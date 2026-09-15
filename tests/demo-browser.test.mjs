import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'vite';
import {chromium} from '@playwright/test';
import {mkdtemp,writeFile,rm,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

test('real browser demo reload, second tab, mode switch and reset preserve career and settings',async()=>{
 const root=process.cwd().replaceAll('\\','/'),temp=await mkdtemp(path.join(tmpdir(),'p07a-demo-')),entry=path.join(temp,'entry.ts');
 await writeFile(entry,`export {careerClient} from ${JSON.stringify(root+'/src/career/client.ts')};export {freshSave,browserStorage,writeSave,loadSave} from ${JSON.stringify(root+'/src/save.ts')};export {resetDemo,visitorSearch} from ${JSON.stringify(root+'/src/demo/profile.ts')};`);
 let source;try{const bundle=await build({configFile:false,mode:'demo',logLevel:'silent',build:{write:false,minify:false,lib:{entry,formats:['es'],fileName:'client'}}});source=(Array.isArray(bundle)?bundle[0]:bundle).output.find(x=>x.type==='chunk').code}finally{await rm(entry);await rmdir(temp)}
 const html=`<!doctype html><div id="app"></div><a id="next" href="?scene=crew">Next</a><a id="career" href="?scene=bay&play=career">Career</a><script type="module">import * as api from '/client.js';window.api=api;const canonical=api.visitorSearch(location.search);history.replaceState(null,'',location.pathname+(canonical?'?'+canonical:''));window.client=await api.careerClient();window.ready=true;</script>`;
 const browser=await chromium.launch({headless:true});try{const context=await browser.newContext();await context.route('http://demo.test/**',route=>route.fulfill({contentType:route.request().url().endsWith('/client.js')?'text/javascript':'text/html',body:route.request().url().endsWith('/client.js')?source:html}));
 const page=await context.newPage();await page.goto('http://demo.test/?scene=bay&play=career');await page.waitForFunction(()=>window.ready);
 await page.evaluate(async()=>{await window.client.execute({type:'entry'});const save=window.api.freshSave();save.settings.volume=.37;window.api.writeSave(window.api.browserStorage(),save)});
 const personal=await page.evaluate(()=>({career:window.client.state,settings:localStorage.getItem('slingmods-twt-rebuild-v1')}));
 await page.goto('http://demo.test/?scene=bay&play=demo');await page.waitForFunction(()=>window.ready);await page.evaluate(async()=>{await window.client.execute({type:'equip',equipped:false});const save=window.api.freshSave();save.settings.mute=true;save.records.demo={timeMs:100,recordedAt:'2026-09-15'};window.api.writeSave(window.api.browserStorage(),save)});
 await page.click('#next');await page.waitForURL('**/?scene=crew&play=demo');await page.waitForFunction(()=>window.ready);assert.equal(await page.evaluate(()=>window.client.state.equipped),false);await page.reload();await page.waitForFunction(()=>window.ready);assert.equal(await page.evaluate(()=>window.api.loadSave(window.api.browserStorage()).settings.mute),true);
 // Readable but stale persistence must not beat the newer in-memory navigation envelope.
 await page.evaluate(async()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(this===sessionStorage&&key==='slingmods-twt-demo-v1:career')throw new DOMException('Write denied','QuotaExceededError');return original.call(this,key,value)};await window.client.execute({type:'equip',equipped:true});window.client.navigate('?scene=bay')});await page.waitForURL('**/?scene=bay&play=demo');await page.waitForFunction(()=>window.ready);assert.equal(await page.evaluate(()=>window.client.state.equipped),true);
 const second=await context.newPage();await second.goto('http://demo.test/?scene=bay&play=demo');await second.waitForFunction(()=>window.ready);assert.equal(await second.evaluate(()=>window.client.state.equipped),true);
 await page.evaluate(()=>window.api.resetDemo(sessionStorage));await page.reload();await page.waitForFunction(()=>window.ready);assert.equal(await page.evaluate(()=>window.client.state.equipped),true);assert.deepEqual(await page.evaluate(()=>window.api.loadSave(window.api.browserStorage()).records),{});
 await page.click('#career');await page.waitForURL('**/?scene=bay&play=career');await page.waitForFunction(()=>window.ready);assert.deepEqual(await page.evaluate(()=>({career:window.client.state,settings:localStorage.getItem('slingmods-twt-rebuild-v1')})),personal);
 // Denied persistence still transfers only within the explicit profile. New tabs have no fallback career imports.
 const denied=await browser.newContext();await denied.addInitScript(()=>{for(const key of ['indexedDB','sessionStorage','localStorage'])Object.defineProperty(window,key,{configurable:true,get(){throw new DOMException('Denied','SecurityError')}})});await denied.route('http://demo.test/**',route=>route.fulfill({contentType:route.request().url().endsWith('/client.js')?'text/javascript':'text/html',body:route.request().url().endsWith('/client.js')?source:html}));
 const fallback=await denied.newPage();await fallback.goto('http://demo.test/?scene=bay&play=demo');await fallback.waitForFunction(()=>window.ready);await fallback.evaluate(()=>window.client.execute({type:'equip',equipped:false}));await fallback.click('#next');await fallback.waitForURL('**/?scene=crew&play=demo');await fallback.waitForFunction(()=>window.ready);assert.equal(await fallback.evaluate(()=>window.client.state.equipped),false);
 await fallback.evaluate(()=>window.client.navigate('?scene=harbor&preset=night'));await fallback.waitForURL('**/?scene=harbor&play=demo&preset=night');await fallback.waitForFunction(()=>window.ready);assert.equal(await fallback.evaluate(()=>window.client.state.equipped),false);
 await fallback.click('#career');await fallback.waitForURL('**/?scene=bay&play=career');await fallback.waitForFunction(()=>window.ready);assert.equal(await fallback.evaluate(()=>window.client.state.owned),false);assert.equal(await fallback.evaluate(()=>window.client.state.chapters.firstCompletion),false);
 await denied.close();await context.close();
 }finally{await browser.close()}
});
