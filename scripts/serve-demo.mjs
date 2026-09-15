import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath}from'node:url';
const project=fileURLToPath(new URL('../',import.meta.url));
const pointer=JSON.parse(await fs.readFile(path.join(project,'demo-current.json'),'utf8'));
const root=path.resolve(project,pointer.output),allowedRoot=path.resolve(project,'demo-dist')+path.sep;
if(!root.startsWith(allowedRoot))throw Error('Demo output must be an owned demo-dist child');
const port=Number(process.env.PORT||5188),types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.hdr':'application/octet-stream','.wasm':'application/wasm','.txt':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end()}
  const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden')}
  const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':data.length,'Cache-Control':/\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(js|css)$/.test(name)?'public, max-age=31536000, immutable':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Required file unavailable')}
}).listen(port,'127.0.0.1',()=>console.log(`Static candidate ${pointer.buildRef} at http://127.0.0.1:${port}/ from ${pointer.output}`));
