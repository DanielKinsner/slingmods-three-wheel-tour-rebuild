import {chromium} from '@playwright/test';
import {build} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const dir=process.env.EVIDENCE_DIR;if(!dir)throw Error('Fresh EVIDENCE_DIR required');await fs.mkdir(dir,{recursive:false});
const hash=b=>createHash('sha256').update(b).digest('hex');
async function assetSnapshot(){const paths=[];async function visit(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())await visit(p);else paths.push(p)}}await visit('public/assets/showcase-quality');return Object.fromEntries(await Promise.all(paths.sort().map(async p=>[p,hash(await fs.readFile(p))])))}
const before=await assetSnapshot();await fs.writeFile(dir+'/assets-before.json',JSON.stringify(before,null,2));
const inputs=['scripts/review12-scene.ts','src/presentation/showcase.ts','src/presentation/harbor-renderer.ts','src/presentation/harbor-water.ts','src/presentation/outdoor-environment.ts','src/presentation/harbor-lighting.ts','src/presentation/driving-camera.ts','src/presentation/chase.ts','src/presentation/hero.ts','public/assets/harbor/route.json','public/assets/vehicles/slingshot-p04a1.glb'];
const sourceInputs=Object.fromEntries(await Promise.all(inputs.map(async p=>[p,hash(await fs.readFile(p))])));await fs.writeFile(dir+'/source-inputs.json',JSON.stringify(sourceInputs,null,2));
await build({configFile:false,logLevel:'silent',publicDir:false,build:{outDir:path.resolve(dir+'/fixture'),emptyOutDir:false,minify:false,lib:{entry:path.resolve('scripts/review12-scene.ts'),name:'DepthVerification',formats:['iife'],fileName:()=> 'scene.js'}}});
const source=await fs.readFile(dir+'/fixture/scene.js','utf8'),prior=JSON.parse(await fs.readFile('director-kit/production/evidence/P06/baseline-stock720/run.json','utf8')),rows=[],errors=[];
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']});
try{
 for(const [name,depth,far]of[['reverse1600','reverse',1600],['reverse8000','reverse',8000],['log8000','log',8000]]){
  const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1}),page=await context.newPage();
  page.on('pageerror',e=>errors.push({name,error:e.message}));page.on('console',m=>{if(m.type()==='error')errors.push({name,console:m.text()})});
  await page.route('**/assets/showcase-quality/**',async r=>{const relative=new URL(r.request().url()).pathname.slice(1);if(relative.includes('..'))throw Error('Invalid path');await r.fulfill({body:await fs.readFile('public/'+relative)})});
  await page.route('**/__review11_fixture?*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
  await page.route('**/__review11_telemetry',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(prior.initial.telemetry)}));
  await page.goto('http://127.0.0.1:5187/__review11_fixture?preset=day&showcase=full&depth='+depth);await page.addScriptTag({content:source});await page.waitForFunction(()=>window.__VISUAL?.ready,null,{timeout:120000});
  const range=await page.evaluate(f=>window.__VISUAL.depthRange(f),far);
  const capabilities=await page.evaluate(()=>window.__VISUAL.depthCapabilities());
  for(const view of ['overview','near','cockpit']){
   const state=await page.evaluate(view=>view==='overview'?window.__VISUAL.diagnostic([95,130,110],[0,0,-120],58):window.__VISUAL.pose(160,'jett',8,view,'stock',false,true),view);
   const filename=name+'-'+view+'.png';await page.screenshot({path:dir+'/'+filename});rows.push({name,view,filename,range,capabilities,state});
  }
  await context.close();
 }
 const after=await assetSnapshot();const result={method:'Controlled presentation diagnostic: reversed versus forced logarithmic depth; far1600/8000, same overview and ordinary near/cockpit camera math. No driving/performance claim.',fixtureSHA256:hash(source),browser:browser.version(),sourceInputs,before,after,assetsIdentical:JSON.stringify(before)===JSON.stringify(after),rows,errors};
 await fs.writeFile(dir+'/verification.json',JSON.stringify(result,null,2));
 if(!result.assetsIdentical)throw Error('Assets changed during verification');if(errors.length)throw Error(JSON.stringify(errors));
}finally{await browser.close()}
