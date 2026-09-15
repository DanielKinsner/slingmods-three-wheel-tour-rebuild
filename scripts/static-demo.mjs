import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

export const mimeTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.hdr':'application/octet-stream','.wasm':'application/wasm','.wav':'audio/wav','.txt':'text/plain; charset=utf-8'};
export const cacheFor=name=>/\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(js|css)$/.test(name)?'public, max-age=31536000, immutable':'no-cache';
export function createStaticServer(root,{noindex=false}={}){
 root=path.resolve(root);
 return http.createServer(async(req,res)=>{
  const common={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...(noindex?{'X-Robots-Tag':'noindex, nofollow'}:{})};
  try{
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,common);return res.end()}
   const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
   const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
   if(!file.startsWith(root+path.sep)||name==='/_headers'){res.writeHead(403,common);return res.end('Forbidden')}
   const data=await fs.readFile(file);
   res.writeHead(200,{...common,'Content-Type':mimeTypes[path.extname(file)]||'application/octet-stream','Content-Length':data.length,'Cache-Control':cacheFor(name)});
   res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404,{...common,'Content-Type':'text/plain','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:'Required file unavailable')}
 });
}
