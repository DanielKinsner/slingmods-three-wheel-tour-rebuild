import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import{createHash}from'node:crypto';import{mimeTypes,cacheFor}from'./static-demo.mjs';
const root=process.cwd(),base=process.env.BASE_URL||'http://127.0.0.1:5189';
const pointer=JSON.parse(await fs.readFile('publish-current.json','utf8')),receipt=JSON.parse(await fs.readFile(pointer.receipt,'utf8'));
const out=process.env.OUT;if(!out)throw Error('OUT required; use a new evidence filename');
const rows=[];
for(const[n,expected]of Object.entries(receipt.files)){
 if(n==='_headers')continue;
 const response=await fetch(base+'/'+n),b=Buffer.from(await response.arrayBuffer());assert.equal(response.status,200,n);assert.equal(b.length,expected.bytes,n);assert.equal(createHash('sha256').update(b).digest('hex'),expected.sha256,n);
 const mime=response.headers.get('content-type');assert.equal(mime,mimeTypes[path.extname(n)]||'application/octet-stream',n);assert.equal(response.headers.get('cache-control'),cacheFor('/'+n),n);assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('referrer-policy'),'no-referrer');assert.match(response.headers.get('x-robots-tag'),/noindex/);
 rows.push({path:n,status:response.status,bytes:b.length,sha256:expected.sha256,mime,cache:response.headers.get('cache-control')});
}
const rootHTML=await fs.readFile(path.join(root,pointer.output,'index.html'),'utf8');
const absent=[];for(const n of ['/assets/absent.glb','/assets/absent.wav','/assets/absent.json','/assets/absent.js','/src/main.ts','/.git/config','/director-kit/production/state.json','/.vite/manifest.json']){const r=await fetch(base+n);assert.equal(r.status,404,n);assert.notEqual(await r.text(),rootHTML,'Missing asset must not serve the game entry');absent.push({path:n,status:r.status})}
const entry=await fetch(base+'/?scene=bay&play=demo');assert.equal(entry.status,200);assert.match(await entry.text(),/name="robots" content="noindex, nofollow"/);
await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,JSON.stringify({pass:true,base,receipt,rows,absent,method:'All public stage bytes fetched and hashed, local HTTP semantics verified. This is not a hosted/provider pass.'},null,2),{flag:'wx'});console.log('PASS '+rows.length+' public files, 8 absent paths, query entry');
