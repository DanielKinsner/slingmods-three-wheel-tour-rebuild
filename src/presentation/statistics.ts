import * as THREE from 'three';
export function assetStatistics(root:THREE.Object3D){
 let meshes=0,triangles=0,uvMeshes=0;const materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 root.traverse(o=>{if(o instanceof THREE.Mesh){meshes++;const g=o.geometry;triangles+=(g.index?.count??g.getAttribute('position').count)/3;if(g.getAttribute('uv'))uvMeshes++;for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value instanceof THREE.Texture)textures.add(value)}}});
 const textureInfo=[...textures].map(t=>{const image=t.image as {width?:number;height?:number}|undefined;const width=image?.width??0,height=image?.height??0;return {name:t.name,width,height,colorSpace:t.colorSpace,estimatedRGBA8WithMips:Math.ceil(width*height*4*4/3)}});
 return {textureEstimateMethod:'RGBA8 plus full mip chain for each distinct Three.Texture object; shared-image GPU allocations may be reused. Estimate only, excludes environment/targets/geometry.',meshes,triangles,uvMeshes,materials:[...materials].map(m=>({name:m.name,type:m.type})),textures:textureInfo,estimatedTextureBytes:textureInfo.reduce((n,t)=>n+t.estimatedRGBA8WithMips,0)};
}
export function measurePasses(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera,environment:THREE.Object3D){
 const shadow=renderer.shadowMap.enabled,visible=environment.visible;
 renderer.render(scene,camera);const sceneWithShadows={...renderer.info.render};
 environment.visible=false;renderer.shadowMap.enabled=false;renderer.render(scene,camera);const heroColorPass={...renderer.info.render};
 environment.visible=visible;renderer.shadowMap.enabled=shadow;renderer.render(scene,camera);
 return {sceneWithShadows,heroColorPass,method:'Renderer counters: full scene with shadows then same camera with environment meshes hidden and shadow pass disabled; restored immediately. No hardware frame-rate measurement.'};
}
