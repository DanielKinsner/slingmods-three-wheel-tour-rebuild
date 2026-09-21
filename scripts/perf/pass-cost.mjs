// Times each top-level pass on the CPU side (submit cost) and counts draw calls, per look/quality.
import {chromium} from '@playwright/test';
const [route='harbor',look='dusk-rain',quality='high']=process.argv.slice(2);
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio','--enable-gpu','--ignore-gpu-blocklist','--disable-frame-rate-limit','--disable-gpu-vsync']}),p=await b.newPage({viewport:{width:2560,height:1440}});
try{await p.goto(`http://127.0.0.1:5186/?scene=express&route=${route}&mode=test&test=1&profile=1&look=${look}&quality=${quality}`,{waitUntil:'commit',timeout:120000});await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});
 await p.locator('#start-crew').click();await p.bringToFront();await p.waitForFunction(()=>window.__EXPRESS.inspect().input.armed);await p.keyboard.down('w');await p.waitForTimeout(2500);
 const r=await p.evaluate(()=>new Promise(done=>{const gl=document.querySelector('canvas').getContext('webgl2');let draws=0;for(const name of['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const original=gl[name].bind(gl);gl[name]=(...a)=>{draws++;return original(...a)}}
  const frames=[];let last=performance.now(),n=0;function f(now){frames.push({ms:now-last,draws});draws=0;last=now;if(++n<400)requestAnimationFrame(f);else{const ms=frames.map(x=>x.ms).sort((a,b)=>a-b),d=frames.map(x=>x.draws).sort((a,b)=>a-b),i=window.__EXPRESS.inspect();done({avgMs:+(ms.reduce((a,b)=>a+b)/ms.length).toFixed(2),p99:+ms[Math.floor(ms.length*.99)].toFixed(1),medianDraws:d[200],maxDraws:d.at(-1),programs:i.renderer?.programs,wet:i.wetReflection?.passes,mirrors:i.mirrors.live})}}requestAnimationFrame(f)}));
 console.log(route,look,quality,JSON.stringify(r))}finally{await b.close()}
