/** Focused loading/retry/route-return inspection in an isolated browser. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:5207',out=process.env.EVIDENCE_DIR||'.tools/flow-polish';await fs.mkdir(out,{recursive:true});
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),p=await b.newPage({viewport:{width:1440,height:900}}),errors=[],report={};
p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{const u=new URL(location.href);if(u.protocol.startsWith('http')){u.searchParams.set('test','1');u.searchParams.set('profile','1');history.replaceState(null,'',u.pathname+u.search+u.hash)}});
const showroom=()=>p.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});
const state=()=>p.evaluate(()=>window.__SIGNATURE.inspect());
try{
 const slow='**/assets/model02/slingshot-2026.glb';let release;
 const gate=new Promise(resolve=>release=resolve);await p.route(slow,async r=>{await gate;await r.continue().catch(()=>{})});
 await p.goto(base+'/?scene=signature');await p.locator('.drive-preparation').waitFor();await p.screenshot({path:out+'/loading-showroom.png'});release();await showroom();await p.unroute(slow);
 report.showroom=(await state()).loadMs;await p.screenshot({path:out+'/entry.png'});
 await p.getByRole('button',{name:'Choose a drive',exact:true}).click();await p.locator('[data-action=destination][data-value=ridge]').click();await p.locator('[data-action=destination-lighting][data-value=night]').click();
 const recipe=(await state()).recipe;
 const ridge='**/assets/ridge/ridge-kit.glb';await p.route(ridge,r=>r.fulfill({status:503,body:'Isolated retry check'}));await p.locator('[data-action=test-drive][data-value=ridge]').click();await p.locator('[data-prepare-retry]').waitFor({state:'visible'});
 await p.screenshot({path:out+'/loading-retry.png'});await p.setViewportSize({width:390,height:844});await p.screenshot({path:out+'/loading-retry-narrow.png'});
 assert.ok(await p.locator('dialog').evaluate(n=>n.scrollWidth<=n.clientWidth+1));assert.ok(await p.locator('[data-prepare-cancel]').isVisible());
 await p.keyboard.press('Escape');await p.waitForFunction(()=>!window.__SIGNATURE.inspect().pending);assert.deepEqual((await state()).recipe,recipe);report.cancel=(await state()).drivePreparation;
 await p.unroute(ridge);await p.setViewportSize({width:1440,height:900});
 await p.locator('[data-action=race][data-value=ridge]').click();await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:120000});
 report.ridge=await p.evaluate(()=>{const s=window.__EXPRESS.inspect();return{loadMs:s.loadMs,entry:s.entry,route:s.route,lighting:s.lighting,ticks:s.ticks,handling:s.handlingProfile,recipe:s.recipe}});
 assert.equal(report.ridge.route.id,'smoky-ridge');assert.equal(report.ridge.lighting,'night');assert.equal(report.ridge.ticks,0);assert.equal(report.ridge.handling,'slingmods-sport-v4');assert.deepEqual(report.ridge.recipe,recipe);
 const stages=report.ridge.entry.stages,sky=stages.find(s=>s.name==='sky-fetch-decode-probe'),car=stages.find(s=>s.name==='vehicle-fetch-decode-bind');assert.ok(car.start<sky.end&&sky.start<car.end,'sky and vehicle loads must overlap');
 await p.screenshot({path:out+'/ridge-ready.png'});await p.locator('#race-menu [data-action=bay]').click();await showroom();assert.deepEqual((await state()).recipe,recipe);
 await p.locator('[data-action=quick-race]').first().click();assert.equal(await p.locator('[data-action=destination][data-value=ridge]').getAttribute('aria-pressed'),'true');assert.equal(await p.locator('[data-action=destination-lighting][data-value=night]').getAttribute('aria-pressed'),'true');report.routeRemembered=true;
 await p.screenshot({path:out+'/destinations-return.png'});await p.setViewportSize({width:600,height:900});await p.screenshot({path:out+'/destinations-narrow.png'});assert.ok(await p.locator('.sig-events').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
 await p.setViewportSize({width:1440,height:900});await p.locator('[data-action=build]').first().click();
 for(const view of ['front','rear','interior']){await p.locator(`[data-action=view][data-value=${view}]`).click();await p.waitForTimeout(900);await p.screenshot({path:out+'/vehicle-'+view+'.png'})}
 assert.deepEqual(errors,[]);report.errors=errors;await fs.writeFile(out+'/flow-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:'PASS',routeRemembered:true,loadOverlap:true,errors,out}));
}catch(error){await p.screenshot({path:out+'/flow-failure.png'});await fs.writeFile(out+'/flow-failure.json',JSON.stringify({error:String(error),errors,url:p.url(),report},null,2));throw error}finally{await b.close()}
