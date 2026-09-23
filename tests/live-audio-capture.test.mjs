import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'vite';
import {chromium} from '@playwright/test';
import {mkdtemp,readFile,writeFile,mkdir,rm,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';

const evidenceRoot=path.resolve(process.env.AUDIO_EVIDENCE_DIR??path.join('director-kit/production/evidence/P06',`live-audio-${new Date().toISOString().replaceAll(':','-')}-${randomUUID().slice(0,8)}`));
const relativeEvidence=path.relative(process.cwd(),evidenceRoot);
if(relativeEvidence==='..'||relativeEvidence.startsWith('..'+path.sep)||path.isAbsolute(relativeEvidence))throw Error('Audio evidence directory must stay within the current project');
await mkdir(path.dirname(evidenceRoot),{recursive:true});
// Claim a fresh directory once for both tests. Existing evidence is a hard error, never replaced.
await mkdir(evidenceRoot);


// White-box routing/lifecycle test using the actual production GameAudio, banks, mapper and native MediaRecorder.
// Telemetry windows are fixtures, not driving evidence. No user browser, microphone, loopback or offline audio render.
test('live game capture includes both real graph buses, stereo media, sync anchors and retry cleanup',async()=>{
 const root=process.cwd().replaceAll('\\','/'),temp=await mkdtemp(path.join(tmpdir(),'p06-live-audio-')),entry=path.join(temp,'entry.ts');let source;
 await writeFile(entry,`export {GameAudio} from ${JSON.stringify(root+'/src/audio/game-audio.ts')};export {LiveGameCapture} from ${JSON.stringify(root+'/src/audio/evidence.ts')};`);
 try{const result=await build({configFile:false,logLevel:'silent',build:{write:false,minify:false,lib:{entry,formats:['es'],fileName:'audio'}}});source=(Array.isArray(result)?result[0]:result).output.find(x=>x.type==='chunk').code}finally{await rm(entry);await rmdir(temp)}
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required','--mute-audio']});
 try{
  const context=await browser.newContext(),page=await context.newPage();
  await page.route('http://127.0.0.1:42972/**',async route=>{const url=new URL(route.request().url());if(url.pathname==='/audio.js')return route.fulfill({contentType:'text/javascript',body:source});if(url.pathname.startsWith('/assets/audio/')){assert.ok(!url.pathname.includes('..'));return route.fulfill({body:await readFile(path.join(root,'public',url.pathname)),contentType:url.pathname.endsWith('.json')?'application/json':'audio/wav'})}return route.fulfill({contentType:'text/html',body:'<!doctype html><div id="app"></div><script type="module">import {GameAudio,LiveGameCapture} from "/audio.js";window.GameAudio=GameAudio;window.LiveGameCapture=LiveGameCapture;window.ready=true;</script>'})});
  await page.goto('http://127.0.0.1:42972/');await page.waitForFunction(()=>window.ready);
  const run=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const links=new Map(),connect=AudioNode.prototype.connect,disconnect=AudioNode.prototype.disconnect;
   AudioNode.prototype.connect=function(destination,...args){const result=connect.call(this,destination,...args);if(destination instanceof AudioNode){if(!links.has(this))links.set(this,new Set());links.get(this).add(destination)}return result};
   AudioNode.prototype.disconnect=function(...args){const result=disconnect.apply(this,args);if(!args.length)links.delete(this);else links.get(this)?.delete(args[0]);return result};
   const destinations=[],makeDestination=AudioContext.prototype.createMediaStreamDestination;
   AudioContext.prototype.createMediaStreamDestination=function(){const result=makeDestination.call(this);destinations.push(result);return result};
   // Any accidental microphone or system-capture request fails this isolated test immediately.
   for(const method of ['getUserMedia','getDisplayMedia'])if(navigator.mediaDevices?.[method])navigator.mediaDevices[method]=()=>{throw Error('Forbidden device capture requested')};
   const game=new GameAudio(document.querySelector('#app'));window.testGame=game;await game.unlock();if(!game.inspect().enabled)throw Error(JSON.stringify(game.inspect()));game.settings.volume=.6;game.settings.mute=false;game.settings.musicVolume=0;game.settings.environmentVolume=0;
   const t={rpm:3200,speed:18,throttle:.7,gear:2,shifting:false,position:{x:0,y:0,z:0},quaternion:{x:0,y:0,z:0,w:1},wheels:[0,1,2].map(()=>({contact:true,longitudinalSpeed:18,slipRatio:0,slipAngle:0,surface:'road'}))};
   const peers={maya:{...t,rpm:4800,position:{x:-3,y:0,z:0}},jett:{...t,rpm:2400,position:{x:4,y:0,z:-1}}};
   game.update(t,false,false,true);game.updateOpponents(t,{});await wait(200);
   const outputsBefore=links.get(game.limiter)?.size;game.startEvidenceCapture();const recording=game.capture;
   let duplicateRejected=false;try{game.startEvidenceCapture()}catch{duplicateRejected=true}
   const outputsDuring=links.get(game.limiter)?.size,windows=[];const markWindow=(id,extra={})=>windows.push({id,startAudio:game.context.currentTime,...extra});
   game.evidenceMarker('start');await wait(250);markWindow('player-only');await wait(350);
   game.graph.master.gain.cancelScheduledValues(game.context.currentTime);game.graph.master.gain.setValueAtTime(0,game.context.currentTime);game.updateOpponents(t,peers);await wait(200);game.updateOpponents(t,peers);await wait(200);markWindow('opponents-only',{opponents:game.inspect().opponents});await wait(350);
   game.update(t,false,false);game.evidenceMarker('middle');await wait(250);markWindow('combined');await wait(350);
   game.lifecycle(true);await wait(400);markWindow('paused');await wait(300);game.lifecycle(false);game.update(t,false,false);game.updateOpponents(t,peers);game.evidenceMarker('end');await wait(350);
   const captured=await game.stopEvidenceCapture();await wait(150);
   const afterStop={outputs:links.get(game.limiter)?.size,tracks:destinations.at(-1).stream.getTracks().map(t=>({kind:t.kind,state:t.readyState})),flashes:document.querySelectorAll('[data-audio-sync]').length,chunks:recording.chunks.length};
   game.startEvidenceCapture();await wait(150);const retry=await game.stopEvidenceCapture();
   game.startEvidenceCapture();const aborted=game.capture;game.evidenceMarker('cancelled');game.dispose();await wait(200);
   const afterDispose={tracks:destinations.flatMap(d=>d.stream.getTracks().map(t=>t.readyState)),context:game.context.state,chunks:aborted.chunks.length,flashes:document.querySelectorAll('[data-audio-sync]').length};
   return{captured,retry,windows,outputsBefore,outputsDuring,duplicateRejected,afterStop,afterDispose,links:links.size};
  });
  assert.equal(run.outputsBefore,1);assert.equal(run.outputsDuring,2);assert.equal(run.duplicateRejected,true);assert.equal(run.afterStop.outputs,1);assert.deepEqual(run.afterStop.tracks,[{kind:'audio',state:'ended'}]);assert.equal(run.afterStop.flashes,0);assert.equal(run.afterStop.chunks,0);assert.ok(run.afterDispose.tracks.every(s=>s==='ended'));assert.equal(run.afterDispose.context,'closed');assert.equal(run.afterDispose.chunks,0);assert.equal(run.afterDispose.flashes,0);
  assert.equal(run.captured.markers.length,3);assert.ok(run.captured.markers.every(m=>m.wallTime>0));assert.ok(run.retry.base64.length>100);
  const out=evidenceRoot;const media=path.join(out,'actual-graph-routing.webm');await writeFile(media,Buffer.from(run.captured.base64,'base64'),{flag:'wx'});
  const probe=spawnSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',media],{encoding:'utf8'});assert.equal(probe.status,0,probe.stderr);const metadata=JSON.parse(probe.stdout);const audio=metadata.streams.filter(s=>s.codec_type==='audio');assert.equal(audio.length,1);assert.equal(audio[0].channels,2);assert.equal(Number(audio[0].sample_rate),48000);// Streaming WebM may omit container duration; decoded sample count below is authoritative.

  const decode=spawnSync('ffmpeg',['-v','error','-i',media,'-f','f32le','-ac','2','-ar','48000','pipe:1'],{maxBuffer:16*1024*1024});assert.equal(decode.status,0,decode.stderr.toString());const data=decode.stdout,frames=data.length/8;const sample=(i,c=0)=>data.readFloatLE(i*8+c*4);
  assert.ok(frames/48000>2);let peak=0,nonfinite=0,clipped=0;for(let i=0;i<frames;i++)for(let c=0;c<2;c++){const value=sample(i,c);if(!Number.isFinite(value))nonfinite++;peak=Math.max(peak,Math.abs(value));if(Math.abs(value)>=1)clipped++}assert.equal(nonfinite,0);assert.equal(clipped,0);
  const rms=(start,duration)=>{let sum=0,n=0;for(let i=Math.max(0,Math.floor(start*48000));i<Math.min(frames,Math.floor((start+duration)*48000));i++)for(let c=0;c<2;c++){const x=sample(i,c);sum+=x*x;n++}return Math.sqrt(sum/n)};
  const windows=run.windows.map(w=>({...w,offset:w.startAudio-run.captured.startedAudio,rms:rms(w.startAudio-run.captured.startedAudio+.05,.20)}));assert.ok(windows[0].rms>.0001);assert.ok(windows[1].rms>.00001);assert.ok(windows[2].rms>.0001);assert.ok(windows[3].rms<.00001,JSON.stringify(windows));assert.equal(windows[1].opponents.slots,2);assert.ok(windows[1].opponents.buses.every(b=>b.rms>0));
  const anchors=run.captured.markers.map(marker=>{const expected=marker.audioTime-run.captured.startedAudio;let best={time:0,power:0};for(let time=Math.max(0,expected-.15);time<expected+.15;time+=.005){const count=960,start=Math.floor(time*48000),coef=2*Math.cos(2*Math.PI*marker.frequency/48000);let prev=0,prev2=0;for(let j=0;j<count&&start+j<frames;j++){const next=sample(start+j)+coef*prev-prev2;prev2=prev;prev=next}const power=prev*prev+prev2*prev2-coef*prev*prev2;if(power>best.power)best={time,power}}return{...marker,expected,detected:best.time,error:best.time-expected,power:best.power}});assert.ok(anchors.every(a=>a.power>1&&Math.abs(a.error)<.12),JSON.stringify(anchors));assert.ok(Math.max(...anchors.map(a=>a.error))-Math.min(...anchors.map(a=>a.error))<.05,JSON.stringify(anchors));
  const report={method:'Isolated headless Chromium, native realtime GameAudio actual bank/mapper/opponent graphs. Fixture telemetry windows and explicit player-bus isolation test routing; not race, performance or subjective mix evidence. Headless host output muted; capture stream still receives live graph. No microphone, loopback, user profile, offline synthesis or controlled clock.',...run,captured:{...run.captured,base64:undefined},retry:{...run.retry,base64:undefined},windows,anchors,metadata,decodedDuration:frames/48000,decodedSignal:{peak,nonfinite,clipped},mediaSha256:createHash('sha256').update(await readFile(media)).digest('hex'),sourceSha256:Object.fromEntries(await Promise.all(['src/audio/evidence.ts','src/audio/game-audio.ts','src/audio/opponents.ts','src/audio/graph.ts','tests/live-audio-capture.test.mjs'].map(async file=>[file,createHash('sha256').update(await readFile(file)).digest('hex')])))};await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2),{flag:'wx'});await context.close();
 }finally{await browser.close()}
});


