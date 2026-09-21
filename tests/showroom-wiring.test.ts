import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
// The showroom module is one long top-level-await script, so declaration ORDER is behaviour:
// a `const` read before its line runs throws (temporal dead zone), even from inside a callback.
const source=readFileSync('src/signature/scene.ts','utf8');
test('keyboard buffer exists before any showroom UI callback can fire under the loading veil',()=>{
 const keyboard=source.indexOf('const keyboard=new KeyboardBuffer()'),ui=source.indexOf('new SignatureUI('),firstAwaitAfterUI=source.indexOf('await',ui);
 assert.ok(keyboard>0&&ui>0);assert.ok(keyboard<ui,'keyboard must be declared before the UI is constructed');assert.ok(keyboard<firstAwaitAfterUI);
});
test('undo is audible like every other build action',()=>{
 const undo=source.slice(source.indexOf("name==='undo'"),source.indexOf("name==='compare'"));assert.match(undo,/audio\.cue\('ui\.back'\)/);
});
test('showroom resize re-reads the monitor pixel ratio',()=>{
 const resize=source.slice(source.indexOf('function resize()'),source.indexOf('async function change'));assert.match(resize,/setPixelRatio\(Math\.min\(devicePixelRatio,GRAPHICS_PRESETS\[graphics\]\.pixelRatioCap\)\)/);assert.match(resize,/pipeline\.resize\(\)/);assert.match(source,/resolution:\$\{devicePixelRatio\}dppx/);
});
