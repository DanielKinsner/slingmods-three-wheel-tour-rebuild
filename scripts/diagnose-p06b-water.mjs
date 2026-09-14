import {chromium} from '@playwright/test';
import {build} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const dir=process.env.EVIDENCE_DIR;
if(!dir)throw Error('Fresh EVIDENCE_DIR required');await fs.mkdir(dir,{recursive:false});
const hash=b=>createHash('sha256').update(b).digest('hex');
const snapshot=async()=>Object.fromEntries(await Promise.all(['kit.glb','foundation.glb','scene-layout.json'].map(async name=>[name,hash(await fs.readFile('public/assets/showcase-quality/'+name))])));
const before=await snapshot(),prior=JSON.parse(await fs.readFile('director-kit/production/evidence/P06/baseline-stock720/run.json','utf8')),errors=[],rows=[];
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']});
try{
 for(const disable of [false,true]){
  const label=disable?'shader-disabled':'shader-enabled';
  await build({configFile:false,logLevel:'silent',publicDir:false,plugins:[{name:'explicit-water-diagnostic-only',enforce:'pre',transform(code,id){
   id=id.replaceAll('\\','/');
   if(disable&&id.endsWith('/src/presentation/harbor-water.ts'))return{code:`export function createHarborWater(){return{update(){},inspect(){return{diagnostic:'shader disabled, original material retained'}},dispose(){}}}`,map:null};
   if(id.endsWith('/scripts/review12-scene.ts'))return{code:code.replace('(window as any).__VISUAL={','(window as any).__VISUAL={waterProbe:(near:number,hide:boolean)=>{camera.near=near;camera.updateProjectionMatrix();const water:any[]=[];scene.traverse(o=>{if(o instanceof THREE.Mesh&&((Array.isArray(o.material)?o.material:[o.material]).some(m=>m.name==="Showcase_Moving_Water"))){water.push({name:o.name,visible:o.visible,box:new THREE.Box3().setFromObject(o).min.toArray(),max:new THREE.Box3().setFromObject(o).max.toArray()});if(hide)o.visible=false}});renderer.render(scene,camera);return{near,hide,water,depthBits:renderer.getContext().getParameter(renderer.getContext().DEPTH_BITS),extensions:renderer.getContext().getSupportedExtensions(),reversed:renderer.capabilities.reversedDepthBuffer}},'),map:null};
  }}],build:{outDir:path.resolve(dir+'/'+label),emptyOutDir:false,minify:false,lib:{entry:path.resolve('scripts/review12-scene.ts'),name:'WaterDiagnostic',formats:['iife'],fileName:()=> 'scene.js'}}});
  const source=await fs.readFile(dir+'/'+label+'/scene.js','utf8'),context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1}),page=await context.newPage();
  page.on('pageerror',e=>errors.push({label,error:e.message}));page.on('console',m=>{if(m.type()==='error')errors.push({label,console:m.text()})});
  await page.route('**/assets/showcase-quality/**',async r=>{const relative=new URL(r.request().url()).pathname.slice(1);if(relative.includes('..'))throw Error('Invalid asset path');await r.fulfill({body:await fs.readFile('public/'+relative)})});
  await page.route('**/__review11_fixture?*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
  await page.route('**/__review11_telemetry',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(prior.initial.telemetry)}));
  await page.goto('http://127.0.0.1:5187/__review11_fixture?preset=day&showcase=full');await page.addScriptTag({content:source});await page.waitForFunction(()=>window.__VISUAL?.ready,null,{timeout:120000});
  await page.evaluate(()=>window.__VISUAL.diagnostic([95,130,110],[0,0,-120],58));
  for(const [name,near,hide]of[['normal',.06,false],['near-half-metre',.5,false],['water-hidden',.06,true]]){
   const result=await page.evaluate(([near,hide])=>window.__VISUAL.waterProbe(near,hide),[near,hide]);
   const filename=label+'-'+name+'.png';await page.screenshot({path:dir+'/'+filename});rows.push({label,filename,bundleSHA256:hash(source),...result});
  }
  await context.close();
 }
 const after=await snapshot();if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Assets changed during diagnostic');
 await fs.writeFile(dir+'/diagnostic.json',JSON.stringify({method:'Diagnostic-only fixture transforms: shader no-op, water mesh hidden, overview near-plane comparison. Never production or performance evidence.',before,after,assetsIdentical:true,rows,errors},null,2));
}finally{await browser.close()}
