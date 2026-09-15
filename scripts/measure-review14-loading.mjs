import {chromium}from'@playwright/test';import fs from'node:fs/promises';
const out=process.env.EVIDENCE_DIR;if(!out)throw Error('Fresh EVIDENCE_DIR required');await fs.mkdir(out,{recursive:false});
const origin=process.env.BASE_URL||'http://127.0.0.1:5187';
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1}),page=await context.newPage();const runs=[];
try{for(const warm of [false,true]){
 const errors=[],requests=[];const onError=e=>errors.push(e.message);const onResponse=r=>requests.push({url:r.url(),status:r.status()});page.on('pageerror',onError);page.on('response',onResponse);
 const start=Date.now();if(warm)await page.reload();else await page.goto(origin+'/?scene=bay&test=1&profile=1');await page.waitForFunction(()=>window.__TWT?.ready,null,{timeout:120000});const elapsed=Date.now()-start;
 const data=await page.evaluate(()=>({resources:performance.getEntriesByType('resource').map(r=>({url:r.name,initiator:r.initiatorType,start:r.startTime,duration:r.duration,transferSize:r.transferSize,encodedBodySize:r.encodedBodySize,decodedBodySize:r.decodedBodySize})),navigation:performance.getEntriesByType('navigation').map(n=>n.toJSON()),state:window.__TWT.inspect()}));
 runs.push({warm,elapsedWallMs:elapsed,errors,requests,...data});page.off('pageerror',onError);page.off('response',onResponse);if(errors.length||requests.some(r=>r.status>=400))throw Error('Loading errors retained');
 }
 const manifest=await(await page.request.get(origin+'/review-build.json')).json();await fs.writeFile(out+'/loading.json',JSON.stringify({manifest,browser:browser.version(),viewport:[1920,1080],dpr:1,network:'Unthrottled localhost. Fresh browser/context for cold run; same-page reload for warm HTTP/browser cache. Driver/OS shader caches not cleared. Wallclock until ready; resource encoded/decoded/transfer fields distinguish file bytes from actual transfers.',runs},null,2));console.log(runs.map(r=>({warm:r.warm,ms:r.elapsedWallMs,transfer:r.resources.reduce((s,v)=>s+v.transferSize,0),glbs:r.resources.filter(v=>v.url.endsWith('.glb')).map(v=>[v.url,v.transferSize,v.decodedBodySize])})));
}finally{await context.close();await browser.close()}