test('live capture faults release real audio tracks and connections without late aborted chunks',async()=>{
 const root=process.cwd().replaceAll('\\','/'),temp=await mkdtemp(path.join(tmpdir(),'p06-audio-fault-')),entry=path.join(temp,'entry.ts');let source;
 await writeFile(entry,`export {LiveGameCapture} from ${JSON.stringify(root+'/src/audio/evidence.ts')};`);
 try{const result=await build({configFile:false,logLevel:'silent',build:{write:false,minify:false,lib:{entry,formats:['es'],fileName:'capture'}}});source=(Array.isArray(result)?result[0]:result).output.find(x=>x.type==='chunk').code}finally{await rm(entry);await rmdir(temp)}
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required','--mute-audio']});try{const context=await browser.newContext(),page=await context.newPage();await page.route('http://127.0.0.1:42973/**',r=>r.fulfill({contentType:r.request().url().endsWith('.js')?'text/javascript':'text/html',body:r.request().url().endsWith('.js')?source:'<!doctype html><script type="module">import {LiveGameCapture} from "/capture.js";window.LiveGameCapture=LiveGameCapture;</script>'}));await page.goto('http://127.0.0.1:42973/');await page.waitForFunction(()=>window.LiveGameCapture);
 const cases=await page.evaluate(async()=>{const original=window.MediaRecorder,ctx=new AudioContext();await ctx.resume();const mix=ctx.createGain();mix.connect(ctx.destination);const links=new Set([ctx.destination]),connect=mix.connect.bind(mix),disconnect=mix.disconnect.bind(mix);mix.connect=(target,...args)=>{const result=connect(target,...args);links.add(target);return result};mix.disconnect=(target,...args)=>{const result=disconnect(target,...args);links.delete(target);return result};const destinations=[],makeDestination=ctx.createMediaStreamDestination.bind(ctx);ctx.createMediaStreamDestination=()=>{const d=makeDestination();destinations.push(d);return d};const results=[];
 for(const mode of ['unsupported','construct','start','stop-error','abort-late','active-error']){class FakeRecorder extends EventTarget{state='inactive';mimeType='audio/webm';static isTypeSupported(){return mode!=='unsupported'}constructor(){super();if(mode==='construct')throw Error('Injected constructor fault')}start(){if(mode==='start')throw Error('Injected start fault');this.state='recording'}stop(){this.state='inactive';const late=this.ondataavailable;queueMicrotask(()=>{if(mode==='stop-error')this.onerror?.(new Event('error'));else{late?.({data:new Blob(['late chunk'])});this.onstop?.(new Event('stop'))}})}}window.MediaRecorder=FakeRecorder;let capture,error='',activeReleasedBeforeStop=null;try{capture=new LiveGameCapture(ctx,mix);if(['stop-error','active-error'].includes(mode))capture.chunks.push(new Blob(['already buffered']));if(mode==='abort-late')capture.abort();else if(mode==='active-error'){capture.recorder.onerror(new Event('error'));activeReleasedBeforeStop=links.size===1&&destinations.at(-1).stream.getTracks().every(t=>t.readyState==='ended');await capture.stop()}else await capture.stop()}catch(e){error=e.message}await new Promise(r=>setTimeout(r,20));results.push({mode,error,activeReleasedBeforeStop,outputs:links.size,tracks:destinations.at(-1).stream.getTracks().map(t=>t.readyState),chunks:capture?.chunks.length??0});}
 window.MediaRecorder=original;mix.disconnect(ctx.destination);await ctx.close();return results});
 for(const c of cases){assert.equal(c.outputs,1,JSON.stringify(c));assert.ok(c.tracks.every(t=>t==='ended'),JSON.stringify(c));assert.equal(c.chunks,0);if(c.mode==='active-error')assert.equal(c.activeReleasedBeforeStop,true);if(c.mode!=='abort-late')assert.ok(c.error,JSON.stringify(c))}
 const out=evidenceRoot;await writeFile(path.join(out,'faults.json'),JSON.stringify({method:'Isolated native AudioContext/media destination with injected MediaRecorder faults. Checks production LiveGameCapture rollback/cleanup only; not recorded content or performance.',cases,sourceSha256:createHash('sha256').update(await readFile('src/audio/evidence.ts')).digest('hex')},null,2),{flag:'wx'});await context.close();}finally{await browser.close()}
});
