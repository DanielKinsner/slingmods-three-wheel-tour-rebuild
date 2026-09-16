import {Quaternion} from 'three';
import type {VehicleTelemetry} from '../simulation';
/** Rendering owns only its interpolated pose. Wheel/engine data remains read-only authoritative state. */
export class PresentationTelemetry {
 private target?:VehicleTelemetry;private position={x:0,y:0,z:0};private rotation={x:0,y:0,z:0,w:1};private from=new Quaternion();private to=new Quaternion();
 sample(previous:VehicleTelemetry,current:VehicleTelemetry,alpha:number){
  this.target??={...current};Object.assign(this.target,current);this.target.position=this.position;this.target.quaternion=this.rotation;
  for(const k of ['x','y','z'] as const)this.position[k]=previous.position[k]+(current.position[k]-previous.position[k])*alpha;
  this.from.set(previous.quaternion.x,previous.quaternion.y,previous.quaternion.z,previous.quaternion.w).slerp(this.to.set(current.quaternion.x,current.quaternion.y,current.quaternion.z,current.quaternion.w),alpha);
  Object.assign(this.rotation,{x:this.from.x,y:this.from.y,z:this.from.z,w:this.from.w});return this.target;
 }
}
