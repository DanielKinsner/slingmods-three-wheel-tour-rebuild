import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'vite';
import {chromium} from '@playwright/test';
import {mkdtemp,writeFile,rm,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

test('drive retry retains completed downloads; cancellation settles workers and preserves the recipe',async()=>{
 const root=process.cwd().replaceAll('\\','/'),temp=await mkdtemp(path.join(tmpdir(),'drive-preparation-')),entry=path.join(temp,'entry.ts');
 await writeFile(entry,`export {prepareDrive,driveAssetURLs} from ${JSON.stringify(root+'/src/signature/drive-preparation.ts')};export {freshRecipe} from ${JSON.stringify(root+'/src/signature/config.ts')};`);
 let source;
 try{const bundle=await build({configFile:false,logLevel:'silent',build:{write:false,minify:false,lib:{entry,formats:['es'],fileName:'client'}}});source=(Array.isArray(bundle)?bundle[0]:bundle).output.find(x=>x.type==='chunk').code}finally{await rm(entry);await rmdir(temp)}
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();
  await page.route('http://drive.test/**',route=>route.fulfill({contentType:route.request().url().endsWith('/client.js')?'text/javascript':'text/html',body:route.request().url().endsWith('/client.js')?source:'<script type="module">import * as api from "/client.js";window.api=api;</script>'}));
  await page.goto('http://drive.test');await page.waitForFunction(()=>window.api);
  await page.evaluate(()=>{
   const recipe=window.api.freshRecipe();window.recipe=recipe;window.original=JSON.stringify(recipe);window.calls={};window.active=0;window.maxActive=0;window.fail=true;window.stall=false;
   window.failedURL=window.api.driveAssetURLs('ridge',recipe).at(-1);
   window.fetch=(url,{signal})=>new Promise((resolve,reject)=>{
    window.calls[url]=(window.calls[url]??0)+1;window.active++;window.maxActive=Math.max(window.maxActive,window.active);
    const finish=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);window.active--};
    const abort=()=>{finish();reject(new DOMException('Cancelled','AbortError'))};
    const timer=setTimeout(()=>{finish();resolve(new Response('asset',{status:window.fail&&url===window.failedURL?503:200}))},window.stall?60000:5);
    signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
   });
   window.work=window.api.prepareDrive('ridge',recipe,'race').then(r=>window.report=r);
  });
  await page.locator('[data-prepare-retry]').waitFor({state:'visible'});
  assert.equal(await page.locator('h2').innerText(),'Smoky Ridge');
  assert.equal(await page.evaluate(()=>window.active),0);
  const completed=await page.evaluate(()=>Object.keys(window.calls).filter(url=>url!==window.failedURL));
  await page.evaluate(()=>window.fail=false);await page.locator('[data-prepare-retry]').click();await page.waitForFunction(()=>window.report);
  const result=await page.evaluate(()=>({report:window.report,calls:window.calls,maxActive:window.maxActive,unchanged:JSON.stringify(window.recipe)===window.original,dialogs:document.querySelectorAll('dialog').length}));
  assert.equal(result.report.retries,1);assert.equal(result.report.cancelled,false);assert.equal(result.unchanged,true);assert.equal(result.dialogs,0);assert.ok(result.maxActive<=4);
  for(const url of completed)assert.equal(result.calls[url],1,'successful download repeated: '+url);
  assert.equal(new Set(result.report.resources.map(r=>r.url)).size,result.report.resources.length);
  for(const waitingOnRetry of [false,true]){
   await page.evaluate(waiting=>{window.report=null;window.stall=!waiting;window.fail=waiting;window.work=window.api.prepareDrive('ridge',window.recipe).then(r=>window.report=r)},waitingOnRetry);
   if(waitingOnRetry)await page.locator('[data-prepare-retry]').waitFor({state:'visible'});
   await page.keyboard.press('Escape');await page.waitForFunction(()=>window.report);
   assert.deepEqual(await page.evaluate(()=>({cancelled:window.report.cancelled,active:window.active,dialogs:document.querySelectorAll('dialog').length,unchanged:JSON.stringify(window.recipe)===window.original})),{cancelled:true,active:0,dialogs:0,unchanged:true});
  }
 }finally{await browser.close()}
});
