import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:5186',out=process.env.EVIDENCE_DIR||'.tools/phase2g';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],failed=[],rows=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|GL_INVALID|program|WebGL/i.test(m.text()))errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)failed.push(r.url())});
page.on('request',r=>{if(/\/assets\/p11\/shared-textures\//.test(r.url()))errors.push('Uncompressed forest master requested: '+r.url())});
async function open(mode='test',extra=''){
 await page.goto(base+`/?scene=express&route=ridge&mode=${mode}&test=1&profile=1&clock=controlled&quality=high${extra}`);await page.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});await page.evaluate(()=>window.__clock=0);
}
async function step(keys,frames){return page.evaluate(({keys,frames})=>{window.__EXPRESS.setDeviceSample({keys,pads:[],focused:true});for(let i=0;i<frames;i++)window.__EXPRESS.normalFrame(window.__clock+=1000/60,i%60===59||i===frames-1);return window.__EXPRESS.inspect()},{keys,frames})}
async function view(name,x,z,tx,tz){
 const result=await page.evaluate(({x,z,tx,tz})=>{const api=window.__EXPRESS,before=JSON.stringify(api.lightweight());api.referenceCamera('player',[x,api.route.heightAt(x,z)+3,z],[tx,api.route.heightAt(tx,tz)+3,tz]);return{forest:api.inspect().world.forest,physicsUnchanged:before===JSON.stringify(api.lightweight())}},{x,z,tx,tz});
 assert.equal(result.physicsUnchanged,true);await page.locator('#race-menu').evaluate(e=>e.style.visibility='hidden');await page.screenshot({path:out+'/'+name+'.png'});await page.locator('#race-menu').evaluate(e=>e.style.visibility='');rows.push({mode:name,fixture:'camera-only visual inspection',...result});return result;
}
async function drive(label,forest=true){await page.locator('#start-crew').click();await step([],210);const i=await step(['KeyW'],180);assert.ok(i.telemetry.speed>8);assert.deepEqual(Object.values(i.profileContract),Array(3).fill('slingmods-sport-v5'));assert.ok(i.contact.visiblePatches>=4);if(forest)assert.equal(i.world.forest.version,'ridge-forest-p11-v1');else assert.equal(i.world.forest.fallback,true);rows.push({mode:label,speed:i.telemetry.speed,profile:i.profileContract,forest:i.world.forest});await page.screenshot({path:out+'/'+label+'.png'});console.log(label+' passed')}
try{
 await open();
 const woods=await view('woods-day',0,-300,0,-420);assert.ok(woods.forest.activeLOD.every(n=>n>0));assert.equal(woods.forest.assets,25);assert.equal(woods.forest.batches,20);
 await view('bark-close',575,-340,555,-265);
 await view('overlook-day',647,-452,702,-383);
 for(const quality of ['low','medium','high','ultra','high']){await page.getByLabel('Graphics quality').selectOption(quality);await step([],1);const r=await view('woods-'+quality,0,-300,0,-420);assert.equal(r.forest.quality,quality);assert.equal(r.forest.shafts,['high','ultra'].includes(quality));if(quality==='low')assert.equal(r.forest.activeLOD[0],0)}
 await drive('test-day');
 await open('race','&lighting=night');await view('woods-night',0,-300,0,-420);await drive('race-night');
 await page.evaluate(()=>localStorage.setItem('slingmods-signature-motion','reduced'));await open();const reduced=await step([],1);assert.equal(reduced.world.forest.wind,0);rows.push({mode:'reduced-motion',forest:reduced.world.forest});await page.evaluate(()=>localStorage.removeItem('slingmods-signature-motion'));
 await page.route('**/assets/p11/ridge-trees/oak-lod0.glb',route=>route.abort());await open();await drive('missing-optional-asset',false);await page.unroute('**/assets/p11/ridge-trees/oak-lod0.glb');
 await open('test','&forest=off');await drive('forest-off',false);
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await fs.writeFile(out+'/result.json',JSON.stringify({pass:true,rows,errors,failed},null,2));
}catch(e){await page.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({error:e.stack,errors,failed,rows},null,2));throw e}finally{await browser.close()}
