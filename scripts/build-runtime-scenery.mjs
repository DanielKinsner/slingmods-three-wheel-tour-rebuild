/** Derived geometry-only GLBs for scenery whose materials are supplied by the shared KTX2 runtime.
 * Original P11 exports are immutable; every vertex/index byte, transform, name and material factor is preserved.
 */
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
let listText=await fs.readFile('demo-assets.json','utf8');
const list=JSON.parse(listText),root='assets/runtime-scenery/';
const sources=[...new Set(list.assets.filter(p=>/\.glb$/.test(p)&&(/assets\/p11\/(trackside-props|ridge-trees|ground-cover)\//.test(p)||p.startsWith(root))).map(p=>p.replace(root,'assets/p11/')))];
const sha=b=>createHash('sha256').update(b).digest('hex'),entries=[];
for(const source of sources){
 const bytes=await fs.readFile('public/'+source),jsonBytes=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+jsonBytes));
 const payload=bytes.subarray(20+jsonBytes); // Preserve every remaining GLB chunk byte-for-byte, including alignment.
 const output=source.replace('assets/p11/',root),removedImages=g.images?.length??0;
 for(const material of g.materials??[]){
  for(const key of ['normalTexture','occlusionTexture','emissiveTexture'])delete material[key];
  for(const key of ['baseColorTexture','metallicRoughnessTexture'])if(material.pbrMetallicRoughness)delete material.pbrMetallicRoughness[key];
  for(const extension of Object.values(material.extensions??{}))for(const key of Object.keys(extension))if(key.endsWith('Texture'))delete extension[key];
 }
 delete g.images;delete g.textures;delete g.samplers;
 for(const key of ['extensionsUsed','extensionsRequired'])if(g[key]){g[key]=g[key].filter(e=>!['KHR_texture_transform','KHR_texture_basisu','EXT_texture_webp'].includes(e));if(!g[key].length)delete g[key];}
 const raw=Buffer.from(JSON.stringify(g)),json=Buffer.alloc(Math.ceil(raw.length/4)*4,0x20);raw.copy(json);
 const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(20+json.length+payload.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);
 const result=Buffer.concat([header,json,payload]);await fs.mkdir(path.dirname('public/'+output),{recursive:true});await fs.writeFile('public/'+output,result);
 entries.push({source,sourceSHA256:sha(bytes),output,sha256:sha(result),bytes:result.length,sourceBytes:bytes.length,removedImages,geometryPayloadSHA256:sha(payload)});
 listText=listText.replaceAll(JSON.stringify(source),JSON.stringify(output));
}
const manifest={version:1,method:'Geometry-only derivatives. Original P11 files unchanged; all binary payload bytes preserved. Material names/scalars remain for explicit shared KTX2 bindings in trackside.ts and ridge/forest.ts. No source-image placeholder loads.',entries};
await fs.mkdir('public/'+root,{recursive:true});await fs.writeFile('public/'+root+'manifest.json',JSON.stringify(manifest,null,2)+'\n');
if(!list.assets.includes(root+'manifest.json'))listText=listText.replace(/("assets":\s*\[[\s\S]*?)(\r?\n\s*\],)/,(_,head,tail)=>head+','+tail.match(/^\r?\n/)[0]+'    "'+root+'manifest.json"'+tail);
await fs.writeFile('demo-assets.json',listText);
console.log(JSON.stringify({models:entries.length,removedImageBindings:entries.reduce((n,e)=>n+e.removedImages,0),bytesSaved:entries.reduce((n,e)=>n+e.sourceBytes-e.bytes,0)}));
