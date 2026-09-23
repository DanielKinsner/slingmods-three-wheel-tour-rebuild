import {chromium} from '@playwright/test';
import {build} from 'vite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const out=process.env.EVIDENCE_DIR||'assets/spyder/evidence/career';await mkdir(out,{recursive:true});
await build({configFile:false,logLevel:'silent',publicDir:false,build:{outDir:path.resolve('.tools/ryker-agent'),emptyOutDir:false,minify:false,lib:{entry:path.resolve('scripts/crew-evidence-agent.ts'),name:'CrewEvidence',formats:['iife'],fileName:()=> 'agent.js'}}});
const source=await readFile('.tools/ryker-agent/agent.js','utf8');
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio']});
const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],report={method:'Isolated fresh browser. Ordinary career transactions and virtual gamepad controls through fixed simulation; no teleport, forged finish or credit injection.',errors};p.on('pageerror',e=>errors.push(e.message));
const ready=async()=>{const u=new URL(p.url());if(u.searchParams.get('test')!=='1'||u.searchParams.get('profile')!=='1'){u.searchParams.set('test','1');u.searchParams.set('profile','1');u.searchParams.set('captureBuffer','1');await p.goto(u.href)}await p.waitForFunction(()=>window.__SIGNATURE?.ready||window.__EXPRESS?.ready,null,{timeout:120000})};
async function capture(name){await p.screenshot({path:out+'/'+name+'.png'})}
try{
 await p.goto((process.env.BASE_URL||'http://127.0.0.1:5213')+'/?profile=1&scene=bay&play=career&visual=spyder&test=1&captureBuffer=1');await ready();await capture('garage-stock');
 await p.locator('#chapter-build').click();await p.locator('#build-panel [data-action=finish][data-value=white-graphite]').click();await p.waitForTimeout(400);await capture('workshop-white');
 report.garage=await p.evaluate(()=>window.__SIGNATURE.inspect());
 const image=await p.evaluate(()=>{window.__SIGNATURE.referenceCamera([1.5,2.6,4.55],[5.79,2.6,4.55]);return document.querySelector('canvas').toDataURL()});await writeFile(out+'/wall-relief.png',Buffer.from(image.split(',')[1],'base64'));
 await p.locator('#build-panel [data-action=close]').click();await p.locator('#continue-chapter').click();await p.locator('#start-shakedown').click();await p.waitForURL('**/?scene=harbor**');
 const url=new URL(p.url());url.searchParams.set('test','1');url.searchParams.set('profile','1');url.searchParams.set('clock','controlled');url.searchParams.set('captureBuffer','1');await p.goto(url.href);await ready();report.entry=await p.evaluate(()=>window.__EXPRESS.inspect());assert.equal(report.entry.recipe.vehicleId,'can-am-spyder-f3');assert.equal(report.entry.recipe.finish,'white-graphite');
 await p.reload();await ready();report.resumed=await p.evaluate(()=>window.__EXPRESS.inspect());assert.deepEqual(report.resumed.recipe,report.entry.recipe);assert.equal(report.resumed.career.attempt.id,report.entry.career.attempt.id);
 await p.addScriptTag({content:source});await p.evaluate(()=>{window.driver=new window.CrewEvidence.EvidenceDriver(window.__EXPRESS.route,11);window.last=0;window.rows=[];window.frameNow=0});
 await p.locator('#start-crew').click();if(await p.locator('.film-skip').isVisible())await p.locator('.film-skip').click();await p.waitForTimeout(100);let result;
 for(let block=0;block<36;block++){
  result=await p.evaluate(()=>{const h=window.__EXPRESS;let s;for(let i=0;i<600;i++){const b=h.lightweight(),dt=Math.max(0,b.telemetry.time-window.last);window.last=b.telemetry.time;h.setDeviceSample(b.race.phase==='running'?window.driver.sample(b.telemetry,b.field,dt):window.CrewEvidence.toDevice());s=h.normalFrame(window.frameNow,i===599);window.frameNow+=1000/60;if(i%30===0)window.rows.push({telemetry:s.telemetry,race:s.race,recipe:s.recipe});if(s.race.playerResult)break}return s});
  console.log(JSON.stringify({block,speed:result.telemetry.speed,phase:result.race.phase,gate:result.race.standingLap?.checkpoint,position:result.telemetry.position,result:result.race.playerResult,reward:result.rewardText}));
  if(block===1){const image=await p.evaluate(()=>window.__EXPRESS.referenceCamera('player',[1.8,1.0,-2.7],[0,.5,-.1]));await writeFile(out+'/road-white.png',Buffer.from(image.split(',')[1],'base64'))}
  if(result.race.playerResult)break;
 }
 report.result=result;await capture('finish');await writeFile(out+'/telemetry.json',JSON.stringify(await p.evaluate(()=>window.rows)));
 assert.ok(result.race.playerResult?.valid,'actual valid lap required');
 await p.waitForFunction(()=>!window.__EXPRESS.inspect().rewardPending);await p.evaluate(()=>window.__EXPRESS.normalFrame(window.frameNow));report.reward=await p.evaluate(()=>window.__EXPRESS.inspect());assert.equal(report.reward.career.state.credits,800);assert.ok(report.reward.career.state.receipts[report.reward.attemptId].buildSnapshot);await capture('reward');
 if(await p.locator('.film-skip').isVisible())await p.locator('.film-skip').click();
 await p.locator('[data-action=bay]').click();await p.waitForURL('**/?scene=bay**');const back=new URL(p.url());back.searchParams.set('test','1');await p.goto(back.href);await ready();await p.locator('#chapter-build').click();await p.locator('#build-panel [data-action=buy][data-value=throttle]').click();await p.waitForTimeout(600);report.purchased=await p.evaluate(()=>window.__SIGNATURE.inspect());await capture('earned-pedal-commander');
 await p.reload();await ready();report.returned=await p.evaluate(()=>window.__SIGNATURE.inspect());assert.deepEqual(errors,[]);report.status='PASS';
}catch(e){report.status='FAIL';report.failure=e.stack;await capture('failure').catch(()=>{});throw e}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close()}
