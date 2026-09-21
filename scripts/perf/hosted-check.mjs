// Reproduces the owner's path on the HOSTED package (port 5189): showroom -> Original Harbor -> Quick Race, then the drive itself.
import {chromium} from '@playwright/test';import fs from 'node:fs/promises';
const base='http://127.0.0.1:8071',b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio','--enable-gpu','--ignore-gpu-blocklist']}),p=await b.newPage({viewport:{width:1920,height:1080}});
const failed=[];p.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url().replace(base,''))});const errors=[];p.on('pageerror',e=>errors.push(String(e)));
const report={};if(process.env.BLOCK)await p.route(u=>/\/assets\/(p11|basis)\//.test(String(u)),r=>r.fulfill({status:404,body:''}));
try{
 for(const [route,label] of [['harbor','Original Harbor'],['express','Harbor Express']]){
  await p.goto(base+'/?scene=signature&screen=events',{waitUntil:'commit',timeout:120000});await p.waitForSelector('[data-action=race],[data-action=test-drive]',{timeout:180000});
  await p.getByText(label,{exact:true}).first().click();await p.waitForTimeout(600);
  const before=failed.length;await p.locator('[data-action=race]').first().click();
  const outcome=await Promise.race([p.waitForURL(u=>/scene=(express|ridge)/.test(String(u)),{timeout:120000}).then(()=>'navigated to the drive'),p.getByText('Download interrupted').waitFor({timeout:120000}).then(()=>'DOWNLOAD INTERRUPTED')]);
  report[route]={dialog:outcome,newFailures:failed.slice(before)};
  if(outcome.startsWith('nav')){await p.waitForSelector('#start-crew',{timeout:180000});await p.waitForTimeout(2500);await p.screenshot({path:`.tools/phase1/hosted-${process.env.BLOCK?'blocked-':''}${route}.png`});report[route].driveUrl=p.url().replace(base,'').slice(0,80)}
 }
}finally{await b.close()}
console.log(JSON.stringify({report,failed,errors},null,1));
