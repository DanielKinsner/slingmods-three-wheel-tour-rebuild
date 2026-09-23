import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
const out=process.env.EVIDENCE_DIR||'assets/ryker/evidence/complete/mounted';await mkdir(out,{recursive:true});
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio']});const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));const report={errors,poses:{}};
async function canvas(name,pos=[2,1.35,-2.8],target=[0,.46,-.35]){const url=await p.evaluate(([pos,target])=>{window.__SIGNATURE.referenceCamera(pos,target);return document.querySelector('canvas').toDataURL()},[pos,target]);await writeFile(out+'/'+name+'.png',Buffer.from(url.split(',')[1],'base64'))}
try{
 await p.goto((process.env.BASE_URL||'http://127.0.0.1:5198')+'/?profile=1&scene=signature&screen=build&visual=ryker&test=1&captureBuffer=1');await p.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});
 await canvas('stock');
 for(const [category,id]of [['Suspension','shocks'],['Body Kit','body'],['Exhaust','exhaust'],['Lighting','underglow']]){
  await p.locator(`[data-action=category][data-value="${category}"]`).click();await p.locator(`[data-action=ryker-toggle][data-value="${id}"]`).click();await p.waitForTimeout(400);await canvas(id);
 }
 await p.locator('[data-action=category][data-value="Paint"]').click();await p.locator('[data-action=finish][data-value="white-graphite"]').click();await p.waitForTimeout(400);await canvas('white-all');
 for(const [name,steer,travel]of [['neutral',0,[0,0,0]],['left-compression',.4,[.055,0,0]],['right-droop',-.4,[0,-.03,0]],['rear-compression',0,[0,0,.06]]]){
  report.poses[name]=await p.evaluate(([s,t])=>window.__SIGNATURE.poseVisual(s,t,0),[steer,travel]);await canvas(name,[1.4,.6,-1.8],[0,.32,-.70]);report.poses[name].lighting=await p.evaluate(()=>window.__SIGNATURE.inspect().product);
 }
 for(const steer of [-.62,.62]){const pose=await p.evaluate(s=>window.__SIGNATURE.poseVisual(s,[.045,-.06,.045],1),steer);report.poses['lock-'+steer]=pose;for(const arm of Object.values(pose.driver.arms))assert.ok(arm.gap<.02,'Full-lock rider grip');for(const foot of Object.values(pose.driver.feet))assert.ok(foot.gap<.02,'Fixed rider foot');await canvas('lock-'+steer,[1.4,1.25,1.8],[0,.70,-.05])}
 await canvas('rear-mounted',[1.3,.7,1.7],[0,.35,.36]);assert.deepEqual(report.poses.neutral.lighting.stockGrilleVisible,[false,false]);assert.notDeepEqual(report.poses.neutral.lighting.emitterWorld[0],report.poses['left-compression'].lighting.emitterWorld[0]);await p.locator('[data-action=category][data-value="Body Kit"]').click();await p.locator('[data-action=ryker-toggle][data-value=body]').click();await p.waitForTimeout(200);report.withStockGrille=await p.evaluate(()=>window.__SIGNATURE.inspect().product);assert.deepEqual(report.withStockGrille.stockGrilleVisible,[true,true]);await p.locator('[data-action=ryker-toggle][data-value=body]').click();await p.waitForTimeout(200);report.state=await p.evaluate(()=>window.__SIGNATURE.inspect());await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log({errors,motion:report.poses.neutral?.rear});
}finally{await b.close()}
