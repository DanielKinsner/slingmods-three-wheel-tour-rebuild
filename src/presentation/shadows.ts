import * as THREE from 'three';
import {PAD} from '../simulation/pad';
export type ShadowMode='legacy'|'vehicle-only'|'receivers-only'|'repaired';
const obstacles=new Set<string>([...PAD.obstacles.map(o=>o.id),...PAD.ramps.map(o=>o.id)]);
/** Floors/painted markings receive light and contact shadows, but are not occluders.
 * Legacy and isolation modes are retained only for explicit diagnostic captures. */
export function configureShadows(vehicle:THREE.Object3D,environment:THREE.Object3D,mode:ShadowMode='repaired',bay=false){
 const census:{name:string;caster:boolean;receiver:boolean}[]=[];
 vehicle.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=mode!=='receivers-only';o.receiveShadow=true;census.push({name:o.name,caster:o.castShadow,receiver:true})}});
 environment.traverse(o=>{if(o instanceof THREE.Mesh){o.receiveShadow=true;o.castShadow=mode==='legacy'||(mode==='repaired'&&!bay&&obstacles.has(o.name));census.push({name:o.name,caster:o.castShadow,receiver:true})}});
 return census;
}
/**
 * Drive scenes only. The sun's shadow map resolves about 6 cm per texel (1024 px across 60 m), so a part smaller than a
 * couple of texels cannot change the car's shadow, yet every caster is one more draw call in the shadow pass. The showroom
 * keeps every caster: its shadow camera is close enough to resolve them.
 */
export function trimSmallCasters(vehicle:THREE.Object3D,minimumMetres=.15){
 let kept=0,trimmed=0;vehicle.updateWorldMatrix(true,true);
 vehicle.traverse(o=>{if(!(o instanceof THREE.Mesh)||!o.castShadow)return;if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();const size=2*(o.geometry.boundingSphere?.radius??Infinity)*o.matrixWorld.getMaxScaleOnAxis();if(size<minimumMetres||o.userData.subTexelParts){o.castShadow=false;trimmed++}else kept++});
 return{kept,trimmed,minimumMetres};
}
