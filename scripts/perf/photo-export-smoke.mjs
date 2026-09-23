/** Real packaged-game photo export, cleanup, mobile layout and return-to-driving checks. */
import {chromium} from '@playwright/test';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:5225',out=process.env.EVIDENCE_DIR;if(!out)throw Error('Fresh EVIDENCE_DIR required');await fs.mkdir(out,{recursive:false});
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),p=await b.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1}),report={errors:[],requests:[]};
p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)report.requests.push(r.status()+' '+r.url())});
try{
 await p.goto(base+'/?scene=express&route=harbor&mode=race&test=1&profile=1&quality=high&look=dusk-rain',{timeout:120000});await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});
 await p.locator('#start-crew').click();if(await p.locator('.film-skip').isVisible())await p.locator('.film-skip').click();
 await p.waitForFunction(()=>window.__EXPRESS.lightweight().race.phase==='running',null,{timeout:30000});
 // Cockpit hides the rider's head to keep it out of the camera. Photo orbit must restore the complete rider.
 for(let i=0;i<3;i++){
  if(await p.evaluate(()=>window.__EXPRESS.inspect().camera.view==='cockpit'))break;
  await p.keyboard.press('c');await p.waitForTimeout(150);
 }
 await p.waitForFunction(()=>window.__EXPRESS.inspect().camera.view==='cockpit');
 report.cockpit=await p.evaluate(()=>window.__EXPRESS.inspect().visual.driver.headVisible);assert.equal(report.cockpit,false);
 await p.keyboard.press('Escape');await p.waitForFunction(()=>window.__EXPRESS.lightweight().race.paused);
 await p.locator('[data-gx-photo]').click();await p.waitForSelector('.gx-photo-ui:not([hidden])');
 await p.waitForTimeout(500);report.before=await p.evaluate(()=>window.__EXPRESS.inspect());
 assert.equal(report.before.visual.driver.headVisible,true,'exterior photo shows the complete rider');
 await p.locator('[data-photo=size]').selectOption('4k');
 const download=p.waitForEvent('download',{timeout:90000});await p.locator('[data-photo=capture]').click();
 const photo=await download;assert.equal(await photo.failure(),null);await photo.saveAs(out+'/photo-4k.png');
 const bytes=await fs.readFile(out+'/photo-4k.png');report.photo={width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length};
 assert.deepEqual([report.photo.width,report.photo.height],[3840,2160]);assert.ok(bytes.length>200000,'PNG contains the rendered scene');
 await p.waitForFunction(()=>document.querySelector('[data-photo-status]')?.textContent==='Photo saved');
 report.after=await p.evaluate(()=>window.__EXPRESS.inspect());
 assert.equal(report.after.telemetry.time,report.before.telemetry.time,'capture never advances the simulation');
 assert.deepEqual(report.after.size,report.before.size);assert.equal(report.after.dpr,report.before.dpr);assert.equal(report.after.pipeline.quality,report.before.pipeline.quality);
 assert.ok(report.after.memory.textures<=report.before.memory.textures,'export releases its GPU textures');
 await p.screenshot({path:out+'/photo-ui.png'});
 await p.setViewportSize({width:844,height:390});await p.waitForTimeout(300);await p.screenshot({path:out+'/photo-mobile.png'});
 report.mobile=await p.locator('.gx-photo-ui').boundingBox();assert.ok(report.mobile.x>=0&&report.mobile.y>=0&&report.mobile.x+report.mobile.width<=845&&report.mobile.y+report.mobile.height<=391,'photo controls fit a landscape phone');
 await p.locator('[data-photo=exit]').click();assert.equal(await p.locator('.gx-photo-ui').isVisible(),false);
 await p.waitForFunction(()=>window.__EXPRESS.inspect().visual.driver.headVisible===false);
 await p.keyboard.press('Escape');await p.waitForFunction(()=>!window.__EXPRESS.lightweight().race.paused);
 await p.keyboard.down('w');await p.waitForTimeout(1800);await p.keyboard.up('w');report.resumed=await p.evaluate(()=>window.__EXPRESS.lightweight());
 assert.ok(report.resumed.telemetry.speed>1,'normal driving resumes');assert.deepEqual(report.errors,[]);assert.deepEqual(report.requests,[]);report.pass=true;
 console.log(JSON.stringify({pass:true,photo:report.photo,memoryBefore:report.before.memory,memoryAfter:report.after.memory,mobile:report.mobile,cache:report.after.textureCache}));
}catch(e){report.failure=e.stack;throw e;}finally{await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));await b.close();}
