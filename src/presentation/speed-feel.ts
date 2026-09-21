import * as THREE from 'three';
import type {VehicleTelemetry} from '../simulation';
import type {DrivingView} from './driving-camera';

/**
 * Speed-reactive camera layer applied AFTER DrivingCamera.
 * The car must not shrink as the view widens: `carSize` is how big it stays on screen relative to the validated chase
 * camera (92% at rest, 80% at top speed). Distance is solved from that, so a wider FOV brings the camera CLOSER (a dolly
 * zoom): the edges of the frame stretch and rush, the car holds its place. Throttle and braking only add a small trail/tuck. It only re-poses the presentation camera: no physics, input,
 * timing or record is touched. With reduced motion it does nothing at all and the validated camera is used as-is.
 * Everything is spring-damped; nothing snaps except on an explicit reset.
 */
export const SPEED_FEEL={topSpeedMph:120,restFov:55,topFov:78,cockpitFov:[66,75],carSize:[.92,.8],trail:.45,brakeTuck:.5,drop:.35,lookToVelocity:.6,yawLead:.22,rollPerG:1.25,maxRoll:2,blurFromMph:70,shakeFromMph:90,shakePixels:[.5,1.5],roughShakePixels:3.2} as const;
const MPH=2.23694,damp=(a:number,b:number,rate:number,dt:number)=>a+(b-a)*(1-Math.exp(-rate*dt)),ease=(x:number)=>{const t=THREE.MathUtils.clamp(x,0,1);return t*t*(3-2*t)};
export function motionReduced(){let reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;try{const stored=localStorage.getItem('slingmods-signature-motion');if(stored==='reduced')reduced=true;else if(stored==='full')reduced=false}catch{/* storage may be unavailable */}return reduced}

