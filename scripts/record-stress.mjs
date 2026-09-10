import {chromium} from '@playwright/test';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
const dir='director-kit/production/evidence/G2';await mkdir(dir+'/stress',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 for(const name of ['curb','incline-launch','high-speed-curb']){
  const context=await browser.newContext({viewport:{width:1280,height:800},recordVideo:{dir:dir+'/video-temp',size:{width:1280,height:800}}});const page=await context.newPage(),cdp=await context.newCDPSession(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5187/?scene=pad&test=1&cap=30');await page.waitForFunction(()=>window.__TWT?.ready,null,{timeout:60000});
  const duration=await page.evaluate(n=>window.__TWT.playScenario(n),name);const trace=[];let next=2;const wallStart=Date.now();
  while(true){await page.waitForTimeout(250);const t=await page.evaluate(()=>window.__TWT.telemetry());trace.push(t);if(t.time>=next){await writeFile(`${dir}/stress/${name}-${next}.png`,Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false})).data,'base64'));next+=2}if(t.time>=duration)break;if(Date.now()-wallStart>180000)throw new Error('Scenario did not complete in three minutes')}
  const video=page.video();await page.close();await context.close();await copyFile(await video.path(),`${dir}/${name}.webm`);await writeFile(`${dir}/stress/${name}.json`,JSON.stringify({command:'node scripts/record-stress.mjs',scenario:name,capture:'Actual isolated Chromium video with scripted input policy driving real Rapier simulation. Software rendering; wall duration may exceed simulation duration. Silent P02.',wallSeconds:(Date.now()-wallStart)/1000,trace,errors},null,2));console.log(`Captured ${name}: ${duration}s simulation`);
 }
}finally{await browser.close()}
