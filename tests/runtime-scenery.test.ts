import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
test('every scenery derivative preserves the original binary geometry, hierarchy and material routing',()=>{
 const manifest=JSON.parse(fs.readFileSync('public/assets/runtime-scenery/manifest.json','utf8'));
 const allowed=new Set(JSON.parse(fs.readFileSync('demo-assets.json','utf8')).assets);
 assert.equal(manifest.entries.length,29);
 for(const entry of manifest.entries){
  const original=fs.readFileSync('public/'+entry.source),derived=fs.readFileSync('public/'+entry.output);
  assert.equal(sha(original),entry.sourceSHA256,entry.source+' stays unchanged');assert.equal(sha(derived),entry.sha256);
  const a=JSON.parse(original.subarray(20,20+original.readUInt32LE(12)).toString()),b=JSON.parse(derived.subarray(20,20+derived.readUInt32LE(12)).toString());
  assert.equal(sha(original.subarray(20+original.readUInt32LE(12))),entry.geometryPayloadSHA256);
  assert.equal(sha(derived.subarray(20+derived.readUInt32LE(12))),entry.geometryPayloadSHA256,'every vertex/index byte remains');
  for(const key of ['nodes','scenes','scene','meshes','accessors','bufferViews','buffers','skins','animations'])assert.deepEqual(b[key],a[key],entry.output+' '+key);
  assert.deepEqual(b.materials.map((m:any)=>m.name),a.materials.map((m:any)=>m.name),'runtime selects materials by these exact names');
  assert.equal(b.images,undefined);assert.equal(b.textures,undefined);
  assert.ok(allowed.has(entry.output));assert.ok(!allowed.has(entry.source),'unused source dependencies cannot ship');
 }
});
