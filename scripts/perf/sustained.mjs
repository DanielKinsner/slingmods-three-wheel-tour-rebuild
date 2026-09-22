/** One preset/route per invocation. Complete real races; no clock control, raster skipping, tracing or recording. */
import {chromium} from '@playwright/test';
import {build} from 'vite';
import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {frameStatistics,frameVerdict,FRAME_LIMITS} from './frame-statistics.mjs';
const [quality='high',cadence='native',route='harbor']=process.argv.slice(2);
assert.ok(['low','medium','high','ultra'].includes(quality));assert.ok(['native','uncapped'].includes(cadence));assert.ok(['harbor','express','ridge'].includes(route));
const out=process.env.EVIDENCE_DIR;if(!out)throw Error('Fresh EVIDENCE_DIR required');await fs.mkdir(out,{recursive:false});
const base=process.env.BASE_URL||'http://127.0.0.1:5186',look=process.env.LOOK||(route==='ridge'?'day':'dusk-rain');
const bundle=await build({configFile:false,logLevel:'silent',publicDir:false,build:{write:false,minify:false,lib:{entry:path.resolve('scripts/story-parity-driver.ts'),name:'ParityDriver',formats:['iife']}}});
const source=(Array.isArray(bundle)?bundle[0]:bundle).output.find(x=>x.type==='chunk').code;
const args=['--use-angle=d3d11','--mute-audio',...(cadence==='uncapped'?['--disable-frame-rate-limit','--disable-gpu-vsync']:[])];
const b=await chromium.launch({headless:true,args}),c=await b.newContext({viewport:{width:2560,height:1440},deviceScaleFactor:1}),p=await c.newPage();
const report={startedAt:new Date().toISOString(),quality,cadence,route,look,url:base,browser:b.version(),args,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 thresholds:FRAME_LIMITS,method:'Isolated Chromium ANGLE D3D11 on owner GPU, native wall-clock RAF (uncapped lane explicitly disables vsync); 2560x1440 DPR1. Two complete races and at least 90 active seconds, bounded at three races. Current Sport v5 pedal/steering driver only; real simulation/rivals/results. Audio graph active, output muted. All raw phases/outliers retained. No screenshots, readback, trace, draw wrappers or recorder in scored frames. CPU submission is not GPU execution time. OS/driver caches not flushed.',errors:[],failedRequests:[],finals:[],attempts:[]};
p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)report.failedRequests.push({status:r.status(),url:r.url()})});
let heartbeat;
try {
 await p.goto(base+`/?scene=express&route=${route}&mode=race&play=preview&test=1&profile=1&quality=${quality}&look=${look}`,{timeout:120000});
 await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});await p.bringToFront();
 report.initial=await p.evaluate(()=>window.__EXPRESS.inspect());assert.match(report.initial.renderer,/RTX 4080/);assert.deepEqual(report.initial.size,[2560,1440]);
 report.timeOrigin=await p.evaluate(()=>performance.timeOrigin);
 assert.equal(report.initial.pipeline.quality,quality);assert.equal(report.initial.pipeline.post,true);assert.equal(report.initial.handlingProfile,'slingmods-sport-v5');assert.equal(report.initial.free,false);
 await p.addScriptTag({content:source});
 if(!report.initial.audio.enabled)await p.locator('#enable-sound').click();await p.waitForFunction(()=>window.__EXPRESS.inspect().audio.enabled);
 await p.evaluate(()=>{window.__drive=true;window.__finished=0;let attempt='',driver,prior='ready',lastTick=-1;
  function frame(){if(!window.__drive)return;const h=window.__EXPRESS,s=h.lightweight();
   if(attempt!==s.attemptId){attempt=s.attemptId;driver=new window.ParityDriver.EvidenceDriver(h.route);lastTick=-1;}
   if(s.ticks!==lastTick||s.race.phase!=='running'){h.setDeviceSample(s.race.phase==='running'?driver.sample(s.telemetry,s.field):window.ParityDriver.toDevice());lastTick=s.ticks;}
   if(s.race.allFinished&&prior!=='finished'){window.__finished++;prior='finished';}else if(!s.race.allFinished)prior=s.race.phase;
   requestAnimationFrame(frame);
  }requestAnimationFrame(frame);
 });
 heartbeat=setInterval(async()=>{try{console.log(JSON.stringify(await p.evaluate(()=>{const s=window.__EXPRESS.lightweight();return {phase:s.race.phase,elapsedMs:s.race.elapsedMs,finished:window.__finished,ticks:s.ticks}})))}catch{}},30000);
 await p.locator('#start-crew').click();
 for(let attempt=1;attempt<=3;attempt++){
  await p.waitForFunction(n=>window.__finished>=n,attempt,{timeout:360000,polling:10000});
  const state=await p.evaluate(()=>window.__EXPRESS.inspect()),profile=await p.evaluate(()=>window.__EXPRESS.profile());report.finals.push(state);
  const rows=profile.rows.filter(r=>r[10]===2&&r[11]===attempt),stats=frameStatistics(rows.map(r=>r[1]));
  const verdict=frameVerdict(stats,{quality,cadence});
  const scales=rows.map(r=>r[12]).filter(Number.isFinite);
  const result={attempt,...stats,...verdict,resolutionScale:scales.length?{minimum:Math.min(...scales),maximum:Math.max(...scales),average:scales.reduce((s,v)=>s+v,0)/scales.length}:null,result:state.race.playerResult,finishers:state.race.standings.map(s=>({id:s.id,status:s.status,timeMs:s.timeMs})),pipeline:state.pipeline};
  report.attempts.push(result);console.log(JSON.stringify(result));
  report.profile=profile;await fs.writeFile(out+'/run.json',JSON.stringify(report));
  assert.ok(state.race.playerResult?.valid&&state.race.standings.every(s=>s.status==='finished'),'Every participant must finish validly');assert.equal(profile.overflow,0,'Collector must not overflow');
  if(attempt>=2&&report.attempts.reduce((s,a)=>s+a.activeSeconds,0)>=90)break;
  if(attempt<3)await p.locator('button[data-action="retry"]').click();
 }
 report.sustained=report.attempts.length>=2&&report.attempts.reduce((s,a)=>s+a.activeSeconds,0)>=90;
 report.pooled=frameStatistics(report.profile.rows.filter(r=>r[10]===2).map(r=>r[1]));
 report.pass=report.sustained&&report.attempts.every(a=>a.frameTail&&a.highBudget!==false)&&!report.errors.length&&!report.failedRequests.length;
 await fs.writeFile(out+'/summary.json',JSON.stringify({...report,profile:undefined,initial:undefined,finals:undefined},null,2));
 await fs.writeFile(out+'/run.json',JSON.stringify(report));console.log(JSON.stringify({pass:report.pass,sustained:report.sustained,pooled:report.pooled}));
 if(!report.pass)process.exitCode=2;
}catch(error){report.failure=error.stack;report.profile=await p.evaluate(()=>window.__EXPRESS?.profile()).catch(()=>null);await fs.writeFile(out+'/run.json',JSON.stringify(report));throw error}
finally{clearInterval(heartbeat);await c.close();await b.close();}
