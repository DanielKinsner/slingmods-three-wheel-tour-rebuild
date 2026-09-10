import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='director-kit/production/evidence/G1';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
const page=await browser.newPage({viewport:{width:1440,height:1000}});const cdp=await page.context().newCDPSession(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5187/?scene=vehicle&test=1');await page.waitForFunction(()=>window.__TWT?.ready,{timeout:60000});
const inspected=await page.evaluate(()=>window.__TWT.inspect());assert.ok(inspected.nodes.every(n=>n.spin));assert.ok(inspected.nodes.slice(0,2).every(n=>n.steer));
for(const view of ['front','side','rear','threequarter','rearquarter','cockpit']){await page.evaluate(view=>window.__TWT.captureView(view),view);await writeFile(`${dir}/runtime-${view}.png`,Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false})).data,'base64'))}
assert.deepEqual(errors,[]);const report={command:'node scripts/capture-vehicle.mjs',outcome:'PASS capture and pivot presence only; recognition requires reviewer',browser:await browser.version(),renderer:'isolated SwiftShader software',viewport:{width:1440,height:1000},inspected,errors};await writeFile(dir+'/runtime-inspection.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close()}


