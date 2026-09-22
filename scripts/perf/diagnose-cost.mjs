/** Short, instrumented CPU profile. Diagnostic only; never acceptance evidence. */
import {chromium} from '@playwright/test';import fs from 'node:fs/promises';
const out=process.env.EVIDENCE_DIR;if(!out)throw Error('Fresh EVIDENCE_DIR required');await fs.mkdir(out,{recursive:false});
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio','--disable-frame-rate-limit','--disable-gpu-vsync']}),p=await b.newPage({viewport:{width:2560,height:1440}});
try{
 if(process.env.PROGRAM_CAUSES==='1')await p.route('**/node_modules/.vite/deps/three.module-*.js*',async route=>{
  const response=await route.fetch(),body=await response.text(),marker='if (needsProgramChange === true) {';
  if(!body.includes(marker))throw Error('Renderer diagnostic marker changed');
  const probe=`if(globalThis.__programCauses){const m=materialProperties;let reason=m.needsLights&&m.lightsStateVersion!==lights.state.version?'lights':m.outputColorSpace!==colorSpace?'colorSpace':m.numClippingPlanes!==undefined&&(m.numClippingPlanes!==clipping.numPlanes||m.numIntersection!==clipping.numIntersection)?'clipping':m.toneMapping!==toneMapping?'toneMapping':m.instancing!==!!object.isInstancedMesh?'instancing':m.vertexTangents!==vertexTangents?'tangents':m.envMap!==envMap?'environment':'other';const k=reason+' / '+(_currentRenderTarget?.texture.name||'screen');globalThis.__programCauses[k]=(globalThis.__programCauses[k]||0)+1;if(reason==='lights'&&globalThis.__lightExamples.length<12)globalThis.__lightExamples.push({material:material.name,target:k,hash:{...lights.state.hash}});}`;
  const exact=body.replace(/(if \([^\n]+\)) needsProgramChange = true;/g,(_,condition)=>condition+' {if(globalThis.__programCauses){const k='+JSON.stringify(condition)+';globalThis.__programCauses[k]=(globalThis.__programCauses[k]||0)+1;}needsProgramChange=true;}');
  await route.fulfill({response,body:exact.replace(marker,marker+probe)});
 });
 await p.goto((process.env.BASE_URL||'http://127.0.0.1:5186')+'/?scene=express&route=harbor&mode=race&look=dusk-rain&test=1&profile=1&quality=high');await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});
 await p.locator('#start-crew').click();await p.waitForFunction(()=>window.__EXPRESS.inspect().input.armed);await p.keyboard.down('w');await p.waitForTimeout(3000);
 await p.evaluate(()=>{window.__programCauses={};window.__lightExamples=[];});
 const c=await p.context().newCDPSession(p);await c.send('Profiler.enable');await c.send('Profiler.start');await p.waitForTimeout(12000);const {profile}=await c.send('Profiler.stop');
 await fs.writeFile(out+'/program-causes.json',JSON.stringify(await p.evaluate(()=>({causes:window.__programCauses,examples:window.__lightExamples})),null,2));
 await fs.writeFile(out+'/cpu-profile.json',JSON.stringify(profile));await fs.writeFile(out+'/state.json',JSON.stringify(await p.evaluate(()=>window.__EXPRESS.inspect())));
 const calls=new Map();for(const n of profile.nodes){const f=n.callFrame,k=f.functionName+' '+f.url.split('/').at(-1)+':'+(f.lineNumber+1);calls.set(k,(calls.get(k)||0)+(n.hitCount||0));}
 const top=[...calls].sort((a,b)=>b[1]-a[1]).slice(0,35);await fs.writeFile(out+'/top.json',JSON.stringify(top,null,2));console.log(top);
 await fs.writeFile(out+'/draw-census.json',JSON.stringify(await p.evaluate(()=>window.__EXPRESS.drawCensus(60)),null,2));
}finally{await b.close();}
