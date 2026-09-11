import {chromium} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
const dir='director-kit/production/evidence/P03A/shadows';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{const page=await browser.newPage({viewport:{width:1280,height:800}});await page.goto('http://127.0.0.1:5187/?scene=pad&test=1&shadow=legacy');await page.waitForFunction(()=>window.__TWT?.ready,null,{timeout:60000});const cdp=await page.context().newCDPSession(page);const results=[];
for(const [i,pose] of [{x:0,z:35,yaw:0},{x:-3,z:3,yaw:.25},{x:-6,z:-20,yaw:.1}].entries()){
 await page.evaluate(p=>{window.__TWT.reset(p);window.__TWT.advance({throttle:0,brake:0,steer:0,reverse:false},2)},pose);
 for(const mode of ['legacy','vehicle-only','receivers-only','repaired']){
  await page.evaluate(m=>window.__TWT.setShadows(m),mode);
  await writeFile(`${dir}/pose-${i}-${mode}.png`,Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true})).data,'base64'));
  results.push({pose,mode,inspect:await page.evaluate(()=>window.__TWT.inspect())});
 }
}
await writeFile(dir+'/caster-isolation.json',JSON.stringify({browser:await browser.version(),renderer:'SwiftShader isolated',command:'node scripts/capture-shadow-diagnosis.mjs',results},null,2));console.log('Captured 3 identical poses x 4 caster/receiver isolation modes');
}finally{await browser.close()}
