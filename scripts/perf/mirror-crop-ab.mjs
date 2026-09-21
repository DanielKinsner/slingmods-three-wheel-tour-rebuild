// A/B the mirror frustum crop from a parked car: same scene with the crop patched out, then with it. Cockpit and chase.
import {chromium} from '@playwright/test';import fs from 'node:fs/promises';
const [route='harbor',look='day']=process.argv.slice(2),out='.tools/mirror-crop';await fs.mkdir(out,{recursive:true});
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio','--enable-gpu','--ignore-gpu-blocklist']});
try{for(const mode of['before','after']){const p=await b.newPage({viewport:{width:1920,height:1080}});
 if(mode==='before')await p.route('**/vehicle-mirrors.ts*',async r=>{const res=await r.fetch();const body=(await res.text());if(!body.includes('this.fit(reflectedCamera, mirror);')&&!body.includes('this.fit(reflectedCamera,mirror);'))throw Error('patch point missing');await r.fulfill({response:res,body:body.replace(/this\.fit\(reflectedCamera, ?mirror\);/,'')})});
 await p.goto(`http://127.0.0.1:5186/?scene=express&route=${route}&mode=test&test=1&profile=1&look=${look}&quality=high`,{waitUntil:'commit',timeout:120000});await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});
 await p.locator('#start-crew').click();await p.bringToFront();await p.waitForFunction(()=>window.__EXPRESS.inspect().input.armed);await p.waitForTimeout(1500);
 await p.screenshot({path:`${out}/${route}-chase-${mode}.png`});
 await p.keyboard.press('c');await p.waitForTimeout(200);await p.keyboard.press('c');await p.waitForTimeout(1200);
 await p.screenshot({path:`${out}/${route}-cockpit-${mode}.png`});console.log(mode,JSON.stringify(await p.evaluate(()=>{const m=window.__EXPRESS.inspect().mirrors;return{cropped:m.cropped,live:m.live,updates:m.updates}})));await p.close()}
}finally{await b.close()}
