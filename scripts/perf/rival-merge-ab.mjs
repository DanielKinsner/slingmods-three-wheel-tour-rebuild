// A/B a rival with the rigid-part merge off and on: four reference angles on the grid, pixel diff per angle.
// node scripts/perf/rival-merge-ab.mjs [route] [look]   (dev server on 5186; writes .tools/rival-merge/)
import {chromium} from '@playwright/test';import fs from 'node:fs/promises';
const [route='express',look='day',rival='jett']=process.argv.slice(2),out='.tools/rival-merge';await fs.mkdir(out,{recursive:true});
const angles={front:[[1.9,1.0,-3.4],[0,.55,-.6]],rear:[[-1.8,1.1,3.6],[0,.5,.4]],side:[[3.6,.7,-.3],[0,.45,-.3]],top:[[.01,4.2,-.3],[0,0,-.3]],wheel:[[1.7,.45,-1.9],[.85,.33,-1.33]]};
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio','--enable-gpu','--ignore-gpu-blocklist']});
try{for(const mode of['off','on']){const p=await b.newPage({viewport:{width:1600,height:900}}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(`http://127.0.0.1:5186/?scene=express&route=${route}&mode=race&test=1&profile=1&look=${look}&quality=high${mode==='off'?'&rivalmerge=off':''}`,{waitUntil:'commit',timeout:120000});await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});await p.waitForTimeout(1500);
 for(const[name,[pos,target]]of Object.entries(angles)){const shot=await p.evaluate(([id,pos,target])=>window.__EXPRESS.referenceCamera(id,pos,target),[rival,pos,target]);await fs.writeFile(`${out}/${route}-${look}-${name}-${mode}.png`,Buffer.from(shot.split(',')[1],'base64'))}
 console.log(mode,JSON.stringify(await p.evaluate(()=>window.__EXPRESS.inspect().rivalMerge??null)),'errors',errors.length,errors[0]??'');await p.close()}
}finally{await b.close()}
