import * as THREE from 'three';
/**
 * Evidence only (never loaded for players): where a frame's draw calls go. `passes` wraps renderer.render for a short
 * window and records each top-level render with its target; `census` walks the scene and groups what the main camera
 * would draw by the scene's top-level branch, counting how many meshes share a geometry+material and could be one call.
 */
export function watchPasses(renderer:THREE.WebGLRenderer,renders=40){
 const original=renderer.render,passes:{target:string;camera:string;calls:number;triangles:number}[]=[];
 return new Promise<typeof passes>(done=>{renderer.render=function(scene:THREE.Object3D,camera:THREE.Camera){original.call(renderer,scene,camera);passes.push({target:renderer.getRenderTarget()?.texture.name||'screen',camera:camera.name||camera.type,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles});if(passes.length>=renders){renderer.render=original;done(passes)}} as typeof renderer.render});
}
export function census(scene:THREE.Scene,camera:THREE.Camera){
 camera.updateMatrixWorld();const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 const branches=new Map<string,{meshes:number;inView:number;casters:number;draws:number;pairs:Map<string,number>;triangles:number}>();
 const visible=(o:THREE.Object3D)=>{for(let p:THREE.Object3D|null=o;p;p=p.parent)if(!p.visible)return false;return true};
 scene.traverse(o=>{const mesh=o as THREE.Mesh;if(!(mesh.isMesh||(o as THREE.Points).isPoints||(o as THREE.Line).isLine)||!visible(o)||!o.layers.test(camera.layers))return;
  let top:THREE.Object3D=o;while(top.parent&&top.parent!==scene)top=top.parent;let second:THREE.Object3D=o;while(second.parent&&second.parent!==top)second=second.parent;
  const named:string[]=[];for(let q:THREE.Object3D|null=o.parent;q&&q!==scene;q=q.parent)if(q.name)named.unshift(q.name);const key=(!top.name||top.children.length>=40)&&named.length?named.slice(0,2).join(' / '):(top.name||top.type)+(o.userData.module?' / '+o.userData.module+(o.userData.lodCount>1?' lod'+o.userData.lodLevel:''):second!==top&&top.children.length<40?' / '+(second.name||second.type):''),entry=branches.get(key)??{meshes:0,inView:0,casters:0,draws:0,pairs:new Map(),triangles:0};branches.set(key,entry);
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material],seen=!mesh.frustumCulled||frustum.intersectsObject(mesh);entry.meshes++;if(o.castShadow)entry.casters++;
  if(seen){entry.inView++;entry.draws+=materials.length;const g=mesh.geometry,count=(g.index?g.index.count:g.getAttribute('position')?.count??0)/3;entry.triangles+=Math.round(count*((mesh as unknown as THREE.InstancedMesh).isInstancedMesh?(mesh as unknown as THREE.InstancedMesh).count:1));for(const m of materials){const pair=g.uuid+'|'+m.uuid;entry.pairs.set(pair,(entry.pairs.get(pair)??0)+1)}}});
 return[...branches].map(([branch,e])=>{const materials=new Set([...e.pairs.keys()].map(k=>k.split('|')[1]));return{branch,meshes:e.meshes,inView:e.inView,draws:e.draws,casters:e.casters,uniquePairs:e.pairs.size,uniqueMaterials:materials.size,triangles:e.triangles}}).sort((a,b)=>b.draws-a.draws);
}
