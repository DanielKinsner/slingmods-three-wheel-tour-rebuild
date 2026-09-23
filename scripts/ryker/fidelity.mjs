import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.RYKER_URL??'http://127.0.0.1:5198';
const out=(process.env.RYKER_WORK??'.tools/ryker-work')+'/fidelity';
await mkdir(out,{recursive:true});
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio']});
const p=await b.newPage({viewport:{width:1440,height:1000}});
const report={base,viewport:[1440,1000],browser:await b.version(),errors:[],models:{},method:'Same renderer, studio, FOV and viewport. Exterior camera distance scales with vehicle length for comparable on-screen detail; assets are not scaled. Closeups target their actual parts.'};
p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
async function canvas(name,pos,target){const data=await p.evaluate(([pos,target])=>{window.__SIGNATURE.referenceCamera(pos,target);return document.querySelector('canvas').toDataURL()},[pos,target]);await writeFile(`${out}/${name}.png`,Buffer.from(data.split(',')[1],'base64'))}
try{
 for(const visual of ['2026','ryker']){
  await p.goto(`${base}/?scene=signature&visual=${visual}&test=1&profile=1`);await p.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});
  const k=visual==='ryker'?.66:1;
  for(const [name,pos,target]of [['front',[3.8,2,-4.6],[0,.65,0]],['side',[5,1.5,0],[0,.65,0]],['rear',[3,1.8,4.2],[0,.6,.3]]])await canvas(`${visual}-${name}`,pos.map(x=>x*k),target.map(x=>x*k));
  await p.locator('.sig-navigation [data-action=build]').click();await p.evaluate(()=>window.__SIGNATURE.view('interior',false));await p.waitForTimeout(1200);
  await p.screenshot({path:`${out}/${visual}-interior.png`});
  report.models[visual]=await p.evaluate(()=>{const i=window.__SIGNATURE.inspect();return {build:i.build,mirrors:i.mirrors,display:i.display,finish:i.finish,camera:i.camera,loadMs:i.loadMs,calls:i.calls,triangles:i.triangles}});
  if(visual==='ryker'){
   await canvas('ryker-screen-close',[.02,1.17,.12],[.005,1.038,-.269]);
   await canvas('ryker-wheel-close',[-1.4,.65,-1.45],[-.53,.30,-.85]);
   await p.locator('[data-action=advanced]').click();await p.locator('[data-action=ignition]').click();
   assert.equal((await p.evaluate(()=>window.__SIGNATURE.inspect().display)).power,false);await canvas('ryker-screen-off',[.02,1.17,.12],[.005,1.038,-.269]);
  }
 }
 await p.goto(`${base}/?scene=express&visual=ryker&route=harbor&mode=test&test=1&profile=1&look=day`);await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});
 await p.locator('#start-crew').click();await p.waitForFunction(()=>window.__EXPRESS.inspect().race.phase==='running');
 for(let i=0;i<3;i++){if(await p.evaluate(()=>window.__EXPRESS.inspect().camera.view==='cockpit'))break;await p.keyboard.press('c');await p.waitForTimeout(500)}
 await p.keyboard.down('w');await p.waitForTimeout(1600);await p.keyboard.up('w');
 report.drive=await p.evaluate(()=>{const i=window.__EXPRESS.inspect();return {build:i.build,display:i.display,mirrors:i.mirrors,camera:i.camera,telemetry:{speed:i.telemetry.speed,rpm:i.telemetry.rpm,gear:i.telemetry.gear},driver:i.visual.driver}});
 await p.screenshot({path:`${out}/ryker-cockpit-drive.png`});
 assert.equal(report.drive.camera.view,'cockpit');assert.equal(report.drive.mirrors.count,2);assert.ok(report.drive.mirrors.updates.every(n=>n>0),'Both mirrors reflect the actual world');
 assert.ok(report.drive.display.values.speed>0);assert.ok(Math.abs(report.drive.display.values.speed-Math.round(report.drive.telemetry.speed*2.23694))<=2);
 await p.keyboard.down('s');await p.waitForTimeout(4200);await p.keyboard.up('s');await p.keyboard.press('x');await p.keyboard.down('w');await p.waitForTimeout(1800);await p.keyboard.up('w');
 report.reverse=await p.evaluate(()=>{const i=window.__EXPRESS.inspect();return {display:i.display,telemetry:{speed:i.telemetry.speed,gear:i.telemetry.gear}}});
 assert.ok(report.reverse.telemetry.speed<0);assert.equal(report.reverse.display.values.gear,'R');
 await p.goto(`${base}/?scene=express&visual=ryker&route=harbor&mode=test&test=1&profile=1&look=night`);await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});
 await p.locator('#start-crew').click();await p.waitForFunction(()=>window.__EXPRESS.inspect().race.phase==='running');await p.waitForTimeout(600);
 report.night=await p.evaluate(()=>{const i=window.__EXPRESS.inspect();return {mirrors:i.mirrors,display:i.display,camera:i.camera}});await p.screenshot({path:`${out}/ryker-cockpit-night.png`});
 assert.equal(report.night.camera.view,'cockpit');assert.ok(report.night.mirrors.updates.every(n=>n>0));
 assert.deepEqual(report.errors,[]);report.pass=true;
}catch(e){report.failure=e.stack;throw e}finally{await writeFile(out+'/comparison.json',JSON.stringify(report,null,2));await b.close()}
