import * as THREE from 'three';
import type {VehicleTelemetry,WheelTelemetry} from '../simulation';
import layout from '../../public/assets/slingshot-contact-layout.json';
export const isRyker=(car:THREE.Object3D)=>!!car.getObjectByName('ryker_foundation');
/** Rigid animation in authored metric coordinates; never change the simulation or stretch the bike. */
export class RykerMotion {
 private wheels: {carrier:THREE.Object3D;spin:THREE.Object3D;rest:THREE.Vector3}[];
 private handle:THREE.Object3D;private axis=new THREE.Vector3(0,.968,-.251).normalize();private base:THREE.Quaternion;
 private report:unknown={};
 constructor(private car:THREE.Object3D){this.wheels=['front_left','front_right','rear'].map(id=>{const carrier=car.getObjectByName(id==='rear'?'rear_carrier':id+'_steer')!,spin=car.getObjectByName(id+'_spin')!;return {carrier,spin,rest:carrier.position.clone()}});this.handle=car.getObjectByName('steering_control')!;this.base=this.handle.quaternion.clone()}
 pose(t:VehicleTelemetry){
  this.wheels.forEach((b,i)=>{const w=t.wheels[i];b.carrier.position.copy(b.rest);b.carrier.position.y+=w.localCenter.y-layout.wheels[i].center[1];b.carrier.rotation.y=i<2?w.steer:0;
   // Match rolling distance, not the larger Slingshot tire's angular speed.
   b.spin.rotation.x=-w.spin*layout.wheels[i].radius/(i===2?.2851:.2848);
  });this.handle.quaternion.copy(this.base).multiply(new THREE.Quaternion().setFromAxisAngle(this.axis,t.steer));
  this.report={kind:'ryker-rigid',wheelbase:1.709,physicsWheelbase:layout.wheelbase,physicsContactMismatch:true,handlebarAngle:t.steer,calipersSpin:false,fendersSpin:false,rearSuspension:'mechanical group rigid; rear wheel translates cosmetically'};
 }
 update(_wheel:Pick<WheelTelemetry,'localCenter'|'spin'>){}
 inspect():any{return this.report}
}
