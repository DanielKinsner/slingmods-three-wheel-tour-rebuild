// Four actual route photographs; isolated test camera, no authored game geometry.
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:5218';
const out=process.env.ART_DIR||'public/assets/interface';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']});
try {
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  for(const [route,light] of [['express','day'],['harbor','day'],['ridge','day'],['ridge','night']]) {
    await page.goto(`${base}/?scene=express&route=${route}&lighting=${light}&look=${light}&visual=2026&test=1&profile=1&clock=controlled&quality=high`);
    await page.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:120000});
    const image=await page.evaluate(()=>{
      window.__EXPRESS.referenceCamera('player',[6,2.8,-7],[0,.7,3]);
      return document.querySelector('#viewport canvas').toDataURL('image/jpeg',.9);
    });
    await fs.writeFile(`${out}/${route}-${light}.jpg`,Buffer.from(image.split(',')[1],'base64'));
    console.log(route,light);
  }
} finally { await browser.close(); }
