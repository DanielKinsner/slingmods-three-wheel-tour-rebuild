import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'https://slingmods-three-wheel-tour-rebuild.vercel.app',out=process.env.EVIDENCE_DIR;
if(!out)throw Error('Fresh EVIDENCE_DIR required');await fs.mkdir(out,{recursive:false});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 const response=await page.goto(base+'/',{timeout:120000});assert.equal(response.status(),200);
 await page.locator('[data-action=build]').first().waitFor({state:'visible',timeout:120000});await page.locator('.drive-preparation').waitFor({state:'detached',timeout:120000});await page.waitForTimeout(300);
 const state=await page.evaluate(()=>({diagnosticsExposed:!!window.__SIGNATURE,title:document.title,canvasCount:document.querySelectorAll('canvas').length,text:document.body.innerText})),url=page.url();assert.equal(new URL(url).search,'');assert.equal(state.diagnosticsExposed,false);assert(state.canvasCount>0);
 const provenanceResponse=await page.request.get(base+'/review-build.json');assert.equal(provenanceResponse.status(),200);const provenance=await provenanceResponse.json();if(process.env.EXPECTED_COMMIT)assert.equal(provenance.commit,process.env.EXPECTED_COMMIT);
 await page.screenshot({path:out+'/root.png'});assert.deepEqual(errors,[]);
 const headers=response.headers();await fs.writeFile(out+'/verification.json',JSON.stringify({pass:true,url,browser:browser.version(),state,provenance,headers:Object.fromEntries(['content-type','cache-control','x-robots-tag','x-content-type-options','referrer-policy'].map(n=>[n,headers[n]])),errors,method:'Fresh isolated context, canonical root without query/test flags, awaited completed graphics preparation and real showroom readiness before screenshot. No personal saves.'},null,2));
}catch(e){await fs.writeFile(out+'/failure.json',JSON.stringify({error:e.stack,errors}));throw e}finally{await browser.close()}
