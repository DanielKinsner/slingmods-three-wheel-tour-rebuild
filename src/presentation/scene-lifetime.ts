import * as THREE from 'three';
/** Own resources as soon as they exist, including loads that finish after navigation. */
export class SceneLifetime {
 private active=true;private cleanups:(()=>void)[]=[];
 constructor(){addEventListener('pagehide',()=>this.dispose(),{once:true})}
 own<T>(value:T,cleanup:(v:T)=>void):T{if(!this.active){cleanup(value);throw new DOMException('Page left during loading','AbortError')}this.cleanups.push(()=>cleanup(value));return value}
 async load<T>(work:Promise<T>,cleanup:(v:T)=>void){return this.own(await work,cleanup)}
 dispose(){if(!this.active)return;this.active=false;for(const f of this.cleanups.reverse())try{f()}catch{}this.cleanups=[]}
}
export function disposeGraph(root:THREE.Object3D){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v instanceof THREE.Texture)textures.add(v)}}if(o instanceof THREE.SkinnedMesh)o.skeleton.dispose()});textures.forEach(v=>v.dispose());materials.forEach(v=>v.dispose());geometries.forEach(v=>v.dispose())}
