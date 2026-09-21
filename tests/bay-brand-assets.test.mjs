import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{createHash}from'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
function glb(path){const bytes=fs.readFileSync(path);const length=bytes.readUInt32LE(12),j=JSON.parse(bytes.subarray(20,20+length).toString()),bin=bytes.subarray(28+length);return{j,view:i=>{const v=j.bufferViews[i];return bin.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength)}}}
function signature(g,node){const{j}=g;const accessor=i=>{const a=j.accessors[i],v=j.bufferViews[a.bufferView];return{...a,bufferView:sha(g.view(a.bufferView)),byteStride:v.byteStride}};const texture=i=>{const t=j.textures[i];return{image:sha(g.view(j.images[t.source].bufferView)),sampler:j.samplers?.[t.sampler]}};const material=(v,k='')=>Array.isArray(v)?v.map(x=>material(x)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([n,x])=>[n,n==='index'&&k.endsWith('Texture')?texture(x):material(x,n)])):v;return{...node,mesh:{...j.meshes[node.mesh],primitives:j.meshes[node.mesh].primitives.map(p=>({...p,indices:accessor(p.indices),attributes:Object.fromEntries(Object.entries(p.attributes).map(([k,v])=>[k,accessor(v)])),material:material(j.materials[p.material])}))}}}
test('garage-only GLB retains every original bay node, transform, primitive, image and material',()=>{
 const source=glb('public/assets/showcase-quality/kit.glb'),bay=glb('public/assets/showcase-quality/bay.glb');const original=source.j.nodes.filter(n=>n.name?.startsWith('kit_bay__'));
 assert.equal(original.length,9);assert.equal(bay.j.nodes.length,9);assert.ok(fs.statSync('public/assets/showcase-quality/bay.glb').size<8_000_000);
 for(const n of original){const actual=bay.j.nodes.find(v=>v.name===n.name);assert.ok(actual,n.name);assert.deepEqual(signature(bay,actual),signature(source,n))}
 assert.deepEqual(bay.j.scenes[0].nodes,[0,1,2,3,4,5,6,7,8]);
});
test('official artwork is preserved in the Blender sign export with bounded scene placements',()=>{
 const logo=fs.readFileSync('public/assets/brand/slingmods-logo-main.png'),source=JSON.parse(fs.readFileSync('public/assets/brand/slingmods-logo-main.source.json')),g=glb('public/assets/brand/slingmods-sign.glb'),layout=JSON.parse(fs.readFileSync('public/assets/brand/sign-layout.json'));
 // The 360 px interface logo stays exactly as retrieved; 3D signs carry the owner-supplied wide wordmark, byte for byte.
 const wide=fs.readFileSync('public/assets/brand/slingmods-logo-wide.png'),wideSource=JSON.parse(fs.readFileSync('public/assets/brand/slingmods-logo-wide.source.json'));
 assert.equal(sha(logo),source.sha256);assert.equal(sha(wide),wideSource.runtime.sha256);assert.equal(sha(fs.readFileSync(wideSource.original.file)),wideSource.original.sha256);assert.equal(layout.sourceImageSHA256,wideSource.runtime.sha256);assert.ok(g.j.images.some(image=>sha(g.view(image.bufferView))===wideSource.runtime.sha256));
 assert.equal(layout.placements.length,4);assert.equal(layout.placements.filter(p=>p.scene==='bay').length,1);assert.equal(layout.placements.filter(p=>p.scene==='harbor').length,3);assert.equal(layout.aspectRatio,wide.readUInt32BE(16)/wide.readUInt32BE(20));assert.equal(g.j.meshes[0].primitives.length,1);
});
