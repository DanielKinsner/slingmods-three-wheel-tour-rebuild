/** Paired static-grid CPU/submission diagnostic. Instrumented; never sustained acceptance evidence. */
import {chromium} from '@playwright/test';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {frameStatistics} from './frame-statistics.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:5226',out=process.env.EVIDENCE_DIR;if(!out)throw Error('Fresh EVIDENCE_DIR required');await fs.mkdir(out,{recursive:false});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio','--disable-frame-rate-limit','--disable-gpu-vsync']}),report={method:'Same packaged High wet Harbor starting grid, 2560x1440. ABBA sequence, 300 real RAF frames per sample. GL entry points wrapped to count submissions. All sampled frames retained. Diagnostic only; no FPS acceptance or external-load attribution.',runs:[]};
try{for(const version of ['legacy','fixed','fixed','legacy']){
 const context=await browser.newContext({viewport:{width:2560,height:1440},deviceScaleFactor:1}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 try{console.log('Loading',version);await p.goto(base+`/?scene=express&route=harbor&mode=race&test=1&profile=1&quality=high&look=dusk-rain${version==='legacy'?'&perf=legacy-rider,legacy-materials':''}`,{timeout:120000});await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});await p.waitForTimeout(2500);
  const sample=await p.evaluate(()=>new Promise(resolve=>{
   const gl=document.querySelector('#viewport canvas').getContext('webgl2'),originals={},totals={uniform:0,texture:0,program:0,draw:0},frames=[];
   const groups={uniform:['uniform1f','uniform1fv','uniform1i','uniform1iv','uniform2f','uniform2fv','uniform2i','uniform2iv','uniform3f','uniform3fv','uniform3i','uniform3iv','uniform4f','uniform4fv','uniform4i','uniform4iv','uniformMatrix2fv','uniformMatrix3fv','uniformMatrix4fv'],texture:['bindTexture'],program:['useProgram'],draw:['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']};
   for(const[k,names]of Object.entries(groups))for(const name of names){originals[name]=gl[name];gl[name]=function(...args){totals[k]++;return originals[name].apply(this,args)}}
   const start=window.__EXPRESS.profile().rows.length;let last;
   function frame(now){if(last!==undefined)frames.push({interval:now-last,...totals});for(const k in totals)totals[k]=0;last=now;
    if(frames.length<300)requestAnimationFrame(frame);else{for(const[name,fn]of Object.entries(originals))gl[name]=fn;resolve({frames,rows:window.__EXPRESS.profile().rows.slice(start),state:window.__EXPRESS.inspect().rivalMaterialPool})}
   }requestAnimationFrame(frame);
  }));
  const mean=key=>sample.frames.reduce((n,f)=>n+f[key],0)/sample.frames.length;
  const summary={version,cpu:frameStatistics(sample.rows.map(r=>r[2])),render:frameStatistics(sample.rows.map(r=>r[3])),interval:frameStatistics(sample.frames.map(f=>f.interval)),calls:{uniform:mean('uniform'),texture:mean('texture'),program:mean('program'),draw:mean('draw')},pool:sample.state,errors};
  report.runs.push({...summary,frames:sample.frames,rows:sample.rows});console.log(JSON.stringify(summary));assert.deepEqual(errors,[]);
 }finally{await context.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2))}
}}finally{await browser.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2))}