export class SpeedFeel {
 /** 0..1 strength of the screen-edge blur for the post pass; rises from 70 mph to top speed. */
 edgeBlur=0;
 private fov=0;private reach=0;private drop=0;private roll=0;private drive=0;private rough=0;private time=0;private initialized=false;private look=new THREE.Vector3();
 private forward=new THREE.Vector3();private velocity=new THREE.Vector3();private offset=new THREE.Vector3();private q=new THREE.Quaternion();private up=new THREE.Vector3(0,1,0);private lean=new THREE.Vector3();
 constructor(public reducedMotion=motionReduced()){}
 inspect(){return{reducedMotion:this.reducedMotion,fov:this.fov,reach:this.reach,drop:this.drop,rollDegrees:this.roll,edgeBlur:this.edgeBlur,rough:this.rough,tuning:SPEED_FEEL}}
 /**
  * @param target the point DrivingCamera aimed at; moved toward where the car is actually GOING.
  * @param obstruction optional ray test (target -> desired camera) so the extra pull-back never passes through scenery.
  */
 apply(camera:THREE.PerspectiveCamera,target:THREE.Vector3,t:VehicleTelemetry,view:DrivingView|'rearward',dt:number,viewportHeight:number,reset=false,obstruction?:(target:THREE.Vector3,desired:THREE.Vector3)=>number|undefined){
  if(this.reducedMotion||view==='rearward'){this.edgeBlur=0;this.initialized=false;return}
  dt=Math.min(.1,Math.max(0,Number.isFinite(dt)?dt:0));this.time+=dt;const snap=reset||!this.initialized;this.initialized=true;
  const mph=Math.abs(t.speed)*MPH,s=ease(mph/SPEED_FEEL.topSpeedMph),yawRate=t.angularVelocity.y,lateralG=THREE.MathUtils.clamp(t.speed*yawRate/9.81,-1.6,1.6);
  this.q.set(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w);this.forward.set(0,0,-1).applyQuaternion(this.q).setY(0).normalize();
  const drive=t.throttle-t.brake,rough=t.wheels.some(w=>w.contact&&w.surface!=='asphalt')&&mph>12?1:0;
  this.drive=snap?drive:damp(this.drive,drive,3,dt);this.rough=snap?rough:damp(this.rough,rough,rough?14:6,dt);
  const cockpit=view==='cockpit',baseFov=camera.fov,fov=cockpit?THREE.MathUtils.lerp(SPEED_FEEL.cockpitFov[0],SPEED_FEEL.cockpitFov[1],s):THREE.MathUtils.lerp(SPEED_FEEL.restFov,SPEED_FEEL.topFov,Math.pow(s,.85))+Math.max(0,this.drive)*2*s;
  const reach=cockpit?0:s*(.33+.67*Math.max(0,this.drive))*SPEED_FEEL.trail-SPEED_FEEL.brakeTuck*Math.max(0,-this.drive)*Math.min(1,s*2.2),drop=cockpit?0:SPEED_FEEL.drop*s,roll=THREE.MathUtils.clamp(lateralG*SPEED_FEEL.rollPerG,-SPEED_FEEL.maxRoll,SPEED_FEEL.maxRoll)*(cockpit?-.6:1);
  this.fov=snap?fov:damp(this.fov,fov,2.6,dt);this.reach=snap?reach:damp(this.reach,reach,3.2,dt);this.drop=snap?drop:damp(this.drop,drop,2.4,dt);this.roll=snap?roll:damp(this.roll,roll,4.5,dt);
  if(cockpit){
   // Head, not camera rig: g pushes it outward and forward under braking, with a faint road buzz that grows with speed.
   this.lean.set(lateralG*.028,Math.sin(this.time*57)*.0035*s+Math.sin(this.time*23.7)*.002*s,-this.drive*.022*Math.min(1,s*3)).applyQuaternion(this.q);camera.position.add(this.lean);target.add(this.lean);
  }else{
   // Look where the car is going (velocity), leading slightly into the turn, rather than where the nose points.
   this.velocity.set(t.velocity.x,0,t.velocity.z);const moving=Math.min(1,this.velocity.length()/10);
   if(moving>.05){this.velocity.normalize();if(this.velocity.dot(this.forward)<0)this.velocity.negate();this.look.copy(this.forward).lerp(this.velocity,SPEED_FEEL.lookToVelocity*moving).applyAxisAngle(this.up,yawRate*SPEED_FEEL.yawLead*moving).normalize()}else this.look.copy(this.forward);
   const ahead=Math.hypot(target.x-t.position.x,target.z-t.position.z),wanted=this.offset.set(t.position.x+this.look.x*ahead,target.y,t.position.z+this.look.z*ahead);if(snap)target.copy(wanted);else target.lerp(wanted,Math.min(1,moving));
   // Trail further and sit lower with speed and throttle; tuck in under braking.
   // Apparent size goes with 1/(distance*tan(fov/2)). Hold it at `carSize` of what the validated camera showed.
   this.offset.copy(camera.position).sub(target);const length=this.offset.length(),held=length*Math.tan(THREE.MathUtils.degToRad(baseFov)/2)/Math.tan(THREE.MathUtils.degToRad(this.fov)/2)/THREE.MathUtils.lerp(SPEED_FEEL.carSize[0],SPEED_FEEL.carSize[1],s),desired=this.offset.multiplyScalar(Math.max(2.6,held+this.reach)/Math.max(length,1e-6)).add(target);desired.y=Math.max(target.y-.2,desired.y-this.drop);
   const hit=desired.distanceTo(target)>length?obstruction?.(target,desired):undefined;if(hit!==undefined&&hit<desired.distanceTo(target))desired.sub(target).setLength(Math.max(.5,hit-.3)).add(target);
   camera.position.copy(desired);
  }
  camera.fov=this.fov;camera.up.set(0,1,0);camera.lookAt(target);camera.rotateZ(THREE.MathUtils.degToRad(this.roll));
  // Shake is sized in screen pixels so it reads the same at any FOV or resolution: 0.5 to 1.5 px above 90 mph, more off the asphalt.
  const fast=THREE.MathUtils.clamp((mph-SPEED_FEEL.shakeFromMph)/(SPEED_FEEL.topSpeedMph-SPEED_FEEL.shakeFromMph),0,1),pixels=(mph>SPEED_FEEL.shakeFromMph?THREE.MathUtils.lerp(SPEED_FEEL.shakePixels[0],SPEED_FEEL.shakePixels[1],fast):0)+this.rough*SPEED_FEEL.roughShakePixels*Math.min(1,mph/45);
  if(pixels>0){const radians=pixels*THREE.MathUtils.degToRad(this.fov)/Math.max(1,viewportHeight),k=this.time;camera.rotateX(radians*(Math.sin(k*83.1)*.6+Math.sin(k*131.7+1.3)*.4));camera.rotateY(radians*(Math.sin(k*97.3+.7)*.6+Math.sin(k*149.9)*.4))}
  camera.updateProjectionMatrix();this.edgeBlur=ease((mph-SPEED_FEEL.blurFromMph)/(SPEED_FEEL.topSpeedMph-SPEED_FEEL.blurFromMph));
 }
}
