import {chromium} from '@playwright/test';
import {build} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const base=process.env.BASE_URL||'http://127.0.0.1:5273',out=process.env.EVIDENCE_DIR||'handoff/rally-polish-evidence';
await fs.mkdir(out,{recursive:true});
const bundle=await build({configFile:false,logLevel:'silent',publicDir:false,build:{write:false,minify:false,lib:{entry:path.resolve('scripts/rally/evidence-driver.ts'),name:'RallyEvidence',formats:['iife']}}});
const source=(Array.isArray(bundle)?bundle[0]:bundle).output.find(x=>x.type==='chunk').code;
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']});
const context=await browser.newContext({viewport:{width:1600,height:900},reducedMotion:'no-preference'}),page=await context.newPage();
const report={base,checks:[],errors:[],failedRequests:[],shots:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
page.on('response',r=>{if(r.status()>=400)report.failedRequests.push({url:r.url(),status:r.status()});});
const rally='/?scene=rally&visual=ryker&mode=race&test=1&profile=1&clock=controlled&quality=high';
async function ready(){await page.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});await page.evaluate(()=>{window.__now=performance.now();window.__EXPRESS.setDeviceSample({keys:[],pads:[],focused:true});window.__EXPRESS.normalFrame(window.__now);});}
async function frames(n){return page.evaluate(n=>{for(let i=0;i<n;i++)window.__EXPRESS.normalFrame(window.__now+=1000/60);return window.__EXPRESS.inspect();},n);}
try{
  // Hold only JavaScript delivery to capture the actual critical boot screen with fully loaded artwork.
  let release;const gate=new Promise(resolve=>{release=resolve});
  await page.route(/\.js(?:\?|$)/,async route=>{await gate;await route.continue();});
  await page.goto(base+rally,{waitUntil:'commit'});
  await page.locator('#gx-boot').waitFor();
  const art=await page.locator('#gx-boot').evaluate(async el=>{const art=el.style.getPropertyValue('--gx-art');const img=new Image();img.src='/assets/game-feel/loading/rally.png';await img.decode();return{art,width:img.naturalWidth,height:img.naturalHeight};});
  assert.ok(art.art.includes('/assets/game-feel/loading/rally.png'));assert.ok(art.width>=1500);
  await page.screenshot({path:out+'/loading.png'});release();await ready();await page.unroute(/\.js(?:\?|$)/);
  report.art=art;report.build=(await page.evaluate(()=>window.__EXPRESS.inspect())).build;
  report.checks.push('Packaged boot uses the generated Redstone transition plate');
  await page.locator('#start-crew').click();
  assert.equal((await page.evaluate(()=>window.__EXPRESS.inspect())).cinematics.film,'grid');
  for(const [time,name] of [[.85,'redstone-start'],[2.4,'dirt-contact'],[4.65,'your-stage'],[6.5,'handoff']]){
    const s=await page.evaluate(t=>window.__EXPRESS.cinematicSeek(t),time);
    assert.equal(s.race.phase,'ready');assert.equal(s.race.elapsedMs,0);assert.equal(s.cinematics.active,true);
    assert.equal(await page.locator('#harbor-ui').evaluate(e=>e.inert),true);
    report.shots.push({name,cinematics:s.cinematics,camera:s.camera});
    await page.screenshot({path:out+'/film-'+name+'.png'});
  }
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>window.__EXPRESS.inspect().size[0]===390);await page.evaluate(()=>window.__EXPRESS.cinematicSeek(4.65));await page.screenshot({path:out+'/film-mobile.png'});
  assert.equal(await page.locator('.gx-prompts').isVisible(),false);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.setViewportSize({width:1600,height:900});await page.waitForFunction(()=>window.__EXPRESS.inspect().size[0]===1600);
  // Complete the real film through normal frames: exactly one countdown, no timer while watching.
  await page.evaluate(()=>window.__EXPRESS.cinematicSeek(6.8));let s=await frames(24);
  assert.equal(s.cinematics.active,false);assert.equal(s.race.phase,'countdown');assert.equal(s.race.elapsedMs,0);
  assert.equal(await page.locator('#harbor-ui').evaluate(e=>e.inert),false);
  s=await frames(190);assert.equal(s.race.phase,'running');await page.screenshot({path:out+'/race-handoff.png'});
  report.checks.push('All four pre-race shots, portrait layout, frozen stage timer, and normal film completion into countdown');
  // Drive the whole stage through real controls to exercise the automatic finish film and record together.
  await page.addScriptTag({content:source});await page.evaluate(()=>{window.__driver=new window.RallyEvidence.RallyDriver(window.__EXPRESS.route);window.__EXPRESS.setDeviceSample(window.RallyEvidence.toDevice());window.__EXPRESS.normalFrame(window.__now+=1000/60);});
  for(let seconds=0;seconds<180&&!s.race.playerResult;seconds++)s=await page.evaluate(()=>{const h=window.__EXPRESS;for(let i=0;i<60;i++){const state=h.lightweight();h.setDeviceSample(window.__driver.sample(state.telemetry,state.field));h.normalFrame(window.__now+=1000/60,i===59);if(h.lightweight().race.playerResult)break;}return h.inspect();});
  assert.equal(s.race.playerResult?.valid,true);await frames(1);const best=await page.evaluate(()=>window.__EXPRESS.inspect().rally.best);
  await page.waitForTimeout(1450);s=await frames(1);assert.equal(s.cinematics.film,'victory');
  await frames(300);await page.screenshot({path:out+'/film-stage-complete.png'});await frames(210);
  s=await page.evaluate(()=>window.__EXPRESS.inspect());assert.equal(s.cinematics.active,false);assert.equal(s.rally.saved,true);assert.deepEqual(s.rally.best,best);
  report.finish={result:s.race.playerResult,best};report.checks.push('Valid full stage triggers the automatic finish film; record stays unchanged through the film');
  await page.reload();await ready();await page.locator('#start-crew').click();await page.keyboard.press('Enter');s=await frames(1);
  assert.equal(s.cinematics.active,false);assert.equal(s.race.phase,'countdown');report.checks.push('Keyboard skip starts one countdown and restores race controls');
  await page.reload();await ready();await page.locator('#start-crew').click();await page.locator('.film-skip').click();s=await frames(1);
  assert.equal(s.cinematics.active,false);assert.equal(s.race.phase,'countdown');report.checks.push('Visible skip control starts the race');
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await ready();await page.locator('#start-crew').click();s=await frames(1);
  assert.equal(s.cinematics.active,false);assert.equal(s.race.phase,'countdown');report.checks.push('Reduced motion bypasses the film through the shared accessibility path');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>localStorage.setItem('slingmods-race-films','off'));await page.reload();await ready();await page.locator('#start-crew').click();s=await frames(1);
  assert.equal(s.cinematics.active,false);assert.equal(s.race.phase,'countdown');report.checks.push('Saved auto-cinematics preference is respected');
  await page.evaluate(()=>localStorage.removeItem('slingmods-race-films'));
  await page.goto(base+'/?scene=signature&screen=events&visual=ryker&test=1&profile=1');await page.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:180000});
  await page.locator('[data-action=destination][data-value=rally]').click();
  const map=page.locator('img.gx-course-map');await map.evaluate(async img=>{await img.decode()});
  assert.ok((await map.getAttribute('src')).endsWith('/assets/game-feel/maps/rally.png'));
  await page.mouse.move(0,0);await page.waitForTimeout(700);await page.screenshot({path:out+'/map-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.locator('.sig-selected-destination').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/map-mobile.png'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  report.checks.push('Generated illustrated map and real in-game postcard on desktop and mobile event cards');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.pass=true;
}catch(e){report.failure=e.stack;await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}
finally{await fs.writeFile(out+'/presentation.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({pass:report.pass,checks:report.checks,errors:report.errors}));
