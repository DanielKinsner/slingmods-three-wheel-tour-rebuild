import {RIDGE_ASSETS} from '../ridge/assets';
import {CURRENT_VEHICLE_URL,CURRENT_DRIVER_ATTACHMENT,CURRENT_REAR_RIG,CURRENT_PRODUCTS_URL,VEHICLE_VISUAL} from '../presentation/vehicle-asset';
import type {BuildRecipe,DestinationId} from './config';
export function driveAssetURLs(route:DestinationId,recipe:BuildRecipe){
 const shared=[CURRENT_VEHICLE_URL,'/assets/drivers/test-driver.glb',CURRENT_DRIVER_ATTACHMENT,CURRENT_REAR_RIG,'/assets/brand/slingmods-sign.glb','/assets/products/tricled-sm133-base.glb','/assets/products/tricled-sm133-base.attachment.json','/assets/products/ddmworks-sm3223-silver.glb',CURRENT_PRODUCTS_URL];
 if(route!=='ridge')shared.push('/assets/showcase-quality/sky/day-puresky-2k.hdr','/assets/showcase-quality/kit.glb');
 if(route==='harbor')shared.push('/assets/harbor/route.json','/assets/harbor/harbor.glb');
 else for(const name of ['p06c_asphalt_Diffuse.jpg','p06c_asphalt_nor_gl.jpg','p06c_asphalt_Rough.jpg','leafy_grass_Diffuse.jpg'])shared.push('/assets/showcase-quality/textures/'+name);
 if(route==='ridge')shared.push(...RIDGE_ASSETS);
 if(VEHICLE_VISUAL==='legacy'&&recipe.finish!=='blue-orange')shared.push(recipe.finish==='white-graphite'?'/assets/p08b/showroom-refinement/finish-white-graphite.png':'/assets/p08b/finish-'+recipe.finish+'.png');
 if(VEHICLE_VISUAL==='2026'&&recipe.finish!=='blue-orange')for(const part of ['front','rear'])shared.push('/assets/model02/decal-'+part+'-'+recipe.finish+'.png');
 return [...new Set(shared)];
}
export interface DrivePreparationReport {route:string;started:number;ended:number;ms:number;resources:{url:string;ms:number;bytes:number}[];retries:number;cancelled:boolean}
/** Warm HTTP bytes before departure. No speculative renderer, simulation, audio or save mutation. */
export async function prepareDrive(route:DestinationId,recipe:BuildRecipe):Promise<DrivePreparationReport>{
 const started=performance.now(),report:DrivePreparationReport={route,started,ended:0,ms:0,resources:[],retries:0,cancelled:false};
 const dialog=document.createElement('dialog');dialog.className='sig-drive-loading';dialog.setAttribute('aria-label','Prepare test drive');
 dialog.style.cssText='border:1px solid #45494e;border-top:4px solid #c51f28;padding:30px;background:#191d21;color:white;width:min(470px,85vw);font:16px/1.5 system-ui';
 const title=document.createElement('h2');title.textContent='Getting your drive ready';
 const stage=document.createElement('p');stage.setAttribute('role','status');stage.dataset.driveLoading='';
 const detail=document.createElement('p');detail.textContent=(route==='ridge'?'Travel to Smoky Ridge after the bay exit. ':'')+'Preparing route downloads before the bay opens. Graphics prepare on arrival. Your build stays safe.';
 const cancel=document.createElement('button');cancel.textContent='Cancel · Stay in showroom';cancel.dataset.prepareCancel='';
 const retry=document.createElement('button');retry.textContent='Retry preparation';retry.hidden=true;retry.dataset.prepareRetry='';
 for(const b of[cancel,retry])b.style.cssText='padding:12px 16px;margin:8px 8px 0 0;color:white;background:#a51c25;border:1px solid #d4d4d4;cursor:pointer';
 dialog.append(title,stage,detail,retry,cancel);document.body.append(dialog);try{dialog.showModal();cancel.focus()}catch(e){dialog.remove();throw e}
 let controller=new AbortController(),cancelled=false,retryWake:(()=>void)|undefined;
 const abort=()=>{cancelled=true;controller.abort();retryWake?.()};cancel.onclick=abort;dialog.addEventListener('cancel',e=>{e.preventDefault();abort()});
 const pageExit=()=>abort();addEventListener('pagehide',pageExit,{once:true});
 try{
  const urls=driveAssetURLs(route,recipe);
  while(!cancelled){
   controller=new AbortController();let next=0,completed=0;report.resources=[];retry.hidden=true;stage.textContent=`Preparing 0 of ${urls.length} route resources`;
   const timeout=setTimeout(()=>controller.abort('timeout'),45000);
   try{
    const jobs=Array.from({length:4},async()=>{while(next<urls.length&&!cancelled){const url=urls[next++],at=performance.now(),response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error('Required route resource unavailable');const data=await response.arrayBuffer();report.resources.push({url,ms:performance.now()-at,bytes:data.byteLength});stage.textContent=`Prepared ${++completed} of ${urls.length} route resources`}});
    try{await Promise.all(jobs)}catch(e){controller.abort();await Promise.allSettled(jobs);throw e}
    break;
   }catch(error){controller.abort();if(cancelled)break;stage.textContent='Preparation interrupted. Retry, or stay in the showroom.';retry.hidden=false;retry.focus();await new Promise<void>(resolve=>{retryWake=resolve;retry.onclick=()=>{report.retries++;resolve()}});retryWake=undefined}
   finally{clearTimeout(timeout)}
  }
 }finally{removeEventListener('pagehide',pageExit);controller.abort();dialog.close();dialog.remove();report.cancelled=cancelled;report.ended=performance.now();report.ms=report.ended-started}
 return report;
}
