import {chromium} from '@playwright/test';import {build} from 'vite';import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
const out=process.env.EVIDENCE_DIR,base=process.env.BASE_URL,expected=process.env.EXPECTED_RUNTIME;
if(process.env.P10B_RECORD!=='1')throw Error('Recording is opt-in: set P10B_RECORD=1 only after native performance is finished.');
if(!out||!base||!expected)throw Error('Fresh EVIDENCE_DIR, immutable BASE_URL and EXPECTED_RUNTIME required');
assert.match(expected,/^[0-9a-f]{12}(?:-working)?$/);
const buildResponse=await fetch(base+'/review-build.json');assert(buildResponse.ok,'Immutable curated build metadata required');const buildIdentity=await buildResponse.json();assert.equal(buildIdentity.buildRef,expected,'Wrong capture runtime');
const html=await(await fetch(base+'/')).text();assert(!html.includes('/@vite/client'),'Never record a live HMR source tree');
await fs.mkdir(out,{recursive:false});await fs.writeFile(out+'/runtime-identity.json',JSON.stringify(buildIdentity,null,2));
const bundle=await build({configFile:false,logLevel:'silent',publicDir:false,build:{write:false,minify:false,lib:{entry:path.resolve('scripts/p09c-career-driver.ts'),name:'Evidence',formats:['iife']}}}),source=(Array.isArray(bundle)?bundle[0]:bundle).output.find(x=>x.type==='chunk').code;

const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,recordVideo:{dir:out+'/raw-video',size:{width:1280,height:720}}});
await fs.writeFile(out+'/control-driver.bundle.js',source);
await context.addInitScript(()=>{const q=new URLSearchParams(location.search);q.set('test','1');q.set('profile','1');history.replaceState(null,'','?'+q+location.hash)});
// Capture-only sync flash mirror: native dialogs can obscure the game's ordinary DOM marker.
// Observe the real chirp-triggered flash and mirror it in the top layer for 240 ms.
// No game clock, audio samples, vehicle transforms or outcome is modified.
await context.addInitScript(()=>{new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(!(node instanceof HTMLElement)||!node.dataset.audioSync)continue;const flash=node.cloneNode(true);delete flash.dataset.audioSync;flash.dataset.evidenceSync=node.dataset.audioSync;flash.setAttribute('popover','manual');flash.style.cssText+=';inset:auto;margin:0;padding:0;border:0;left:0;top:0';document.body.append(flash);flash.showPopover();setTimeout(()=>flash.remove(),240)}}).observe(document,{childList:true,subtree:true})});
const p=await context.newPage(),errors=[],segments=[],shots=[];p.on('pageerror',e=>errors.push(e.message));
const wait=ms=>p.waitForTimeout(ms);async function ready(){await p.waitForFunction(()=>window.__P09C_MOTION?.ready||window.__SIGNATURE?.ready||window.__EXPRESS?.ready,null,{timeout:120000});await p.locator('[data-loading-stage]').waitFor({state:'detached',timeout:120000})}
async function shot(name){await p.screenshot({path:out+'/'+name+'.png'});shots.push(name)}
async function begin(name,caption='REAL-SPEED GAME CAPTURE · AUTOMATED INPUT · ACTUAL GAME AUDIO'){console.log("BEGIN "+name);if(!await p.evaluate(()=>((window.__P09C_MOTION||window.__SIGNATURE||window.__EXPRESS)?.inspect().audio??window.__CAREER_HUB?.audioInspect()).enabled)){try{await p.locator('#enable-sound').click({timeout:1500})}catch(error){if(!await p.evaluate(()=>((window.__P09C_MOTION||window.__SIGNATURE||window.__EXPRESS)?.inspect().audio??window.__CAREER_HUB?.audioInspect()).enabled))throw error}}await p.waitForFunction(()=>((window.__P09C_MOTION||window.__SIGNATURE||window.__EXPRESS)?.inspect().audio??window.__CAREER_HUB?.audioInspect()).enabled);assert.equal(await p.locator('#enable-sound').isVisible(),false,'Enabled audio must hide Enable sound');await p.evaluate(({name,caption})=>{const h=window.__P09C_MOTION||window.__SIGNATURE||window.__EXPRESS||window.__CAREER_HUB;h.startAudioCapture();(h.audioSync??h.audioMarker)(name+'-start');const label=document.createElement('div');label.textContent=caption;label.style.cssText='position:fixed;bottom:2px;left:50%;transform:translateX(-50%);font:10px Arial;background:#111d;color:#fff;padding:3px 8px;z-index:5000';label.dataset.filmCapture='true';document.body.append(label)},{name,caption});await wait(450)}
async function end(name){console.log("END "+name);await p.evaluate(name=>{const h=window.__P09C_MOTION||window.__SIGNATURE||window.__EXPRESS||window.__CAREER_HUB;(h.audioSync??h.audioMarker)(name+'-end')},name);await wait(400);const a=await p.evaluate(()=>(window.__P09C_MOTION||window.__SIGNATURE||window.__EXPRESS||window.__CAREER_HUB).stopAudioCapture());await fs.writeFile(out+'/'+name+'-audio.webm',Buffer.from(a.base64,'base64'));delete a.base64;await p.evaluate(()=>document.querySelectorAll('[data-film-capture]').forEach(n=>n.remove()));segments.push({name,...a});await fs.writeFile(out+'/audio-segments.json',JSON.stringify(segments,null,2))}
async function category(v){await p.locator('[data-action="category"][data-value="'+v+'"]').click();await wait(350)}async function action(a,v){await p.locator('[data-action="'+a+'"]'+(v?'[data-value="'+v+'"]':'')).first().click();if(await p.evaluate(()=>!!window.__SIGNATURE))await p.waitForFunction(()=>!window.__SIGNATURE||!window.__SIGNATURE.inspect().pending);await wait(350)}
async function driver(){await p.addScriptTag({content:source});await p.evaluate(()=>{window.__drive=true;window.__trace=[];window.__agent=new window.Evidence.EvidenceDriver(window.__EXPRESS.route);let last=0,record=0,view=0;function frame(){if(!window.__drive)return;const h=window.__EXPRESS,s=h.lightweight(),dt=Math.max(0,s.telemetry.time-last);last=s.telemetry.time;const device=s.race.phase==='running'?window.__agent.sample(s.telemetry,s.field,dt):window.Evidence.toDevice();if(s.race.elapsedMs>([16000,17000,28000][view]??Infinity)){device.keys=['KeyC'];view++}h.setDeviceSample(device);if(s.ticks-record>=30){record=s.ticks;window.__trace.push({wall:performance.now(),...s})}requestAnimationFrame(frame)}requestAnimationFrame(frame)})}


