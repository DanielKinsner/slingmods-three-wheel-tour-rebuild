import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:5209',out=process.env.EVIDENCE_DIR||'.tools/story-parity-resume';
const fixture=JSON.parse(await fs.readFile(process.env.FIXTURE||'.tools/story-parity-final/earned-career.json','utf8'));for(const origin of fixture.origins)origin.origin=base;
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),context=await browser.newContext({viewport:{width:1440,height:900},storageState:fixture}),page=await context.newPage(),errors=[],rows=[];
page.on('pageerror',e=>errors.push(e.message));
await context.addInitScript(()=>{const q=new URLSearchParams(location.search);q.set('test','1');q.set('profile','1');if(['harbor','crew','express','ridge'].includes(q.get('scene')))q.set('clock','controlled');history.replaceState(null,'','?'+q+location.hash)});
const ready=k=>page.waitForFunction(k=>window[k]?.ready,k,{timeout:120000});
const state=()=>page.evaluate(()=>window.__EXPRESS.inspect());
async function hub(){await page.goto(base+'/?scene=career&play=career');await ready('__CAREER_HUB');return page.evaluate(()=>window.__CAREER_HUB.inspect())}
async function keyboardDrive(label){console.log('Driving '+label);
 await page.bringToFront();await page.locator('#start-crew').click();await page.waitForFunction(()=>window.__EXPRESS.inspect().race.phase!=='ready');
 await page.evaluate(()=>{window.__clock=performance.now();for(let i=0;i<200;i++)window.__EXPRESS.normalFrame(window.__clock+=1000/60,i===199)});
 await page.keyboard.down('w');await page.evaluate(()=>{for(let i=0;i<90;i++)window.__EXPRESS.normalFrame(window.__clock+=1000/60,i===89)});await page.keyboard.up('w');
 const moving=await state();assert.ok(moving.telemetry.speed>5,label+' moves from keyboard');assert.deepEqual(Object.values(moving.profileContract),Array(3).fill('slingmods-sport-v5'));
 await page.keyboard.down('a');await page.evaluate(()=>{for(let i=0;i<12;i++)window.__EXPRESS.normalFrame(window.__clock+=1000/60,i===11)});await page.keyboard.up('a');assert.ok(Math.abs((await state()).telemetry.steer)>.01,label+' steering responds');
 await page.keyboard.press('Escape');await page.evaluate(()=>window.__EXPRESS.normalFrame(window.__clock+=1000/60,true));assert.equal((await state()).race.paused,true);
 await page.screenshot({path:out+'/'+label+'.png'});console.log(label+' passed');rows.push({label,profile:moving.profileContract,speed:moving.telemetry.speed,recipe:moving.recipe,look:moving.look});
}
try{
 const initial=await hub(),recipe=initial.recipe;console.log('Hub loaded');
 await page.locator('[data-action=event][data-value=open-it-up]').click();await page.locator('[data-action=start]').click();await ready('__EXPRESS');const prepared=await state();console.log('Current entry prepared');
 await page.locator('[data-action=bay]').click();await ready('__CAREER_HUB');
 console.log('Returned to hub');
 // A deliberately constructed old-version save in this isolated test context.
 // Existing records/receipts come from the real complete-career run and stay exact.
 await page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('slingmods-twt-rebuild-career-v1',2);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});try{await new Promise((resolve,reject)=>{const tx=db.transaction('career','readwrite'),store=tx.objectStore('career'),r=store.get('current');r.onsuccess=()=>{const s=r.result;if(!s?.ownBuild.active)throw Error('Prepared entry fixture required');const a=s.ownBuild.active;a.handlingProfile=a.recipe.handlingProfile='slingmods-sport-v2';s.ownBuild.attempts[a.id]=structuredClone(a);store.put(s,'current')};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}finally{db.close()}});
 console.log('Old fixture stored');await page.reload();await ready('__CAREER_HUB');const old=await page.evaluate(()=>window.__CAREER_HUB.inspect());assert.equal(old.state.ownBuild.active.handlingProfile,'slingmods-sport-v2');
 await page.locator('[data-action=resume]').click();await ready('__EXPRESS');const resumed=await state();console.log('Old entry resumed');assert.notEqual(resumed.career.attempt.id,prepared.career.attempt.id);assert.deepEqual(resumed.recipe,recipe);assert.deepEqual(resumed.career.state.ownBuild.records,initial.state.ownBuild.records);assert.deepEqual(resumed.career.state.receipts,initial.state.receipts);assert.equal(resumed.career.state.ownBuild.attempts[prepared.career.attempt.id].status,'abandoned');assert.equal(resumed.career.state.ownBuild.attempts[prepared.career.attempt.id].handlingProfile,'slingmods-sport-v2');
 await keyboardDrive('resumed-story');
 await page.locator('#start-crew').click();await page.evaluate(()=>{for(let i=0;i<3;i++)window.__EXPRESS.normalFrame(window.__clock+=1000/60,i===2)});await page.keyboard.down('r');await page.evaluate(()=>{for(let i=0;i<90;i++)window.__EXPRESS.normalFrame(window.__clock+=1000/60,i===89)});await page.keyboard.up('r');await page.waitForFunction(id=>window.__EXPRESS.inspect().attemptId!==id,resumed.career.attempt.id);const retried=await state();assert.deepEqual(retried.recipe,resumed.recipe);assert.deepEqual(retried.career.state.receipts,initial.state.receipts);
 const beforePreviews=await hub();await page.locator('[data-action=abandon]').click();await page.waitForFunction(()=>!window.__CAREER_HUB.inspect().pending);const untouched=await page.evaluate(()=>window.__CAREER_HUB.inspect());
 const fragment='#build='+encodeURIComponent(JSON.stringify({...recipe,handlingProfile:'slingmods-sport-v1'}));
 await page.goto(base+'/?scene=signature&screen=build'+fragment);await ready('__SIGNATURE');const showroom=await page.evaluate(()=>window.__SIGNATURE.inspect());assert.equal(showroom.simulationProfile,'slingmods-sport-v5');assert.equal(showroom.recipe.handlingProfile,'slingmods-sport-v1');await page.screenshot({path:out+'/showroom-original-recipe.png'});
 for(const route of ['harbor','express','ridge'])for(const mode of ['test','race']){await page.goto(base+`/?scene=express&route=${route}&mode=${mode}`+fragment);await ready('__EXPRESS');const s=await state();assert.deepEqual(s.recipe,recipe);await keyboardDrive(route+'-'+mode)}
 for(const query of ['?scene=harbor&play=career&preset=night','?scene=crew&play=career&event=duel','?scene=crew&play=career']){await page.goto(base+'/'+query);await ready('__EXPRESS');assert.deepEqual((await state()).recipe,recipe);assert.equal((await state()).look.base,'night');await keyboardDrive('chapter-one-'+(await state()).eventId)}
 const after=await hub();assert.deepEqual(after.state,untouched.state);assert.deepEqual(beforePreviews.state.receipts,after.state.receipts);
 await page.goto(base+'/?scene=bay&play=career&shop=build');await ready('__TWT');const garage=await page.evaluate(()=>window.__TWT.inspect());assert.deepEqual(garage.recipe,recipe);assert.equal(garage.display.power,true);assert.equal(garage.pipeline.quality,'high');assert.equal(await page.locator('#lighting-retail-fitment').textContent(),'Listed for 2026 R');assert.ok((await page.locator('#suspension-state').locator('..').textContent()).includes('Listed for 2026 R'));await page.screenshot({path:out+'/garage-current-build.png'});
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/result.json',JSON.stringify({pass:true,method:'Packaged browser with an isolated constructed v2 prepared entry; archived results originate in the real complete-career run. Keyboard driving, steering, pause, retry and preview isolation.',rows,old:old.state.ownBuild.active,resumed:resumed.career.attempt,retried:retried.career.attempt,garage,errors},null,2));console.log('RESUME AND KEYBOARD PARITY PASS');
}catch(e){await page.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({error:e.stack,rows,errors,state:await page.evaluate(()=>window.__EXPRESS?.inspect()||window.__CAREER_HUB?.inspect()||window.__TWT?.inspect()).catch(()=>null)},null,2));throw e}finally{await context.close();await browser.close()}
