import * as THREE from 'three';
/** Loading-only preparation; does not advance simulation or modify persistent equipment. */
export async function prepareRenderer(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera){
 const announce=(text:string)=>{if(typeof document!=='undefined'){const node=document.querySelector('[data-loading-stage]');if(node)node.textContent=text}};
 await new Promise(resolve=>setTimeout(resolve,0));
 const start=performance.now(),textures=new Set<THREE.Texture>(),culling=new Map<THREE.Object3D,boolean>(),lodVisibility=new Map<THREE.Object3D,boolean>();
 scene.traverse(o=>{if(o instanceof THREE.Mesh){if(o.userData.prewarmLOD){lodVisibility.set(o,o.visible);o.visible=true}culling.set(o,o.frustumCulled);o.frustumCulled=false;for(const m of Array.isArray(o.material)?o.material:[o.material])for(const v of Object.values(m))if(v instanceof THREE.Texture)textures.add(v)}});
 const stages:{name:string;ms:number}[]=[];let t=performance.now();
 try{
  announce('Preparing surface textures…');
  let uploaded=0;for(const texture of textures){renderer.initTexture(texture);if(++uploaded%8===0)await new Promise(resolve=>setTimeout(resolve,0));}stages.push({name:'init-textures',ms:performance.now()-t});t=performance.now();
  announce('Preparing graphics programs…');
  await renderer.compileAsync(scene,camera);stages.push({name:'compile-async',ms:performance.now()-t});t=performance.now();
  // Actual render initializes depth/shadow variants and unseen geometry buffers. Loading veil is still present.
  renderer.render(scene,camera);stages.push({name:'first-all-mesh-render',ms:performance.now()-t});t=performance.now();
  // Explicit loading-only synchronization. This is CPU wait time, not a GPU timer query.
  renderer.getContext().finish();stages.push({name:'loading-gpu-sync',ms:performance.now()-t});
 }finally{for(const[o,value]of culling)o.frustumCulled=value;for(const[o,value]of lodVisibility)o.visible=value}
 return{ms:performance.now()-start,stages,textures:textures.size,programs:renderer.info.programs?.length??0,parallelCompile:renderer.extensions.has('KHR_parallel_shader_compile'),method:'Texture initialization, compileAsync, all-mesh render and loading-only finish. Culling restored before play; simulation not stepped.'};
}
export function preparationVeil(parent:Element){
 const node=document.createElement('section');node.setAttribute('aria-label','Preparing your drive');node.className='drive-preparation';
 node.style.cssText='position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#131619;color:#f4f4f4;font:600 20px system-ui';
 const panel=document.createElement('div');panel.style.cssText='width:min(480px,90vw);padding:32px;border-top:3px solid #c51f28;background:#1e2226';
 const brand=document.createElement('img');brand.src='/assets/brand/slingmods-logo-main.png';brand.alt='SlingMods';brand.style.cssText='width:190px;max-width:100%;margin-bottom:24px';
 const stage=document.createElement('h1');stage.dataset.loadingStage='';stage.style.cssText='font-size:26px;line-height:1.2';stage.textContent='Preparing your build';stage.setAttribute('role','status');
 const progress=document.createElement('p');progress.style.cssText='font:15px/1.5 system-ui;color:#c4c8ce';progress.textContent='Loading the car, products and route. Your saved build is safe.';
 const cancel=document.createElement('a');cancel.textContent='Cancel · Back to showroom';cancel.href=new URLSearchParams(location.search).get('play')==='career'?'?scene=career&play=career':'?scene=signature&screen=build'+location.hash;cancel.style.cssText='display:inline-block;margin-top:20px;padding:12px 18px;background:#c51f28;color:white;font:600 15px system-ui;text-decoration:none';cancel.dataset.loadingCancel='';
 panel.append(brand,stage,progress,cancel);node.append(panel);parent.append(node);
 const previous=THREE.DefaultLoadingManager.onProgress;
 const report:typeof previous=(url,loaded,total)=>{previous?.(url,loaded,total);if(node.isConnected)progress.textContent=`${loaded} of ${total} requested resources loaded. Graphics preparation follows.`};
 THREE.DefaultLoadingManager.onProgress=report;
 const observer=new MutationObserver(()=>{if(!node.isConnected){if(THREE.DefaultLoadingManager.onProgress===report)THREE.DefaultLoadingManager.onProgress=previous;observer.disconnect()}});observer.observe(parent,{childList:true});
 return node;
}
