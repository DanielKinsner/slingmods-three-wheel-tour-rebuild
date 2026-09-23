/** Structural/packaging audit of every shipped GLB and KTX2. Visual quality and licence approval remain separate. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const validator=require(process.env.GLTF_VALIDATOR?path.resolve(process.env.GLTF_VALIDATOR):'gltf-validator');
const out=process.env.EVIDENCE_DIR||'.tools/runtime-asset-audit';await fs.mkdir(out,{recursive:true});
const allow=JSON.parse(await fs.readFile('demo-assets.json','utf8')),files=new Set([...allow.assets,...allow.notices]);
const report={method:'Read-only audit of the exact curated runtime allowlist. Khronos glTF validator, dependency closure, KTX2 bounds/mips, SHA-256 and mesh budgets. Warnings are retained. Does not certify appearance, product fitment or marketplace licence terms.',models:[],textures:[],errors:[],lodWarnings:[]};
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const file of files){
 if(/\.(blend\d*|fbx|obj|mtl|rar|zip|psd)$/i.test(file)||/male-biker-rigged|local-handoffs/.test(file))report.errors.push('Editable/purchased source in runtime package: '+file);
 const location=path.resolve('public',file);
 if(!location.startsWith(path.resolve('public')+path.sep)){report.errors.push('Path outside public: '+file);continue;}
 try{await fs.access(location);}catch{report.errors.push('Missing runtime file: '+file);continue;}
 if(!/\.(glb|ktx2)$/.test(file))continue;
 const data=await fs.readFile(location);
 if(file.endsWith('.glb')){
  const validation=await validator.validateBytes(new Uint8Array(data),{uri:file,maxIssues:0,externalResourceFunction:async uri=>{
   const dependency=path.posix.normalize(path.posix.join(path.posix.dirname(file),decodeURIComponent(uri)));
   if(!files.has(dependency))throw Error('Dependency not shipped: '+dependency);
   return new Uint8Array(await fs.readFile(path.join('public',dependency)));
  }});
  const g=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
  const primitives=(g.meshes??[]).flatMap(m=>m.primitives),triangles=primitives.reduce((sum,p)=>sum+((p.mode??4)===4?g.accessors[p.indices??p.attributes.POSITION].count/3:0),0);
  const row={file,bytes:data.length,sha256:sha(data),triangles,meshPrimitives:primitives.length,materials:g.materials?.length??0,images:g.images?.length??0,errors:validation.issues.numErrors,warnings:validation.issues.numWarnings,issues:validation.issues.messages};
  report.models.push(row);if(row.errors)report.errors.push(file+': '+row.errors+' glTF errors');
 }else{
  const magic=Buffer.from([0xab,0x4b,0x54,0x58,0x20,0x32,0x30,0xbb,0x0d,0x0a,0x1a,0x0a]);
  if(data.length<80||!data.subarray(0,12).equals(magic)){report.errors.push('Invalid KTX2: '+file);continue;}
  const width=data.readUInt32LE(20),height=data.readUInt32LE(24),levels=data.readUInt32LE(40),expected=1+Math.floor(Math.log2(Math.max(width,height)));
  let valid=width>0&&height>0&&levels>0&&80+levels*24<=data.length;
  if(valid)for(let i=0;i<levels;i++){const start=Number(data.readBigUInt64LE(80+i*24)),bytes=Number(data.readBigUInt64LE(88+i*24));valid&&=start>=80+levels*24&&bytes>0&&start+bytes<=data.length;}
  report.textures.push({file,bytes:data.length,sha256:sha(data),width,height,levels,completeMipChain:levels===expected,valid});
  if(!valid)report.errors.push('Invalid mip bounds: '+file);
 }
}
for(const model of report.models){
 if(!/-lod0\.glb$/.test(model.file))continue;
 const family=[0,1,2].map(level=>report.models.find(m=>m.file===model.file.replace('-lod0.glb',`-lod${level}.glb`)));
 if(family.some(x=>!x))report.lodWarnings.push({file:model.file,issue:'Not all three LODs are packaged'});
 else if(family[0].triangles===family[2].triangles)report.lodWarnings.push({file:model.file,issue:'LOD2 does not reduce triangle count',triangles:family.map(m=>m.triangles)});
}
report.summary={packagedFiles:files.size,glbs:report.models.length,ktx2s:report.textures.length,errors:report.errors.length,gltfWarnings:report.models.reduce((n,m)=>n+m.warnings,0),incompleteMipChains:report.textures.filter(t=>!t.completeMipChain).length,lodWarnings:report.lodWarnings.length};
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({...report.summary,largestModels:[...report.models].sort((a,b)=>b.triangles-a.triangles).slice(0,8).map(({file,triangles,bytes})=>({file,triangles,bytes})),report:path.join(out,'report.json')},null,2));
if(report.errors.length)process.exitCode=1;
