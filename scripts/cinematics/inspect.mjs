import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.EVIDENCE_DIR||'evidence/cinematics/revised';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio']});
const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try{
await page.goto((process.env.BASE_URL||'http://127.0.0.1:5237')+'/?scene=express&route=express&mode=race&look=golden-hour&play=preview&quality=ultra&test=1&profile=1&clock=controlled&captureBuffer=1');
await page.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:120000});
for(const film of ['arrival','grid','victory']){
 await page.evaluate(f=>window.__EXPRESS.cinematic(f),film);
 for(const t of [1,2.7,4.8,6.6]){
  await page.evaluate(t=>window.__EXPRESS.cinematicSeek(t),t);
  await page.screenshot({path:`${out}/${film}-${t}.png`});
 }
}
await writeFile(out+'/report.json',JSON.stringify({errors,state:await page.evaluate(()=>window.__EXPRESS.inspect())},null,2));
}finally{await browser.close()}
