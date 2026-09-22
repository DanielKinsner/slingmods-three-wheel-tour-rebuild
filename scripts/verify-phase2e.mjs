import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:5186',out=process.env.EVIDENCE_DIR||'.tools/phase2e';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],failed=[],rows=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|GL_INVALID|program|WebGL/i.test(m.text()))errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)failed.push(r.url())});
async function open(route,mode='test',extra='',scene='express',quality='high'){
 await page.goto(base+`/?scene=${scene}&route=${route}&mode=${mode}&test=1&profile=1&clock=controlled&quality=${quality}${extra}`);await page.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});
 await page.waitForFunction(()=>{const e=window.__EXPRESS.inspect().effects;return e.loadedTextures+e.skippedTextures===6},null,{timeout:60000});
 await page.locator('#start-crew').click();await page.waitForFunction(()=>window.__EXPRESS.inspect().race.phase!=='ready');
 await page.evaluate(()=>{window.__clock=0;window.__EXPRESS.setDeviceSample({keys:[],pads:[],focused:true});for(let i=0;i<210;i++)window.__EXPRESS.normalFrame(window.__clock+=1000/60,i===209)});
}
async function drive(keys,frames){return page.evaluate(({keys,frames})=>{window.__EXPRESS.setDeviceSample({keys,pads:[],focused:true});for(let i=0;i<frames;i++)window.__EXPRESS.normalFrame(window.__clock+=1000/60,i%60===59||i===frames-1);return window.__EXPRESS.inspect()},{keys,frames})}
try{
 for(const [route,mode,extra,scene]of [['harbor','test','&look=after-rain','express'],['express','race','&look=dusk-rain','express'],['ridge','test','&lighting=night','express'],['harbor','story','&play=demo&preset=night','harbor']]){
  await open(route,mode,extra,scene);const moving=await drive(['KeyW'],180);assert.ok(moving.telemetry.speed>8);assert.deepEqual(Object.values(moving.profileContract),Array(3).fill('slingmods-sport-v5'));assert.equal(moving.effects.loadedTextures,6);if(scene==='express'&&route!=='ridge')assert.equal(moving.look.id,new URLSearchParams(extra).get('look'));if(moving.look.wet)assert.ok(moving.effects.particles[3].emitted>0,'Moving wet tires spray');
  await page.screenshot({path:out+'/'+route+'-'+mode+'.png'});rows.push({route,mode,speed:moving.telemetry.speed,effects:moving.effects});console.log(route+' '+mode+' real driving passed');
  if(route==='harbor'&&mode==='test'){let contact;for(let i=0;i<8;i++){contact=await drive(['KeyW','KeyA'],30);if(contact.effects.particles[4].emitted>0)break}assert.ok(contact.effects.particles[4].emitted>0,'Real barrier contact produces sparks');rows.push({route,mode:'barrier-contact',effects:contact.effects});await page.screenshot({path:out+'/real-contact.png'})}
 }
 await page.route('**/assets/p11/vfx/**',route=>route.abort());await page.addInitScript(()=>localStorage.setItem('slingmods-signature-motion','reduced'));
 await open('harbor','test','&look=after-rain','express','low');const fallback=await drive(['KeyW'],120);assert.ok(fallback.telemetry.speed>5);assert.equal(fallback.effects.skippedTextures,6);assert.equal(fallback.effects.headlightFog,false);assert.equal(fallback.effects.heatHaze,0);assert.equal(fallback.effects.reducedMotion,true);rows.push({route:'harbor',mode:'low-reduced-missing-assets',effects:fallback.effects});console.log('Low / reduced motion / unavailable texture fallback passed');
 await page.unroute('**/assets/p11/vfx/**');await page.goto(base+'/?scene=express&route=harbor&test=1&profile=1&quality=ultra&look=golden-hour&effects=off&clock=controlled');await page.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});const off=await page.evaluate(()=>window.__EXPRESS.inspect());assert.equal(off.effects.enabled,false);assert.equal(off.effects.loadedTextures,0);assert.equal(off.look.id,'golden-hour');assert.equal(off.pipeline.quality,'ultra');rows.push({route:'harbor',mode:'published-look-quality-effects-options',effects:off.effects});
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await fs.writeFile(out+'/result.json',JSON.stringify({pass:true,method:'Production fixed-step simulation using only pedal input. Same shared effects across routes and modes.',rows,errors,failed},null,2));
}catch(e){await page.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({error:e.stack,errors,failed,rows},null,2));throw e}finally{await browser.close()}
