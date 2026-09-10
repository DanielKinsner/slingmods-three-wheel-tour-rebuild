import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='director-kit/production/evidence/G2';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const neutral={throttle:0,brake:0,steer:0,reverse:false,tractionControl:true};
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});const cdp=await page.context().newCDPSession(page);const snap=async path=>writeFile(path,Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false})).data,'base64'));const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5187/?scene=pad&test=1');await page.waitForFunction(()=>window.__TWT?.ready,null,{timeout:60000});
 const results=[];
 for(const cap of [30,60,120,144]){
  await page.evaluate(()=>window.__TWT.reset());
  const result=await page.evaluate(({cap,neutral})=>{for(let frame=0;frame<cap*8;frame++){const t=frame/cap;window.__TWT.renderFrame({...neutral,throttle:t<5?.7:0,brake:t>=5?.5:0},1/cap,false)}window.__TWT.advance(neutral,0);return window.__TWT.inspect()},{cap,neutral});
  await snap(`${dir}/runtime-cap-${cap}.png`);results.push({cap,result});
 }
 const ref=results[1].result.telemetry;for(const {result} of results){assert.ok(Math.abs(result.telemetry.position.z-ref.position.z)<Math.max(.01,Math.abs(ref.position.z)*.01));assert.ok(Math.abs(result.telemetry.speed-ref.speed)<.01)}
 const maneuvers=[];
 for(const name of ['rest','accelerate','left-turn','brake','reverse']){
  let control=neutral,seconds=1;if(name==='rest'){await page.evaluate(()=>window.__TWT.reset());seconds=2}if(name==='accelerate'){control={...neutral,throttle:.65};seconds=4}if(name==='left-turn'){control={...neutral,throttle:.2,steer:.35};seconds=3}if(name==='brake'){control={...neutral,brake:1};seconds=3}if(name==='reverse'){control={...neutral,throttle:.35,reverse:true};seconds=3}
  const result=await page.evaluate(({control,seconds})=>window.__TWT.advance(control,seconds),{control,seconds});await snap(`${dir}/runtime-${name}.png`);maneuvers.push({name,result});
 }
 assert.deepEqual(errors,[]);const report={command:'node scripts/capture-driving.mjs',outcome:'PASS injected frame-clock schedules at 30/60/120/144 and final runtime captures; intermediate rendering omitted in this software test; real paced motion recorded separately',browser:await browser.version(),renderer:'SwiftShader software; no performance claim',results,maneuvers,errors};await writeFile(dir+'/runtime-driving.json',JSON.stringify(report,null,2));console.log('Captured 4 frame caps and 5 maneuvers; frame-cap pose tolerance passed.');
}finally{await browser.close()}



