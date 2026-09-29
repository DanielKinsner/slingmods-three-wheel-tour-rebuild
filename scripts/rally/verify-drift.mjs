import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const base=process.env.BASE_URL||'http://127.0.0.1:5271',out=process.env.EVIDENCE_DIR||'handoff/rally-evidence/packaged';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),page=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce'}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto(base+'/?scene=rally&visual=ryker&mode=race&test=1&profile=1&clock=controlled&quality=high');
  await page.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});
  await page.evaluate(()=>{window.__now=performance.now();window.__EXPRESS.setDeviceSample({keys:[],pads:[],focused:true});window.__EXPRESS.normalFrame(window.__now);});
  await page.locator('#start-crew').click();
  await page.evaluate(()=>{for(let i=0;i<190;i++)window.__EXPRESS.normalFrame(window.__now+=1000/60,i===189);});
  const result=await page.evaluate(()=>{const h=window.__EXPRESS;let peakSlip=0,slides=0;for(let i=0;i<410;i++){const held=i>=340;h.setDeviceSample({keys:held?['KeyW','KeyD','Space']:['KeyW'],pads:[],focused:true});h.normalFrame(window.__now+=1000/60,i===409);const s=h.lightweight();peakSlip=Math.max(peakSlip,Math.abs(s.telemetry.wheels[2].slipAngle));if(s.racecraft.drift.active)slides++;}return{peakSlip,slides,state:h.lightweight()};});
  assert.ok(result.slides>10);assert.ok(result.state.rally.score>100,'Ordinary handbrake input scores a progressing dirt slide');assert.equal(result.state.rally.recorded,false);assert.equal(result.state.racecraft.drift.boosts,0);assert.deepEqual(errors,[]);
  await page.screenshot({path:out+'/scored-drift.png'});
  await fs.writeFile(out+'/scored-drift.json',JSON.stringify({pass:true,method:'Keyboard throttle, steering and handbrake through the normal fixed-tick simulation; no telemetry or score injection.',...result,errors},null,2));
  console.log(JSON.stringify({pass:true,score:result.state.rally.score,slideTicks:result.slides,peakSlip:result.peakSlip}));
}finally{await browser.close();}
