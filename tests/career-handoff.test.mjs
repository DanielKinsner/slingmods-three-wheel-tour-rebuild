import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'vite';
import {chromium} from '@playwright/test';
import {mkdtemp,writeFile,readFile,rm,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

test('denied-IDB real scene navigation preserves session career and rejects unsupported transfers',async()=>{
 const root=process.cwd().replaceAll('\\','/'),temp=await mkdtemp(path.join(tmpdir(),'p05-career-handoff-')),entry=path.join(temp,'entry.ts');
 await writeFile(entry,`export {careerClient} from ${JSON.stringify(root+'/src/career/client.ts')}; export {BuildUI} from ${JSON.stringify(root+'/src/career/build-ui.ts')};`);
 let source;
 try{const bundle=await build({configFile:false,logLevel:'silent',build:{write:false,minify:false,lib:{entry,formats:['es'],fileName:'client'}}});source=(Array.isArray(bundle)?bundle[0]:bundle).output.find(x=>x.type==='chunk').code}finally{await rm(entry);await rmdir(temp)}
 const fixture=JSON.parse(await readFile('director-kit/production/evidence/P04B2/fixtures/review08-earned.json','utf8')).origins[0].indexedDB[0].stores[0].records[0].value;
 const expected=structuredClone(fixture);expected.version=4;expected.ownBuild={version:1,finish:'blue-orange',products:{},completed:{'open-it-up':false,'hold-your-nerve':false,'coastline-cup':false},won:{'open-it-up':false,'hold-your-nerve':false,'coastline-cup':false},active:null,attempts:{},cups:{},activeCupId:null,records:[]};expected.buildMatters={legacyCrewAccess:true,duelCompleted:false,duelWon:false};expected.suspension={owned:false,equipped:false,setup:{frontCompression:2,frontRebound:6,rearCompression:1,rearRebound:3,rideHeightMm:0}};expected.crew={invitationSeen:true,completed:true,bestPlace:3,cleared:true,clearAcknowledged:false};
 const html='<!doctype html><div id="app"></div><script type="module">import {careerClient,BuildUI} from "/client.js";window.client=await careerClient();window.buildUI=new BuildUI(window.client,{open(){},previewNight(){},appearance(){}});window.buildUI.open();window.ready=true;</script>';
 const browser=await chromium.launch({headless:true});
 try{const context=await browser.newContext();await context.addInitScript(()=>{Object.defineProperty(window,'indexedDB',{configurable:true,get(){throw new DOMException('Test denies IndexedDB','SecurityError')}})});
 await context.route('http://career-handoff.test/**',route=>route.fulfill({contentType:route.request().url().endsWith('/client.js')?'text/javascript':'text/html',body:route.request().url().endsWith('/client.js')?source:html}));
 const page=await context.newPage();await page.goto('http://career-handoff.test/?scene=bay');await page.waitForFunction(()=>window.ready);
 await page.evaluate(state=>{window.name='twt-career-transfer:'+JSON.stringify({origin:location.origin,target:'/?scene=bay',previousName:'test-tab',state});location.reload()},expected);await page.waitForFunction(()=>window.ready&&window.client.state.credits===300);
 const check=async()=>{const actual=await page.evaluate(()=>({state:window.client.state,durable:window.client.durable,name:window.name,warning:document.querySelector('#career-storage').textContent}));assert.deepEqual(actual.state,expected);assert.equal(actual.durable,false);assert.equal(actual.name,'test-tab');assert.match(actual.warning,/Session only.*cannot be saved/)};
 await check();
 // navigate is the actual production client path, including a full same-origin page reload.
 await page.evaluate(()=>window.client.navigate('?scene=crew'));await page.waitForURL('**/?scene=crew');await page.waitForFunction(()=>window.ready);await check();
 await page.evaluate(()=>window.client.navigate('?scene=bay'));await page.waitForURL('**/?scene=bay');await page.waitForFunction(()=>window.ready);await check();
 // The production capture listener examines links. Prevent only navigation to inspect the envelope policy.
 for(const href of['https://outside.example/?scene=crew','/?scene=unsupported']){
  const name=await page.evaluate(href=>{window.name='unrelated-window-name';const a=document.createElement('a');a.href=href;a.addEventListener('click',e=>e.preventDefault());document.body.append(a);a.click();a.remove();return window.name},href);assert.equal(name,'unrelated-window-name');
 }
 const allowed=await page.evaluate(()=>{const a=document.createElement('a');a.href='/?scene=crew';a.addEventListener('click',e=>e.preventDefault());document.body.append(a);a.click();a.remove();return JSON.parse(window.name.slice('twt-career-transfer:'.length))});assert.equal(allowed.target,'/?scene=crew');assert.deepEqual(allowed.state,expected);assert.equal(allowed.previousName,'unrelated-window-name');await context.close();
 }finally{await browser.close()}
});


test('corrupt career recovery is actionable above the real preparation veil and preserves the stored record',async()=>{
 const root=process.cwd().replaceAll('\\','/'),temp=await mkdtemp(path.join(tmpdir(),'p05-career-recovery-')),entry=path.join(temp,'entry.ts');
 await writeFile(entry,`export {careerClient} from ${JSON.stringify(root+'/src/career/client.ts')}; export {preparationVeil} from ${JSON.stringify(root+'/src/presentation/prepare.ts')};`);
 let source;try{const bundle=await build({configFile:false,logLevel:'silent',build:{write:false,minify:false,lib:{entry,formats:['es'],fileName:'client'}}});source=(Array.isArray(bundle)?bundle[0]:bundle).output.find(x=>x.type==='chunk').code}finally{await rm(entry);await rmdir(temp)}
 const browser=await chromium.launch({headless:true});try{const context=await browser.newContext({viewport:{width:1280,height:720}});const raw={version:99,credits:1234,sentinel:'Do not overwrite this record'};
 const html='<!doctype html><div id="app"></div><script type="module">import {careerClient,preparationVeil} from "/client.js";const r=indexedDB.open("slingmods-twt-rebuild-career-v1",2);r.onupgradeneeded=()=>r.result.createObjectStore("career");r.onsuccess=()=>{const db=r.result,tx=db.transaction("career","readwrite");tx.objectStore("career").put('+JSON.stringify(raw)+',"current");tx.oncomplete=async()=>{db.close();window.veil=preparationVeil(document.querySelector("#app"));window.client=await careerClient();window.ready=true;}};</script>';
 await context.route('http://career-recovery.test/**',route=>route.fulfill({contentType:route.request().url().endsWith('/client.js')?'text/javascript':'text/html',body:route.request().url().endsWith('/client.js')?source:html}));const page=await context.newPage();await page.goto('http://career-recovery.test/');await page.waitForSelector('#career-recovery');
 const layer=await page.evaluate(()=>{const panel=document.querySelector('#career-recovery'),button=[...panel.querySelectorAll('button')].find(b=>b.textContent==='Play temporary career'),r=button.getBoundingClientRect();return {dialogZ:Number(getComputedStyle(panel).zIndex),veilZ:Number(getComputedStyle(window.veil).zIndex),receivesPointer:button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}});assert.ok(layer.dialogZ>layer.veilZ);assert.equal(layer.receivesPointer,true);
 await page.getByRole('button',{name:'Play temporary career'}).click();await page.waitForFunction(()=>window.ready);assert.equal(await page.evaluate(()=>window.client.durable),false);const stored=await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('slingmods-twt-rebuild-career-v1',2);r.onsuccess=()=>{const db=r.result,tx=db.transaction('career','readonly'),get=tx.objectStore('career').get('current');get.onsuccess=()=>resolve(get.result);tx.oncomplete=()=>db.close()};r.onerror=()=>reject(r.error)}));assert.deepEqual(stored,raw);await context.close();
 }finally{await browser.close()}
});
