// Read-only frozen-runtime diagnostic. Set DIAGNOSTIC_DIR to a new, nonexistent directory.
// Does not rebuild, alter game assets, or overwrite previous evidence.
import {chromium} from '@playwright/test';
import * as THREE from 'three';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.env.DIAGNOSTIC_DIR;assert.ok(out,'Set DIAGNOSTIC_DIR to a fresh directory');
await fs.mkdir(out,{recursive:false});
const sha=b=>createHash('sha256').update(b).digest('hex');
const build=JSON.parse(await fs.readFile('dist/review-build.json','utf8'));
async function stable(){for(const[p,h]of Object.entries(build.inputs))assert.equal(sha(await fs.readFile(p)),h,p)}
await stable();
const served={};
for(const p of ['dist/review-build.json',...Object.keys(build.inputs).filter(x=>x.startsWith('public/')),...(await fs.readdir('dist/assets')).filter(x=>/\.(js|css)$/.test(x)).map(x=>'dist/assets/'+x)]){
 const disk=await fs.readFile(p),res=await fetch('http://127.0.0.1:5187/'+p.replace(/^(dist|public)\//,''));assert.equal(res.status,200,p);assert.equal(sha(Buffer.from(await res.arrayBuffer())),sha(disk),p);served[p]=sha(disk);
}
const report={commit:build.commit,method:'Independent fresh viewport contexts; normalFrame virtual samples and fixed physics. All60Hz driver states,12Hz local JPGs. No desktop input. Declared obstacle diagnostic is outside main movie.',served,framing:[],regrip:[],images:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
try{
 for(const width of[1280,1680]){
  const ctx=await browser.newContext({viewport:{width,height:720}}),page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:5187/?scene=pad&test=1&clock=controlled',{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.__TWT?.ready,null,{timeout:90000});
  const cdp=await ctx.newCDPSession(page);let tick=0;
  async function step(axis=0,keys=[],count=1){
   const result=await page.evaluate(({axis,keys,count,tick})=>{
    const states=[];window.__TWT.setDeviceSample({keys,focused:true,pads:[{index:0,id:'Independent review',mapping:'standard',connected:true,axes:[axis],buttons:Array.from({length:17},()=>({value:0,pressed:false}))}]});
    for(let i=0;i<count;i++){const s=window.__TWT.normalFrame((tick+i)*1000/60,i===count-1);states.push({time:(tick+i)/60,driver:s.driver,steer:s.telemetry.steer,active:s.activeView})}
    return{states,state:window.__TWT.inspect()};
   },{axis,keys,count,tick});tick+=count;return result;
  }
  async function shot(name){const b=Buffer.from((await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:88,fromSurface:true})).data,'base64');await fs.writeFile(path.join(out,name+'.jpg'),b,{flag:'wx'});report.images.push({name,sha256:sha(b)})}
  await step(0,[],5);
  for(const mode of['cockpit','near']){
   await page.evaluate(mode=>window.__TWT.setCamera(mode),mode);const s=(await step()).state;
   // Recover actual projection aspect from an observed world hand point/NDC pair;
   // this verifies camera projection independently of requested viewport dimensions.
   const cam=new THREE.PerspectiveCamera(s.cameraFov,1,.05,700);cam.position.fromArray(s.cameraPosition);cam.lookAt(new THREE.Vector3().fromArray(s.cameraTarget));cam.updateMatrixWorld(true);
   const inferredAspect=new THREE.Vector3().fromArray(s.driver.arms.left.contact).project(cam).x/s.driverProjection.left[0];assert.ok(Math.abs(inferredAspect-width/720)<1e-5);
   report.framing.push({viewport:{width,height:720},mode,inferredProjectionAspect:inferredAspect,driverProjection:s.driverProjection,camera:s.cameraPosition,target:s.cameraTarget,headVisible:s.driver.headVisible});await shot(width+'-'+mode);
  }
  const rear=(await step(0,['KeyB'])).state;assert.equal(rear.activeView,'rearward');report.framing.push({viewport:{width,height:720},mode:'rearward',elapsedHoldMs:1000/60,camera:rear.cameraPosition,target:rear.cameraTarget,active:rear.activeView});await shot(width+'-rearward');await step(0,[],2);
  if(width===1680){
   await page.evaluate(()=>window.__TWT.setCamera('cockpit'));
   for(let f=0;f<60;f++){const r=await step(f<20?-1:f<40?1:0,[],5);report.regrip.push(...r.states);await shot('regrip-'+String(f).padStart(3,'0'))}
   await page.evaluate(()=>{window.__TWT.reset({x:42,z:-62.5,y:.025});window.__TWT.setCamera('near')});const s=await page.evaluate(()=>window.__TWT.inspect());
   report.obstacle={pose:{x:42,z:-62.5,y:.025},camera:s.cameraPosition,target:s.cameraTarget,method:'Existing1.2m barrier is below nominal follow sightline; close-clearance view, not clamp activation'};await shot('1680-barrier');
  }
  await ctx.close();
 }
 report.regripSummary={samples:report.regrip.length,releasingSamples:report.regrip.filter(x=>Object.values(x.driver.arms).some(a=>a.regripping)).length,maxSupportingRimGap:Math.max(...report.regrip.map(x=>Math.min(...Object.values(x.driver.arms).map(a=>a.rimGap)))),simultaneousRelease:report.regrip.filter(x=>Object.values(x.driver.arms).every(a=>a.regripping)).length,maxWheelAngle:Math.max(...report.regrip.map(x=>Math.abs(x.driver.wheelAngle)))};
 assert.ok(report.regripSummary.releasingSamples>0);assert.equal(report.regripSummary.simultaneousRelease,0);assert.ok(report.regripSummary.maxSupportingRimGap<.02);assert.equal(report.errors.length,0);await stable();
 report.harness={file:'scripts/verify-review05-diagnostics.mjs',sha256:sha(await fs.readFile('scripts/verify-review05-diagnostics.mjs'))};
 await fs.writeFile(path.join(out,'final-diagnostics.json'),JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({directory:out,summary:report.regripSummary}));
}finally{await browser.close()}
