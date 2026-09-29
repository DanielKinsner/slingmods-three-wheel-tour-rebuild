import {chromium} from '@playwright/test';
import {build} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {frameStatistics,frameVerdict,FRAME_LIMITS} from '../perf/frame-statistics.mjs';

const base=process.env.BASE_URL||'http://127.0.0.1:5271',quality=process.env.QUALITY||'high',cadence=process.env.CADENCE||'uncapped',out=process.env.EVIDENCE_DIR||'handoff/rally-evidence/performance';
assert.ok(['native','uncapped'].includes(cadence));
await fs.mkdir(out,{recursive:true});
const bundle=await build({configFile:false,logLevel:'silent',publicDir:false,build:{write:false,minify:false,lib:{entry:path.resolve('scripts/rally/evidence-driver.ts'),name:'RallyEvidence',formats:['iife']}}}),source=(Array.isArray(bundle)?bundle[0]:bundle).output.find(x=>x.type==='chunk').code;
const args=['--use-angle=d3d11','--mute-audio',...(cadence==='uncapped'?['--disable-frame-rate-limit','--disable-gpu-vsync']:[])];
const browser=await chromium.launch({headless:true,args}),page=await browser.newPage({viewport:{width:2560,height:1440},reducedMotion:'reduce'});
const report={quality,cadence,startedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),browser:browser.version(),args,thresholds:FRAME_LIMITS,method:'Two complete physical rally laps, 2560x1440 DPR 1, native RAF at the explicitly named cadence, real input controls. All running frames retained. No controlled clock, screenshots, readbacks or tracing during scored frames. Audio enabled, hardware output muted. Separate from the historical road-course gate.',errors:[],requests:[],attempts:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.requests.push(r.url());});
let heartbeat;
try{
  await page.goto(base+`/?scene=rally&visual=ryker&mode=race&test=1&profile=1&quality=${quality}`,{timeout:120000});await page.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});await page.bringToFront();
  report.initial=await page.evaluate(()=>window.__EXPRESS.inspect());assert.deepEqual(report.initial.size,[2560,1440]);assert.equal(report.initial.rally.practice,false);
  await page.addScriptTag({content:source});await page.locator('#enable-sound').click();
  await page.evaluate(()=>{window.__drive=true;let attempt='',driver,lastTick=-1;function frame(){if(!window.__drive)return;const h=window.__EXPRESS,s=h.lightweight();if(attempt!==s.attemptId){attempt=s.attemptId;driver=new window.RallyEvidence.RallyDriver(h.route);lastTick=-1;}if(s.ticks!==lastTick||s.race.phase!=='running'){h.setDeviceSample(s.race.phase==='running'?driver.sample(s.telemetry,s.field):window.RallyEvidence.toDevice());lastTick=s.ticks;}requestAnimationFrame(frame);}requestAnimationFrame(frame);});
  heartbeat=setInterval(async()=>{const s=await page.evaluate(()=>window.__EXPRESS.lightweight()).catch(()=>null);if(s)console.log(JSON.stringify({seconds:Math.round(s.race.elapsedMs/1000),phase:s.race.phase,progress:Math.round(s.race.standings[0].progress)}));},20000);
  await page.locator('#start-crew').click();
  for(let attempt=1;attempt<=2;attempt++){
    await page.waitForFunction(()=>window.__EXPRESS.lightweight().race.allFinished,null,{timeout:240000});
    const state=await page.evaluate(()=>window.__EXPRESS.inspect()),profile=await page.evaluate(()=>window.__EXPRESS.profile()),rows=profile.rows.filter(r=>r[10]===2&&r[11]===attempt),stats=frameStatistics(rows.map(r=>r[1]));
    report.attempts.push({attempt,...stats,...frameVerdict(stats,{quality,cadence}),result:state.race.playerResult,resolutionScale:{min:Math.min(...rows.map(r=>r[12])),max:Math.max(...rows.map(r=>r[12]))}});
    assert.equal(profile.overflow,0,'Retain every frame without collector overflow');
    assert.equal(state.race.playerResult?.valid,true,JSON.stringify(state.race.playerResult));report.profile=profile;console.log(JSON.stringify(report.attempts.at(-1)));
    if(attempt===1){await page.waitForTimeout(2000);await page.locator('#start-crew').click();}
  }
  report.pooled=frameStatistics(report.profile.rows.filter(r=>r[10]===2).map(r=>r[1]));report.pass=report.attempts.every(a=>a.frameTail&&a.highBudget!==false)&&!report.errors.length&&!report.requests.length;
  await fs.writeFile(out+'/summary.json',JSON.stringify({...report,initial:undefined,profile:undefined},null,2));if(!report.pass)process.exitCode=2;
}catch(e){report.failure=e.stack;throw e;}
finally{clearInterval(heartbeat);await fs.writeFile(out+'/run.json',JSON.stringify(report));await browser.close();}
console.log(JSON.stringify({pass:report.pass,pooled:report.pooled}));
