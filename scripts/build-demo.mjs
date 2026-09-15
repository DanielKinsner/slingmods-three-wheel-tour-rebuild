import {build} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));process.chdir(root);
const hash=b=>createHash('sha256').update(b).digest('hex');
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const dirty=execFileSync('git',['diff','--name-only','HEAD'],{encoding:'utf8'}).trim().length>0;
const buildRef=commit.slice(0,12)+(dirty?'-working':'');
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const output=path.join('demo-dist',stamp+'-'+buildRef);await fs.mkdir(output,{recursive:true});
const list=JSON.parse(await fs.readFile('demo-assets.json','utf8'));
const selected=['index.html','package.json','package-lock.json','tsconfig.json','vite.config.ts','demo-assets.json'];
async function walk(dir){const result=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())result.push(...await walk(p));else result.push(p)}return result}
selected.push(...await walk('src'),...await walk('tests'),...list.assets.map(n=>'public/'+n),...list.notices.map(n=>'public/'+n));
const inputs=Object.fromEntries(await Promise.all(selected.sort().map(async n=>[n,hash(await fs.readFile(n))])));
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','--noEmit'],{stdio:'inherit'});
await build({mode:'demo',publicDir:false,define:{__BUILD_REF__:JSON.stringify(buildRef)},build:{outDir:output,emptyOutDir:false,sourcemap:false,manifest:true}});
for(const n of [...list.assets,...list.notices]){
 if(path.isAbsolute(n)||n.split('/').includes('..')||!n.startsWith('assets/'))throw Error('Unsafe allowlist asset');
 const dest=path.join(output,n);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(path.join('public',n),dest);
}
const notices=['SlingMods: Three-Wheel Tour — local development candidate. No public deployment authorization implied.','SlingMods artwork is proprietary, retained unchanged under the explicitly authorized local P07A branding scope. See assets/brand/slingmods-logo-main.source.json.','Authored game models and code remain project-owned. Photo/HDR source records and CC0 notices: assets/showcase-quality/source-manifest.json.'];
for(const dep of ['three','@dimforge/rapier3d-compat']){
 const folder=path.join('node_modules',dep);for(const file of ['LICENSE','LICENSE.md','LICENSE.txt']){try{notices.push('\n'+dep+'\n'+await fs.readFile(path.join(folder,file),'utf8'));break}catch{}}
}
await fs.writeFile(path.join(output,'NOTICES.txt'),notices.join('\n\n'));
for(const[n,h]of Object.entries(inputs))if(hash(await fs.readFile(n))!==h)throw Error('Input changed during demo build: '+n);
await fs.writeFile(path.join(output,'review-build.json'),JSON.stringify({commit,buildRef,workingTreeDirty:dirty,created:new Date().toISOString(),inputs,method:'Exact demo-mode static candidate; explicit public asset allowlist. All inventoried inputs stable across build. Guarded test/profile query only for isolated evidence.'},null,2));
const paths=await walk(output),files=Object.fromEntries(await Promise.all(paths.sort().map(async p=>{const data=await fs.readFile(p);return[p.slice(output.length+1).replaceAll('\\','/'),{bytes:data.length,sha256:hash(data)}]})));
const manifest={schemaVersion:1,commit,buildRef,output:output.replaceAll('\\','/'),basePath:'/',bytes:Object.values(files).reduce((s,v)=>s+v.bytes,0),files,cachePolicy:'Version-hashed bundled JS/CSS may be immutable. HTML, review-build.json and unversioned public assets revalidate; no immutable caching of mutable names.'};
await fs.writeFile(path.join(output,'OUTPUT-MANIFEST.json'),JSON.stringify(manifest,null,2));
await fs.writeFile('demo-current.json',JSON.stringify({output:manifest.output,commit,buildRef,manifest:'OUTPUT-MANIFEST.json'},null,2));
console.log(JSON.stringify({output:manifest.output,buildRef,files:paths.length,bytes:manifest.bytes},null,2));
