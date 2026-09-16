import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const base='https://slingmods-three-wheel-tour-rebuild.vercel.app',out='director-kit/production/evidence/P09C/hosted-baseline-01';
await fs.mkdir(out,{recursive:false});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 const response=await page.goto(base+'/',{timeout:120000});await page.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});
 await page.screenshot({path:out+'/root.png'});const root=await page.evaluate(()=>({url:location.href,title:document.title,state:window.__SIGNATURE.inspect()}));
 const files=[];for(const name of ['/review-build.json','/missing-p09c-file.wasm','/src/main.ts','/Astra-Review-18-Lean.zip']){const r=await context.request.get(base+name);files.push({path:name,status:r.status(),contentType:r.headers()['content-type'],cache:r.headers()['cache-control'],bytes:(await r.body()).length})}
 await fs.writeFile(out+'/verification.json',JSON.stringify({method:'Actual canonical hosted root in fresh isolated Chromium; baseline metadata only, no current candidate claim.',status:response.status(),browser:browser.version(),root,files,errors},null,2));
}finally{await browser.close()}
