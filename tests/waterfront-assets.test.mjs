import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const prefix='public/assets/showcase-quality/';
function glb(name){const bytes=fs.readFileSync(prefix+name);const length=bytes.readUInt32LE(12);return{bytes,json:JSON.parse(bytes.subarray(20,20+length)),binary:20+length+8}}

test('P06C road binds the nonmirrored source and an active varying COLOR_0',()=>{
 const {bytes,json:g,binary}=glb('foundation.glb');const road=g.materials.find(m=>m.name==='Quality_Dry_Asphalt');
 const image=g.images[g.textures[road.pbrMetallicRoughness.baseColorTexture.index].source],view=g.bufferViews[image.bufferView];
 const embedded=bytes.subarray(binary+(view.byteOffset??0),binary+(view.byteOffset??0)+view.byteLength);
 const expected=fs.readFileSync(prefix+'textures/p06c_asphalt_Diffuse.jpg');
 assert.equal(createHash('sha256').update(embedded).digest('hex'),createHash('sha256').update(expected).digest('hex'));
 const primitive=g.meshes.flatMap(m=>m.primitives).find(p=>g.materials[p.material]===road);assert.ok(primitive);
 assert.ok(primitive.attributes.COLOR_0!==undefined);assert.equal(primitive.attributes.COLOR_1,undefined);
 const accessor=g.accessors[primitive.attributes.COLOR_0],buffer=g.bufferViews[accessor.bufferView];
 const start=binary+(buffer.byteOffset??0)+(accessor.byteOffset??0),components=accessor.type==='VEC4'?4:3;
 const size={5121:1,5123:2,5126:4}[accessor.componentType];assert.ok(size);
 const read={5121:i=>bytes.readUInt8(i),5123:i=>bytes.readUInt16LE(i),5126:i=>bytes.readFloatLE(i)}[accessor.componentType];
 const values=Array.from({length:accessor.count},(_,i)=>read(start+i*(buffer.byteStride??components*size)));
 assert.ok(Math.max(...values)-Math.min(...values)>0,'Active tone must vary after export');
});

test('P06C palm pinnae export an actual double-sided alpha mask bound in every LOD',()=>{
 const {bytes,json:g,binary}=glb('kit.glb');const leaves=g.materials.find(m=>m.name==='P06C_Palm_Frond');assert.ok(leaves);
 assert.equal(leaves.alphaMode,'MASK');assert.ok(Math.abs(leaves.alphaCutoff-.35)<1e-6);assert.equal(leaves.doubleSided,true);
 const image=g.images[g.textures[leaves.pbrMetallicRoughness.baseColorTexture.index].source];assert.ok(image.bufferView!==undefined);assert.equal(image.mimeType,'image/png');
 const view=g.bufferViews[image.bufferView],embedded=bytes.subarray(binary+(view.byteOffset??0),binary+(view.byteOffset??0)+view.byteLength);
 assert.equal(createHash('sha256').update(embedded).digest('hex'),createHash('sha256').update(fs.readFileSync(prefix+'textures/p06c-frond.png')).digest('hex'),'Actual embedded mask must be the authored pinna bake');
 const layout=JSON.parse(fs.readFileSync(prefix+'scene-layout.json'));
 assert.ok(layout.waterfrontEnsembles.length>=5);assert.equal(layout.version,'P06C-built-waterfront-1');
 assert.ok(layout.instances.some(p=>p.module==='waterfrontYards'));
 for(const p of layout.waterfrontEnsembles){assert.equal(p.footprint.length,4);assert.ok(p.minimumRouteDistance>12.5)}
 // The authored three levels retain the same leaf material, roots and named modules.
 for(const kind of ['palm0','palm1','palm2'])for(const module of layout.lod[kind]){
  const nodes=g.nodes.filter(n=>n.name?.startsWith('kit_'+module+'__'));
  assert.ok(nodes.some(n=>g.meshes[n.mesh].primitives.some(p=>g.materials[p.material]===leaves)),module);
 }
});
