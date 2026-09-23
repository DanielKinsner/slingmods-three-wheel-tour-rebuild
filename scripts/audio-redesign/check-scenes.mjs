import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const base=process.env.BASE_URL??'http://127.0.0.1:5217',out=process.env.EVIDENCE_DIR??'assets/audio-redesign/evidence';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--mute-audio','--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
const report={base,method:'Actual local scene rendering and WebAudio, controlled normal input path for brief driving checks; not a benchmark, certified lap, or listening approval.',errors:[],cases:[]};
try{for(const entry of [{place:'showroom',visual:'2026'},{place:'harbor',visual:'2026'},{place:'ridge',visual:'ryker'},{place:'express',visual:'2026'}]){
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/audio/'))report.errors.push(r.status()+' '+r.url())});
 const showroom=entry.place==='showroom',hook=showroom?'__SIGNATURE':'__EXPRESS';
 await page.goto(`${base}/?scene=${showroom?'signature':'express'}&route=${entry.place}&mode=free&play=preview&visual=${entry.visual}&test=1&profile=1&clock=controlled&quality=low`);
 await page.waitForFunction(h=>window[h]?.ready,hook,{timeout:120000});await page.locator('#enable-sound').click();await page.waitForFunction(h=>window[h].inspect().audio.enabled,hook,{timeout:40000});
 if(showroom){await page.locator('#game-audio summary').click();await page.screenshot({path:out+'/showroom-mix.png'});
  const controls=await page.locator('#game-audio label').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,bottom:r.bottom,right:r.right}}));
  console.log('Mix bounds',JSON.stringify(controls));assert.equal(controls.length,5);for(let i=1;i<controls.length;i++)assert.ok(controls[i].y>=controls[i-1].bottom-1,'Mix controls overlap');
  for(const width of [1280,390]){await page.setViewportSize({width,height:800});const r=await page.locator('#audio-music').boundingBox();assert.ok(r.x>=0&&r.x+r.width<=width);}
 }else{
  await page.evaluate(()=>window.audioNow=0);await page.locator('#start-crew').click();
  for(let i=0;i<48;i++){await page.evaluate(i=>{const h=window.__EXPRESS;h.setDeviceSample({keys:i<30?[]:['ArrowUp'],pads:[],focused:true});for(let f=0;f<6;f++){h.normalFrame(window.audioNow,f===5);window.audioNow+=1000/60}},i);await page.waitForTimeout(100)}
  const state=await page.evaluate(()=>window.__EXPRESS.inspect());assert.ok(state.telemetry.speed>2);assert.equal(state.audio.score.scene.place,entry.place);assert.equal(state.audio.score.scene.phase,'running');
  assert.equal(state.audio.soundTreatment,entry.visual==='ryker'?'tour-designed-three-cylinder':'tour-designed-stock-mix');assert.ok(state.audio.graph.rms>0);
  if(entry.visual==='ryker')assert.equal(state.audio.graph.shiftCount,0);
  await page.screenshot({path:out+'/'+entry.place+'-drive.png'});
 }
 report.cases.push({entry,audio:await page.evaluate(h=>window[h].inspect().audio,hook)});await page.close();}
 assert.deepEqual(report.errors,[]);report.status='PASS';
}catch(e){report.status='FAIL';report.failure=e.stack;throw e}finally{await fs.writeFile(out+'/scenes.json',JSON.stringify(report,null,2));await browser.close()}
