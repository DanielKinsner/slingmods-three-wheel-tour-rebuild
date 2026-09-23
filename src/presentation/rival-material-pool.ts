import * as THREE from 'three';
import {materialRole} from './vehicle-materials';

/** Only the fleet's immutable opaque trim. Paint, decals, displays, glass and emitters remain private. */
export function sharedRivalMaterial(source:THREE.Material,semantic:boolean){
 return semantic&&source instanceof THREE.MeshStandardMaterial&&!source.transparent&&source.opacity===1&&
  source.alphaTest===0&&!source.emissiveMap&&source.emissive.getHex()===0&&
  ['metal','rubber','interior'].includes(materialRole(source)??'');
}

/** Source identity is exact: independent cars reuse a private fleet copy, never the player's material. */
export class RivalMaterialPool {
 private entries=new Map<THREE.Material,{material:THREE.Material;users:number}>();
 acquire(source:THREE.Material){
  let entry=this.entries.get(source);
  if(!entry){entry={material:source.clone(),users:0};this.entries.set(source,entry)}
  entry.users++;return entry.material;
 }
 release(source:THREE.Material){
  const entry=this.entries.get(source);if(!entry)return;
  if(--entry.users===0){entry.material.dispose();this.entries.delete(source)}
 }
 inspect(){return{materials:this.entries.size,users:[...this.entries.values()].reduce((n,e)=>n+e.users,0)}}
}
