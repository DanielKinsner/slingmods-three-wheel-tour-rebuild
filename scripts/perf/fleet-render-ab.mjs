/** Exact-view A/B of fleet material reuse and targeted rider matrices; separate from timing acceptance. */
import {chromium} from '@playwright/test';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:5226',out=process.env.EVIDENCE_DIR;if(!out)throw Error('Fresh EVIDENCE_DIR required');await fs.mkdir(out,{recursive:false});
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),report={method:'Same packaged build, controlled clock, Ultra 1600x900. legacy-rider,legacy-materials restores only this continuation. Player and rival views, all vehicles/routes. No geometry reduction.',runs:[],comparisons:[]};
const cases=[['harbor','dusk-rain','2026'],['express','day','ryker'],['harbor','day','spyder'],['ridge','day','2026']];
const angles={front:[[2.4,1.15,-4.5],[0,.65,-.2]],rear:[[-2.9,1.35,5.3],[0,.65,0]],wide:[[0,3.8,11],[0,.2,-7]]};
try{for(const [route,look,visual]of cases){const name=`${route}-${look}-${visual}`,images={};
 for(const version of ['legacy','fixed']){const c=await b.newContext({viewport:{width:1600,height:900}}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  try{console.log('Loading',name,version);await p.goto(base+`/?scene=${route==='ridge'?'ridge':'express'}&route=${route}&mode=race&test=1&profile=1&clock=controlled&quality=ultra&look=${look}&visual=${visual}${version==='legacy'?'&perf=legacy-rider,legacy-materials':''}`,{timeout:120000});await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});
   const state=await p.evaluate(()=>{const s=window.__EXPRESS.inspect();return{pool:s.rivalMaterialPool,memory:s.memory,programs:s.preparation.programs,driver:s.visual.driver,world:s.world.forest}});
   assert.deepEqual(errors,[]);assert.equal(state.pool.materials>0,version==='fixed');images[version]={};report.runs.push({name,version,state,errors});
   for(const id of ['player','maya','jett'])for(const [view,[position,target]]of Object.entries(angles)){
    const key=id+'-'+view,png=await p.evaluate(([id,position,target])=>window.__EXPRESS.referenceCamera(id,position,target),[id,position,target]);images[version][key]=png;await fs.writeFile(`${out}/${name}-${version}-${key}.png`,Buffer.from(png.split(',')[1],'base64'));
   }
  }finally{await c.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2))}
 }
 const p=await b.newPage();for(const view of Object.keys(images.legacy)){
  const diff=await p.evaluate(async([a,b])=>{const pixels=async src=>{const im=new Image();im.src=src;await im.decode();const c=new OffscreenCanvas(im.width,im.height),x=c.getContext('2d');x.drawImage(im,0,0);return x.getImageData(0,0,im.width,im.height).data};const[x,y]=await Promise.all([pixels(a),pixels(b)]);let any=0,over8=0,max=0;for(let k=0;k<x.length;k+=4){const d=Math.max(Math.abs(x[k]-y[k]),Math.abs(x[k+1]-y[k+1]),Math.abs(x[k+2]-y[k+2]));any+=d>0;over8+=d>8;max=Math.max(max,d)}return{pixels:x.length/4,any,over8,max}},[images.legacy[view],images.fixed[view]]);
  report.comparisons.push({name,view,...diff});console.log(JSON.stringify({name,view,...diff}));
 }await p.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));
}}finally{await b.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2))}
