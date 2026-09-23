import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const base=process.env.BASE_URL??'http://127.0.0.1:5252',out=process.env.EVIDENCE_DIR??'handoff/worktree-integration/ryker-ui';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--mute-audio','--use-angle=d3d11']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],rows=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
const settled=()=>page.waitForFunction(()=>!window.__SIGNATURE.inspect().pending);
const click=async selector=>{await page.locator(selector).click();await settled()};
try{
 await page.goto(base+'/?scene=signature&screen=build&visual=ryker&test=1&profile=1&quality=medium&play=preview');
 await page.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});
 await click('[data-action=finish][data-value=white-graphite]');
 for(const [category,part]of [['Lighting','underglow'],['Suspension','shocks'],['Exhaust','exhaust'],['Body Kit','body']]){
  await click(`[data-action=category][data-value="${category}"]`);await click(`[data-action=ryker-toggle][data-value="${part}"]`);
  assert.equal(await page.evaluate(part=>!!window.__SIGNATURE.inspect().recipe.ryker[part],part),true);
 }
 await page.locator('#enable-sound').click();await page.waitForFunction(()=>window.__SIGNATURE.inspect().audio.enabled&&!window.__SIGNATURE.inspect().audio.loading);
 await click('[data-action=advanced]');await click('[data-action=driver]');
 await page.waitForFunction(()=>window.__SIGNATURE.inspect().visual.driver.motion.enabled);
 await click('[data-action=view][data-value=route-relief]');assert.equal(await page.evaluate(()=>window.__SIGNATURE.inspect().showroom.view),'route-relief');
 await click('[data-action=view][data-value=hero]');
 await click('.sig-header [data-action=shop]');assert.equal(await page.locator('.sig-shop-list article').count(),4);
 for(const [width,height]of [[1440,1000],[390,844]]){
  await page.setViewportSize({width,height});
  const geometry=await page.locator('.sig-shop-list article > div').evaluateAll(nodes=>nodes.map(e=>({width:e.getBoundingClientRect().width,overflow:e.scrollWidth>e.clientWidth+1})));
  assert.ok(geometry.every(g=>g.width>200&&!g.overflow),JSON.stringify(geometry));
  await page.screenshot({path:`${out}/ryker-shop-${width}.png`});rows.push({width,geometry});
  await page.locator('#game-audio summary').click();
  const controls=await page.locator('#game-audio label,#music-off').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect().toJSON()));
  assert.equal(controls.length,6);
  controls.forEach((r,i)=>{assert.ok(r.x>=0&&r.right<=width+1&&r.y>=0&&r.bottom<=height,JSON.stringify(r));if(i)assert.ok(r.y>=controls[i-1].bottom-1,'audio control overlap')});
  await page.screenshot({path:`${out}/sound-mix-${width}.png`});rows.push({width,controls});
  await page.locator('#music-off').click();assert.equal(await page.evaluate(()=>window.__SIGNATURE.inspect().audio.extendedLevels.music),0);
  await page.locator('#game-audio summary').click();
 }
 await page.reload();await page.waitForFunction(()=>window.__SIGNATURE?.ready,null,{timeout:120000});
 const s=await page.evaluate(()=>window.__SIGNATURE.inspect());assert.equal(s.audio.extendedLevels.music,0);assert.equal(s.recipe.finish,'white-graphite');assert.equal(Object.values(s.recipe.ryker).filter(Boolean).length,4);
 assert.deepEqual(errors,[]);await writeFile(out+'/report.json',JSON.stringify({pass:true,method:'Packaged merged game. Real Ryker preview product/paint/view controls and all six audio controls, desktop and emulated phone. No career purchase or personal profile.',rows,recipe:s.recipe,errors},null,2));
 console.log('PASS integrated Ryker products, relief/rider hooks, shop layout and persistent audio controls');
}catch(e){await page.screenshot({path:out+'/failure.png'}).catch(()=>{});await writeFile(out+'/failure.json',JSON.stringify({error:e.stack,rows,errors},null,2));throw e}
finally{await browser.close()}
