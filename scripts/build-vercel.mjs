/** Stable Vercel output from the existing hashed, allowlisted publication stage. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {stagePublish,sha} from './stage-publish.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
execFileSync(process.execPath,['scripts/build-demo.mjs'],{cwd:root,stdio:'inherit'});
const stage=await stagePublish(root),output=path.resolve(root,'vercel-dist');
// Only this generated immediate child may be replaced. Never follow a linked output.
if(path.dirname(output)!==path.resolve(root)||path.basename(output)!=='vercel-dist')throw Error('Unexpected output directory');
try{if((await fs.lstat(output)).isSymbolicLink())throw Error('Linked output refused')}catch(e){if(e.code!=='ENOENT')throw e}
await fs.rm(output,{recursive:true,force:true});await fs.mkdir(output);
const files={};
for(const[name,expected]of Object.entries(stage.files)){
 if(name==='_headers')continue; // Netlify metadata is replaced by checked-in Vercel headers.
 const bytes=await fs.readFile(path.join(root,stage.output,name));
 if(sha(bytes)!==expected.sha256||bytes.length!==expected.bytes)throw Error('Stage changed: '+name);
 const destination=path.resolve(output,name);
 if(!destination.startsWith(output+path.sep))throw Error('Unsafe output path');
 await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,bytes);files[name]=expected;
}
const receipt={commit:stage.commit,buildRef:stage.buildRef,output:'vercel-dist',sourceStage:stage.output,files,method:'Existing curated demo build and validated publication stage; stable output directory; no SPA catch-all. Provider headers in vercel.json. Source/evidence/ZIPs/editor assets are excluded.'};
await fs.writeFile(path.join(root,'vercel-current.json'),JSON.stringify(receipt,null,2));
console.log(JSON.stringify({output:'vercel-dist',commit:stage.commit,buildRef:stage.buildRef,files:Object.keys(files).length},null,2));
