import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL??'http://127.0.0.1:5224',out=process.env.EVIDENCE_DIR??'handoff/rider-redesign-evidence';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
const errors=[],requests=[],rows=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());if(r.url().includes('tour-rider.glb'))requests.push({url:r.url(),status:r.status()})});
try{
 for(const visual of ['2026','ryker']){
  await page.goto(base+'/?scene=express&mode=test&route=express&test=1&profile=1&clock=controlled&visual='+visual);
  await page.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:120000});
  await page.locator('#start-crew').click();
  const s=await page.evaluate(()=>{
   const h=window.__EXPRESS;let now=0;h.setDeviceSample({keys:[],pads:[],focused:true});
   for(let i=0;i<240;i++)h.normalFrame(now+=1000/60,false);
   h.setDeviceSample({keys:['KeyW'],pads:[],focused:true});for(let i=0;i<180;i++)h.normalFrame(now+=1000/60,i===179);
   const s=h.inspect();return{speed:s.telemetry.speed,profile:s.profileContract,build:s.build,visual:s.visual,rivals:s.rivals,race:s.race.phase,careerTouched:s.careerTouched};
  });
  assert.ok(s.speed>1);assert.equal(s.visual.driver.motion.enabled,true);assert.equal(s.careerTouched,false);
  assert.ok(Object.values(s.visual.driver.arms).every(a=>a.gap<.001));
  await page.evaluate(v=>window.__EXPRESS.referenceCamera('player',v==='ryker'?[-1.4,1.7,-1.8]:[-1.7,1.8,-1.8],v==='ryker'?[0,1,.1]:[-.35,.85,.1]),visual);
  await page.screenshot({path:out+'/game-'+visual+'.png'});rows.push({visual,...s});console.log('Packaged drive '+visual+' '+s.speed.toFixed(2)+' m/s');
 }
 // Actual showroom UI toggles acknowledgement and the visible rider keeps breathing.
 await page.goto(base+'/?scene=signature&screen=build&visual=2026&test=1&profile=1');
 await page.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});
 await page.locator('[data-action="advanced"]').click();
 await page.locator('[data-action="driver"]').first().click();
 await page.waitForFunction(()=>window.__SIGNATURE.inspect().visual.driver.motion.gesture==='acknowledge');
 const before=await page.evaluate(()=>window.__SIGNATURE.inspect().visual.driver.motion.breathing);
 await page.waitForFunction(b=>Math.abs(window.__SIGNATURE.inspect().visual.driver.motion.breathing-b)>.0002,before);
 const showroom=await page.evaluate(()=>{const s=window.__SIGNATURE.inspect();return{visible:s.driverVisible,motion:s.visual.driver.motion,build:s.build}});assert.equal(showroom.visible,true);rows.push({showroom});
 // Reduced motion suppresses optional showroom motion.
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});
 await page.locator('[data-action="advanced"]').click();
 await page.locator('[data-action="driver"]').first().click();
 const reduced=await page.evaluate(()=>{const s=window.__SIGNATURE.inspect();return{reduced:s.reducedMotion,motion:s.visual.driver.motion}});assert.equal(reduced.reduced,true);assert.equal(reduced.motion.breathing,0);assert.equal(reduced.motion.gesture,'none');rows.push({reduced});
 assert.ok(requests.length>=2);assert.deepEqual(errors,[]);
 await writeFile(out+'/game-smoke.json',JSON.stringify({pass:true,method:'Packaged game, isolated Chromium. Real input and fixed-step physics for two short drives, then real showroom UI and reduced-motion check. Not sustained performance or full career validation.',requests,rows,errors},null,2));console.log('PACKAGED RIDER SMOKE PASS');
}catch(e){await page.screenshot({path:out+'/game-failure.png'}).catch(()=>{});await writeFile(out+'/game-failure.json',JSON.stringify({error:String(e),rows,errors,requests},null,2));throw e}
finally{await context.close();await browser.close()}
