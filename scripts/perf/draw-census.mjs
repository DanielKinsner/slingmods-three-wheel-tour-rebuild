// Where a frame's draw calls go: per render pass, and per scene branch. node scripts/perf/draw-census.mjs harbor dusk high
import {chromium} from '@playwright/test';
const [route='harbor',look='dusk',quality='high',drive='2500']=process.argv.slice(2);
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio','--enable-gpu','--ignore-gpu-blocklist']}),p=await b.newPage({viewport:{width:1920,height:1080}});
try{await p.goto(`http://127.0.0.1:5186/?scene=express&route=${route}&mode=${process.env.MODE||'test'}&test=1&profile=1&look=${look}&quality=${quality}`,{waitUntil:'commit',timeout:120000});await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});
 await p.locator('#start-crew').click();await p.bringToFront();await p.waitForFunction(()=>window.__EXPRESS.inspect().input.armed);await p.keyboard.down('w');await p.waitForTimeout(+drive);
 const r=await p.evaluate(()=>window.__EXPRESS.drawCensus(40));
 const byPass={};for(const x of r.passes){const k=x.target+' <- '+x.camera;(byPass[k]??=[]).push(x.calls)}
 console.log('PASSES (calls per render, over',r.passes.length,'renders)');for(const[k,v]of Object.entries(byPass))console.log(' ',k.padEnd(48),'x'+v.length,'median',v.sort((a,b)=>a-b)[v.length>>1],'max',v.at(-1));
 console.log('BRANCHES (main camera)');console.table(r.branches.slice(0,28));
 console.log('TOTAL in-view draws',r.branches.reduce((a,x)=>a+x.draws,0),'unique pairs',r.branches.reduce((a,x)=>a+x.uniquePairs,0),'casters',r.branches.reduce((a,x)=>a+x.casters,0))}finally{await b.close()}
