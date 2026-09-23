import {chromium} from '@playwright/test';
import {build} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:5209',out=process.env.EVIDENCE_DIR||'.tools/story-parity';
await fs.mkdir(out,{recursive:true});
const bundle=await build({configFile:false,logLevel:'silent',publicDir:false,build:{write:false,minify:false,lib:{entry:path.resolve('scripts/story-parity-driver.ts'),name:'ParityDriver',formats:['iife']}}});
const source=(Array.isArray(bundle)?bundle[0]:bundle).output.find(v=>v.type==='chunk').code;
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[],failed=[],rows=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()})});
await context.addInitScript(()=>{const p=new URLSearchParams(location.search);p.set('test','1');p.set('profile','1');if(['harbor','crew','express','ridge'].includes(p.get('scene')))p.set('clock','controlled');history.replaceState(null,'','?'+p+location.hash)});
const ready=key=>page.waitForFunction(k=>window[k]?.ready,key,{timeout:120000});
const inspect=()=>page.evaluate(()=>window.__EXPRESS.inspect());
async function driveReady(){await ready('__EXPRESS');const s=await inspect();assert.deepEqual(Object.values(s.profileContract),Array(3).fill('slingmods-sport-v5'));assert.equal(s.visual.asset,'/assets/model02/slingshot-2026.glb');return s}
async function goto(query,key='__EXPRESS'){await page.goto(base+'/'+query);await ready(key);return key==='__EXPRESS'?driveReady():page.evaluate(k=>window[k].inspect(),key)}
async function run(label){
 await page.addScriptTag({content:source});await page.evaluate(()=>{window.__driver=new window.ParityDriver.EvidenceDriver(window.__EXPRESS.route);window.__clock=0;window.__EXPRESS.setDeviceSample(window.ParityDriver.toDevice())});
 await page.locator('#start-crew').click();if(await page.locator('.film-skip').isVisible())await page.locator('.film-skip').click();await page.waitForFunction(()=>window.__EXPRESS.inspect().race.phase!=='ready');
 let result;
 for(let batch=0;batch<600;batch++){
  result=await page.evaluate(()=>{const h=window.__EXPRESS;for(let i=0;i<60;i++){const s=h.lightweight();h.setDeviceSample(s.race.phase==='running'?window.__driver.sample(s.telemetry,s.field):window.ParityDriver.toDevice());h.normalFrame(window.__clock+=1000/60,i===59)}const s=h.lightweight();return {race:s.race,ticks:s.ticks}});
  if(result.race.playerResult&&!result.race.playerResult.valid)throw Error(label+' invalid: '+JSON.stringify(result));
  if(result.race.allFinished&&result.race.phase==='finished')break;
  if(batch===599)throw Error(label+' timeout '+JSON.stringify(result));
 }
 await page.waitForFunction(()=>{const s=window.__EXPRESS.inspect();return !s.rewardPending&&s.career.state.receipts[s.attemptId]},null,{timeout:20000});
 await page.evaluate(()=>window.__EXPRESS.normalFrame(window.__clock+=1000/60,true));
 if(await page.locator('.film-skip').isVisible())await page.locator('.film-skip').click();
 const s=await inspect();assert.equal(s.race.playerResult.valid,true);assert.equal(s.career.state.receipts[s.attemptId].handlingProfile,'slingmods-sport-v5');
 rows.push({label,recipe:s.recipe,profile:s.profileContract,look:s.look,route:s.route,receipt:s.career.state.receipts[s.attemptId],race:s.race});
 await page.screenshot({path:out+'/'+label+'.png'});await fs.writeFile(out+'/progress.json',JSON.stringify(rows,null,2));console.log(label+' passed '+s.race.playerResult.timeMs.toFixed(0)+'ms');return s;
}
async function back(key){await page.locator('[data-action=bay]').click();await ready(key);return page.evaluate(k=>window[k].inspect(),key)}
async function event(id){await page.locator(`[data-action=event][data-value="${id}"]`).first().click();await page.locator('[data-action=start]').click();return driveReady()}
async function buy(id){await page.locator(`[data-product="${id}"] [data-action=purchase]`).click();await page.waitForFunction(()=>!window.__CAREER_HUB.inspect().pending);const s=await page.evaluate(()=>window.__CAREER_HUB.inspect());assert.ok(s.recipe.products[id],id+' purchase');return s}
try{
 await goto('?scene=bay&play=career','__TWT');await page.locator('#chapter-time-trial').click();await page.locator('#start-shakedown').click();await driveReady();await run('01-shakedown');await back('__TWT');
 await page.locator('#chapter-duel').click();await driveReady();await run('02-maya');await back('__TWT');
 await page.locator('#chapter-crew').click();await page.locator('#accept-crew').click();await driveReady();await run('03-crew');await back('__TWT');
 await page.locator('.chapter-next').click();await ready('__CAREER_HUB');
 await buy('SM-133');
 await event('open-it-up');await run('04-open-it-up');await back('__CAREER_HUB');await buy('SM-3223');await buy('SM-7720');
 await event('hold-your-nerve');await run('05-jett');await back('__CAREER_HUB');await buy('SM-26801');
 const frozen=await event('coastline-cup');await run('06-cup-harbor');await back('__CAREER_HUB');await page.reload();await ready('__CAREER_HUB');
 await page.locator('#career-finish').selectOption('white-graphite');await page.waitForFunction(()=>!window.__CAREER_HUB.inspect().pending);
 assert.deepEqual((await event('coastline-cup')).recipe,frozen.recipe);await run('07-cup-express');await back('__CAREER_HUB');await buy('SM-28919');
 for(const [id,label]of [['find-the-ridge','08-ridge-solo'],['nico-ridge-duel','09-ridge-duel'],['summit-invitational','10-ridge-crew']]){await event(id);await run(label);await back('__CAREER_HUB')}
 const final=await page.evaluate(()=>window.__CAREER_HUB.inspect());assert.equal(Object.keys(final.recipe.products).length,5);await page.reload();await ready('__CAREER_HUB');assert.deepEqual((await page.evaluate(()=>window.__CAREER_HUB.inspect())).state,final.state);
 // Revisiting Chapter 01 must carry the same earned build, including later parts.
 const garage=await goto('?scene=bay&play=career','__TWT');assert.deepEqual(garage.recipe,final.recipe);assert.equal(garage.finish.finish,final.recipe.finish);assert.equal(garage.products.selected.length,5);await page.screenshot({path:out+'/11-career-garage.png'});
 for(const query of ['?scene=harbor&play=career','?scene=crew&event=duel&play=career','?scene=crew&play=career']){const s=await goto(query);assert.deepEqual(s.recipe,final.recipe);assert.equal(s.products.selected.length,5);assert.equal(s.visual.asset,rows.length?'/assets/model02/slingshot-2026.glb':'');rows.push({label:'revisit-'+s.eventId,profile:s.profileContract,recipe:s.recipe,look:s.look})}
 // Current Chapter 01 creates a frozen entry when revisited. Check those deliberate
 // preparations separately before testing that free previews make no career writes.
 await goto('?scene=career&play=career','__CAREER_HUB');
 const previewBaseline=await page.evaluate(()=>window.__CAREER_HUB.inspect().state);
 const priorEntries=final.state.ownBuild.chapterOne.entries;
 const revisits=Object.values(previewBaseline.ownBuild.chapterOne.entries).filter(e=>!priorEntries[e.id]);
 assert.equal(revisits.length,3);assert.deepEqual(revisits.map(e=>e.event).sort(),['crew','duel','shakedown']);
 for(const e of revisits){assert.deepEqual(e.recipe,final.recipe);assert.equal(e.status,e.event==='crew'?'prepared':'abandoned')}
 assert.deepEqual({...previewBaseline,revision:final.state.revision,ownBuild:{...previewBaseline.ownBuild,chapterOne:final.state.ownBuild.chapterOne}},final.state);
 // Preview the earned build on every road/mode without touching career records.
 const fragment='#build='+encodeURIComponent(JSON.stringify({...final.recipe,handlingProfile:'slingmods-sport-v2'}));
 for(const route of ['harbor','express','ridge'])for(const mode of ['test','race']){const s=await goto(`?scene=express&route=${route}&mode=${mode}`+fragment);assert.deepEqual(s.recipe,final.recipe);assert.equal(s.careerTouched,false);rows.push({label:route+'-'+mode,profile:s.profileContract,recipe:s.recipe,look:s.look});await page.screenshot({path:out+`/12-${route}-${mode}.png`})}
 await goto('?scene=career&play=career','__CAREER_HUB');assert.deepEqual((await page.evaluate(()=>window.__CAREER_HUB.inspect())).state,previewBaseline);
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await context.storageState({path:out+'/earned-career.json',indexedDB:true});await fs.writeFile(out+'/result.json',JSON.stringify({pass:true,method:'Packaged browser. Fresh career, real fixed-step physics and test-only pedal/steering inputs; no position, checkpoint, credit or result injection. Controlled simulation clock, not performance evidence.',final,rows,errors,failed},null,2));console.log('STORY PARITY PASS');
}catch(e){await page.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({error:e.stack,rows,errors,failed,state:await page.evaluate(()=>window.__EXPRESS?.inspect()||window.__TWT?.inspect()||window.__CAREER_HUB?.inspect()).catch(()=>null)},null,2));throw e}finally{await context.close();await browser.close()}
