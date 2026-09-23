/** Controlled visual A/B of asset-loading and surface optimizations. Separate from sustained frame-rate acceptance. */
import {chromium} from '@playwright/test';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const out=process.env.EVIDENCE_DIR;if(!out)throw Error('Fresh EVIDENCE_DIR required');await fs.mkdir(out,{recursive:false});
const urls={baseline:process.env.BASELINE_URL||'http://127.0.0.1:5224',candidate:process.env.BASE_URL||'http://127.0.0.1:5223'};
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),report={method:'Controlled simulation clock, Ultra fixed 100% resolution, 1600x900 DPR1, identical camera fixtures. Sequential isolated browser contexts. Load times include local caches and are diagnostic, not a sustained performance claim.',runs:[],comparisons:[]};
const cases=[['harbor','dusk-rain','2026'],['express','day','ryker'],['harbor','day','spyder'],['ridge','day','2026']];
try{
 for(const [route,look,visual] of cases){const name=`${route}-${look}-${visual}`,images={};
  for(const [version,base] of Object.entries(urls)){
   const context=await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1}),p=await context.newPage(),errors=[],requests=[];
   p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});p.on('request',r=>{if(r.url().includes('/assets/'))requests.push(r.url())});
   console.log('Loading',name,version);
   try{
    await p.goto(base+`/?scene=${route==='ridge'?'ridge':'express'}&route=${route}&mode=race&test=1&profile=1&clock=controlled&quality=ultra&look=${look}&visual=${visual}`,{timeout:120000});
    await p.waitForFunction(()=>window.__EXPRESS?.ready,null,{timeout:180000});
    const state=await p.evaluate(()=>{const s=window.__EXPRESS.inspect();return{loadMs:s.loadMs,stages:s.entry.stages,preparation:s.preparation,memory:s.memory,cache:s.textureCache,world:s.world,merge:s.rivalMerge,pipeline:s.pipeline,asset:s.visual.asset,renderer:s.renderer};});
    report.runs.push({name,version,state,errors,assetRequests:requests.length,sourcePNGRequests:requests.filter(u=>u.includes('/shared-textures/'))});
    assert.deepEqual(errors,[]);if(route==='ridge')assert.equal(state.world.forest?.fallback,undefined,'full forest must load');
    images[version]={};
    const angles={front:[[2.4,1.15,-4.5],[0,.65,-.2]],rear:[[-2.9,1.35,5.3],[0,.65,0]],wide:[[0,3.8,11],[0,.2,-7]]};
    for(const [view,[position,target]]of Object.entries(angles)){
     const png=await p.evaluate(([position,target])=>window.__EXPRESS.referenceCamera('player',position,target),[position,target]);
     images[version][view]=png;await fs.writeFile(`${out}/${name}-${version}-${view}.png`,Buffer.from(png.split(',')[1],'base64'));
    }
    console.log(JSON.stringify({name,version,loadMs:state.loadMs,programs:state.preparation.programs,memory:state.memory,cache:state.cache}));
   }finally{await context.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));}
  }
  const p=await browser.newPage();
  for(const view of Object.keys(images.baseline)){
   const diff=await p.evaluate(async([a,b])=>{const pixels=async url=>{const im=new Image();im.src=url;await im.decode();const canvas=new OffscreenCanvas(im.width,im.height),ctx=canvas.getContext('2d');ctx.drawImage(im,0,0);return ctx.getImageData(0,0,im.width,im.height).data;};const [x,y]=await Promise.all([pixels(a),pixels(b)]);let any=0,over8=0,max=0,total=0;for(let k=0;k<x.length;k+=4){const d=Math.max(Math.abs(x[k]-y[k]),Math.abs(x[k+1]-y[k+1]),Math.abs(x[k+2]-y[k+2]));any+=d>0;over8+=d>8;max=Math.max(max,d);total+=d;}return{pixels:x.length/4,any,over8,max,meanMaxChannelDifference:total/(x.length/4)};},[images.baseline[view],images.candidate[view]]);
   report.comparisons.push({name,view,...diff});console.log(JSON.stringify({name,view,...diff}));
  }
  await p.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));
 }
}finally{await browser.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));}
