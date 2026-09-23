import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.RYKER_URL??'http://127.0.0.1:5198',out=(process.env.RYKER_WORK??'.tools/ryker-work')+'/finish';
await mkdir(out,{recursive:true});const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio']}),p=await b.newPage({viewport:{width:1440,height:1000}}),report={base,errors:[]};
p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
try{
 await p.goto(base+'/?scene=signature&visual=ryker&test=1&profile=1');await p.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});
 report.initial=await p.evaluate(()=>{const i=window.__SIGNATURE.inspect();return {build:i.build,finish:i.finish.finish,vehicle:i.vehicleContext.visual}});assert.equal(report.initial.finish,'blue-orange');assert.equal(report.initial.vehicle,'ryker');
 await p.locator('.sig-navigation [data-action=build]').click();
 const red=p.getByRole('button',{name:'Adrenaline Red / black',exact:true});await red.waitFor();assert.equal(await red.getAttribute('aria-pressed'),'true');
 await p.locator('[data-action=finish][data-value=black-red]').click();await p.locator('[data-action=finish][data-value=black-red][aria-pressed=true]').waitFor();await red.click();await p.locator('[data-action=finish][data-value=blue-orange][aria-pressed=true]').waitFor();
 const shot=await p.evaluate(()=>{window.__SIGNATURE.referenceCamera([2.6,1.65,-3.1],[0,.65,0]);return document.querySelector('canvas').toDataURL()});await writeFile(out+'/adrenaline-red-black-seat.png',Buffer.from(shot.split(',')[1],'base64'));await p.screenshot({path:out+'/finish-selector.png'});
 assert.deepEqual(report.errors,[]);report.defaultRestored=true;report.pass=true;
}catch(e){report.failure=e.stack;throw e}finally{await writeFile(out+'/browser.json',JSON.stringify(report,null,2));await b.close()}
