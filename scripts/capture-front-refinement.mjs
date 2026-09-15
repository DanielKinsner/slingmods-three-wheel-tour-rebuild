import {chromium} from '@playwright/test';import fs from 'node:fs/promises';
const out=process.env.EVIDENCE_DIR;if(!out)throw Error('Fresh EVIDENCE_DIR required');await fs.mkdir(out,{recursive:false});
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--mute-audio']}),p=await b.newPage({viewport:{width:1500,height:1000}}),errors=[],rows=[];p.on('pageerror',e=>errors.push(e.message));
try{await p.goto((process.env.BASE_URL||'http://127.0.0.1:5201')+'/scripts/front-refinement-proof.html');await p.waitForFunction(()=>window.art?.ready,null,{timeout:120000});
for(const [name,pos,target]of [['front',[0,.77,-4.5],[0,.42,-1.7]],['corner',[1.7,.90,-3.4],[.58,.45,-2]],['low',[1.5,.28,-3.8],[.3,.30,-1.95]]])for(const old of [true,false]){
 await p.evaluate(async({name,pos,target,old})=>{await art.set('blue-orange',[]);art.baselineView(old);art.view(pos,target,(old?'BEFORE':'AFTER')+' / '+name+' / actual runtime asset')},{name,pos,target,old});await p.waitForTimeout(500);const n=name+(old?'-before':'-after');await p.screenshot({path:out+'/'+n+'.png'});rows.push({name:n,...await p.evaluate(()=>art.stats())});
}
await p.evaluate(async()=>{art.baselineView(false);await art.set('white-graphite',[]);art.view([1.7,.9,-3.4],[.58,.45,-2],'AFTER / pearl white / actual runtime asset')});await p.waitForTimeout(500);await p.screenshot({path:out+'/white-after.png'});
await fs.writeFile(out+'/verification.json',JSON.stringify({pass:errors.length===0,errors,rows,method:'Isolated WebGL actual GLBs, identical before/after cameras and lighting, no image edits. Asset inspection, not performance proof.'},null,2));if(errors.length)throw Error(errors.join('\n'));
}finally{await b.close()}
