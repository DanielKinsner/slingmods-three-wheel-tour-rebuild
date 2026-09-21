/** Isolated owner-requested mirror, upgrade, keyboard drive and return check. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:5208',out=process.env.EVIDENCE_DIR||'.tools/mirrors-steering/packaged';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],report={};
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&/THREE.WebGLProgram|GL_INVALID/.test(m.text()))errors.push(m.text())});
await page.addInitScript(()=>{const u=new URL(location.href);if(u.protocol.startsWith('http')){u.searchParams.set('test','1');u.searchParams.set('profile','1');history.replaceState(null,'',u.pathname+u.search+u.hash)}});
const ready=key=>page.waitForFunction(k=>window[k]?.ready,key,{timeout:120000}),state=()=>page.evaluate(()=>window.__SIGNATURE.inspect());
const action=async name=>{await page.locator(`[data-action=${name}]`).first().click();await page.waitForFunction(()=>!window.__SIGNATURE.inspect().pending)};
try{
 await page.goto(base+'/?scene=signature&screen=build');await ready('__SIGNATURE');assert.equal((await state()).recipe.handlingProfile,'slingmods-sport-v5');assert.equal((await state()).mirrors.count,2);
 const old={...(await state()).recipe,handlingProfile:'slingmods-sport-v4',finish:'graphite-red'};
 await page.goto(base+'/?scene=signature&screen=build#build='+encodeURIComponent(JSON.stringify(old)));await ready('__SIGNATURE');assert.deepEqual((await state()).recipe,old);
 await page.evaluate(()=>localStorage.setItem('mirror-steering-career-sentinel','unchanged'));await action('use-current-driving');const upgraded=(await state()).recipe;
 assert.equal(upgraded.handlingProfile,'slingmods-sport-v5');assert.deepEqual({...upgraded,handlingProfile:old.handlingProfile},old);assert.ok((await state()).saved.some(s=>s.recipe.handlingProfile==='slingmods-sport-v4'));
 await page.reload();await ready('__SIGNATURE');assert.deepEqual((await state()).recipe,upgraded);report.upgradePreservesOriginal=true;
 for(const [side,x]of [['left',-.65],['right',.65]]){await page.evaluate(({x})=>window.__SIGNATURE.referenceCamera([x,1.15,.5],[Math.sign(x)*.85,.94,-.42]),{x});await page.waitForTimeout(200);await page.screenshot({path:out+`/showroom-${side}.png`})}
 report.showroomMirrors=(await state()).mirrors;assert.ok(report.showroomMirrors.updates.every(n=>n>0));
 await page.locator('[data-action=test-drive][data-value=express]').first().click();await page.locator('[data-departure=skip]').waitFor({timeout:120000});await page.locator('[data-departure=skip]').click();await ready('__EXPRESS');
 let drive=await page.evaluate(()=>window.__EXPRESS.inspect());assert.equal(drive.handlingProfile,'slingmods-sport-v5');assert.deepEqual(drive.recipe,upgraded);assert.equal(drive.mirrors.count,2);
 await page.locator('#start-crew').click();await page.bringToFront();await page.waitForFunction(()=>window.__EXPRESS.inspect().input?.armed);
 for(let i=0;i<3&&await page.evaluate(()=>window.__EXPRESS.inspect().visual.driver.headVisible);i++){await page.keyboard.press('c',{delay:80});await page.waitForTimeout(200)}
 assert.equal(await page.evaluate(()=>window.__EXPRESS.inspect().visual.driver.headVisible),false);await page.screenshot({path:out+'/cockpit-stopped.png'});
 await page.keyboard.down('w');await page.waitForFunction(()=>window.__EXPRESS.inspect().telemetry.speed>65/2.23694,null,{timeout:35000});await page.keyboard.up('w');report.beforeTurn=await page.evaluate(()=>window.__EXPRESS.inspect().telemetry);
 await page.keyboard.down('a');await page.waitForTimeout(450);await page.keyboard.up('a');report.afterTurn=await page.evaluate(()=>window.__EXPRESS.inspect().telemetry);assert.ok(report.afterTurn.steer>0);assert.ok(report.afterTurn.angularVelocity.y>report.beforeTurn.angularVelocity.y+.05);await page.screenshot({path:out+'/cockpit-turn.png'});
 await page.keyboard.down('s');await page.waitForTimeout(1300);await page.keyboard.up('s');
 for(const [side,x]of [['left',-.55],['right',.55]]){const shot=await page.evaluate(({x})=>window.__EXPRESS.referenceCamera('player',[x,1.12,.38],[Math.sign(x)*.85,.94,-.42]),{x});await fs.writeFile(out+`/road-${side}.png`,Buffer.from(shot.split(',')[1],'base64'))}
 report.drivingMirrors=await page.evaluate(()=>window.__EXPRESS.inspect().mirrors);assert.ok(report.drivingMirrors.updates.every(n=>n>0));
 report.frameIntervals=await page.evaluate(()=>new Promise(resolve=>{let last=performance.now();const rows=[];function step(now){rows.push(now-last);last=now;if(rows.length===60)resolve({median:rows.sort((a,b)=>a-b)[30],max:Math.max(...rows)});else requestAnimationFrame(step)}requestAnimationFrame(step)}));
 await page.keyboard.press('Escape',{delay:80});await page.waitForFunction(()=>window.__EXPRESS.inspect().race.paused);await page.locator('#race-menu [data-action=bay]').click();await ready('__SIGNATURE');assert.deepEqual((await state()).recipe,upgraded);assert.equal(await page.evaluate(()=>localStorage.getItem('mirror-steering-career-sentinel')),'unchanged');report.returned=true;
 for(const route of ['harbor','ridge']){await page.goto(base+`/?scene=express&route=${route}&mode=test#build=`+encodeURIComponent(JSON.stringify(upgraded)));await ready('__EXPRESS');const s=await page.evaluate(()=>window.__EXPRESS.inspect());assert.equal(s.mirrors.count,2);assert.equal(s.handlingProfile,'slingmods-sport-v5');report[route]={mirrors:s.mirrors.count,route:s.route.id}}
 assert.deepEqual(errors,[]);report.errors=errors;report.result='PASS';await fs.writeFile(out+'/result.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:'PASS',upgrade:true,returned:true,startMph:report.beforeTurn.speed*2.23694,steer:report.afterTurn.steer,frameIntervals:report.frameIntervals,out}));
}catch(error){await page.screenshot({path:out+'/failure.png'});await fs.writeFile(out+'/failure.json',JSON.stringify({error:String(error),errors,url:page.url(),report},null,2));throw error}finally{await browser.close()}
