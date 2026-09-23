import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='assets/ryker/evidence/complete';await mkdir(out,{recursive:true});
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio']});
const p=await b.newPage({viewport:{width:1440,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto('http://127.0.0.1:5198/?scene=signature&screen=build&visual=ryker&test=1&captureBuffer=1');await p.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});
 await p.screenshot({path:out+'/assembled-before.png'});
 for(const [id,pos,target]of [['stock-front',[2,1.4,-2.8],[0,.5,-.4]],['stock-side',[3,1.1,.15],[0,.45,0]],['stock-rear',[2,1.4,2.6],[0,.45,.3]]]){const data=await p.evaluate(([pos,target])=>{window.__SIGNATURE.referenceCamera(pos,target);return document.querySelector('canvas').toDataURL()},[pos,target]);await writeFile(out+'/'+id+'.png',Buffer.from(data.split(',')[1],'base64'))}
 await writeFile(out+'/initial-inspection.json',JSON.stringify({errors,state:await p.evaluate(()=>window.__SIGNATURE.inspect())},null,2));console.log({errors});
}finally{await b.close()}
