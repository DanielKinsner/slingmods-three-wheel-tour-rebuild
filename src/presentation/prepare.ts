import * as THREE from 'three';
/** Loading-only preparation; does not advance simulation or modify persistent equipment. */
export async function prepareRenderer(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera){
 const start=performance.now(),textures=new Set<THREE.Texture>(),culling=new Map<THREE.Object3D,boolean>();
 scene.traverse(o=>{if(o instanceof THREE.Mesh){culling.set(o,o.frustumCulled);o.frustumCulled=false;for(const m of Array.isArray(o.material)?o.material:[o.material])for(const v of Object.values(m))if(v instanceof THREE.Texture)textures.add(v)}});
 const stages:{name:string;ms:number}[]=[];let t=performance.now();
 try{
  for(const texture of textures)renderer.initTexture(texture);stages.push({name:'init-textures',ms:performance.now()-t});t=performance.now();
  await renderer.compileAsync(scene,camera);stages.push({name:'compile-async',ms:performance.now()-t});t=performance.now();
  // Actual render initializes depth/shadow variants and unseen geometry buffers. Loading veil is still present.
  renderer.render(scene,camera);stages.push({name:'first-all-mesh-render',ms:performance.now()-t});t=performance.now();
  // Explicit loading-only synchronization. This is CPU wait time, not a GPU timer query.
  renderer.getContext().finish();stages.push({name:'loading-gpu-sync',ms:performance.now()-t});
 }finally{for(const[o,value]of culling)o.frustumCulled=value}
 return{ms:performance.now()-start,stages,textures:textures.size,programs:renderer.info.programs?.length??0,parallelCompile:renderer.extensions.has('KHR_parallel_shader_compile'),method:'Texture initialization, compileAsync, all-mesh render and loading-only finish. Culling restored before play; simulation not stepped.'};
}
export function preparationVeil(parent:Element){const node=document.createElement('div');node.setAttribute('role','status');node.textContent='Preparing your drive…';node.style.cssText='position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#101820;color:#f4f4f4;font:600 20px system-ui';parent.append(node);return node}
