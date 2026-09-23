import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'vite';
import {chromium} from '@playwright/test';
import {mkdtemp,readFile,writeFile,rm,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

test('cinematic music shares Music off and yields the scene soundtrack, including immediate mute',async()=>{
 const root=process.cwd(),temp=await mkdtemp(path.join(tmpdir(),'tour-film-audio-')),entry=path.join(temp,'entry.ts');
 let source;
 try{
  await writeFile(entry,`export {GameAudio} from ${JSON.stringify(path.join(root,'src/audio/game-audio.ts').replaceAll('\\','/'))};`);
  const result=await build({configFile:false,logLevel:'silent',build:{write:false,minify:false,lib:{entry,formats:['es']}}});
  source=(Array.isArray(result)?result[0]:result).output.find(v=>v.type==='chunk').code;
 }finally{await rm(entry);await rmdir(temp)}
 const browser=await chromium.launch({headless:true,args:['--mute-audio','--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage();
  await page.route('http://127.0.0.1:42974/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/audio.js')return route.fulfill({contentType:'text/javascript',body:source});
   if(url.pathname.startsWith('/assets/audio/'))return route.fulfill({body:await readFile(path.join(root,'public',url.pathname)),contentType:url.pathname.endsWith('.json')?'application/json':url.pathname.endsWith('.ogg')?'audio/ogg':'audio/wav'});
   return route.fulfill({contentType:'text/html',body:'<main></main><script type="module">import {GameAudio} from "/audio.js";window.audio=new GameAudio(document.querySelector("main"));window.ready=true;</script>'});
  });
  await page.goto('http://127.0.0.1:42974/');await page.waitForFunction(()=>window.ready);
  await page.evaluate(async()=>{
   await audio.unlock();Object.assign(audio.settings,{volume:.8,engineVolume:0,interfaceVolume:0,environmentVolume:0,musicVolume:.5,mute:false});
   window.t={time:1,rpm:1200,speed:0,throttle:0,gear:1,shifting:false,position:{x:0,y:0,z:0},quaternion:{x:0,y:0,z:0,w:1},wheels:[0,1,2].map(()=>({travel:0,contact:true,longitudinalSpeed:0,slipRatio:0,slipAngle:0,surface:'road'}))};
   audio.setSoundScene({place:'harbor',phase:'running'});audio.update(t,false,false);
   // Record the post-limiter signal on the audio thread, stamped with audio-clock time. Every loudness check
   // reads a fixed window of rendered audio, however late a loaded page or test runner gets to read it.
   const tapSource='class Tap extends AudioWorkletProcessor{constructor(){super();this.blocks=[];this.port.onmessage=()=>this.port.postMessage(this.blocks)}process(inputs){let sum=0;const mono=inputs[0]&&inputs[0][0];if(mono)for(const x of mono)sum+=x*x;this.blocks.push([currentTime,sum]);return true}}registerProcessor("rms-tap",Tap)';
   await audio.context.audioWorklet.addModule(URL.createObjectURL(new Blob([tapSource],{type:'text/javascript'})));
   window.tap=new AudioWorkletNode(audio.context,'rms-tap',{numberOfOutputs:0,channelCount:1,channelCountMode:'explicit'});audio.limiter.connect(tap);
   window.untilAudio=async time=>{while(audio.context.currentTime<time)await new Promise(r=>setTimeout(r,5))};
   window.rms=async(from,to)=>{
    for(;;){await untilAudio(to);const blocks=await new Promise(r=>{tap.port.onmessage=e=>r(e.data);tap.port.postMessage(0)});
     if(!blocks.length||blocks.at(-1)[0]<to){await new Promise(r=>setTimeout(r,5));continue}
     let sum=0,n=0;for(const[t,s]of blocks)if(t>=from&&t<to){sum+=s;n+=128}return Math.sqrt(sum/n)}
   };
  });
  await page.waitForFunction(()=>audio.inspect().score.music==='music-race');
  assert.ok(await page.evaluate(()=>audio.inspect().score.musicTarget>0));
  // The arrival cue fades below the audible threshold about 1.2 s of audio time after it starts, so Music off
  // is pressed at 0.3 s on the audio clock, inside the page. If a stalled page misses that by more than 0.2 s,
  // the cue restarts rather than being muted late, when its own fade could pass for silence.
  const cue=await page.evaluate(async()=>{
   for(let attempt=1;attempt<=5;attempt++){
    const start=audio.context.currentTime;audio.film('arrival',0);await untilAudio(start+.3);
    const off=audio.context.currentTime;if(off-start>.5){audio.film(null);await untilAudio(audio.context.currentTime+.1);continue}
    const playing=audio.inspect();
    // Dispatch the actual slider handler: music-off must silence a film already playing.
    const slider=document.querySelector('#audio-music');slider.value='0';slider.dispatchEvent(new Event('input'));
    return {attempt,start,off,playing,muted:audio.inspect()};
   }
   throw Error('the page could not press Music off within 0.5 s of audio time after the cue in five attempts');
  });
  const levels=await page.evaluate(async({start,off})=>({playing:await rms(start+.2,start+.3),beforeOff:await rms(off-.05,off),afterOff:await rms(off+.2,off+.4)}),cue);
  const detail=JSON.stringify({attempt:cue.attempt,pressedAt:cue.off-cue.start,levels});
  assert.equal(cue.playing.score.musicTarget,0,'the background soundtrack yields to the cinematic score');assert.equal(cue.playing.score.cinematic,true);
  assert.ok(cue.playing.cinematicScore.level>0);assert.ok(cue.playing.cinematicScore.sources>0);assert.ok(levels.playing>.0001,detail);
  // Still loud when muted: from here the cue's own fade takes about 0.6 s to reach the silence threshold, longer
  // than the 0.4 s window below, so only Music off can make that window silent.
  assert.ok(levels.beforeOff>.003,detail);
  assert.equal(cue.muted.cinematicScore.sources,0);assert.equal(cue.muted.cinematicScore.level,0);assert.ok(levels.afterOff<.0001,detail);
  await page.evaluate(()=>audio.film('grid',0));assert.equal(await page.evaluate(()=>audio.inspect().cinematicScore.sources),0);
  await page.evaluate(()=>{audio.film(null);const slider=document.querySelector('#audio-music');slider.value='.5';slider.dispatchEvent(new Event('input'))});
  assert.equal(await page.evaluate(()=>audio.inspect().score.cinematic),false);assert.ok(await page.evaluate(()=>audio.inspect().score.musicTarget>0));
  await page.evaluate(()=>audio.film('victory',0));await page.locator('#mute-sound').click();
  assert.equal(await page.evaluate(()=>audio.inspect().cinematicScore.sources),0);
  await page.locator('#mute-sound').click();await page.evaluate(()=>{audio.film('grid',0);audio.lifecycle(true)});
  assert.equal(await page.evaluate(()=>audio.inspect().cinematicScore.sources),0);
  await page.evaluate(()=>{audio.limiter.disconnect(tap);audio.dispose()});
 }finally{await browser.close()}
});
