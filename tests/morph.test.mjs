import test from 'node:test';import assert from 'node:assert/strict';import {build} from 'vite';import {chromium} from '@playwright/test';
// src/game/morph.ts patches the showroom panel in place so clicks animate instead of rebuilding every element.
test('morph keeps element identity, focus and typed values; animates only what entered or switched on',async()=>{
 const r=await build({configFile:false,logLevel:'silent',build:{write:false,minify:false,lib:{entry:process.cwd().replaceAll('\\','/')+'/src/game/morph.ts',formats:['es']}}});
 const js=(Array.isArray(r)?r[0]:r).output.find(x=>x.type==='chunk').code;
 const b=await chromium.launch({headless:true}),p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));try{
  await p.route('http://127.0.0.1:42974/**',q=>q.fulfill({contentType:q.request().url().endsWith('m.js')?'text/javascript':'text/html',body:q.request().url().endsWith('m.js')?js:`<!doctype html><div id="root"></div><script type="module">import{morph}from'/m.js';window.morph=morph;window.ready=true</script>`}));
  await p.goto('http://127.0.0.1:42974/');await p.waitForFunction(()=>window.ready);
  const view=(category,pressed,name='')=>`<nav><button aria-pressed="${pressed==='a'}">A</button><button aria-pressed="${pressed==='b'}">B</button></nav><aside data-motion-key="${category}"><h2>${category}</h2></aside><footer><input id="name" value="${name}"><span>${category}</span></footer>`;
  const result=await p.evaluate(([first,swap,press,reduced])=>{
   const root=document.querySelector('#root');morph(root,first);
   const nav=root.querySelector('nav'),footer=root.querySelector('footer'),input=root.querySelector('#name'),aside=root.querySelector('aside');
   const initialMarks=root.querySelectorAll('[data-enter],[data-pop]').length;
   input.focus();input.value='My build';
   morph(root,swap);
   const afterSwap={nav:root.querySelector('nav')===nav,footer:root.querySelector('footer')===footer,input:root.querySelector('#name')===input,typed:input.value,focused:document.activeElement===input,
    asideReplaced:root.querySelector('aside')!==aside,asides:root.querySelectorAll('aside').length,asideEnters:root.querySelector('aside').hasAttribute('data-enter'),footerText:footer.querySelector('span').textContent};
   morph(root,press);
   const pops=[...root.querySelectorAll('nav button')].map(x=>x.hasAttribute('data-pop'));
   morph(root,swap);const keepsMarks=root.querySelector('aside').hasAttribute('data-enter');
   const quiet=document.createElement('div');morph(quiet,first);morph(quiet,reduced,true);
   return {initialMarks,afterSwap,pops,keepsMarks,reducedMarks:quiet.querySelectorAll('[data-enter],[data-pop]').length,reducedPressed:quiet.querySelector('nav button:last-child').getAttribute('aria-pressed')};
  },[view('Paint','a'),view('Suspension','a'),view('Suspension','b'),view('Aero','b')]);
  assert.equal(result.initialMarks,0,'first draw is a plain render with no one-shot animations');
  assert.deepEqual(result.afterSwap,{nav:true,footer:true,input:true,typed:'My build',focused:true,asideReplaced:true,asides:1,asideEnters:true,footerText:'Suspension'});
  assert.deepEqual(result.pops,[false,true],'only the control that switched on pops');
  assert.equal(result.keepsMarks,true,'a following morph does not cut an entrance short');
  assert.equal(result.reducedMarks,0,'reduced motion: no entrance or pop markers');
  assert.equal(result.reducedPressed,'true','reduced motion still updates state');
  assert.deepEqual(errors,[]);
 }finally{await b.close()}
});
