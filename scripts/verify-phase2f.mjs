import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:5186',out=process.env.EVIDENCE_DIR||'.tools/phase2f';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],failed=[],rows=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|GL_INVALID|program|WebGL/i.test(m.text()))errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)failed.push(r.url())});
async function open(route,mode='test',extra='',scene='express'){
 await page.goto(base+`/?scene=${scene}&route=${route}&mode=${mode}&test=1&profile=1&clock=controlled&quality=high${extra}`);await page.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});
 await page.evaluate(()=>window.__clock=0);
}
async function step(keys,frames){return page.evaluate(({keys,frames})=>{window.__EXPRESS.setDeviceSample({keys,pads:[],focused:true});for(let i=0;i<frames;i++)window.__EXPRESS.normalFrame(window.__clock+=1000/60,i%60===59||i===frames-1);return window.__EXPRESS.inspect()},{keys,frames})}
try{
 for(const [route,mode,extra,scene]of [['harbor','test','&look=day','express'],['express','race','&look=dusk-rain','express'],['ridge','test','&lighting=day','express'],['harbor','story','&play=demo&preset=night','harbor']]){
  await open(route,mode,extra,scene);
  if(route==='harbor'&&mode==='test'){
   for(const [quality,resolution]of [['low',512],['medium',1024],['high',2048],['ultra',2048],['high',2048]]){
    await page.getByLabel('Graphics quality').selectOption(quality);const i=await step([],1);assert.equal(i.optics.shadow.resolution,resolution);assert.equal(i.optics.shadow.quality,quality);
   }
   await page.evaluate(()=>window.__EXPRESS.referenceCamera('player',[3.7,1.3,4.8],[0,.3,0]));await page.locator('#race-menu').evaluate(e=>e.style.visibility='hidden');await page.screenshot({path:out+'/contact-on.png'});await page.locator('#race-menu').evaluate(e=>e.style.visibility='');
  }
  await page.locator('#start-crew').click();await step([],210);const moving=await step(['KeyW'],180);
  assert.ok(moving.telemetry.speed>8);assert.deepEqual(Object.values(moving.profileContract),Array(3).fill('slingmods-sport-v5'));assert.ok(moving.contact.visiblePatches>=4);assert.equal(moving.contact.drawCalls,1);assert.equal(moving.contact.capacity,moving.contact.cars*4);assert.equal(moving.optics.shadow.maps,1);assert.equal(moving.optics.shadow.resolution,2048);
  rows.push({route,mode,speed:moving.telemetry.speed,contact:moving.contact,shadow:moving.optics.shadow});await page.screenshot({path:out+'/'+route+'-'+mode+'.png'});console.log(route+' '+mode+' contact and shadow driving passed');
  if(route==='harbor'&&mode==='test'){
   const fixtures=await page.evaluate(()=>{
    const api=window.__EXPRESS,before=JSON.stringify(api.lightweight()),original=structuredClone(api.inspect().field),air=structuredClone(original);air.player.position.y+=2;air.player.wheels.forEach(w=>w.contact=false);api.effectFixture(air,true);const airborne=api.inspect().contact;
    const roll=structuredClone(original);roll.player.quaternion={x:0,y:0,z:1,w:0};api.effectFixture(roll,true);const overturned=api.inspect().contact;api.effectFixture(original,true);
    return{airborne,overturned,physicsUnchanged:before===JSON.stringify(api.lightweight())};
   });assert.equal(fixtures.airborne.visiblePatches,0);assert.equal(fixtures.overturned.visiblePatches,0);assert.equal(fixtures.physicsUnchanged,true);rows.push({mode:'synthetic-airborne-and-rollover',...fixtures});
  }
 }
 await open('harbor','test','&look=day&contact=off');await step([],1);let off=await page.evaluate(()=>window.__EXPRESS.inspect());assert.equal(off.contact.enabled,false);assert.equal(off.contact.visiblePatches,0);await page.evaluate(()=>window.__EXPRESS.referenceCamera('player',[3.7,1.3,4.8],[0,.3,0]));await page.locator('#race-menu').evaluate(e=>e.style.visibility='hidden');await page.screenshot({path:out+'/contact-off.png'});rows.push({mode:'contact-off',contact:off.contact});
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await fs.writeFile(out+'/result.json',JSON.stringify({pass:true,rows,errors,failed},null,2));
}catch(e){await page.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({error:e.stack,errors,failed,rows},null,2));throw e}finally{await browser.close()}
