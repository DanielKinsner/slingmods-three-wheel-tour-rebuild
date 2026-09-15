import * as THREE from 'three';
/** Loading-only preparation; does not advance simulation or modify persistent equipment. */
export async function prepareRenderer(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera){
 const announce=(text:string)=>{if(typeof document!=='undefined'){const node=document.querySelector('[data-loading-stage]');if(node)node.textContent=text}};
 const start=performance.now(),textures=new Set<THREE.Texture>(),culling=new Map<THREE.Object3D,boolean>(),lodVisibility=new Map<THREE.Object3D,boolean>();
 scene.traverse(o=>{if(o instanceof THREE.Mesh){if(o.userData.prewarmLOD){lodVisibility.set(o,o.visible);o.visible=true}culling.set(o,o.frustumCulled);o.frustumCulled=false;for(const m of Array.isArray(o.material)?o.material:[o.material])for(const v of Object.values(m))if(v instanceof THREE.Texture)textures.add(v)}});
 const stages:{name:string;ms:number}[]=[];let t=performance.now();
 try{
  announce('Preparing surface textures…');
  for(const texture of textures)renderer.initTexture(texture);stages.push({name:'init-textures',ms:performance.now()-t});t=performance.now();
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
 const node=document.createElement('div');node.setAttribute('role','status');node.style.cssText='position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#101820;color:#f4f4f4;font:600 20px system-ui';
 const panel=document.createElement('div');panel.style.cssText='text-align:center;max-width:460px;padding:28px';
 const stage=document.createElement('p');stage.dataset.loadingStage='';stage.textContent='Loading your Slingshot and surroundings…';
 const progress=document.createElement('p');progress.style.cssText='font:14px/1.5 system-ui;color:#bcc8d1';progress.textContent='The first visit loads the models. Your drive starts after graphics are ready.';
 panel.append(stage,progress);node.append(panel);parent.append(node);
 const previous=THREE.DefaultLoadingManager.onProgress;
 const report:typeof previous=(url,loaded,total)=>{previous?.(url,loaded,total);if(node.isConnected)progress.textContent=`${loaded} of ${total} currently requested model / texture resources loaded`};
 THREE.DefaultLoadingManager.onProgress=report;
 const observer=new MutationObserver(()=>{if(!node.isConnected){if(THREE.DefaultLoadingManager.onProgress===report)THREE.DefaultLoadingManager.onProgress=previous;observer.disconnect()}});observer.observe(parent,{childList:true});
 return node;
}
