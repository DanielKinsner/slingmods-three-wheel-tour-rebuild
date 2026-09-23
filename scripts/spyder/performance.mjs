/** Comparable bounded addition audit, not the pre-existing performance release gate. */
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {frameStatistics,frameVerdict} from '../perf/frame-statistics.mjs';
const out=process.env.EVIDENCE_DIR||'assets/spyder/evidence/performance';await fs.mkdir(out,{recursive:true});
const source=await fs.readFile('.tools/ryker-agent/agent.js','utf8');
const report={method:'Sequential isolated Chromium D3D11 native wall-clock RAF. 2560x1440 DPR1 High dusk-rain Harbor Time Attack, one genuine full lap per vehicle. Audio graph enabled; speaker output muted. No screenshots, recording, readback or tracing during scored frames. Same route, settings and evidence driver. Existing performance HOLD remains HOLD. This bounded audit does not replace the two-race High/Ultra release matrix.',startedAt:new Date().toISOString(),cpu:execFileSync('powershell',['-NoProfile','-Command','Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors | ConvertTo-Json'],{encoding:'utf8'}),build:JSON.parse(await fs.readFile('demo-current.json','utf8')),runs:[]};
for(const vehicle of ['slingshot','ryker','spyder']){
 const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio']}),p=await b.newPage({viewport:{width:2560,height:1440},deviceScaleFactor:1});
 const r={vehicle,errors:[],missing:[],browser:b.version()};p.on('pageerror',e=>r.errors.push(e.message));p.on('response',x=>{if(x.status()>=400)r.missing.push(x.url())});
 try{
  await p.goto((process.env.BASE_URL||'http://127.0.0.1:5214')+`/?scene=express&route=harbor&mode=race&trial=1&play=preview&visual=${vehicle}&test=1&profile=1&quality=high&look=dusk-rain`);await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});
  r.initial=await p.evaluate(()=>window.__EXPRESS.inspect());assert.deepEqual(r.initial.size,[2560,1440]);assert.equal(r.initial.pipeline.quality,'high');await p.addScriptTag({content:source});
  if(!r.initial.audio.enabled)await p.locator('#enable-sound').click();
  await p.evaluate(()=>{window.drive=true;const h=window.__EXPRESS,d=new window.CrewEvidence.EvidenceDriver(h.route);let last=0;function f(){if(!window.drive)return;const s=h.lightweight(),dt=Math.max(0,s.telemetry.time-last);last=s.telemetry.time;h.setDeviceSample(s.race.phase==='running'?d.sample(s.telemetry,s.field,dt):window.CrewEvidence.toDevice());requestAnimationFrame(f)}requestAnimationFrame(f)});
  await p.locator('#start-crew').click();if(await p.locator('.film-skip').isVisible())await p.locator('.film-skip').click();
  await p.waitForFunction(()=>window.__EXPRESS.lightweight().race.playerResult?.valid,null,{timeout:240000,polling:5000});
  await p.evaluate(()=>window.drive=false);r.final=await p.evaluate(()=>window.__EXPRESS.inspect());const profile=await p.evaluate(()=>window.__EXPRESS.profile());await fs.writeFile(`${out}/${vehicle}-raw.json`,JSON.stringify(profile));
  r.frames=frameStatistics(profile.rows.filter(x=>x[10]===2).map(x=>x[1]));r.tail=frameVerdict(r.frames,{quality:'high',cadence:'native'});r.overflow=profile.overflow;
  r.census=await p.evaluate(()=>window.__EXPRESS.drawCensus(5));r.records=await p.evaluate(()=>JSON.parse(localStorage.getItem('slingmods-gx-time-attack-v1')||'{}'));
  assert.ok(r.frames.samples>500&&r.frames.activeSeconds>60);assert.equal(r.overflow,0);assert.deepEqual(r.errors,[]);assert.deepEqual(r.missing,[]);r.status='PASS';
  if(vehicle==='spyder'){
   await p.reload();await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});r.reloadedText=await p.locator('body').innerText();r.reloaded=await p.evaluate(()=>window.__EXPRESS.inspect());await p.screenshot({path:out+'/spyder-saved-ghost.png'});
   assert.ok(Object.values(r.records).some(x=>x.ghost?.length>500),'Native-rate ghost must contain dense samples');
  }
 }catch(e){r.status='FAIL';r.failure=e.stack;console.error(e)}finally{report.runs.push(r);await fs.writeFile(out+'/report.json',JSON.stringify(report));console.log(JSON.stringify({vehicle,status:r.status,frames:r.frames,tail:r.tail,failure:r.failure}));await b.close()}
}
