import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.RYKER_WORK??'C:/Users/SM - Dan/Documents/GitHub/slingmods game/ryker-purchased/work';
await mkdir(out+'/browser',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try{
 await page.goto('http://127.0.0.1:5198/?scene=signature&visual=ryker&test=1&profile=1',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(12000);
 console.log(await page.evaluate(()=>({keys:Object.keys(window).filter(k=>k.startsWith('__')),text:document.body.innerText.slice(-3500)})));
 await page.screenshot({path:out+'/browser/first-showroom.png'});
 await writeFile(out+'/browser/first-errors.json',JSON.stringify(errors,null,2));console.log(errors);
}finally{await browser.close()}
