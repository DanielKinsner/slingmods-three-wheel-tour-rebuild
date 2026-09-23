import {createRequire} from 'node:module';import {readFileSync} from 'node:fs';

// Renders the route guides from outlines.json (the game's own centrelines, exported via src/signature/route-data.ts).
// Run from the repo root: node assets/game-feel/map-src/outline-png.mjs
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const {chromium}=createRequire(root+'package.json')('@playwright/test');
const paths=JSON.parse(readFileSync(root+'assets/game-feel/map-src/outlines.json','utf8'));
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1536,height:1024}});
for(const [k,d] of Object.entries(paths)){
 // Route box: x 6%..60%, y 8%..66% of the frame (the visible part of the Race screen art).
 const n=d.match(/-?\d+(\.\d+)?/g).map(Number),xs=n.filter((_,i)=>i%2===0),ys=n.filter((_,i)=>i%2===1),x0=Math.min(...xs),y0=Math.min(...ys),w=Math.max(...xs)-x0,h=Math.max(...ys)-y0;
 const bx=92,by=82,bw=830,bh=594,m=.1,sc=Math.min(bw*(1-2*m)/w,bh*(1-2*m)/h),tx=bx+(bw-w*sc)/2-x0*sc,ty=by+(bh-h*sc)/2-y0*sc;
 await p.setContent(`<body style="margin:0;background:#fff"><svg width="1536" height="1024" viewBox="0 0 1536 1024"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="#bbb" stroke-dasharray="12 10" stroke-width="3"/><path d="${d}" transform="translate(${tx},${ty}) scale(${sc})" fill="none" stroke="#e01010" vector-effect="non-scaling-stroke" style="stroke-width:14px;stroke-linejoin:round"/><circle cx="${xs[0]*sc+tx}" cy="${ys[0]*sc+ty}" r="16" fill="#111"/></svg></body>`);
 await p.screenshot({path:root+`assets/game-feel/map-src/outline-${k}.png`});
}
await b.close();console.log('done');
