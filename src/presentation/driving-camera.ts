import * as THREE from 'three';import {ChaseCamera} from './chase';
export type DrivingView='near'|'far'|'cockpit';
export const nextDrivingView=(v:DrivingView):DrivingView=>v==='near'?'far':v==='far'?'cockpit':'near';
/** Follow history always advances, even behind the deliberate quick glance. */
export class DrivingCamera {
 readonly target=new THREE.Vector3();private followCamera=new THREE.PerspectiveCamera(38,1,.08,850);private follow=new ChaseCamera(this.followCamera);private cockpitDirection=new THREE.Vector3(0,0,-1);private initialized=false;
 cockpitPitch=-.43;cockpitFov=66;eye=new THREE.Vector3(-.43,1.12,.48);activeView:DrivingView|'rearward'='near';
 constructor(readonly camera:THREE.PerspectiveCamera){}
 update(p:THREE.Vector3,q:THREE.Quaternion,speed:number,dt:number,mode:DrivingView,lookBack:boolean,snap=false,obstruction?:(target:THREE.Vector3,desired:THREE.Vector3)=>number|undefined){
  const reset=snap||!this.initialized;this.initialized=true;this.followCamera.aspect=this.camera.aspect;this.follow.update(p,q,speed,dt,mode==='far',false,reset,obstruction);
  const euler=new THREE.Euler().setFromQuaternion(q,'YXZ'),yaw=euler.y,orientation=new THREE.Quaternion().setFromEuler(new THREE.Euler(euler.x*.35,yaw,euler.z*.12,'YXZ'));
  const forward=new THREE.Vector3(0,this.cockpitPitch,-1).normalize().applyQuaternion(orientation);if(reset)this.cockpitDirection.copy(forward);else this.cockpitDirection.lerp(forward,1-Math.exp(-24*Math.max(0,dt))).normalize();
  const eye=p.clone().add(this.eye.clone().applyQuaternion(q));
  if(lookBack){
   // Intentionally cut to an exterior rear-facing glance above the tail, never orbit through the car.
   const turn=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),origin=p.clone().add(new THREE.Vector3(0,1.58,0));
   const desired=p.clone().add(new THREE.Vector3(0,1.58,1.85).applyQuaternion(turn));const hit=obstruction?.(origin,desired);if(hit!==undefined)desired.copy(origin).addScaledVector(desired.clone().sub(origin).normalize(),Math.max(.15,hit-.3));
   this.camera.position.copy(desired);this.target.copy(desired).add(new THREE.Vector3(0,-.15,12).applyQuaternion(turn));this.camera.fov=58;this.activeView='rearward';
  }else if(mode==='cockpit'){this.camera.position.copy(eye);this.target.copy(eye).addScaledVector(this.cockpitDirection,12);this.camera.fov=this.cockpitFov;this.activeView='cockpit'}
  else{this.camera.position.copy(this.followCamera.position);this.target.copy(this.follow.target);this.camera.fov=this.followCamera.fov;this.activeView=mode}
  this.camera.up.set(0,1,0);this.camera.lookAt(this.target);this.camera.updateProjectionMatrix();return{mode,activeView:this.activeView,position:this.camera.position.toArray(),target:this.target.toArray(),fov:this.camera.fov};
 }
}
