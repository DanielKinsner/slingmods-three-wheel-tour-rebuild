import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {RALLY_ROUTE} from '../../src/rally/route';
const pts=RALLY_ROUTE.centerline, xs=pts.map(p=>p[0]),zs=pts.map(p=>p[1]),x0=Math.min(...xs),z0=Math.min(...zs),s=Math.min(930/(Math.max(...xs)-x0),790/(Math.max(...zs)-z0));
const xy=(x:number,z:number)=>[290+(x-x0)*s,110+(z-z0)*s],path=pts.map(([x,z],i)=>(i?'L':'M')+xy(x,z).map(v=>v.toFixed(2)).join(',')).join(' ')+' Z',start=xy(0,0);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024"><rect width="1536" height="1024" fill="#ded5b9"/><path d="${path}" fill="#c4c8ad" stroke="#62442d" stroke-width="21" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="#fc493e" stroke-width="5"/><rect x="${start[0]-15}" y="${start[1]-5}" width="30" height="10" fill="white" stroke="black" stroke-width="2"/><text x="${start[0]-20}" y="${start[1]+35}" font-family="sans-serif" font-size="18">START / FINISH</text></svg>`;
await fs.mkdir('assets/game-feel/rally',{recursive:true});await fs.writeFile('assets/game-feel/rally/route-guide.svg',svg);
const b=await chromium.launch({headless:true}),p=await b.newPage({viewport:{width:1536,height:1024}});await p.setContent(`<style>body{margin:0}</style>${svg}`);await p.screenshot({path:'assets/game-feel/rally/route-guide.png'});await b.close();
