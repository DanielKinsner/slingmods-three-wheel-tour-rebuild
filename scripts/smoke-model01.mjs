/** One isolated showroom/departure/drive/return flow; no film or benchmark. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:5205';const out='.tools/model01-smoke';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],report={};
await page.addInitScript(()=>{const u=new URL(location.href);if(u.protocol.startsWith('http')){u.searchParams.set('test','1');u.searchParams.set('profile','1');history.replaceState(null,'',u.pathname+u.search+u.hash)}});
page.on('pageerror',e=>errors.push(e.message));
const ready=key=>page.waitForFunction(k=>window[k]?.ready,key,{timeout:120000});
const state=()=>page.evaluate(()=>window.__SIGNATURE.inspect());
const action=async(a,v)=>{await page.locator(`[data-action="${a}"]${v?`[data-value="${v}"]`:''}`).first().click();await page.waitForFunction(()=>!window.__SIGNATURE.inspect().pending)};
try{
 await page.goto(base+'/?scene=signature&screen=build&visual=josh&test=1&profile=1');await ready('__SIGNATURE');
 assert.match((await state()).visual.asset,/josh/);assert.equal((await state()).recipe.handlingProfile,'slingmods-sport-v4');
 await page.evaluate(()=>localStorage.setItem('model01-career-sentinel','unchanged'));
 report.finishes=[];
 for(const finish of ['blue-orange','black-red','white-graphite','graphite-red']){await action('finish',finish);assert.equal((await state()).finish.finish,finish);report.finishes.push(finish);if(finish==='white-graphite')await page.screenshot({path:out+'/white.png'})}
 await action('finish','blue-orange');
 report.extremes=[];
 for(const [steer,travel]of [[-.55,-.14],[.55,.14],[0,0]]){const result=await page.evaluate(({steer,travel})=>window.__SIGNATURE.poseVisual(steer,travel,2.1),{steer,travel});assert.ok(result.rear.wheelCenterError<1e-5);assert.ok(result.rear.shockEndpointError<1e-5);report.extremes.push(result);await page.evaluate(()=>window.__SIGNATURE.view('front',false));await page.screenshot({path:out+`/travel-${travel}.png`})}
 const products=[['Lighting','SM-133'],['Suspension','SM-3223'],['Exhaust','SM-7720'],['Aero','SM-26801'],['Storage','SM-28919']];
 for(const [category,id]of products){await action('category',category);await action('toggle',id);assert.ok((await state()).recipe.products[id]);await action('toggle',id);assert.equal((await state()).recipe.products[id],undefined);if(id==='SM-3223')assert.ok((await state()).suspension.stockVisible.every(o=>o.visible));await action('toggle',id)}
 const recipe=(await state()).recipe;report.recipe=recipe;
 await action('compare');assert.equal((await state()).compare,true);await action('compare');assert.deepEqual((await state()).recipe,recipe);
 await action('save-menu');await page.locator('#signature-recipe-name').fill('Josh integration smoke');await action('save');
 await page.reload();await ready('__SIGNATURE');assert.deepEqual((await state()).recipe,recipe);assert.ok((await state()).saved.some(r=>r.name==='Josh integration smoke'));
 await page.evaluate(()=>window.__SIGNATURE.view('rear',false));await page.screenshot({path:out+'/equipped.png'});
 // Same render/finish framing for the recoverable old/new selector.
 report.showroom=(await state());
 await page.locator('[data-action="test-drive"][data-value="express"]').first().click();await page.waitForFunction(()=>!!window.__SIGNATURE?.inspect().departure);
 await page.bringToFront();await page.waitForTimeout(1600);report.departure=await state();assert.ok(report.departure.departure.doorFound);assert.ok(report.departure.display.power);await page.screenshot({path:out+'/departure.png'});
 await page.locator('[data-departure=skip]').click();await ready('__EXPRESS');
 let s=await page.evaluate(()=>window.__EXPRESS.inspect());assert.deepEqual(s.recipe,recipe);assert.match(s.visual.asset,/josh/);assert.equal(s.handlingProfile,'slingmods-sport-v4');
 await page.locator('#start-crew').click();await page.bringToFront();await page.waitForFunction(()=>window.__EXPRESS.inspect().race.phase==='running'&&window.__EXPRESS.inspect().input?.armed);
 report.drive=[];
 for(const [keys,ms]of [[['w'],2500],[['w','a'],250],[['w','d'],250],[['s'],2600],[[],250],[['x'],100],[['w'],1300]]){for(const k of keys)await page.keyboard.down(k);await page.waitForTimeout(ms);for(const k of keys)await page.keyboard.up(k);report.drive.push(await page.evaluate(()=>window.__EXPRESS.inspect()))}
 assert.ok(report.drive.some(s=>s.telemetry.speed>3));assert.ok(report.drive.some(s=>s.telemetry.steer!==0));assert.ok(report.drive.some(s=>s.telemetry.speed<-.5),'reverse must move');
 await page.screenshot({path:out+'/drive.png'});await page.keyboard.press('c');await page.waitForTimeout(300);await page.screenshot({path:out+'/cockpit.png'});
 // Use the game's build link, retaining the exact recipe and tab visual choice.
 await page.locator('a.shop-build-route').click();await ready('__SIGNATURE');assert.deepEqual((await state()).recipe,recipe);assert.match((await state()).visual.asset,/josh/);assert.equal(await page.evaluate(()=>localStorage.getItem('model01-career-sentinel')),'unchanged');
 report.returned=true;assert.deepEqual(errors,[]);report.errors=errors;
 await fs.writeFile(out+'/result.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:'PASS',finishes:report.finishes,products:products.length,returned:true,speeds:report.drive.map(s=>s.telemetry.speed),out}));
}catch(e){await page.screenshot({path:out+'/failure.png'});await fs.writeFile(out+'/failure.json',JSON.stringify({error:String(e),errors,url:page.url(),body:await page.locator('body').innerText(),report},null,2));throw e}finally{await browser.close()}
