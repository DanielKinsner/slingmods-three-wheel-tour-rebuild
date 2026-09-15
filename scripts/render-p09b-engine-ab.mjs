import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';import{createHash}from'node:crypto';
const out=process.env.EVIDENCE_DIR;assert.ok(out,'EVIDENCE_DIR required');await fs.mkdir(out,{recursive:false});
const base=process.env.BASE_URL??'http://127.0.0.1:5201';const browser=await chromium.launch({headless:true,args:['--mute-audio']});
try{const page=await browser.newPage();await page.route(base+'/p09b-audio-fixture',r=>r.fulfill({contentType:'text/html',body:'<title>Isolated P09B engine comparison</title>'}));await page.goto(base+'/p09b-audio-fixture');const result=await page.evaluate(async()=>{
 const{renderOfflineGameAudio}=await import('/src/audio/game-audio.ts');const{Simulation}=await import('/src/simulation/index.ts');const sim=await Simulation.create();const prototype=sim.telemetry();sim.dispose();const timeline=[];
 for(let frame=0;frame<300;frame++){const time=frame/20,t=structuredClone(prototype),stage=Math.floor(time/3),within=time%3;t.wheels.forEach(w=>{w.contact=true;w.longitudinalSpeed=0;w.slipRatio=0;w.slipAngle=0});t.speed=0;t.gear=1;t.shifting=false;
  if(stage===0){t.rpm=1050+Math.sin(time*4)*20;t.throttle=0}
  if(stage===1){t.rpm=3400;t.throttle=.48}
  if(stage===2){t.rpm=1600+within/3*4800;t.throttle=.92}
  if(stage===3){t.rpm=5800-within/3*3400;t.throttle=0}
  if(stage===4){const cycle=within%1;t.gear=2+Math.floor(within);t.shifting=cycle>.72&&cycle<.92;t.rpm=cycle<.82?3300+cycle*3000:3300;t.throttle=t.shifting?.15:.8}
  timeline.push({time,telemetry:t,life:{enabled:true,paused:false,mute:false,volume:.65,cockpit:false}})
 }
 const result={};for(const revision of ['old','new'])result[revision]=await renderOfflineGameAudio(timeline,15,revision);return{renders:result,timeline,method:'Identical scripted authoritative-telemetry-shaped test states rendered by each real runtime graph/mapper/source bank in OfflineAudioContext; not a captured driving run or physical-device audition.'}
 });for(const[name,audio]of Object.entries(result.renders)){await fs.writeFile(out+'/'+name+'-unmatched.wav',Buffer.from(audio.wavBase64,'base64'));delete audio.wavBase64;assert.equal(audio.nonfinite,0);assert.equal(audio.clipped,0)}result.inputHashes=Object.fromEntries(await Promise.all(['src/audio/game-audio.ts','src/audio/graph.ts','src/audio/mapper.ts','src/audio/mapper-legacy.ts','public/assets/audio/p03b2/provenance.json','public/assets/audio/p09b/provenance.json'].map(async p=>[p,createHash('sha256').update(await fs.readFile(p)).digest('hex')])));await fs.writeFile(out+'/offline-render.json',JSON.stringify(result,null,2));console.log(JSON.stringify({output:out,renders:result.renders}));}finally{await browser.close()}
