import {chromium} from '@playwright/test';
import {build} from 'vite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:5237',out=process.env.EVIDENCE_DIR||'evidence/cinematics/verified';await mkdir(out,{recursive:true});
await build({configFile:false,logLevel:'silent',publicDir:false,build:{outDir:path.resolve('.tools/cinematic-agent'),emptyOutDir:false,minify:false,lib:{entry:path.resolve('scripts/crew-evidence-agent.ts'),name:'CrewEvidence',formats:['iife'],fileName:()=> 'agent.js'}}});
const source=await readFile('.tools/cinematic-agent/agent.js','utf8');
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio']});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],report={method:'Isolated real WebGL browser. Authored shot samples are controlled preview fixtures; the finish below is earned through virtual gamepad input and ordinary physics/checkpoint validation. No finish or reward injection.',errors,previews:[]};
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const snap=()=>page.evaluate(()=>window.__EXPRESS.inspect());
async function open(route='express',visual='2026',extra=''){
 await page.goto(`${base}/?scene=express&route=${route}&visual=${visual}&mode=race&look=dusk-rain&play=preview&quality=high&test=1&profile=1&clock=controlled&captureBuffer=1${extra}`);
 await page.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:120000});
 await page.evaluate(()=>{window.now=0;window.__EXPRESS.setDeviceSample({keys:[],pads:[],focused:true})});
}
const frame=()=>page.evaluate(()=>{window.now+=1000/60;return window.__EXPRESS.normalFrame(window.now)});
const shot=name=>page.screenshot({path:`${out}/${name}.png`});
try{
 if(!process.env.FINISH_ONLY){
 for(const [route,visual]of [['express','2026'],['ridge','ryker'],['harbor','2026']]){
  await open(route,visual);const before=await snap();const saved=await page.evaluate(()=>JSON.stringify(localStorage));
  for(const film of ['arrival','grid','victory']){
   await page.evaluate(f=>window.__EXPRESS.cinematic(f),film);
   for(const t of [1,2.6,4.8,6.6]){const s=await page.evaluate(t=>window.__EXPRESS.cinematicSeek(t),t);assert.deepEqual(s.telemetry,before.telemetry);assert.equal(s.race.phase,'ready');assert.ok(s.camera.position.every(Number.isFinite));assert.ok(s.cinematics.active);if(t===4.8||film==='victory'&&t===2.6)await shot(`${route}-${visual}-${film}-${t}`)}
   await page.keyboard.press('Escape');await frame();assert.equal((await snap()).cinematics.active,false);assert.equal(await page.locator('#harbor-ui').evaluate(e=>e.inert),false);
  }
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),saved);
  report.previews.push({route,visual,vehicle:before.recipe.vehicleId,unchangedSimulation:true,unchangedStorage:true});
  console.log('PASS previews',route,visual);
 }
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);await page.evaluate(()=>window.__EXPRESS.cinematic('victory'));await page.evaluate(()=>window.__EXPRESS.cinematicSeek(6.2));await shot('portrait-victory');
 assert.equal(await page.locator('.film-skip').isVisible(),true);await page.locator('.film-skip').click();await frame();await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(150);
 // OS reduced-motion preference bypasses automatic travel; manual preview holds one static camera.
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.__EXPRESS.cinematic('grid'));const a=await page.evaluate(()=>window.__EXPRESS.cinematicSeek(.2)),b=await page.evaluate(()=>window.__EXPRESS.cinematicSeek(.8));assert.deepEqual(a.camera.position,b.camera.position);assert.equal(b.cinematics.look.amount,0);await page.keyboard.press('Escape');await frame();await page.locator('#start-crew').click();assert.equal((await snap()).cinematics.active,false);assert.equal((await snap()).race.phase,'countdown');report.reducedMotion=true;
 await page.emulateMedia({reducedMotion:'no-preference'});
 }
 // Start waits before the race clock begins; skipping starts the ordinary countdown.
 await open('harbor');await page.locator('#start-crew').click();assert.equal((await snap()).race.phase,'ready');assert.equal((await snap()).cinematics.film,'grid');await page.locator('.film-skip').click();assert.equal((await snap()).race.phase,'countdown');
 await page.addScriptTag({content:source});await page.evaluate(()=>{window.driver=new window.CrewEvidence.EvidenceDriver(window.__EXPRESS.route,11);window.last=0});
 let result;
 for(let block=0;block<28;block++){
  result=await page.evaluate(()=>{const h=window.__EXPRESS;let s;for(let i=0;i<600;i++){const b=h.lightweight(),dt=Math.max(0,b.telemetry.time-window.last);window.last=b.telemetry.time;h.setDeviceSample(b.race.phase==='running'?window.driver.sample(b.telemetry,b.field,dt):window.CrewEvidence.toDevice());s=h.normalFrame(window.now,i%120===0);window.now+=1000/60;if(s.race.playerResult){s=h.normalFrame(window.now);window.now+=1000/60;break}}return s});
  console.log('Race',block,result.race.phase,result.race.playerResult?.status??result.telemetry.speed.toFixed(1));
  if(result.race.playerResult)break;
 }
 assert.ok(result.race.playerResult?.valid,'must earn an actual finish');assert.equal(result.cinematics.film,'victory');report.finish=result.race.playerResult;report.finishTriggered=result.cinematics;
 for(let i=0;i<52;i++)await frame();assert.ok((await snap()).cinematics.elapsed>.7,'film must advance with a connected controller');report.finishAdvanced=(await snap()).cinematics;await shot('earned-finish');
 for(let i=0;i<43;i++)await page.evaluate(()=>{window.now+=100;window.__EXPRESS.normalFrame(window.now)});
 await shot('earned-classification');assert.equal(await page.locator('.film-detail').textContent(),`P${result.race.playerResult.place} / FINISH  /  ${(result.race.playerResult.timeMs/1000).toFixed(3)} SEC`);
 for(let i=0;i<35;i++)await page.evaluate(()=>{window.now+=100;window.__EXPRESS.normalFrame(window.now)});
 assert.equal((await snap()).cinematics.active,false);for(let i=0;i<10;i++)await frame();assert.equal((await snap()).cinematics.active,false);assert.equal(await page.locator('#race-menu').isVisible(),true);report.finishDoesNotReplay=true;report.automaticResultsReturn=true;
 // Native wall-clock run and real captured score, respecting existing audio controls.
 await page.goto(`${base}/?scene=express&route=express&mode=test&look=golden-hour&play=preview&test=1&profile=1&quality=high`);await page.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:120000});
 await page.locator('#enable-sound').click();await page.waitForFunction(()=>window.__EXPRESS.inspect().audio.enabled);await page.evaluate(()=>window.__EXPRESS.startAudioCapture());
 await page.locator('.film-launcher summary').click();const start=Date.now();await page.locator('[data-film=arrival]').click();await page.waitForTimeout(2200);report.nativeMid=(await snap()).cinematics;await shot('native-arrival');await page.waitForFunction(()=>!window.__EXPRESS.inspect().cinematics.active,null,{timeout:20000});report.nativeDurationMs=Date.now()-start;
 const audio=await page.evaluate(()=>window.__EXPRESS.stopAudioCapture());await writeFile(out+'/original-score.webm',Buffer.from(audio.base64,'base64'));report.audio={...audio,base64:undefined};
 assert.ok(report.nativeDurationMs>=9000&&report.nativeDurationMs<16000);assert.ok(report.nativeMid.active);
 await page.locator('#start-crew').click();assert.equal((await snap()).cinematics.film,'grid');await page.waitForFunction(()=>['countdown','running'].includes(window.__EXPRESS.inspect().race.phase),null,{timeout:15000});assert.equal((await snap()).cinematics.active,false);report.automaticStart=true;
 assert.deepEqual(errors,[]);report.status='PASS';
}catch(e){report.status='FAIL';report.failure=e.stack;await shot('failure').catch(()=>{});throw e}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close()}
