import {chromium} from '@playwright/test';
import {build} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const base=process.env.BASE_URL||'http://127.0.0.1:5268',out=process.env.EVIDENCE_DIR||'handoff/rally-evidence';
await fs.mkdir(out,{recursive:true});
const bundle=await build({configFile:false,logLevel:'silent',publicDir:false,build:{write:false,minify:false,lib:{entry:path.resolve('scripts/rally/evidence-driver.ts'),name:'RallyEvidence',formats:['iife']}}});
const source=(Array.isArray(bundle)?bundle[0]:bundle).output.find(x=>x.type==='chunk').code;
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']});
const context=await browser.newContext({viewport:{width:1600,height:900},reducedMotion:'reduce'}),page=await context.newPage();
const report={base,errors:[],failedRequests:[],checks:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.failedRequests.push({url:r.url(),status:r.status()});});
const query='&test=1&profile=1&clock=controlled&quality=high';
async function go(url,hook='__EXPRESS'){await page.goto(base+url,{timeout:120000});await page.waitForFunction(h=>window[h]?.ready,hook,{timeout:180000});}
async function frames(count,drive=true,raster=false){return page.evaluate(({count,drive,raster})=>{const h=window.__EXPRESS;for(let i=0;i<count;i++){const s=h.lightweight();h.setDeviceSample(drive&&s.race.phase==='running'?window.__driver.sample(s.telemetry,s.field):window.RallyEvidence.toDevice());h.normalFrame(window.__now+=1000/60,raster&&i===count-1);if(h.lightweight().race.playerResult)break;}if(raster)h.normalFrame(window.__now,true);return h.lightweight();},{count,drive,raster});}
try{
  await go('/?scene=signature&screen=events&visual=2026'+query,'__SIGNATURE');
  await page.locator('[data-action=destination][data-value=rally]').click();
  await page.getByRole('button',{name:'START RALLY'}).waitFor();
  assert.ok((await page.locator('body').innerText()).includes('A Ryker is provided'));
  await page.screenshot({path:out+'/event-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/event-mobile.png'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.setViewportSize({width:1600,height:900});
  const foreign=await page.evaluate(()=>window.__SIGNATURE.inspect().recipe);
  await page.getByRole('button',{name:'START RALLY'}).click();
  await page.locator('#start-crew').waitFor({timeout:180000});
  await page.getByRole('heading',{name:'Redstone Rally',exact:true}).waitFor();
  assert.equal(new URL(page.url()).searchParams.get('scene'),'rally');
  report.checks.push('Event menu entry from a Slingshot supplies a Ryker; desktop and mobile layout');
  // Controlled validation uses exactly the public rally entry, with isolated evidence parameters added.
  await go('/?scene=rally&visual=spyder&mode=race'+query+'#build='+encodeURIComponent(JSON.stringify(foreign)));
  report.initial=await page.evaluate(()=>window.__EXPRESS.inspect());
  assert.equal(report.initial.recipe.vehicleId,'can-am-ryker-900');assert.equal(report.initial.route.id,'redstone-rally');assert.equal(Object.keys(report.initial.field).length,1);assert.equal(report.initial.careerTouched,false);
  await page.addScriptTag({content:source});await page.evaluate(()=>{window.__now=performance.now();window.__driver=new window.RallyEvidence.RallyDriver(window.__EXPRESS.route);window.__EXPRESS.setDeviceSample(window.RallyEvidence.toDevice());window.__EXPRESS.normalFrame(window.__now);});
  await page.locator('#start-crew').click();
  let s;for(let i=0;i<180;i++){s=await frames(60,true,true);if([15,45,75,100].includes(i))await page.screenshot({path:out+'/stage-'+i+'.png'});if(s.race.playerResult)break;if(i%30===0)console.log('Rally validation seconds',i,'progress',Math.round(s.race.standings[0].progress));}
  assert.equal(s.race.playerResult?.valid,true,JSON.stringify(s.race.playerResult));assert.equal(s.rally.saved,true);assert.equal(s.racecraft.drift.boosts,0);
  await page.waitForTimeout(1700);await page.screenshot({path:out+'/stage-finish.png'});report.finish=s;
  await page.locator('#start-crew').click();s=await frames(3,false,true);assert.equal(s.rally.score,0);assert.equal(s.rally.recorded,false);
  await page.locator('#race-pause').click();s=await frames(1,false,true);const paused=s.race.elapsedMs;const score=s.rally.score;s=await frames(120,false,true);assert.equal(s.race.elapsedMs,paused);assert.equal(s.rally.score,score);assert.equal(s.race.paused,true);
  await page.reload();await page.waitForFunction(()=>window.__EXPRESS?.ready);const persisted=await page.evaluate(()=>window.__EXPRESS.inspect().rally.best);assert.ok(persisted.timeMs>60000);report.checks.push('Full physical lap, records persist, retry resets scoring, pause freezes clock and score');
  await go('/?scene=rally&visual=ryker&mode=test'+query);await page.addScriptTag({content:source});
  await page.evaluate(()=>{window.__now=performance.now();window.__EXPRESS.setDeviceSample(window.RallyEvidence.toDevice());window.__EXPRESS.normalFrame(window.__now);});await page.locator('#start-crew').click();await frames(190,false,true);
  report.drift=await page.evaluate(()=>{const h=window.__EXPRESS;let peak=0,slides=0;for(let i=0;i<480;i++){const held=i>=340&&i<410;h.setDeviceSample({keys:held?['KeyW','KeyD','Space']:i>=410?['KeyW','KeyA']:['KeyW'],pads:[],focused:true});h.normalFrame(window.__now+=1000/60,i===409||i===479);const s=h.lightweight();peak=Math.max(peak,Math.abs(s.telemetry.wheels[2].slipAngle));if(s.racecraft.drift.active)slides++;}return{peak,slides,state:h.lightweight()};});
  assert.ok(report.drift.slides>10,'handbrake drift is reachable from ordinary keyboard controls');assert.equal(report.drift.state.rally.recorded,false);assert.equal(report.drift.state.racecraft.drift.boosts,0);await page.screenshot({path:out+'/dirt-drift.png'});
  report.checks.push('Recce keyboard drift, dirt particles, no timed record or automatic boost');
  for(const [route,visual] of [['express','2026'],['ridge','ryker'],['harbor','spyder']]){await go(`/?scene=express&route=${route}&visual=${visual}&mode=test${query}`);const state=await page.evaluate(()=>window.__EXPRESS.inspect());assert.equal(state.rally,null);assert.equal(state.racecraft.arcade,true);report.checks.push(`${route} / ${visual} retains its road mode`);}
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.pass=true;
}catch(e){report.failure=e.stack;await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}
finally{await fs.writeFile(out+'/browser.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({pass:report.pass,checks:report.checks,errors:report.errors}));
