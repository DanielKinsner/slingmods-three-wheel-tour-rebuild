import * as THREE from 'three';
import {linkTransform} from './rear';
import type {WheelTelemetry} from '../simulation';
type Link={side:'left'|'right';a:number[];b:number[]};
/** The existing wheel contacts drive authored visual endpoints only. */
export class FrontLinks {
 private links:{node:THREE.Object3D;rest:THREE.Matrix4;link:Link}[]=[];
 constructor(private root:THREE.Object3D){
  root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert();
  root.traverse(node=>{const link=node.userData.model01FrontLink as Link|undefined;if(link)this.links.push({node,rest:inverse.clone().multiply(node.matrixWorld),link})});
 }
 update(wheels:Pick<WheelTelemetry,'localCenter'>[]){
  this.root.updateWorldMatrix(true,false);
  for(const {node,rest,link}of this.links){
   const wheel=wheels[link.side==='left'?0:1],a=new THREE.Vector3().fromArray(link.a),b=new THREE.Vector3().fromArray(link.b),end=b.clone();end.y+=wheel.localCenter.y-.32985;
   node.parent!.updateWorldMatrix(true,false);node.matrixAutoUpdate=false;
   node.matrix.copy(node.parent!.matrixWorld).invert().multiply(this.root.matrixWorld).multiply(linkTransform(a,b,a,end)).multiply(rest);node.matrixWorldNeedsUpdate=true;
  }
 }
}
