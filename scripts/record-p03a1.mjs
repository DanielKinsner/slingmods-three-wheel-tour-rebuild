import {chromium} from '@playwright/test';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
const dir=process.env.EVIDENCE_DIR;assert.ok(dir);await mkdir(dir,{recursive:false});
const sha=b=>createHash('sha256').update(b).digest('hex'),base=process.env.TWT_URL??'http://127.0.0.1:5187';
const build=JSON.parse(await readFile('dist/review-build.json','utf8'));for(const [p,h]of Object.entries(build.inputs))assert.equal(sha(await readFile(p)),h,p);
const report={runtimeCommit:build.commit,inputs:build.inputs,created:new Date().toISOString(),method:'SILENT actual runtime screenshots from isolated Chromium/SwiftShader, 12 captured frames per encoded second. Orbit camera/light steps and pad simulation controls are scripted; not real-time rendering or human driving. No desktop input.',movies:[],errors:[]};
report.served={};for(const path of ['dist/review-build.json','dist/index.html',...(await readdir('dist/assets')).filter(f=>/\.(js|css)$/.test(f)).map(f=>'dist/assets/'+f),'public/assets/vehicles/slingshot-p03a1.glb','public/assets/inspection-bay-p03a1.glb','public/assets/test-pad.glb']){const digest=sha(await readFile(path)),response=await fetch(base+'/'+path.replace(/^(dist|public)\//,''));assert.equal(response.status,200,path);assert.equal(sha(Buffer.from(await response.arrayBuffer())),digest,path);report.served[path]=digest}
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});report.browser=browser.version();
try{
const p=await browser.newPage({viewport:{width:1440,height:960}});p.on('pageerror',e=>report.errors.push(e.message));const c=await p.context().newCDPSession(p);
async function record(name,seconds,frame){
 const started=Date.now();const folder=dir+'/'+name+'-frames';await mkdir(folder);const entry={name,seconds,fps:12,frames:[],sha256:''};
 for(let i=0;i<seconds*12;i++){const state=await frame(i/(seconds*12-1),i/12,i);const bytes=Buffer.from((await c.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false})).data,'base64');await writeFile(folder+'/'+String(i).padStart(4,'0')+'.png',bytes);entry.frames.push({i,sha256:sha(bytes),...state});if(i%60===0)console.log(name+' '+i+'/'+(seconds*12))}
 const file=name+'-SILENT.mp4';execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-framerate','12','-i',folder+'/%04d.png','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',dir+'/'+file]);entry.captureAndEncodeWallMs=Date.now()-started;entry.file=file;entry.sha256=sha(await readFile(dir+'/'+file));report.movies.push(entry);
}
await p.goto(base+'/?test=1&asset=p03a1');await p.waitForFunction(()=>window.__TWT?.ready,null,{timeout:90000});assert.equal(await p.evaluate(()=>window.__TWT.asset),'slingshot-p03a1.glb');
await record('orbit',13,async fraction=>{const angle=fraction*Math.PI*2;const state=await p.evaluate(a=>{window.__TWT.reviewOrbit(a);window.__TWT.lightSweep(a*.45);const s=window.__TWT.inspect();return {projection:s.projectedBounds,camera:s.cameraPosition}},angle);assert.ok(state.projection.allInFront);assert.ok(Math.max(...['minX','maxX','minY','maxY'].map(k=>Math.abs(state.projection[k])))<=.80001);return {angle,...state}});
await p.goto(base+'/?scene=pad&test=1&asset=p03a1');await p.waitForFunction(()=>window.__TWT?.ready,null,{timeout:90000});await p.evaluate(()=>window.__TWT.reset({z:0}));
await record('pad',20,async(_,time,i)=>{let stage='rest',throttle=0,brake=0,steer=0;if(time>=1&&time<5){stage='accelerate';throttle=.65}else if(time<8&&time>=5){stage='left corner';throttle=.35;steer=.4}else if(time<10&&time>=8){stage='braking';brake=1}else if(time<13&&time>=10){stage='right corner';throttle=.5;steer=-.45}else if(time<15&&time>=13){stage='far camera exit';throttle=.5}else if(time>=15&&time<19){stage='final braking';brake=1}
const state=await p.evaluate(({throttle,brake,steer,i})=>{if(i===156)window.__TWT.setCamera('far');const t=window.__TWT.advance({throttle,brake,steer,reverse:false,tractionControl:true},1/12);const s=window.__TWT.inspect();return {time:t.time,speed:t.speed,steer:t.steer,position:t.position,camera:s.cameraPosition,shadow:s.shadowMode}}, {throttle,brake,steer,i});return {stage,control:{throttle,brake,steer},...state}});
const drive=report.movies[1].frames;assert.ok(drive.some(f=>f.speed>5));assert.ok(drive.some(f=>f.steer>0)&&drive.some(f=>f.steer<0));assert.ok(Math.abs(drive.at(-1).speed)<.1);
assert.deepEqual(report.errors,[]);
}finally{await browser.close()}
for(const [p,h]of Object.entries(build.inputs))assert.equal(sha(await readFile(p)),h,p);
await writeFile(dir+'/recordings.json',JSON.stringify(report,null,2));console.log('PASS framed orbit and actual simulated pad recordings');
