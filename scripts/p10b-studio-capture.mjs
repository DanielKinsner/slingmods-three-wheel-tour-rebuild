import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const out=process.env.EVIDENCE_DIR||'director-kit/production/evidence/P10B/studio/runtime-01';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11']});const page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto((process.env.BASE_URL||'http://127.0.0.1:5206')+'/?scene=signature&test=1&profile=1');await page.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});await page.waitForTimeout(600);
const records=[];
for(const viewport of [{width:1920,height:1080},{width:1280,height:720}]){
 await page.setViewportSize(viewport);await page.waitForTimeout(400);
 for(const finish of ['blue-orange','black-red','white-graphite','graphite-red']) {
  await page.locator('[data-action="build"]').first().click();await page.locator('[data-action="category"][data-value="Paint"]').click();await page.locator(`[data-action="finish"][data-value="${finish}"]`).click();await page.waitForFunction(f=>window.__SIGNATURE.inspect().finish.finish===f,finish);await page.locator('[data-action="back"]').first().click();
  for(const view of ['hero','tour-wall']){await page.evaluate(v=>window.__SIGNATURE.view(v),view);await page.waitForTimeout(1000);await page.screenshot({path:`${out}/${viewport.width}-${view}-${finish}-entry.png`});records.push({viewport,finish,view,state:await page.evaluate(()=>window.__SIGNATURE.inspect())})}
 }
}
await fs.writeFile(out+'/verification.json',JSON.stringify({errors,records},null,2));await browser.close();console.log(JSON.stringify({out,errors,captures:records.length}));
