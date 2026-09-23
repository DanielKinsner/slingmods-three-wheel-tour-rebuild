import * as THREE from 'three';
import './loading.css';
/** Loading-only preparation; does not advance simulation or modify persistent equipment. */
/** @param alsoRender draws the same frame through any other path gameplay uses (e.g. the post target), so those shader variants are built under the veil too. */
export async function prepareRenderer(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera,alsoRender?:()=>void){
 const announce=(text:string)=>{if(typeof document!=='undefined'){const node=document.querySelector('[data-loading-stage]');if(node)node.textContent=text;for(const step of document.querySelectorAll<HTMLElement>('[data-loading-step]')){if(step.dataset.loadingStep==='scene')step.setAttribute('aria-current','step');else step.removeAttribute('aria-current')}}};
 await new Promise(resolve=>setTimeout(resolve,0));
 const start=performance.now(),textures=new Set<THREE.Texture>(),culling=new Map<THREE.Object3D,boolean>(),lodVisibility=new Map<THREE.Object3D,boolean>();
 scene.traverse(o=>{if(o instanceof THREE.Mesh){if(o.userData.prewarmLOD){lodVisibility.set(o,o.visible);o.visible=true}culling.set(o,o.frustumCulled);o.frustumCulled=false;for(const m of Array.isArray(o.material)?o.material:[o.material])for(const v of Object.values(m))if(v instanceof THREE.Texture)textures.add(v)}});
 const stages:{name:string;ms:number}[]=[];let t=performance.now();
 try{
  announce('Setting the scene');
  let uploaded=0;for(const texture of textures){renderer.initTexture(texture);if(++uploaded%8===0)await new Promise(resolve=>setTimeout(resolve,0));}stages.push({name:'init-textures',ms:performance.now()-t});t=performance.now();
  announce('Setting the scene');
  await renderer.compileAsync(scene,camera);stages.push({name:'compile-async',ms:performance.now()-t});t=performance.now();
  // Actual render initializes depth/shadow variants and unseen geometry buffers. Loading veil is still present.
  renderer.render(scene,camera);stages.push({name:'first-all-mesh-render',ms:performance.now()-t});t=performance.now();
  if(alsoRender){alsoRender();stages.push({name:'post-path-all-mesh-render',ms:performance.now()-t});t=performance.now()}
  // Explicit loading-only synchronization. This is CPU wait time, not a GPU timer query.
  renderer.getContext().finish();stages.push({name:'loading-gpu-sync',ms:performance.now()-t});
 }finally{for(const[o,value]of culling)o.frustumCulled=value;for(const[o,value]of lodVisibility)o.visible=value}
 return{ms:performance.now()-start,stages,textures:textures.size,programs:renderer.info.programs?.length??0,parallelCompile:renderer.extensions.has('KHR_parallel_shader_compile'),method:'Texture initialization, compileAsync, all-mesh render and loading-only finish. Culling restored before play; simulation not stepped.'};
}
export function preparationVeil(parent:Element,context:{showroom?:boolean;destination?:string;art?:string;vehicle?:string}={}){
 const node=document.createElement('section');node.setAttribute('aria-label',context.showroom?'Opening the showroom':'Preparing your drive');node.className='drive-preparation';
 // Keep the recovery-layer contract explicit even in standalone embedded clients.
 node.style.zIndex='9999';if(context.art){node.dataset.art='';node.style.setProperty('--gx-art',`url('${context.art}')`)}
 const panel=document.createElement('div');panel.className='drive-loading-panel';
 const brand=document.createElement('img');brand.src='/assets/brand/slingmods-logo-main.png';brand.alt='SlingMods';brand.className='drive-loading-brand';
 const eyebrow=document.createElement('p');eyebrow.className='drive-loading-eyebrow';eyebrow.textContent=context.showroom?'Your signature build':context.destination??'Your next drive';
 const stage=document.createElement('h1');stage.dataset.loadingStage='';stage.textContent=context.showroom?'Opening the showroom':'Getting your drive ready';stage.setAttribute('role','status');
 const steps=document.createElement('ol');steps.className='drive-loading-steps';steps.setAttribute('aria-label','Loading stages');steps.innerHTML='<li data-loading-step="build" aria-current="step">Load your build</li><li data-loading-step="scene">Prepare the scene</li>';
 const progress=document.createElement('p');progress.className='drive-loading-detail';progress.textContent=context.showroom?'Choose your finish. Try the accessories. Take your build out for a drive.':`Your ${context.vehicle??'Slingshot'} and scenery are loading. You can start when the road is ready.`;
 const cancel=document.createElement('a');const career=new URLSearchParams(location.search).get('play')==='career';cancel.textContent=career?'Back to career':context.showroom?'Reload showroom':'Back to showroom';cancel.href=career?'?scene=career&play=career':'?scene=signature&screen=build'+location.hash;cancel.className='drive-loading-button';cancel.dataset.loadingCancel='';
 panel.append(brand,eyebrow,stage,steps,progress,cancel);node.append(panel);parent.append(node);
 const previous=THREE.DefaultLoadingManager.onProgress;
 const report:typeof previous=(url,loaded,total)=>{previous?.(url,loaded,total);if(node.isConnected)node.dataset.loadedResources=`${loaded}/${total}`};
 THREE.DefaultLoadingManager.onProgress=report;
 const observer=new MutationObserver(()=>{if(!node.isConnected){if(THREE.DefaultLoadingManager.onProgress===report)THREE.DefaultLoadingManager.onProgress=previous;observer.disconnect()}});observer.observe(parent,{childList:true});
 return node;
}
