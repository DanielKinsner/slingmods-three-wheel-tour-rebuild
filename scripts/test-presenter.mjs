import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),cdp=await page.context().newCDPSession(page);
 await page.goto('http://127.0.0.1:5187/?scene=pad&test=1');await page.waitForFunction(()=>window.__TWT?.ready);
 const poses=[];for(const steer of [1,-1]){await page.evaluate(()=>window.__TWT.reset());const inspected=await page.evaluate(steer=>{window.__TWT.advance({steer,throttle:.1,brake:0,reverse:false},1);window.__TWT.captureView('cockpit');return window.__TWT.inspect()},steer);const expected=Math.sin(inspected.telemetry.steer*10/2);assert.ok(Math.abs(inspected.steeringControlQuaternion[2]-expected)<1e-6);assert.equal(Math.sign(inspected.telemetry.wheels[0].steer),steer);assert.equal(Math.sign(inspected.telemetry.wheels[1].steer),steer);assert.equal(inspected.telemetry.wheels[2].steer,0);poses.push({steer,inspected});await writeFile(`director-kit/production/evidence/G2/cockpit-steer-${steer>0?'left':'right'}.png`,Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false})).data,'base64'))}
 await writeFile('director-kit/production/evidence/G2/input-presentation.json',JSON.stringify({command:'node scripts/test-presenter.mjs',outcome:'PASS cockpit steering_control quaternion follows authoritative front steer with explicit10:1 visual ratio estimate; both front channels steer with input and rear does not',poses},null,2));console.log('PASS cockpit and front steering telemetry binding.');
}finally{await browser.close()}
