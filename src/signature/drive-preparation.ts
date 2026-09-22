import {effectAssetURLs} from '../presentation/effect-assets';
import {RIDGE_ASSETS} from '../ridge/assets';
import {speedDressingURLs,BASIS_TRANSCODER_URLS} from '../presentation/p11-assets';
import {resolveLook} from '../presentation/time-of-day';
import {CURRENT_VEHICLE_URL,CURRENT_DRIVER_ATTACHMENT,CURRENT_REAR_RIG,CURRENT_PRODUCTS_URL,CURRENT_UNDERGLOW,VEHICLE_VISUAL} from '../presentation/vehicle-asset';
import type {BuildRecipe,DestinationId} from './config';
export const DRIVE_DESTINATIONS:Record<DestinationId,string>={harbor:'Original Harbor',express:'Harbor Express',ridge:'Smoky Ridge'};
export function driveAssetURLs(route:DestinationId,recipe:BuildRecipe){
 const shared=[CURRENT_VEHICLE_URL,'/assets/drivers/test-driver.glb',CURRENT_DRIVER_ATTACHMENT,CURRENT_REAR_RIG,'/assets/brand/slingmods-sign.glb',CURRENT_UNDERGLOW.glb,CURRENT_UNDERGLOW.attachment,'/assets/products/ddmworks-sm3223-silver.glb',CURRENT_PRODUCTS_URL];
 if(route!=='ridge')shared.push('/assets/showcase-quality/sky/day-puresky-2k.hdr','/assets/showcase-quality/kit.glb');
 if(route==='harbor')shared.push('/assets/harbor/route.json','/assets/harbor/harbor.glb');
 else for(const name of ['p06c_asphalt_Diffuse.jpg','p06c_asphalt_nor_gl.jpg','p06c_asphalt_Rough.jpg','leafy_grass_Diffuse.jpg'])shared.push('/assets/showcase-quality/textures/'+name);
 if(route==='ridge')shared.push(...RIDGE_ASSETS);
 if(VEHICLE_VISUAL==='legacy'&&recipe.finish!=='blue-orange')shared.push(recipe.finish==='white-graphite'?'/assets/p08b/showroom-refinement/finish-white-graphite.png':'/assets/p08b/finish-'+recipe.finish+'.png');
 if(VEHICLE_VISUAL==='2026'&&recipe.finish!=='blue-orange')for(const part of ['front','rear'])shared.push('/assets/model02/decal-'+part+'-'+recipe.finish+'.png');
 return [...new Set(shared)];
}
/** Set dressing the drive can do without (P11 asphalt, decals, trackside). Warmed when the host has it; never required. */
export const optionalDriveAssetURLs=(route:DestinationId)=>{if(route==='ridge')return [...effectAssetURLs(),...BASIS_TRANSCODER_URLS];const sky=resolveLook({route,career:false,requested:'day',explicitLighting:false}).sky;return[...effectAssetURLs(),...speedDressingURLs(route),...(sky?[sky]:[])]};
/**
 * Best-effort warm-up. A missing file, a network error or a timeout is recorded and swallowed: the scene has its own
 * fallback (previous road, no props), so nothing here may ever stop the player from driving.
 */
