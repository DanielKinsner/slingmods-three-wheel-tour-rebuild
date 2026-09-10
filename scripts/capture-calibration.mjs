import {chromium} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir=process.env.EVIDENCE_DIR||'director-kit/production/evidence/G0';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{localStorage.setItem('legacy-game','preserved');localStorage.setItem('unrelated-setting','42')});
await page.goto(process.env.TWT_URL||'http://127.0.0.1:5186/?scene=calibration');await page.waitForFunction(()=>window.__TWT?.ready);
const result=await page.evaluate(()=>window.__TWT.inspect());
assert.deepEqual(result.cubeBounds.map(v=>Math.round(v*1000)/1000),[1,1,1]);assert.equal(result.clearcoat,1);assert.ok(Math.abs(result.rubberRoughness-.87)<1e-6);assert.ok(result.animationCount>0);
const d=(a,b)=>a.map((v,i)=>Math.round((v-b[i])*1000)/1000);
assert.deepEqual(d(result.axes.x,result.axes.origin),[1,0,0]);assert.deepEqual(d(result.axes.y,result.axes.origin),[0,0,-1]);assert.deepEqual(d(result.axes.z,result.axes.origin),[0,1,0]);
await page.evaluate(()=>window.__TWT.setTime(0));const q0=await page.evaluate(()=>window.__TWT.inspect().wheelQuaternion);
await page.screenshot({path:dir+'/calibration-runtime.png'});
await page.evaluate(()=>window.__TWT.setTime(.4));const q1=await page.evaluate(()=>window.__TWT.inspect().wheelQuaternion);assert.notDeepEqual(q0,q1);await page.screenshot({path:dir+'/calibration-pivot-runtime.png'});
const storage=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));assert.equal(storage['legacy-game'],'preserved');assert.equal(storage['unrelated-setting'],'42');assert.deepEqual(errors,[]);
const report={command:'node scripts/capture-calibration.mjs',outcome:'PASS',browser:await browser.version(),rendering:'isolated headless Chromium, explicitly SwiftShader software rendering; no physical GPU performance claim',viewport:{width:1440,height:900},result,q0,q1,storage,errors};await writeFile(dir+'/browser-smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();


