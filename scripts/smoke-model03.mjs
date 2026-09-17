/** One isolated showroom/departure/drive/return flow; no film or benchmark. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:5205';const out='.tools/model03-smoke';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],report={};
await page.addInitScript(()=>{const u=new URL(location.href);if(u.protocol.startsWith('http')){u.searchParams.set('test','1');u.searchParams.set('profile','1');history.replaceState(null,'',u.pathname+u.search+u.hash)}});
page.on('pageerror',e=>errors.push(e.message));
const ready=key=>page.waitForFunction(k=>window[k]?.ready,key,{timeout:120000});
const state=()=>page.evaluate(()=>window.__SIGNATURE.inspect());
const action=async(a,v)=>{await page.locator(`[data-action="${a}"]${v?`[data-value="${v}"]`:''}`).first().click();await page.waitForFunction(()=>!window.__SIGNATURE.inspect().pending)};
try{
 await page.goto(base+'/?scene=signature&screen=build&test=1&profile=1');await ready('__SIGNATURE');
 assert.match((await state()).visual.asset,/model02/);assert.equal((await state()).recipe.handlingProfile,'slingmods-sport-v4');
 assert.equal((await state()).vehicleContext.year,2026);assert.ok((await state()).display.cluster.bound);
 await action('advanced');await action('ignition','false');assert.ok(!(await state()).display.cluster.power);assert.ok((await state()).display.cluster.needles.every(n=>n.angle===0));await action('ignition','true');await page.locator('#enable-sound').click();await page.waitForFunction(()=>window.__SIGNATURE.inspect().audio.enabled);await page.locator('#mute-sound').click();assert.ok((await state()).display.cluster.power);assert.ok((await state()).display.cluster.needles.find(n=>n.kind==='rpm').value>0);await page.locator('#mute-sound').click();report.ignitionMute=true;await action('advanced');
 for(const foot of Object.values((await state()).visual.driver.feet))assert.ok(foot.gap<1e-5);
 for(const arm of Object.values((await state()).visual.driver.arms))assert.ok(arm.gap<.01);
 assert.ok(!(await state()).resources.some(r=>/slingshot-(josh|hoops)/.test(r.name)));
 await page.evaluate(()=>localStorage.setItem('model03-career-sentinel','unchanged'));
 report.finishes=[];
 for(const finish of ['blue-orange','black-red','white-graphite','graphite-red']){await action('finish',finish);assert.equal((await state()).finish.finish,finish);report.finishes.push(finish);if(finish==='white-graphite')await page.screenshot({path:out+'/white.png'})}
 await action('finish','blue-orange');
 report.extremes=[];
 for(const [steer,travel]of [[-.55,-.14],[.55,.14],[0,0]]){const result=await page.evaluate(({steer,travel})=>window.__SIGNATURE.poseVisual(steer,travel,2.1),{steer,travel});assert.ok(result.rear.wheelCenterError<1e-5);assert.ok(result.rear.shockEndpointError<1e-5);report.extremes.push(result);await page.evaluate(()=>window.__SIGNATURE.view('front',false));await page.screenshot({path:out+`/travel-${travel}.png`})}
 const products=[['Lighting','SM-133'],['Suspension','SM-3223'],['Exhaust','SM-7720'],['Aero','SM-26801'],['Storage','SM-28919']];
 for(const [category,id]of products){await action('category',category);await action('toggle',id);assert.ok((await state()).recipe.products[id]);await action('toggle',id);assert.equal((await state()).recipe.products[id],undefined);if(id==='SM-3223')assert.ok((await state()).suspension.stockVisible.every(o=>o.visible));await action('toggle',id)}
 // Inspection must restore original seat/door state through each navigation path.
 for(const destination of ['shop','quick-race','build']){await action('build');await action('category','Storage');await action('view','SM-28919');await page.waitForTimeout(850);assert.ok((await state()).products.storageInspection);if(destination==='shop')await page.screenshot({path:out+'/storage.png'});await action(destination);assert.ok(!(await state()).products.storageInspection);assert.ok((await state()).products.seats.every(s=>s.visible))}
 await action('shop');assert.equal(await page.locator('[data-shopping=compatible] article').count(),4);assert.equal(await page.locator('[data-shopping=experimental] article').count(),1);assert.match(await page.locator('[data-shopping=experimental]').innerText(),/Experimental game fit — reference product is for 2020–2024/);assert.match(await page.locator('[data-shopping=experimental] a').innerText(),/View reference product/);
 report.fitmentLinks=await page.locator('.sig-shop-list a').evaluateAll(nodes=>nodes.map(n=>({label:n.textContent,url:n.href})));assert.ok(report.fitmentLinks.every(l=>l.url.startsWith('https://www.slingmods.com/')));await page.screenshot({path:out+'/shop-desktop.png'});
 await page.setViewportSize({width:600,height:900});await page.waitForTimeout(150);assert.ok(await page.locator('.sig-shop').evaluate(n=>n.scrollWidth<=n.clientWidth+1));await page.locator('[data-shopping=experimental]').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/shop-narrow.png'});await page.setViewportSize({width:1600,height:1000});await action('build');
 const recipe=(await state()).recipe;report.recipe=recipe;assert.equal(recipe.vehicleId,'slingshot-r-2024');assert.equal((await state()).products.stockExhaust.kind,'empty compatibility anchor');
 await action('compare');assert.equal((await state()).compare,true);await action('compare');assert.deepEqual((await state()).recipe,recipe);
 await action('save-menu');await page.locator('#signature-recipe-name').fill('2026 finished experience');await action('save');
 await page.reload();await ready('__SIGNATURE');assert.deepEqual((await state()).recipe,recipe);assert.ok((await state()).saved.some(r=>r.name==='2026 finished experience'));
 await page.evaluate(()=>window.__SIGNATURE.view('rear',false));await page.screenshot({path:out+'/equipped.png'});
 // Default 2026 selection must survive save/reload and scene navigation.
 report.showroom=(await state());
 await page.locator('[data-action="test-drive"][data-value="express"]').first().click();await page.waitForFunction(()=>!!window.__SIGNATURE?.inspect().departure);
 await page.bringToFront();await page.waitForTimeout(3500);report.departure=await state();assert.ok(report.departure.departure.doorFound);assert.ok(report.departure.display.power);assert.ok(Math.abs(report.departure.visual.rear.drivePulley.angle)>0);assert.ok(report.departure.products.seats.every(s=>s.visible));await page.screenshot({path:out+'/departure.png'});
 await page.locator('[data-departure=skip]').click();await ready('__EXPRESS');
 let s=await page.evaluate(()=>window.__EXPRESS.inspect());assert.equal(s.vehicleContext.year,2026);assert.deepEqual(s.recipe,recipe);assert.match(s.visual.asset,/model02/);assert.equal(s.handlingProfile,'slingmods-sport-v4');
 await page.locator('#start-crew').click();await page.bringToFront();await page.waitForFunction(()=>window.__EXPRESS.inspect().race.phase==='running'&&window.__EXPRESS.inspect().input?.armed);
 report.drive=[];
 for(const [keys,ms]of [[['w'],2500],[['w','a'],250],[['w','d'],250],[['s'],2600],[[],250],[['x'],100],[['w'],1300]]){for(const k of keys)await page.keyboard.down(k);await page.waitForTimeout(ms);for(const k of keys)await page.keyboard.up(k);report.drive.push(await page.evaluate(()=>window.__EXPRESS.inspect()));if(keys.includes('a'))await page.screenshot({path:out+'/steering.png'})}
 assert.ok(report.drive.some(s=>s.telemetry.speed>3));assert.ok(report.drive.some(s=>s.telemetry.steer!==0));assert.ok(report.drive.some(s=>s.telemetry.speed<-.5),'reverse must move');
 assert.ok(report.drive.every(s=>s.visual.rear.drivePulley.centerError<1e-6),'drive pulley must remain on its chassis axle');assert.ok(report.drive.some(s=>Math.abs(s.visual.rear.drivePulley.angle)>1),'drive pulley must turn in gameplay');
 for(const s of report.drive){assert.equal(s.display.cluster.values.speed,Math.round(Math.abs(s.telemetry.speed)*2.23694));assert.equal(s.display.cluster.values.gear,s.telemetry.gear===-1?'R':s.telemetry.gear===0?'N':String(s.telemetry.gear));for(const foot of Object.values(s.visual.driver.feet))assert.ok(foot.gap<1e-5)}
 assert.ok(report.drive.some(s=>s.optics.brakeEmission.every(v=>v===3.5)));assert.ok(report.drive.some(s=>s.telemetry.brake===0&&s.optics.brakeEmission.some(v=>v===0)));
 await page.screenshot({path:out+'/drive.png'});
 // C cycles near -> far -> cockpit. Confirm the driver's head is hidden in-eye.
 for(let i=0;i<3&&(await page.evaluate(()=>window.__EXPRESS.inspect().visual.driver.headVisible));i++){await page.keyboard.press('c',{delay:100});await page.waitForTimeout(300)}
 assert.equal(await page.evaluate(()=>window.__EXPRESS.inspect().visual.driver.headVisible),false);report.cockpit=true;await page.screenshot({path:out+'/cockpit.png'});const clusterImage=await page.evaluate(()=>window.__EXPRESS.referenceCamera('player',[-.375,1.03,.08],[-.375,.81,-.39]));await fs.writeFile(out+'/native-cluster.png',Buffer.from(clusterImage.split(',')[1],'base64'));
 // Use the game's pause menu, retaining the exact recipe and tab visual choice.
 await page.keyboard.press('Escape',{delay:100});await page.waitForFunction(()=>window.__EXPRESS.inspect().race.paused);
 const paused=await page.evaluate(()=>window.__EXPRESS.inspect().display.cluster);await page.waitForTimeout(250);assert.deepEqual(await page.evaluate(()=>window.__EXPRESS.inspect().display.cluster),paused);report.pause=true;await page.keyboard.press('Escape',{delay:100});await page.waitForFunction(()=>!window.__EXPRESS.inspect().race.paused&&window.__EXPRESS.inspect().input.armed);await page.keyboard.down('r');await page.waitForTimeout(1100);await page.keyboard.up('r');await page.waitForTimeout(100);report.reset=await page.evaluate(()=>window.__EXPRESS.inspect());assert.ok(Math.abs(report.reset.telemetry.speed)<.5);assert.equal(report.reset.display.cluster.values.speed,0);await page.keyboard.press('Escape',{delay:100});await page.waitForFunction(()=>window.__EXPRESS.inspect().race.paused);
 await page.locator('#race-menu [data-action=bay]').click();await ready('__SIGNATURE');assert.deepEqual((await state()).recipe,recipe);assert.match((await state()).visual.asset,/model02/);assert.equal(await page.evaluate(()=>localStorage.getItem('model03-career-sentinel')),'unchanged');
 assert.equal((await state()).vehicleContext.year,2026);assert.ok((await state()).products.seats.every(s=>s.visible));
 const oldRecipe={...recipe,handlingProfile:'slingmods-sport-v1'};await page.goto(base+'/?scene=signature&screen=build&test=1&profile=1&loadLegacy=1#build='+encodeURIComponent(JSON.stringify(oldRecipe)));await ready('__SIGNATURE');assert.deepEqual((await state()).recipe,oldRecipe);assert.equal((await state()).vehicleContext.year,2026);report.oldRecipeLoaded=true;
 report.returned=true;
 await page.goto(base+'/?scene=express&route=express&mode=race&test=1&profile=1#build='+encodeURIComponent(JSON.stringify(recipe)));await ready('__EXPRESS');const rivalState=await page.evaluate(()=>window.__EXPRESS.inspect());assert.equal(Object.keys(rivalState.rivals).length,3);assert.ok(rivalState.rivals.maya.optics.roles.includes('brake'));const rivalImage=await page.evaluate(()=>window.__EXPRESS.referenceCamera('maya',[2.8,1.1,-3.2],[0,.65,-.25]));await fs.writeFile(out+'/rival.png',Buffer.from(rivalImage.split(',')[1],'base64'));report.rival=rivalState.rivals.maya;
assert.deepEqual(errors,[]);report.errors=errors;
 await fs.writeFile(out+'/result.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:'PASS',finishes:report.finishes,products:5,returned:true,speeds:report.drive.map(s=>s.telemetry.speed),out}));
}catch(e){await page.screenshot({path:out+'/failure.png'});await fs.writeFile(out+'/failure.json',JSON.stringify({error:String(e),errors,url:page.url(),body:await page.locator('body').innerText(),report},null,2));throw e}finally{await browser.close()}