export async function warmOptionalAssets(urls:readonly string[],fetchImpl:typeof fetch=fetch,signal?:AbortSignal,parallel=4){
 const warmed:string[]=[],skipped:string[]=[];let next=0;
 await Promise.all(Array.from({length:parallel},async()=>{while(next<urls.length&&!signal?.aborted){const url=urls[next++];try{const response=await fetchImpl(url,{signal});if(!response.ok)throw Error(String(response.status));await response.arrayBuffer();warmed.push(url)}catch{skipped.push(url)}}}));
 return{warmed,skipped};
}
export interface DrivePreparationReport {route:string;started:number;ended:number;ms:number;resources:{url:string;ms:number;bytes:number}[];retries:number;cancelled:boolean;optional?:{warmed:number;skipped:string[]}}
/** Warm HTTP bytes before departure. No speculative renderer, simulation, audio or save mutation. */
export async function prepareDrive(route:DestinationId,recipe:BuildRecipe,mode:'test'|'race'='test'):Promise<DrivePreparationReport>{
 const started=performance.now(),report:DrivePreparationReport={route,started,ended:0,ms:0,resources:[],retries:0,cancelled:false};
 const dialog=document.createElement('dialog');dialog.className='sig-drive-loading';dialog.setAttribute('aria-label','Prepare test drive');
 const eyebrow=document.createElement('p');eyebrow.className='drive-loading-eyebrow';eyebrow.textContent=mode==='race'?'Quick race':'Test drive';
 const title=document.createElement('h2');title.textContent=DRIVE_DESTINATIONS[route];
 const stage=document.createElement('p');stage.setAttribute('role','status');stage.dataset.driveLoading='';
 const progress=document.createElement('progress');progress.className='drive-loading-track';progress.setAttribute('aria-label','Drive download progress');
 const detail=document.createElement('p');detail.className='drive-loading-detail';detail.textContent=mode==='race'?'One lap against the field. Your current build comes with you.':'Explore at your own pace. Your current build comes with you.';
 const cancel=document.createElement('button');cancel.className='drive-loading-button';cancel.textContent='Stay in showroom';cancel.dataset.prepareCancel='';
 const retry=document.createElement('button');retry.className='drive-loading-button drive-loading-primary';retry.textContent='Try again';retry.hidden=true;retry.dataset.prepareRetry='';
 const actions=document.createElement('div');actions.className='drive-loading-actions';actions.append(retry,cancel);
 dialog.append(eyebrow,title,progress,stage,detail,actions);document.body.append(dialog);try{dialog.showModal();cancel.focus()}catch(e){dialog.remove();throw e}
 let controller=new AbortController(),cancelled=false,retryWake:(()=>void)|undefined;
 const abort=()=>{cancelled=true;controller.abort();retryWake?.()};cancel.onclick=abort;dialog.addEventListener('cancel',e=>{e.preventDefault();abort()});
 const pageExit=()=>abort();addEventListener('pagehide',pageExit,{once:true});
 try{
  const urls=driveAssetURLs(route,recipe),completedURLs=new Set<string>();progress.max=urls.length;progress.value=0;
  const updateProgress=()=>{progress.value=completedURLs.size;progress.setAttribute('aria-valuetext',`${completedURLs.size} of ${urls.length} downloads complete`)};
  while(!cancelled){
   controller=new AbortController();let next=0;const remaining=urls.filter(url=>!completedURLs.has(url));retry.hidden=true;stage.textContent=completedURLs.size?'Picking up where we left off…':'Loading your build and route…';
   const timeout=setTimeout(()=>controller.abort('timeout'),45000);
   try{
    const jobs=Array.from({length:4},async()=>{while(next<remaining.length&&!cancelled){const url=remaining[next++],at=performance.now(),response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error('Required route resource unavailable');const data=await response.arrayBuffer();report.resources.push({url,ms:performance.now()-at,bytes:data.byteLength});completedURLs.add(url);updateProgress()}});
    try{await Promise.all(jobs)}catch(e){controller.abort();await Promise.allSettled(jobs);throw e}
    break;
   }catch(error){controller.abort();clearTimeout(timeout);if(cancelled)break;stage.textContent='Download interrupted. Check your connection and try again.';detail.textContent='Your build is unchanged. Completed downloads are ready for your retry.';retry.hidden=false;retry.focus();await new Promise<void>(resolve=>{retryWake=resolve;retry.onclick=()=>{report.retries++;resolve()}});retryWake=undefined}
   finally{clearTimeout(timeout)}
  }
  // Required files are in. Optional dressing gets one bounded, best-effort pass; whatever is missing is simply skipped.
  if(!cancelled){stage.textContent='Dressing the route…';const limit=new AbortController(),timer=setTimeout(()=>limit.abort(),30000),stop=()=>limit.abort();controller.signal.addEventListener('abort',stop);cancel.addEventListener('click',stop,{once:true});try{const result=await warmOptionalAssets(optionalDriveAssetURLs(route),fetch,limit.signal);report.optional={warmed:result.warmed.length,skipped:result.skipped}}finally{clearTimeout(timer)}}
 }finally{removeEventListener('pagehide',pageExit);controller.abort();dialog.close();dialog.remove();report.cancelled=cancelled;report.ended=performance.now();report.ms=report.ended-started}
 return report;
}
