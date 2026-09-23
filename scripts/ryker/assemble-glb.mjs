/** Lossless GLB composition. Copies original accessor/bufferView bytes, prunes replaced meshes.
 * Purchased baseline remains untouched. Re-run after build-mods.py.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
function parse(b){const len=b.readUInt32LE(12);return {json:JSON.parse(b.subarray(20,20+len)),bin:b.subarray(28+len)}}
const baseBytes=await readFile('public/assets/ryker/ryker-900.glb'),partsBytes=await readFile('public/assets/ryker/complete/ryker-accessories.glb');
const a=parse(baseBytes),b=parse(partsBytes),g=a.json,add=b.json,offsets=Object.fromEntries(['nodes','meshes','materials','accessors','bufferViews'].map(k=>[k,(g[k]??[]).length]));
for(const n of add.nodes){if(n.mesh!==undefined)n.mesh+=offsets.meshes;if(n.children)n.children=n.children.map(i=>i+offsets.nodes)}
for(const m of add.meshes)for(const p of m.primitives){for(const k in p.attributes)p.attributes[k]+=offsets.accessors;if(p.indices!==undefined)p.indices+=offsets.accessors;if(p.material!==undefined)p.material+=offsets.materials}
for(const ac of add.accessors)if(ac.bufferView!==undefined)ac.bufferView+=offsets.bufferViews;
const binary=Buffer.concat([a.bin,b.bin]);for(const v of add.bufferViews){v.buffer=0;v.byteOffset=(v.byteOffset??0)+a.bin.length}
const removed=new Set(g.nodes.flatMap((n,i)=>['body_panels','front_suspension','rear_mechanical'].includes(n.name)?[i]:[]));
for(const n of g.nodes)if(n.children)n.children=n.children.filter(i=>!removed.has(i));
for(const k of Object.keys(offsets))g[k]=[...(g[k]??[]),...(add[k]??[])];
g.scenes[g.scene??0].nodes.push(...add.scenes[add.scene??0].nodes.map(i=>i+offsets.nodes));
const live=new Set();function visit(i){if(live.has(i))return;live.add(i);for(const child of g.nodes[i].children??[])visit(child)}g.scenes[g.scene??0].nodes.forEach(visit);
const maps={};function compact(key,indices){const ids=[...new Set(indices)].sort((a,b)=>a-b);maps[key]=new Map(ids.map((old,i)=>[old,i]));g[key]=ids.map(i=>g[key][i])}
compact('nodes',[...live]);for(const n of g.nodes)if(n.children)n.children=n.children.map(i=>maps.nodes.get(i));for(const s of g.scenes)s.nodes=s.nodes.filter(i=>live.has(i)).map(i=>maps.nodes.get(i));
compact('meshes',g.nodes.flatMap(n=>n.mesh===undefined?[]:[n.mesh]));for(const n of g.nodes)if(n.mesh!==undefined)n.mesh=maps.meshes.get(n.mesh);
compact('accessors',g.meshes.flatMap(m=>m.primitives.flatMap(p=>[...Object.values(p.attributes),...(p.indices===undefined?[]:[p.indices])])));for(const m of g.meshes)for(const p of m.primitives){for(const k in p.attributes)p.attributes[k]=maps.accessors.get(p.attributes[k]);if(p.indices!==undefined)p.indices=maps.accessors.get(p.indices)}
compact('bufferViews',g.accessors.flatMap(ac=>ac.bufferView===undefined?[]:[ac.bufferView]));for(const ac of g.accessors)if(ac.bufferView!==undefined)ac.bufferView=maps.bufferViews.get(ac.bufferView);
let size=0;const chunks=[];for(const v of g.bufferViews){const bytes=binary.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength);v.byteOffset=size;chunks.push(bytes);size+=bytes.length;const pad=(4-size%4)%4;if(pad){chunks.push(Buffer.alloc(pad));size+=pad}}
const bin=Buffer.concat(chunks);g.buffers=[{byteLength:bin.length}];g.asset.generator='Ryker lossless assembled vehicle v1';g.asset.extras={sourceSHA256:createHash('sha256').update(baseBytes).digest('hex'),method:'Exact buffer copies; replaced source primitives pruned; stock reconstruction and all accessory motion groups present before presenters bind.'};
const json=Buffer.from(JSON.stringify(g)),padding=(4-json.length%4)%4,j=Buffer.concat([json,Buffer.alloc(padding,32)]),header=Buffer.alloc(20),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+j.length+bin.length,8);header.writeUInt32LE(j.length,12);header.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);
await writeFile('public/assets/ryker/complete/ryker-900-complete.glb',Buffer.concat([header,j,bh,bin]));
await writeFile('assets/ryker/evidence/complete/assembly.json',JSON.stringify({sourceBytes:baseBytes.length,partsBytes:partsBytes.length,assembledBytes:28+j.length+bin.length,savedBytes:baseBytes.length+partsBytes.length-(28+j.length+bin.length),replaced:['body_panels','front_suspension','rear_mechanical'],method:g.asset.extras},null,2));console.log({assembledBytes:28+j.length+bin.length});
