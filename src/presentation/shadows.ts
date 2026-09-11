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
