import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL??'http://127.0.0.1:5253',out=process.env.EVIDENCE_DIR??'handoff/rider-hands/closeups';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']});
const page=await browser.newPage({viewport:{width:1400,height:1000}}),errors=[],rows=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
try{
 await page.goto(base+'/rider-lab.html');await page.waitForFunction(()=>window.__RIDER_LAB?.ready,null,{timeout:120000});
 for(const car of ['slingshot','ryker']){
  await page.evaluate(async car=>{const h=window.__RIDER_LAB;await h.load('tour',car);h.setPose('idle');h.step(.4,true)},car);
  for(const [pose,seconds]of [['idle',.2],['left',.12],['left-lock',.6],['right',.12],['right-lock',.6],['brake',.4]]){
   const report=await page.evaluate(({pose,seconds})=>{const h=window.__RIDER_LAB;h.setPose(pose);return h.sweep(seconds)},{pose,seconds});
   assert.ok(report.maxHand<.001);assert.ok(report.maxFoot<.001);assert.ok(report.maxSupportingGap<.001);
   const target=[0,0,0];for(const a of Object.values(report.report.arms))a.target.forEach((x,i)=>target[i]+=x/2);
   for(const side of [-1,1]){
    await page.evaluate(({target,side})=>window.__RIDER_LAB.camera([target[0]+side*.55,target[1]+.30,target[2]-.62],target),{target,side});
    await page.screenshot({path:`${out}/${car}-${pose}-${side<0?'left':'right'}.png`});
   }
   rows.push({car,pose,...report});
  }
 }
 assert.deepEqual(errors,[]);await writeFile(out+'/report.json',JSON.stringify({pass:true,method:'Actual exported mesh on both current vehicles. Paired close-ups through idle, turning, full lock, regrip and braking; all intermediate contact gaps checked. Images require visual review in addition to numeric checks.',rows,errors},null,2));
 console.log('PASS both vehicles, six poses, paired hand close-ups and intermediate contact checks');
}finally{await browser.close()}
