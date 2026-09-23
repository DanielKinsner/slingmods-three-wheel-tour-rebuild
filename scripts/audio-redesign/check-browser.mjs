import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL??'http://127.0.0.1:5217',out='assets/audio-redesign/evidence';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--mute-audio']});
const report={method:'Isolated real Chromium WebAudio; speakers muted; no by-ear or physical-device claim.',errors:[],requests:[],checks:[]};
try{
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>report.errors.push(r.url()+': '+r.failure()?.errorText));
 await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 await page.route(base+'/audio-fixture',r=>r.fulfill({contentType:'text/html',body:`<main></main><script type="module">
 import{GameAudio}from'/src/audio/game-audio.ts';import{Simulation}from'/src/simulation/index.ts';
 window.sim=await Simulation.create();window.t=sim.telemetry();window.make=()=>window.audio=new GameAudio(document.querySelector('main'));make();window.ready=true;
 </script>`}));
 await page.goto(base+'/audio-fixture');await page.waitForFunction(()=>window.ready);assert.equal(await page.evaluate(()=>audio.inspect().enabled),false);
 await page.locator('#enable-sound').click();await page.waitForFunction(()=>audio.inspect().enabled&&!audio.inspect().loading);
 await page.evaluate(()=>audio.update(t,false,false));await page.waitForFunction(()=>audio.inspect().score.music==='music-garage');
 report.checks.push({name:'User gesture loads engine, foley, ambience and showroom score',state:await page.evaluate(()=>audio.inspect())});
 // Record a listenable walkthrough using the actual post-limiter runtime; telemetry is a fixture, not a race.
 await page.evaluate(()=>audio.startEvidenceCapture());
 await page.waitForTimeout(4000);await page.evaluate(()=>audio.cue('part.shocks.attach','fit1'));await page.waitForTimeout(1800);
 await page.evaluate(()=>{audio.setSoundScene({place:'harbor',wet:true,night:true,phase:'countdown'});audio.cue('race.count')});await page.waitForTimeout(1000);
 await page.evaluate(()=>audio.cue('race.count'));await page.waitForTimeout(1000);await page.evaluate(()=>audio.cue('race.start'));
 for(let i=0;i<90;i++){await page.evaluate(i=>{t.time+=.1;t.speed=Math.min(29,i*.4);t.rpm=1200+Math.min(5200,i*75);t.throttle=.8;t.wheels.forEach(w=>{w.contact=true;w.longitudinalSpeed=t.speed;w.slipRatio=i>60?.4:0;w.slipAngle=i>60?.18:0});audio.setSoundScene({phase:'running'});audio.update(t,false,false)},i);await page.waitForTimeout(100)}
 await page.evaluate(()=>{audio.setSoundScene({place:'ridge',wet:false,night:false,free:true});t.powertrain='cvt';t.rpm=4500;audio.update(t,false,false)});await page.waitForTimeout(4000);
 await page.evaluate(()=>{audio.cue('race.finish');audio.setSoundScene({phase:'finished'});t.speed=0;t.rpm=1100;t.throttle=0;t.wheels.forEach(w=>w.longitudinalSpeed=0);audio.update(t,false,false)});await page.waitForTimeout(3000);
 const recording=await page.evaluate(()=>audio.stopEvidenceCapture());await fs.writeFile(out+'/runtime-audio-tour.webm',Buffer.from(recording.base64,'base64'));delete recording.base64;report.recording=recording;
 const playing=await page.evaluate(()=>audio.inspect());assert.ok(playing.graph.rms>0);assert.ok(playing.score.musicVoices<=2);report.checks.push({name:'Full mix captured; distinct CVT beds active',state:playing});
 await page.locator('summary').click();await page.locator('#music-off').click();await page.waitForTimeout(1200);assert.equal((await page.evaluate(()=>audio.inspect())).score.musicTarget,0);
 await page.locator('#mute-sound').click();await page.waitForTimeout(400);let quiet=await page.evaluate(()=>audio.inspect());assert.equal(quiet.score.worldTarget,0);assert.equal(quiet.score.musicTarget,0);assert.ok(quiet.graph.rms<1e-4);assert.equal(quiet.score.shots,0);
 await page.locator('#mute-sound').click();await page.evaluate(()=>audio.lifecycle(true));await page.waitForTimeout(400);quiet=await page.evaluate(()=>audio.inspect());assert.ok(quiet.graph.rms<1e-4);assert.equal(quiet.score.worldTarget,0);
 report.checks.push({name:'Music off, master mute and pause silence actual buses',state:quiet});
 await page.evaluate(()=>{audio.dispose();make()});await page.waitForTimeout(300);assert.equal((await page.evaluate(()=>audio.inspect())).extendedLevels.music,0);
 if(await page.locator('#enable-sound').isVisible())await page.locator('#enable-sound').click();await page.waitForFunction(()=>audio.inspect().enabled&&!audio.inspect().loading);assert.equal((await page.evaluate(()=>audio.inspect())).score.music,'');
 await page.evaluate(()=>{audio.dispose();sim.dispose()});assert.deepEqual(report.errors,[]);report.status='PASS';await fs.writeFile(out+'/browser.json',JSON.stringify(report,null,2));console.log('PASS tour runtime capture, scene music, cue ducking, music-off persistence, mute, pause and disposal');
}catch(e){report.error=String(e);await fs.writeFile(out+'/browser-failed.json',JSON.stringify(report,null,2));throw e}finally{await browser.close()}
