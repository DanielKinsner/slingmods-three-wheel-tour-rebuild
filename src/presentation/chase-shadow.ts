import * as THREE from 'three';
import type {GraphicsQuality} from './graphics-settings';
/** One bounded sun map. Contact occlusion supplies the detail beneath the tires. */
export const CHASE_SHADOW={low:{resolution:512,span:52,radius:1.4},medium:{resolution:1024,span:48,radius:1.6},high:{resolution:2048,span:48,radius:2.4},ultra:{resolution:2048,span:48,radius:2.4}} as const;
export class ChaseShadow {
 private right=new THREE.Vector3();private up=new THREE.Vector3();private focus=new THREE.Vector3();private offset=new THREE.Vector3();private quality?:GraphicsQuality;
 constructor(private sun:THREE.DirectionalLight,private direction:THREE.Vector3){
  this.right.crossVectors(new THREE.Vector3(0,1,0),direction).normalize();this.up.crossVectors(direction,this.right).normalize();
 }
 update(position:THREE.Vector3,camera:THREE.Vector3,quality:GraphicsQuality){
  const p=CHASE_SHADOW[quality],shadow=this.sun.shadow;
  if(this.quality!==quality){
   this.quality=quality;
   if(shadow.mapSize.x!==p.resolution){shadow.map?.dispose();shadow.map=null;shadow.mapSize.set(p.resolution,p.resolution)}
   Object.assign(shadow.camera,{left:-p.span/2,right:p.span/2,bottom:-p.span/2,top:p.span/2,near:.5,far:125});shadow.camera.updateProjectionMatrix();shadow.normalBias=.012;shadow.bias=-.00004;shadow.radius=p.radius;shadow.needsUpdate=true;
  }
  this.offset.copy(camera).sub(position);this.offset.y=0;this.offset.multiplyScalar(.3).clampLength(0,5);
  this.focus.copy(position).add(this.offset);
  // Snap in the light's plane: sub-texel movement cannot slide shadows across the bodywork.
  const texel=p.span/p.resolution,x=this.focus.dot(this.right),y=this.focus.dot(this.up);
  this.focus.addScaledVector(this.right,Math.round(x/texel)*texel-x).addScaledVector(this.up,Math.round(y/texel)*texel-y);
  this.sun.target.position.copy(this.focus);this.sun.position.copy(this.focus).addScaledVector(this.direction,65);
 }
 inspect(){const p=CHASE_SHADOW[this.quality??'high'];return{maps:1,quality:this.quality,resolution:this.sun.shadow.mapSize.x,span:this.sun.shadow.camera.right-this.sun.shadow.camera.left,texelMetres:p.span/p.resolution,radius:this.sun.shadow.radius,stabilized:!!this.quality,focus:this.focus.toArray()}}
}
