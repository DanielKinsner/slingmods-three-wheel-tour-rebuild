import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {mimeTypes,cacheFor} from './static-demo.mjs';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export async function stagePublish(root){
 const pointer=JSON.parse(await fs.readFile(path.join(root,'demo-current.json'),'utf8'));
 if(!/^[0-9a-f]{12}(?:-working)?$/.test(pointer.buildRef)||!/^[0-9a-f]{40}$/.test(pointer.commit))throw Error('Invalid build identity');
 const input=path.resolve(root,pointer.output);
 if(!input.startsWith(path.resolve(root,'demo-dist')+path.sep))throw Error('Unexpected demo input');
 const manifestBytes=await fs.readFile(path.join(input,'OUTPUT-MANIFEST.json'));
 const manifest=JSON.parse(manifestBytes),payload=new Map();
 if(manifest.commit!==pointer.commit||manifest.buildRef!==pointer.buildRef||manifest.output!==pointer.output||manifest.basePath!=='/')throw Error('Output identity mismatch');
 for(const[n,row]of Object.entries(manifest.files)){
  if(path.isAbsolute(n)||n.split(/[\\/]/).includes('..')||n.includes('\\'))throw Error('Unsafe manifest path');
  if(!['index.html','NOTICES.txt','review-build.json','.vite/manifest.json'].includes(n)&&!/^assets\/[\w./-]+$/.test(n))throw Error('Unexpected public payload '+n);
  if(/\.(?:blend|map|py|ps1|zip|env)$/i.test(n))throw Error('Private payload '+n);
  const b=await fs.readFile(path.join(input,n));if(b.length!==row.bytes||sha(b)!==row.sha256)throw Error('Input mismatch '+n);
  payload.set(n,b);
 }
 const selected=JSON.parse(await fs.readFile(path.join(root,'demo-assets.json'),'utf8'));
 for(const n of [...selected.assets,...selected.notices,'index.html','NOTICES.txt','review-build.json'])if(!payload.has(n))throw Error('Required asset absent '+n);
 for(const[n,b]of payload)if(/\.(json|txt|html|js|css)$/.test(n)){
  const text=b.toString('utf8');
  if(/[A-Za-z]:[\\/]+Users[\\/]|\/Users\/|\/home\/|-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[A-Z0-9]{16}/.test(text))throw Error('Private path or credential pattern in '+n);
 }
 payload.delete('.vite/manifest.json');
 const build=JSON.parse(payload.get('review-build.json'));
 if(build.commit!==pointer.commit||build.buildRef!==pointer.buildRef)throw Error('Build identity mismatch');
 payload.set('review-build.json',Buffer.from(JSON.stringify({commit:build.commit,buildRef:build.buildRef,inputs:Object.fromEntries(Object.entries(build.inputs).filter(([n])=>n.startsWith('public/'))),kind:'Development Preview; public asset provenance only'},null,2)));
 const html=payload.get('index.html').toString('utf8');if(!html.includes('</head>'))throw Error('Missing HTML head');
 payload.set('index.html',Buffer.from(html.replace('</head>','<meta name="robots" content="noindex, nofollow">\n</head>')));
 payload.set('robots.txt',Buffer.from('User-agent: *\nDisallow: /\n'));
 payload.set('404.html',Buffer.from('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>Unavailable</title><p>This demo file is unavailable. <a href="/">Return to the preview</a>.</p></html>'));
 let headers='/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Robots-Tag: noindex, nofollow\n';
 for(const n of [...payload.keys()].sort())headers+='\n/'+n+'\n  Content-Type: '+(mimeTypes[path.extname(n)]||'application/octet-stream')+'\n  Cache-Control: '+cacheFor('/'+n)+'\n';
 headers+='\n/\n  Content-Type: text/html; charset=utf-8\n  Cache-Control: no-cache\n';
 payload.set('_headers',Buffer.from(headers));
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');const output='publish-stage/'+stamp+'-'+pointer.buildRef;
 await fs.mkdir(path.join(root,output),{recursive:true});
 const files={};for(const[n,b]of payload){const p=path.join(root,output,n);await fs.mkdir(path.dirname(p),{recursive:true});await fs.writeFile(p,b);files[n]={bytes:b.length,sha256:sha(b)}}
 const receipt={schemaVersion:1,output,buildRef:pointer.buildRef,commit:pointer.commit,basePath:'/',files,bytes:[...payload.values()].reduce((n,b)=>n+b.length,0),sourceOutput:pointer.output,sourceManifestSHA256:sha(manifestBytes),publication:'PENDING_OWNER_AUTHORIZATION_AND_TARGET_ACCESS',transformations:['Runtime assets, bundled game code and notices copied byte-identically.','Remove internal Vite import manifest; limit review-build.json to public asset provenance.','Add HTML noindex meta, robots.txt, 404.html and explicit Netlify _headers; no redirects or SPA fallback.'],limits:'Local stage only. Netlify headers/visibility/quota/HTTPS must be verified after separately authorized publication. Noindex is not privacy.'};
 await fs.writeFile(path.join(root,output+'-receipt.json'),JSON.stringify(receipt,null,2));
 await fs.writeFile(path.join(root,'publish-current.json'),JSON.stringify({output,buildRef:pointer.buildRef,commit:pointer.commit,receipt:output+'-receipt.json'},null,2));
 return receipt;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const receipt=await stagePublish(fileURLToPath(new URL('../',import.meta.url)));console.log(JSON.stringify({output:receipt.output,bytes:receipt.bytes,files:Object.keys(receipt.files).length,publication:receipt.publication},null,2));
}
