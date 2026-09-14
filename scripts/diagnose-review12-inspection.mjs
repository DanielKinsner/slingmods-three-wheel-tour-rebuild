import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const dir=process.env.EVIDENCE_DIR;if(!dir)throw Error('Fresh EVIDENCE_DIR required');await fs.mkdir(dir);
const saved=JSON.parse(await fs.readFile('director-kit/production/evidence/P04B2/fixtures/review08-earned.json','utf8'));
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),context=await browser.newContext({viewport:{width:1280,height:720},storageState:saved}),page=await context.newPage(),errors=[],operations=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5187/?scene=crew&test=1&profile=1');await page.waitForFunction(()=>window.__CREW?.ready,null,{timeout:120000});await page.locator('#enable-sound').click();await page.waitForFunction(()=>window.__CREW.inspect().audio.enabled);await page.waitForTimeout(1200);
 for(const kind of ['light','full','light','full','light','full']){
  const hostStart=performance.now();const returned=await page.evaluate(kind=>{window.__inspectionStart=performance.now();const value=kind==='full'?window.__CREW.inspect():window.__CREW.lightweight();window.__inspectionBuildEnd=performance.now();return value},kind);const hostMs=performance.now()-hostStart;
  const interval=await page.evaluate(()=>({start:window.__inspectionStart,buildEnd:window.__inspectionBuildEnd,returnedAt:performance.now()}));await page.waitForTimeout(650);
  const rows=await page.evaluate(({start,returnedAt})=>window.__CREW.profile().rows.filter(r=>r[0]>=start-100&&r[0]<=returnedAt+200),interval);
  operations.push({kind,hostMs,...interval,serializedBytes:Buffer.byteLength(JSON.stringify(returned)),nearbyRows:rows});
 }
 const final=await page.evaluate(()=>({commit:window.__CREW.inspect().commit,profile:window.__CREW.profile()}));
 const result={method:'Native-clock ready-screen diagnostic only, after all scored races. Alternating lightweight and full inspection through actual Playwright serialization. No simulation input, recording or screenshots. These deliberately instrumented ready rows are not performance scores. Browser-side build duration, full IPC host duration and adjacent raw RAF rows retained. A recurrence demonstrates inspection overhead, not a retrospective proof of the exact original outlier.',toolSHA256:createHash('sha256').update(await fs.readFile(fileURLToPath(import.meta.url))).digest('hex'),operations,final,errors};await fs.writeFile(dir+'/inspection.json',JSON.stringify(result,null,2));console.log(JSON.stringify(operations.map(o=>({kind:o.kind,buildMs:o.buildEnd-o.start,hostMs:o.hostMs,bytes:o.serializedBytes,maxAdjacentRAF:Math.max(...o.nearbyRows.map(r=>r[1]))})),null,2));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close()}
