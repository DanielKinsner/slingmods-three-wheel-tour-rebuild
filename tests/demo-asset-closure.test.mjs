import {forestGLTFURL} from '../src/ridge/forest-assets.ts';
import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{createHash}from'node:crypto';
test('static demo contains every retained and current audio-bank dependency with original bytes',()=>{const list=JSON.parse(fs.readFileSync('demo-assets.json','utf8'));for(const version of ['p03b2','p09b','p09b-cues','p09b-departure']){const base='assets/audio/'+version+'/',bank=JSON.parse(fs.readFileSync('public/'+base+'provenance.json','utf8'));assert.ok(list.assets.includes(base+'provenance.json'));for(const f of bank.files){const p=base+f.file;assert.ok(list.assets.includes(p),p);assert.equal(createHash('sha256').update(fs.readFileSync('public/'+p)).digest('hex'),f.sha256)}}});
test('allowlisted GLBs have no omitted external buffers or images',()=>{const list=JSON.parse(fs.readFileSync('demo-assets.json','utf8'));for(const p of list.assets.filter(p=>p.endsWith('.glb'))){const b=fs.readFileSync('public/'+p),n=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+n).toString());for(const item of [...g.buffers??[],...g.images??[]]){
  // P11 trackside GLBs name their shared 15-25 MB PNG masters. The runtime never requests those: it answers them with one
  // pixel and binds the allowlisted KTX2 trim/chain-link instead (src/presentation/trackside.ts), so they are deliberately
  // not shipped. Buffers, and every other GLB, must still be fully self-contained.
  const p11Master=p.startsWith('assets/p11/trackside-props/')&&g.images?.includes(item)&&/^\.\.\/shared-textures\/[0-9a-f]{64}\.png$/.test(item.uri??'');
  if(p11Master){for(const n of['trim-baseColor','trim-normal','trim-ORM','chain-link'])assert.ok(list.assets.includes('assets/p11/trackside-props/'+n+'.ktx2'),n+' replacement must ship');continue}
  // Forest geometry also substitutes every source material with the compressed kit. Verify the exact URL resolver
  // used by its GLTFLoader and all replacement maps; browser package tests reject any source PNG request.
  const forest=/^assets\/p11\/(ridge-trees\/(oak|sycamore)-lod[012]|ground-cover\/rock-[01]-lod1)\.glb$/.exec(p);
  if(forest&&g.images?.includes(item)&&/^\.\.\/shared-textures\/[0-9a-f]{64}\.png$/.test(item.uri??'')){
   assert.ok(forestGLTFURL(item.uri).startsWith('data:image/png;'));
   const maps=forest[2]?['bark-baseColor','bark-normal','leaves-baseColor','imposter-baseColor'].map(n=>'assets/p11/ridge-trees/'+forest[2]+'-'+n+'.ktx2'):['rocks-baseColor','rocks-normal'].map(n=>'assets/p11/ground-cover/'+n+'.ktx2');
   for(const map of maps)assert.ok(list.assets.includes(map),map+' replacement must ship');continue;
  }
  assert.ok(!item.uri||item.uri.startsWith('data:'),p+' has external dependency '+item.uri)}}});
