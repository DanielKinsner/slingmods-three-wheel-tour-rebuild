import {chromium} from '@playwright/test';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const out=process.env.EVIDENCE_DIR;if(!out)throw Error('Fresh EVIDENCE_DIR required');await fs.mkdir(out,{recursive:false});
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2}),rows=[],errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try{
 for(const [quality,samples,bloomLevels,cap]of [['low',0,0,1],['medium',2,4,1],['high',4,5,1.5],['ultra',4,6,2]]){
  await p.goto((process.env.BASE_URL||'http://127.0.0.1:5186')+'/?scene=calibration&test=1&quality='+quality);await p.waitForFunction(()=>window.__TWT?.ready);
  const s=await p.evaluate(()=>window.__TWT.inspect());assert.equal(s.pipeline.post,true);assert.equal(s.pipeline.quality,quality);assert.equal(s.pipeline.samples,samples);assert.equal(s.pipeline.bloomLevels,bloomLevels);assert.deepEqual(s.pipeline.size,[1440*cap,900*cap]);assert.ok(s.preparation.stages.some(x=>x.name==='post-path-all-mesh-render'));assert.deepEqual(s.cubeBounds.map(v=>Math.round(v*1000)/1000),[1,1,1]);
  await p.evaluate(()=>window.__TWT.setTime(0));const q=await p.evaluate(()=>window.__TWT.inspect().wheelQuaternion);await p.evaluate(()=>window.__TWT.setTime(.4));assert.notDeepEqual((await p.evaluate(()=>window.__TWT.inspect())).wheelQuaternion,q);
  await p.setViewportSize({width:1200,height:800});await p.waitForFunction(({w,h})=>window.__TWT.inspect().pipeline.size.join()===w+','+h,{w:1200*cap,h:800*cap});rows.push({quality,state:s,resized:(await p.evaluate(()=>window.__TWT.inspect())).pipeline});
  if(quality==='high')await p.screenshot({path:out+'/calibration-high.png'});await p.setViewportSize({width:1440,height:900});
 }
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/result.json',JSON.stringify({pass:true,rows,errors},null,2));
}finally{await b.close();}
