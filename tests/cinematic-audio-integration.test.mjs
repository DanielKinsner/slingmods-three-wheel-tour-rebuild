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
   window.analyser=audio.context.createAnalyser();audio.limiter.connect(analyser);
   window.rms=()=>{const values=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(values);return Math.sqrt(values.reduce((n,x)=>n+x*x,0)/values.length)};
  });
  await page.waitForFunction(()=>audio.inspect().score.music==='music-race');
  assert.ok(await page.evaluate(()=>audio.inspect().score.musicTarget>0));
  await page.evaluate(()=>audio.film('arrival',0));await page.waitForTimeout(250);
  const playing=await page.evaluate(()=>({audio:audio.inspect(),rms:rms()}));
  assert.equal(playing.audio.score.musicTarget,0,'the background soundtrack yields to the cinematic score');assert.equal(playing.audio.score.cinematic,true);
  assert.ok(playing.audio.cinematicScore.level>0);assert.ok(playing.audio.cinematicScore.sources>0);assert.ok(playing.rms>.0001);
  // Dispatch the actual slider handler: music-off must silence a film already playing.
  await page.evaluate(()=>{const slider=document.querySelector('#audio-music');slider.value='0';slider.dispatchEvent(new Event('input'))});
  await page.waitForTimeout(250);
  const off=await page.evaluate(()=>({audio:audio.inspect(),rms:rms()}));
  assert.equal(off.audio.cinematicScore.sources,0);assert.equal(off.audio.cinematicScore.level,0);assert.ok(off.rms<.0001,JSON.stringify(off));
  await page.evaluate(()=>audio.film('grid',0));assert.equal(await page.evaluate(()=>audio.inspect().cinematicScore.sources),0);
  await page.evaluate(()=>{audio.film(null);const slider=document.querySelector('#audio-music');slider.value='.5';slider.dispatchEvent(new Event('input'))});
  assert.equal(await page.evaluate(()=>audio.inspect().score.cinematic),false);assert.ok(await page.evaluate(()=>audio.inspect().score.musicTarget>0));
  await page.evaluate(()=>audio.film('victory',0));await page.locator('#mute-sound').click();
  assert.equal(await page.evaluate(()=>audio.inspect().cinematicScore.sources),0);
  await page.locator('#mute-sound').click();await page.evaluate(()=>{audio.film('grid',0);audio.lifecycle(true)});
  assert.equal(await page.evaluate(()=>audio.inspect().cinematicScore.sources),0);
  await page.evaluate(()=>{audio.limiter.disconnect(analyser);audio.dispose()});
 }finally{await browser.close()}
});
