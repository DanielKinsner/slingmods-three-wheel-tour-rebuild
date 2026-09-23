import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.EVIDENCE_DIR||'assets/spyder/evidence/assembled-final';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio']});
const p=await browser.newPage({viewport:{width:1600,height:1000}}),report={errors:[],parts:[],poses:{}};p.on('pageerror',e=>report.errors.push(e.message));
const ready=()=>p.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});
const inspect=()=>p.evaluate(()=>window.__SIGNATURE.inspect());
const shot=async(name,pos,target)=>{const data=await p.evaluate(async([pos,target])=>{window.__SIGNATURE.referenceCamera(pos,target);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);return document.querySelector('canvas').toDataURL()},[pos,target]);await writeFile(out+'/'+name+'.png',Buffer.from(data.split(',')[1],'base64'))};
try{
 await p.goto((process.env.BASE_URL||'http://127.0.0.1:5213')+'/?scene=signature&visual=spyder&screen=build&test=1&profile=1&captureBuffer=1');await ready();
 report.stock=await inspect();
 for(const [id,cat] of [['throttle','Throttle'],['front','Front Suspension'],['rear','Rear Suspension'],['sway','Handling'],['underglow','UnderGlow'],['wheels','Wheel Lights']]){
  await p.locator(`[data-action=category][data-value="${cat}"]`).click();await p.locator(`[data-action=spyder-toggle][data-value=${id}]`).click();await p.waitForTimeout(200);
  report.parts.push({id,installed:await inspect()});
  await p.locator(`[data-action=spyder-toggle][data-value=${id}]`).click();await p.waitForTimeout(100);report.parts.at(-1).removed=await inspect();
  await p.locator(`[data-action=spyder-toggle][data-value=${id}]`).click();await p.waitForTimeout(100);
 }
 await p.screenshot({path:out+'/equipped-ui.png'});
 await p.locator('[data-action=save-menu]').click();await p.locator('#signature-recipe-name').fill('SPYDER01 complete');await p.locator('button[data-action=save]').click();await p.waitForTimeout(200);
 report.equipped=await inspect();await p.reload();await ready();report.reload=await inspect();
 await p.locator('[data-action=advanced]').click();await p.locator('[data-action=driver][data-value=true]').click();await p.locator('[data-action=motion][data-value=true]').click().catch(()=>{});
 await shot('equipped-hero',[2,1.6,-2.8],[0,.65,0]);await shot('equipped-side',[-2.8,1.05,.3],[0,.65,0]);
 await shot('front-shock',[-1.4,.75,-1.7],[-.36,.38,-.85]);await shot('rear-shock',[.75,.85,1.5],[0,.5,.55]);await shot('ring',[-1.7,.52,-1.35],[-.69,.33,-.85]);await shot('controller',[-.65,1.55,.4],[-.1,1,-.33]);
 for(const [name,steer,travel,spin] of [['left',-.6,[.04,-.04,0],1.2],['right',.6,[-.04,.04,0],-1.2],['rear',0,[0,0,.06],-2]]){
  report.poses[name]=await p.evaluate(([s,t,w])=>window.__SIGNATURE.poseVisual(s,t,w),[steer,travel,spin]);await shot('pose-'+name,[2,1.6,-2.8],[0,.7,0]);
 }
 await p.evaluate(()=>window.__SIGNATURE.poseVisual(0,0,0));await p.locator('[data-action=lighting][data-value=lights]').click();await shot('lights',[-2,.7,-2.7],[0,.4,0]);
 for(const part of report.parts){assert.equal(part.installed.recipe.spyder.parts[part.id],true);assert.ok(!part.removed.recipe.spyder.parts[part.id]);}assert.deepEqual(report.reload.recipe,report.equipped.recipe);assert.ok(Object.values(report.equipped.recipe.spyder.parts).every(Boolean));for(const pose of Object.values(report.poses))for(const arm of Object.values(pose.driver.arms))assert.ok(arm.gap<.001);assert.deepEqual(report.errors,[]);report.status='PASS';
}catch(e){report.status='FAIL';report.failure=e.stack;await p.screenshot({path:out+'/failure.png'}).catch(()=>{})}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,failure:report.failure,errors:report.errors}));await browser.close()}


