import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:5186',out=process.env.EVIDENCE_DIR||'.tools/phase2h';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],failed=[],rows=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|GL_INVALID|program|WebGL/i.test(m.text()))errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)failed.push(r.url())});
async function open(query,key='__EXPRESS'){await page.goto(base+'/?'+query+'&test=1&profile=1&clock=controlled&quality=high');await page.waitForFunction(k=>window[k]?.ready,key,{timeout:180000});await page.evaluate(()=>window.__clock=0);return page.evaluate(k=>window[k].inspect(),key)}
async function step(keys,frames){return page.evaluate(({keys,frames})=>{const api=window.__EXPRESS;api.setDeviceSample({keys,pads:[],focused:true});for(let i=0;i<frames;i++)api.normalFrame(window.__clock+=1000/60,i%60===59||i===frames-1);return api.inspect()},{keys,frames})}
function check(i){assert.equal(i.surfaceFinish.version,'surface-finish-v1');assert.ok(i.surfaceFinish.changedMeshes>0);assert.deepEqual(i.surfaceFinish.failedSets,[]);assert.equal(i.surfaceFinish.addedDrawCalls,0)}
try{
 for(const [scene,key]of [['signature','__SIGNATURE'],['bay','__TWT']]){
  const i=await open('scene='+scene+'&play=career&screen=build',key);check(i);assert.ok(i.surfaceFinish.materials.some(m=>m.source==='studio_warm_white'));assert.ok(i.surfaceFinish.materials.some(m=>m.source==='Refined_vented_red'&&m.detailOnly));rows.push({mode:scene,surfaceFinish:i.surfaceFinish});
  await page.evaluate(k=>window[k].referenceCamera([4,2.4,-2],[0,1.3,6]),key);await page.screenshot({path:out+'/'+scene+'-room.png'});
  if(scene==='signature'){
   await page.locator('#signature-ui').evaluate(e=>e.style.visibility='hidden');await page.screenshot({path:out+'/room-on.png'});
   const off=await open('scene=signature&screen=build&surfaces=off',key);assert.deepEqual(off.recipe,i.recipe);assert.equal(off.surfaceFinish.changedMeshes,0);await page.evaluate(()=>window.__SIGNATURE.referenceCamera([4,2.4,-2],[0,1.3,6]));await page.locator('#signature-ui').evaluate(e=>e.style.visibility='hidden');await page.screenshot({path:out+'/room-off.png'});
  }
 }
 for(const [route,mode,extra,scene]of [['harbor','test','&look=day','express'],['express','race','&look=dusk-rain','express'],['ridge','test','&lighting=day','express'],['harbor','story','&play=demo&preset=night','harbor']]){
  const i=await open(`scene=${scene}&route=${route}&mode=${mode}${extra}`);check(i);rows.push({route,mode,surfaceFinish:i.surfaceFinish});
  if(route==='express'){await page.evaluate(()=>{const api=window.__EXPRESS,t=api.inspect().field.player,q=t.quaternion;function local(v){const x=v[0]-t.position.x,y=v[1]-t.position.y,z=v[2]-t.position.z,u=[-q.x,-q.y,-q.z],c=[u[1]*z-u[2]*y,u[2]*x-u[0]*z,u[0]*y-u[1]*x];return[x+2*(q.w*c[0]+u[1]*c[2]-u[2]*c[1]),y+2*(q.w*c[1]+u[2]*c[0]-u[0]*c[2]),z+2*(q.w*c[2]+u[0]*c[1]-u[1]*c[0])]}api.referenceCamera('player',local([-8.5,1,-40]),local([-8,0,-45]))});await page.locator('#race-menu').evaluate(e=>e.style.visibility='hidden');await page.screenshot({path:out+'/curb-and-runoff.png'});await page.locator('#race-menu').evaluate(e=>e.style.visibility='')}
  if(route==='harbor'&&mode==='test'){for(const q of ['low','medium','high','ultra','high']){await page.getByLabel('Graphics quality').selectOption(q);check(await step([],1))}}
  await page.locator('#start-crew').click();await step([],210);const moving=await step(['KeyW'],180);assert.ok(moving.telemetry.speed>8);assert.deepEqual(Object.values(moving.profileContract),Array(3).fill('slingmods-sport-v5'));await page.screenshot({path:out+'/'+route+'-'+mode+'.png'});console.log(route+' '+mode+' surfaces passed');
 }
 const off=await open('scene=express&route=express&mode=test&surfaces=off');assert.equal(off.surfaceFinish.enabled,false);assert.equal(off.surfaceFinish.changedMeshes,0);rows.push({mode:'surfaces-off',surfaceFinish:off.surfaceFinish});
 await page.route('**/assets/p11/trackside-props/concrete-normal.ktx2',route=>route.abort());const missing=await open('scene=express&route=express&mode=test');assert.deepEqual(missing.surfaceFinish.failedSets,['concrete']);assert.ok(missing.surfaceFinish.changedMeshes>0);await page.locator('#start-crew').click();await step([],210);assert.ok((await step(['KeyW'],180)).telemetry.speed>8);rows.push({mode:'missing-concrete-normal',surfaceFinish:missing.surfaceFinish});await page.unroute('**/assets/p11/trackside-props/concrete-normal.ktx2');
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await fs.writeFile(out+'/result.json',JSON.stringify({pass:true,rows,errors,failed},null,2));
}catch(e){await page.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({error:e.stack,rows,errors,failed},null,2));throw e}finally{await browser.close()}