/** This file only supplies ordinary UI actions and pedal/steer inputs. Native race
 * physics, timing, gates and results continue at wall clock speed. */
try{
 await p.goto(base+'/?scene=signature');await ready();assert.equal(await p.evaluate(()=>window.__SIGNATURE.inspect().build),expected);
 await p.evaluate(()=>document.fonts.ready);await begin('01-studio-build-tour');await wait(3000);await shot('01-entry');
 const safe=await p.evaluate(()=>window.__SIGNATURE.inspect().showroom.safeRegion);
 const cx=(safe.left+safe.right)/2,cy=(safe.top+safe.bottom)/2;await p.mouse.move(cx,cy);await p.mouse.down();await p.mouse.move(cx+100,cy+12,{steps:24});await p.mouse.up();await wait(1500);
 await action('build');await action('advanced');await action('view','tour-wall');await wait(3500);await shot('02-tour-wall');await action('view','hero');
 await category('Build Presets');await action('preset','harbor-sport');
 await category('Paint');for(const finish of ['blue-orange','black-red','white-graphite','graphite-red']){await action('finish',finish);await wait(1700);await shot('finish-'+finish)}await action('finish','black-red');
 await category('Lighting');if(!await p.evaluate(()=>window.__SIGNATURE.inspect().recipe.products['SM-133']))await action('toggle','SM-133');await action('lighting','lights');await wait(2800);await shot('03-lighting');await action('lighting','studio');
 await category('Exhaust');assert(await p.evaluate(()=>!!window.__SIGNATURE.inspect().recipe.products['SM-7720']));await action('view','SM-7720');await wait(3000);await shot('04-exhaust');await action('view','hero');
 await category('Storage');if(!await p.evaluate(()=>window.__SIGNATURE.inspect().recipe.products['SM-28919']))await action('toggle','SM-28919');
 await category('Suspension');await wait(2000);
 await category('Build Presets');await p.locator('#signature-recipe-name').fill('Cinematic Tour');await action('save');await wait(1300);
 const selectedRecipe=await p.evaluate(()=>window.__SIGNATURE.inspect().recipe);assert.equal(Object.keys(selectedRecipe.products).length,5);assert.equal(selectedRecipe.handlingProfile,'slingmods-sport-v3');
 await action('shop');await wait(3500);await shot('05-shop');await action('build');await action('quick-race');
 for(const id of ['harbor','express','ridge']){await action('destination',id);await wait(2000)}await action('destination-lighting','night');await wait(2000);await shot('06-ridge-blue-hour');await action('destination-lighting','day');await wait(1800);await end('01-studio-build-tour');
 await action('race','ridge');await ready();await begin('02-ridge-continuous-race');await driver();await p.locator('#start-crew').click();
 await p.waitForFunction(()=>window.__EXPRESS.inspect().race.allFinished,null,{timeout:240000});
 const result=await p.evaluate(()=>window.__EXPRESS.inspect());assert.equal(result.race.playerResult.valid,true);assert.equal(result.race.allFinished,true);await wait(4000);await shot('07-actual-result');
 await fs.writeFile(out+'/ridge-race.json',JSON.stringify(await p.evaluate(()=>({state:window.__EXPRESS.inspect(),trace:window.__trace}))));await end('02-ridge-continuous-race');
 await action('bay');await ready();assert.deepEqual(await p.evaluate(()=>window.__SIGNATURE.inspect().recipe),selectedRecipe);
 await begin('03-same-build-return');await action('view','hero');await wait(3000);await action('view','tour-wall');await wait(3000);await shot('08-build-return');await end('03-same-build-return');
 // End while deliberately paused before the real 5.8s departure navigates.
 // This is explicitly an excerpt, not a claim that the full travel was shown.
 await action('view','hero');await category('Paint');
 const motion=await p.evaluate(()=>window.__SIGNATURE.inspect().reducedMotion);if(motion){await action('advanced');await action('motion','false')}
 await begin('04-thermal-departure-excerpt','DEPARTURE EXCERPT · PAUSED BEFORE TRAVEL · ACTUAL GAME AUDIO');
 await p.locator('[data-action="test-drive"]').first().click();
 await p.waitForFunction(()=>window.__SIGNATURE?.inspect().departure?.elapsed>=4.7,null,{timeout:120000});
 await p.locator('[data-departure="pause"]').click();
 const departure=await p.evaluate(()=>window.__SIGNATURE.inspect());assert(departure.departure.paused);assert(departure.departure.elapsed<5.8);assert(departure.recipe.products['SM-7720']);
 await shot('09-thermal-departure-excerpt');await end('04-thermal-departure-excerpt');await fs.writeFile(out+'/departure-excerpt.json',JSON.stringify(departure,null,2));
 assert.deepEqual(errors,[]);
 await fs.writeFile(out+'/verification.json',JSON.stringify({pass:true,runtime:expected,buildIdentity,errors,shots,selectedRecipe,browser:browser.version(),segments:segments.map(s=>s.name),method:'Native wall-clock actual game. Entry/orbit/physical Tour Wall, every finish, lighting and exhaust preview, all five parts, save/shop/three destinations, one uninterrupted actual Ridge race and truthful result, same-build return. Last segment is a Thermal-equipped departure EXCERPT deliberately paused before travel. Disclosed control-only driver and actual post-limiter WebAudio; loading/marker cuts only, no fabricated shots, rewards, timing, sound or speed changes. No career state injected or changed.'},null,2));
}catch(e){await fs.writeFile(out+'/failure.json',JSON.stringify({error:e.stack,errors,segments},null,2));await shot('failure');throw e}finally{const video=p.video();await context.close();await fs.writeFile(out+'/video-path.json',JSON.stringify({path:await video.path()}));await browser.close()}
