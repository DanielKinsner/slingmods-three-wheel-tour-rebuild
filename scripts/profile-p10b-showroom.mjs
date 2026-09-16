import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.EVIDENCE_DIR,base=process.env.BASE_URL;if(!out||!base)throw Error('Fresh EVIDENCE_DIR and BASE_URL required');await fs.mkdir(out,{recursive:false});
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),c=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1}),p=await c.newPage(),errors=[],phases=[];p.on('pageerror',e=>errors.push(e.message));
const inspect=()=>p.evaluate(()=>window.__SIGNATURE.inspect());
async function phase(name,work){const before=await inspect();await work();const after=await inspect(),intervals=after.intervals.slice(before.intervals.length),sorted=[...intervals].sort((a,b)=>a-b),pct=q=>sorted[Math.ceil(q*sorted.length)-1];phases.push({name,intervals,p95:pct(.95),p99:pct(.99),max:sorted.at(-1),before:{frames:before.frames,memory:before.memory},after:{frames:after.frames,memory:after.memory,calls:after.calls,triangles:after.triangles}})}
async function action(a,v){await p.locator(`[data-action="${a}"]${v?`[data-value="${v}"]`:''}`).first().click();await p.waitForFunction(()=>!window.__SIGNATURE.inspect().pending)}
try{
 const at=Date.now();await p.goto(base+'/?scene=signature&test=1&profile=1');await p.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});const cold=await inspect(),readyMs=Date.now()-at;await p.locator('#enable-sound').click();await p.waitForFunction(()=>window.__SIGNATURE.inspect().audio.enabled);
 await phase('entry-idle',()=>p.waitForTimeout(8000));
 await phase('free-orbit',async()=>{await p.mouse.move(1050,480);await p.mouse.down();for(let n=0;n<100;n++){await p.mouse.move(1050+Math.sin(n/25)*190,480+Math.sin(n/40)*40);await p.waitForTimeout(50)}await p.mouse.up();await p.waitForTimeout(1500)});
 await action('build');await action('category','Paint');
 for(let pass=0;pass<2;pass++)await phase(pass?'warm-finishes':'first-finish-material-changes',async()=>{for(const f of ['black-red','white-graphite','graphite-red','blue-orange']){await action('finish',f);await p.waitForTimeout(1300)}});
 for(let pass=0;pass<2;pass++)await phase(pass?'remove-products':'first-product-material-changes',async()=>{for(const [category,id]of [['Lighting','SM-133'],['Suspension','SM-3223'],['Exhaust','SM-7720'],['Aero','SM-26801'],['Storage','SM-28919']]){await action('category',category);await action('toggle',id);await p.waitForTimeout(900)}});
 const final=await inspect();assert.deepEqual(errors,[]);assert.ok(phases.every(s=>s.intervals.length>100));await fs.writeFile(out+'/verification.json',JSON.stringify({pass:true,base,runtime:cold.build,browser:b.version(),readyMs,cold,phases,final,errors,method:'Native RAF, 1920x1080 DPR1 ANGLE D3D11. No video/screenshots/tracing/Blender/compression concurrent. Separate cold load, orbit, initial material changes and warm changes. Object counts are not measured VRAM; this is one workstation.'},null,2));console.log(JSON.stringify({readyMs,phases:phases.map(({intervals,...s})=>s)}));
}catch(e){await fs.writeFile(out+'/failure.json',JSON.stringify({error:e.stack,phases,errors},null,2));throw e}finally{await b.close()}
