import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {createStaticServer}from'../scripts/static-demo.mjs';import {stagePublish,sha}from'../scripts/stage-publish.mjs';
test('actual HTTP WAV MIME, exact bytes, cache boundaries and missing-asset status',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'twt-http-'));const server=createStaticServer(root,{noindex:true});
 try{
  await fs.mkdir(path.join(root,'assets'));await fs.writeFile(path.join(root,'index.html'),'<h1>Demo</h1>');await fs.writeFile(path.join(root,'assets/a.wav'),Buffer.from([82,73,70,70]));await fs.writeFile(path.join(root,'assets/runtime-abcdefgh.js'),'export {};');
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const wav=await fetch(base+'/assets/a.wav');assert.equal(wav.headers.get('content-type'),'audio/wav');assert.deepEqual(Buffer.from(await wav.arrayBuffer()),Buffer.from([82,73,70,70]));assert.equal(wav.headers.get('cache-control'),'no-cache');assert.equal(wav.headers.get('x-content-type-options'),'nosniff');
  const etag=wav.headers.get('etag');assert.match(etag,/^"[a-f0-9]{64}"$/);const cached=await fetch(base+'/assets/a.wav',{headers:{'If-None-Match':etag}});assert.equal(cached.status,304);assert.equal((await cached.arrayBuffer()).byteLength,0);await fs.writeFile(path.join(root,'assets/a.wav'),'changed');const changed=await fetch(base+'/assets/a.wav',{headers:{'If-None-Match':etag}});assert.equal(changed.status,200);assert.notEqual(changed.headers.get('etag'),etag);assert.equal(await changed.text(),'changed');
  assert.match((await fetch(base+'/assets/runtime-abcdefgh.js')).headers.get('cache-control'),/immutable/);
  const absent=await fetch(base+'/assets/missing.wav');assert.equal(absent.status,404);assert.doesNotMatch(await absent.text(),/<h1>/);assert.equal(absent.headers.get('x-robots-tag'),'noindex, nofollow');assert.equal((await fetch(base+'/',{method:'POST'})).status,405);assert.equal((await fetch(base+'/',{method:'HEAD'})).headers.get('content-type'),'text/html; charset=utf-8');
 }finally{await new Promise(r=>server.close(r));await fs.rm(root,{recursive:true,force:true})}
});
test('publication refuses corrupt/missing inputs and preserves runtime bytes while removing internal metadata',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'twt-stage-'));
 try{
  const commit='a'.repeat(40),buildRef='a'.repeat(12),output='demo-dist/fixture';await fs.mkdir(path.join(root,output,'assets'),{recursive:true});
  const data={'index.html':'<html><head></head><body>Demo</body></html>','NOTICES.txt':'Retained license','.vite/manifest.json':'{}','review-build.json':JSON.stringify({commit,buildRef,inputs:{'public/assets/a.wav':'x','src/private.ts':'y'}}),'assets/a.wav':'RIFF original'};
  const files={};for(const[n,b]of Object.entries(data)){await fs.mkdir(path.dirname(path.join(root,output,n)),{recursive:true});await fs.writeFile(path.join(root,output,n),b);files[n]={bytes:Buffer.byteLength(b),sha256:sha(b)}}
  await fs.writeFile(path.join(root,output,'OUTPUT-MANIFEST.json'),JSON.stringify({files,commit,buildRef,output,basePath:'/'}));await fs.writeFile(path.join(root,'demo-current.json'),JSON.stringify({output,commit,buildRef}));await fs.writeFile(path.join(root,'demo-assets.json'),JSON.stringify({assets:['assets/a.wav'],notices:[]}));
  const receipt=await stagePublish(root);assert.equal(receipt.files['assets/a.wav'].sha256,files['assets/a.wav'].sha256);assert.ok(!receipt.files['.vite/manifest.json']);assert.equal(await fs.readFile(path.join(root,output,'index.html'),'utf8'),data['index.html']);assert.match(await fs.readFile(path.join(root,receipt.output,'_headers'),'utf8'),/Content-Type: audio\/wav/);assert.doesNotMatch(await fs.readFile(path.join(root,receipt.output,'review-build.json'),'utf8'),/private/);
  await fs.writeFile(path.join(root,'demo-current.json'),JSON.stringify({output,commit:'b'.repeat(40),buildRef}));await assert.rejects(stagePublish(root),/identity mismatch/);await fs.writeFile(path.join(root,'demo-current.json'),JSON.stringify({output,commit,buildRef}));
  await fs.writeFile(path.join(root,output,'assets/a.wav'),'bad');await assert.rejects(stagePublish(root),/Input mismatch/);await fs.unlink(path.join(root,output,'assets/a.wav'));await assert.rejects(stagePublish(root),/ENOENT/);
 }finally{await fs.rm(root,{recursive:true,force:true})}
});
