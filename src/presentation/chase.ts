import type {HandlingProfileId} from '../simulation/profile';
import * as THREE from 'three';
export const CHASE_TUNING={positionRate:10,targetRate:9,headingRate:8,viewRate:5,viewAngularSpeed:3,distanceRate:5,fovRate:3,nearDistance:6.4,farDistance:9,nearHeight:2.65,farHeight:3.8} as const;
const damp=(a:number,b:number,k:number,dt:number)=>THREE.MathUtils.lerp(a,b,1-Math.exp(-k*dt));
const shortest=(a:number,b:number)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a));
export class ChaseCamera {
 readonly target=new THREE.Vector3();private anchor=new THREE.Vector3();private initialized=false;private heading=0;private orbit=0;private distance=6.4;private height=2.65;
 constructor(readonly camera:THREE.PerspectiveCamera,readonly profileId:HandlingProfileId='legacy-p08a'){}
 update(position:THREE.Vector3,quaternion:THREE.Quaternion,speed:number,dt:number,far:boolean,lookBack:boolean,snap=false,obstruction?:(target:THREE.Vector3,desired:THREE.Vector3)=>number|undefined){
  dt=Math.min(.1,Math.max(0,Number.isFinite(dt)?dt:0));snap=snap||!this.initialized;this.initialized=true;
  const tuning=this.profileId==='legacy-p08a'?CHASE_TUNING:{...CHASE_TUNING,positionRate:16,headingRate:12,nearDistance:6,farDistance:8.4,nearHeight:2.4,farHeight:3.5};
  const yaw=new THREE.Euler().setFromQuaternion(quaternion,'YXZ').y;
  if(snap){this.anchor.copy(position);this.heading=yaw;this.orbit=lookBack?Math.PI:0;this.distance=far?tuning.farDistance:tuning.nearDistance;this.height=far?tuning.farHeight:tuning.nearHeight}
  else{this.anchor.lerp(position,1-Math.exp(-tuning.positionRate*dt));this.heading=damp(this.heading,shortest(this.heading,yaw),tuning.headingRate,dt);this.orbit+=THREE.MathUtils.clamp(damp(this.orbit,lookBack?Math.PI:0,tuning.viewRate,dt)-this.orbit,-tuning.viewAngularSpeed*dt,tuning.viewAngularSpeed*dt);this.distance=damp(this.distance,far?tuning.farDistance:tuning.nearDistance,tuning.distanceRate,dt);this.height=damp(this.height,far?tuning.farHeight:tuning.nearHeight,tuning.distanceRate,dt)}
  const desired=this.anchor.clone().add(new THREE.Vector3(Math.sin(this.heading+this.orbit)*this.distance,this.height,Math.cos(this.heading+this.orbit)*this.distance));
  const ahead=THREE.MathUtils.clamp(speed*.10,-1.0,2.2),lookDistance=lookBack?-.8:.9+ahead;
  const desiredTarget=position.clone().add(new THREE.Vector3(-Math.sin(this.heading)*lookDistance,.85,-Math.cos(this.heading)*lookDistance));
  if(snap)this.target.copy(desiredTarget);else this.target.lerp(desiredTarget,1-Math.exp(-tuning.targetRate*dt));
  const hit=obstruction?.(this.target,desired);if(hit!==undefined){const ray=desired.clone().sub(this.target);desired.copy(this.target).addScaledVector(ray.normalize(),Math.max(.5,hit-.3))}
  this.camera.position.copy(desired);this.camera.up.set(0,1,0);this.camera.lookAt(this.target);const fov=this.profileId==='legacy-p08a'?38+Math.min(Math.abs(speed)*.15,7):42+Math.min(Math.abs(speed)*.20,10);this.camera.fov=snap?fov:damp(this.camera.fov,fov,tuning.fovRate,dt);this.camera.updateProjectionMatrix();
  return {position:this.camera.position.toArray(),target:this.target.toArray(),fov:this.camera.fov,lookBack,far};
 }
}
