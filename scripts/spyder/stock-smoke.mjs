import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='assets/spyder/evidence/stock-first-repair';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio']});const p=await browser.newPage({viewport:{width:1600,height:1000}}),report={errors:[],states:{}};p.on('pageerror',e=>report.errors.push(e.message));p.on('console',e=>{if(e.type()==='error')report.errors.push(e.text())});
try{
 await p.goto('http://127.0.0.1:5213/?scene=signature&visual=spyder&screen=build&test=1&profile=1');await p.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000}).catch(()=>{});await p.screenshot({path:out+'/showroom.png'});report.showroom=await p.evaluate(()=>({text:document.body.innerText,keys:Object.keys(window).filter(k=>k.startsWith('__')),state:window.__SIGNATURE?.inspect?.()}));
 await p.goto('http://127.0.0.1:5213/?scene=express&route=harbor&play=preview&visual=spyder&mode=test&test=1&profile=1&clock=controlled&captureBuffer=1');await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:120000});await p.evaluate(()=>window.frameNow=0);
 await p.locator('#start-crew').click();if(await p.locator('.film-skip').isVisible())await p.locator('.film-skip').click();
 const step=async(keys,n)=>p.evaluate(([keys,n])=>{const h=window.__EXPRESS;h.setDeviceSample({keys,pads:[],focused:true});let s;for(let i=0;i<n;i++){s=h.normalFrame(window.frameNow,i===n-1);window.frameNow+=1000/60}return s},[keys,n]);
 report.states.spawn=await step([],240);report.states.drive=await step(['ArrowUp'],120);await p.screenshot({path:out+'/driving.png'});
 const png=await p.evaluate(()=>window.__EXPRESS.referenceCamera('player',[2,1.6,-2.8],[0,.7,0]));await writeFile(out+'/road-hero.png',Buffer.from(png.split(',')[1],'base64'));
 report.states.stop=await step(['ArrowDown'],180);await step(['KeyX'],2);await step([],2);report.states.reverse=await step(['ArrowUp'],120);assert.ok(report.states.drive.telemetry.speed>5);assert.ok(Math.abs(report.states.stop.telemetry.speed)<.4);assert.equal(report.states.reverse.telemetry.gear,-1);assert.ok(report.states.reverse.telemetry.speed<-.5);report.status='PASS';
}catch(e){report.status='FAIL';report.failure=e.stack;await p.screenshot({path:out+'/failure.png'}).catch(()=>{})}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,errors:report.errors,failure:report.failure,states:Object.fromEntries(Object.entries(report.states).map(([k,v])=>[k,{speed:v.telemetry.speed,gear:v.telemetry.gear,powertrain:v.telemetry.powertrain,hands:v.visual.driver.arms}]))},null,2));await browser.close()}
