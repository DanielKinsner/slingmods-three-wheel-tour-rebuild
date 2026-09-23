import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const load=(file:string)=>{const b=readFileSync(file);assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(8),b.length);const j=b.readUInt32LE(12);return {g:JSON.parse(b.subarray(20,20+j).toString()),bin:b.subarray(28+j)}};
test('complete Ryker contains reversible stock parts and nine independent Elka motion groups',()=>{
 const {g}=load('public/assets/ryker/complete/ryker-900-complete.glb');const named=new Map(g.nodes.map((n:any)=>[n.name,n]));
 for(const name of ['stock_ryker_body','stock_ryker_exhaust','stock_ryker_shocks','stock_ryker_shocks_rear','retained_front_links','retained_rear_mechanical','ryker_mod_body','ryker_mod_exhaust','ryker_mod_shocks'])assert.ok(named.has(name),name);
 for(const replaced of ['body_panels','front_suspension','rear_mechanical'])assert.equal(named.has(replaced),false,'duplicate source geometry must be pruned');
 const moving=g.nodes.filter((n:any)=>n.name.startsWith('Elka_')&&n.extras?.rykerMotion);assert.equal(moving.length,9);
 for(let channel=0;channel<3;channel++)assert.deepEqual(moving.filter((n:any)=>n.extras.rykerMotion.channel===channel).map((n:any)=>n.extras.rykerMotion.part).sort(),['body','shaft','spring']);
});
test('every final Ryker and wall mesh has finite positions and in-bounds accessor buffers',()=>{
 for(const file of ['ryker-900-complete.glb','ryker-accessories.glb','ryker-underglow.glb','showroom-route-relief.glb']){const {g,bin}=load('public/assets/ryker/complete/'+file);
  for(const node of g.nodes){if(node.mesh!==undefined)assert.ok(g.meshes[node.mesh]);for(const child of node.children??[])assert.ok(g.nodes[child])}
  for(const mesh of g.meshes)for(const primitive of mesh.primitives){const ac=g.accessors[primitive.attributes.POSITION],view=g.bufferViews[ac.bufferView];assert.equal(ac.componentType,5126);assert.equal(ac.type,'VEC3');assert.ok((view.byteOffset??0)+view.byteLength<=bin.length);const stride=view.byteStride??12,start=(view.byteOffset??0)+(ac.byteOffset??0);for(let i=0;i<ac.count;i++)for(let axis=0;axis<3;axis++)assert.ok(Number.isFinite(bin.readFloatLE(start+i*stride+axis*4)),file)}
 }
});
