// Photographs the harbor water from fixed WORLD viewpoints per look. node scripts/perf/water-look.mjs [tag] [looks...]
import {chromium} from '@playwright/test';import fs from 'node:fs/promises';
const [tag='now',...looks]=process.argv.slice(2),out='.tools/water';await fs.mkdir(out,{recursive:true});
const views={wide:[[10,9,-60],[-70,-1,-110]],docks:[[-24,3,-60],[-44,-.4,-90]],low:[[-29,1.2,-40],[-60,-.3,-80]],far:[[30,14,-150],[-90,-2,-60]]};
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio','--enable-gpu','--ignore-gpu-blocklist']});
try{for(const look of looks.length?looks:['day','dusk','night','after-rain']){const p=await b.newPage({viewport:{width:1600,height:900}}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(`http://127.0.0.1:5186/?scene=express&route=harbor&mode=test&test=1&profile=1&look=${look}&quality=high`,{waitUntil:'commit',timeout:120000});await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});await p.waitForTimeout(1500);
 for(const[name,[pos,target]]of Object.entries(views)){const shot=await p.evaluate(([pos,target])=>{const i=window.__EXPRESS.lightweight().telemetry,q=i.quaternion,o=i.position;
   // world -> car local: rotate by the inverse quaternion
   const rot=(v,q)=>{const [x,y,z]=v,{x:qx,y:qy,z:qz,w:qw}=q;const ix=qw*x+qy*z-qz*y,iy=qw*y+qz*x-qx*z,iz=qw*z+qx*y-qy*x,iw=-qx*x-qy*y-qz*z;return[ix*qw+iw*-qx+iy*-qz-iz*-qy,iy*qw+iw*-qy+iz*-qx-ix*-qz,iz*qw+iw*-qz+ix*-qy-iy*-qx]};
   const local=v=>rot([v[0]-o.x,v[1]-o.y,v[2]-o.z],{x:-q.x,y:-q.y,z:-q.z,w:q.w});return window.__EXPRESS.referenceCamera('player',local(pos),local(target))},[pos,target]);await fs.writeFile(`${out}/${look}-${name}-${tag}.png`,Buffer.from(shot.split(',')[1],'base64'))}
 console.log(look,JSON.stringify(await p.evaluate(()=>window.__EXPRESS.inspect().world?.water??null))?.slice(0,300),'errors',errors.length,errors[0]??'');await p.close()}
}finally{await b.close()}
