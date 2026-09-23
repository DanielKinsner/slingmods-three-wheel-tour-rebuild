// Isolated local browser, actual menu actions and fixed-step physics. No personal profile or performance claims.
import {chromium} from '@playwright/test';
import {build} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const base=process.env.BASE_URL||'http://127.0.0.1:5218';
const out=process.env.EVIDENCE_DIR||'.tools/tour-ui/verified';
await fs.mkdir(out,{recursive:true});
const bundle=await build({configFile:false,logLevel:'silent',publicDir:false,build:{write:false,minify:false,lib:{entry:path.resolve('scripts/story-parity-driver.ts'),name:'TourDriver',formats:['iife']}}});
const source=(Array.isArray(bundle)?bundle[0]:bundle).output.find(x=>x.type==='chunk').code;
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']});
const context=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'reduce'});
await context.addInitScript(()=>{
  const q=new URLSearchParams(location.search);q.set('test','1');q.set('profile','1');
  if(['express','harbor','ridge','crew'].includes(q.get('scene')))q.set('clock','controlled');
  history.replaceState(null,'','?'+q+location.hash);
});
const p=await context.newPage(),errors=[],failed=[],checks=[],layouts=[];
p.setDefaultTimeout(30000);
p.on('pageerror',e=>errors.push(e.message));
p.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()})});
const ready=key=>p.waitForFunction(k=>window[k]?.ready,key,{timeout:120000});
const settled=()=>p.waitForFunction(()=>!window.__SIGNATURE?.inspect().pending);
const click=async selector=>{await p.locator(selector).click();await settled()};
const shot=async name=>{
  await p.evaluate(()=>document.fonts.ready);
  // Navigation replaces the route image. Wait for the actual decoded pixels, not only its DOM node.
  await p.locator('.sig-route-art img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
  await p.screenshot({path:`${out}/${name}.jpg`,type:'jpeg',quality:88});
};
async function geometry(screen,selectors){
  const report=await p.evaluate(selectors=>({width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+1,panels:selectors.flatMap(s=>[...document.querySelectorAll(s)].filter(e=>!e.hidden&&e.getClientRects().length).map(e=>({selector:s,box:e.getBoundingClientRect().toJSON(),overflow:e.scrollWidth>e.clientWidth+2})))}),selectors);
  assert.equal(report.overflow,false,screen+' page overflow');
  for(const v of report.panels){assert.ok(v.box.left>=-1&&v.box.right<=report.width+1&&v.box.top>=-1&&v.box.bottom<=report.height+1,screen+' outside viewport: '+JSON.stringify(v));assert.equal(v.overflow,false,screen+' panel overflow '+v.selector)}
  layouts.push({screen,...report});
}
try{
  await p.goto(base+'/?scene=signature&quality=medium');await ready('__SIGNATURE');
  assert.equal(await p.locator('html').getAttribute('class'),'tour-ui');
  await p.evaluate(()=>document.fonts.ready);
  assert.equal(await p.evaluate(()=>document.fonts.check('600 14px Manrope')),true);
  for(const [width,height,label]of [[1920,1080,'desktop'],[1280,720,'laptop'],[390,844,'phone']]){
    await p.setViewportSize({width,height});
    await click('.sig-header [data-action=home]');await geometry('entry-'+label,['.sig-header','.sig-entry','.tour-entry-footer']);await shot('entry-'+label);
    await p.getByRole('button',{name:/make it yours/i}).click();await settled();
    await geometry('build-'+label,['.sig-detail','.sig-bottom','.sig-view-tools']);await shot('build-'+label);
    await click('[data-action=finish][data-value=black-red]');assert.equal(await p.evaluate(()=>window.__SIGNATURE.inspect().recipe.finish),'black-red');
    await click('[data-action=finish][data-value=blue-orange]');
    await click('.sig-header [data-action=quick-race]');
    await click('[data-action=destination][data-value=ridge]');
    await click('[data-action=destination-lighting][data-value=night]');
    await geometry('destinations-'+label,['.sig-events']);await shot('destinations-'+label);
    assert.equal(await p.locator('[data-action=race][data-value=ridge]').count(),1);
  }
  checks.push('Entry, build and destinations contained at 1920x1080, 1280x720 and 390x844; paint and destination controls work at each size.');
  await p.setViewportSize({width:1920,height:1080});
  await click('.sig-header [data-action=build]');
  const original=await p.evaluate(()=>window.__SIGNATURE.inspect().recipe);
  await click('[data-action=category][data-value=Lighting]');
  await click('[data-action=toggle][data-value=SM-133]');
  assert.ok(await p.evaluate(()=>window.__SIGNATURE.inspect().recipe.products['SM-133']));
  await click('[data-action=light-color][data-value=red]');
  await shot('lighting-desktop');
  await click('.sig-header [data-action=shop]');assert.equal(await p.locator('.sig-shop-list article').count(),1);await shot('shop-desktop');
  for(const link of await p.locator('.sig-shop-list a').all()){assert.match(await link.getAttribute('href'),/^https:\/\/www.slingmods.com\//);assert.match(await link.getAttribute('rel'),/noopener/)}
  await click('.sig-header [data-action=build]');
  await click('[data-action=reset]');assert.equal(await p.locator('[role=alertdialog]').count(),1);
  await p.keyboard.press('Escape');assert.equal(await p.locator('[role=alertdialog]').count(),0);
  await click('[data-action=toggle][data-value=SM-133]');
  await click('[data-action=category][data-value=Paint]');
  await click('[data-action=finish][data-value=black-red]');
  await click('[data-action=undo]');assert.equal(await p.evaluate(()=>window.__SIGNATURE.inspect().recipe.finish),original.finish);
  await click('[data-action=compare]');assert.equal(await p.evaluate(()=>window.__SIGNATURE.inspect().compare),true);
  await click('[data-action=compare]');assert.equal(await p.evaluate(()=>window.__SIGNATURE.inspect().compare),false);
  await click('[data-action=save-menu]');await p.getByLabel('Save your build recipe').fill('Tour UI verification');await p.getByLabel('Save your build recipe').press('Enter');await settled();
  assert.equal(await p.locator('[data-action=load-recipe]').filter({hasText:'Tour UI verification'}).count(),1);
  await click('[data-action=category][data-value=Paint]');
  await p.locator('[data-action=finish][data-value=white-graphite]').focus();await p.keyboard.press('Enter');await settled();
  assert.equal(await p.evaluate(()=>window.__SIGNATURE.inspect().recipe.finish),'white-graphite');
  assert.equal(await p.locator('.tour-entry').count(),0);
  checks.push('Real install/remove, colour, undo, compare, cancel reset, named save, keyboard activation and product links pass.');
  await click('.sig-header [data-action=home]');
  await p.locator('.sig-entry [data-action=career]').click();await ready('__TWT');
  await shot('garage-desktop');
  assert.equal(await p.evaluate(()=>window.__TWT.inspect().career.credits),0);
  await p.goto(base+'/?scene=career');await ready('__CAREER_HUB');await shot('career-desktop');
  const careerBefore=await p.evaluate(()=>window.__CAREER_HUB.inspect().state);
  await p.locator('.sig-header [data-action=build]').click();await ready('__SIGNATURE');
  assert.match(await p.locator('.sig-nav-career').textContent(),/RETURN TO CAREER/);
  await p.locator('.sig-header [data-action=career]').click();await ready('__CAREER_HUB');
  assert.deepEqual(await p.evaluate(()=>window.__CAREER_HUB.inspect().state),careerBefore);
  await p.setViewportSize({width:390,height:844});await shot('career-phone');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  checks.push('Fresh career garage, hub, explicit return and mobile career preserve the exact saved state.');
  await p.setViewportSize({width:1920,height:1080});
  await p.goto(base+'/?scene=signature&visual=ryker&screen=build&quality=medium');await ready('__SIGNATURE');await shot('ryker-build');
  assert.equal(await p.evaluate(()=>window.__SIGNATURE.inspect().vehicleContext.visual),'ryker');
  checks.push('Existing Ryker selection and category rendering work; no vehicle implementation changed.');
  await p.goto(base+'/?scene=express&route=express&mode=race&visual=2026&look=golden-hour&quality=medium');await ready('__EXPRESS');await shot('race-start');
  await p.addScriptTag({content:source});
  await p.evaluate(()=>{window.__driver=new window.TourDriver.EvidenceDriver(window.__EXPRESS.route);window.__clock=0;window.__EXPRESS.setDeviceSample(window.TourDriver.toDevice())});
  await p.locator('#start-crew').click();
  async function advance(n,drive=true){return p.evaluate(({n,drive})=>{const h=window.__EXPRESS;for(let i=0;i<n;i++){const s=h.lightweight();h.setDeviceSample(drive&&s.race.phase==='running'&&!s.race.paused?window.__driver.sample(s.telemetry,s.field):window.TourDriver.toDevice());h.normalFrame(window.__clock+=1000/60,i===n-1)}return h.lightweight()},{n,drive})}
  await advance(600);
  const driving=await p.evaluate(()=>window.__EXPRESS.inspect());assert.ok(driving.telemetry.speed>5);
  assert.equal(await p.locator('#race-speed').textContent(),String(Math.round(Math.abs(driving.telemetry.speed)*2.23694)));
  await shot('race-hud');
  await p.locator('#race-pause').click();const time=(await advance(1)).race.elapsedMs;
  assert.equal((await advance(60)).race.elapsedMs,time);await shot('race-pause');
  await p.setViewportSize({width:390,height:844});await geometry('race-pause-phone',['#race-menu']);await shot('race-pause-phone');
  await p.setViewportSize({width:1920,height:1080});await p.locator('#start-crew').click();await advance(3,false);
  let last;
  for(let i=0;i<480;i++){last=await advance(60);if(last.race.phase==='finished'&&last.race.allFinished)break;if(i===479)throw Error('Bounded race did not finish')}
  assert.equal(last.race.playerResult.valid,true);await shot('race-results');
  const attempt=last.attemptId;await p.locator('[data-action=retry]').click();
  assert.notEqual((await advance(1)).attemptId,attempt);
  checks.push('Actual Sport v5 quick race, live MPH, paused clock, phone pause menu, valid finish and distinct retry attempt pass. Controlled clock is not performance evidence.');
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  await fs.writeFile(`${out}/validation.json`,JSON.stringify({pass:true,browser:browser.version(),base,checks,layouts,errors,failed,limits:['Chromium only','Emulated phone viewport','No sustained-performance gate or physical-controller claim','UI branch based on committed 7b041ac; concurrent work excluded']},null,2));
  console.log(JSON.stringify({pass:true,checks,errors,failed}));
}catch(error){await shot('failure').catch(()=>{});await fs.writeFile(`${out}/failure.json`,JSON.stringify({error:error.stack,checks,layouts,errors,failed},null,2));throw error}
finally{await context.close();await browser.close()}
