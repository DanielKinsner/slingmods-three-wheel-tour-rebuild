import {Simulation,steeringLimit,steeringRequest,steeringDemandForAngle,type HandlingProfileId,type VehicleTelemetry,type VehicleControl} from '../src/simulation';
import type {EnvironmentDefinition} from '../src/course/environment';
export const MOTION_PAD:EnvironmentDefinition={ground:{center:[0,-.15,0],size:[6000,.3,6000]},obstacles:[],ramps:[],surfaceAt:()=>({id:'asphalt',mu:1.05,rolling:.014})};
export const yaw=(q:VehicleTelemetry['quaternion'])=>Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.y*q.y+q.z*q.z));
export const clamp=(v:number,lo=-1,hi=1)=>Math.max(lo,Math.min(hi,v));
export type SweeperSpec={mph:number;radius:number;direction:1|-1;duration?:number};
/** Evidence-only controller. It supplies pedals/steering to real simulation;
 * never writes position, velocity, yaw, forces or telemetry. Same gains and
 * target geometry for historical/current profiles. Not included in gameplay. */
export class SweeperProtocol {
 readonly speed:number;entry:VehicleTelemetry|null=null;elapsed=0;integral=0;speedIntegral=0;
 constructor(readonly profile:HandlingProfileId,readonly spec:SweeperSpec){this.speed=spec.mph*.44704}
 get finished(){return !!this.entry&&this.elapsed>=(this.spec.duration??12)}
 control(t:VehicleTelemetry):VehicleControl{
  if(!this.entry&&t.speed>=this.speed-.05)this.entry=structuredClone(t);
  if(!this.entry)return {throttle:1,brake:0,steer:0,reverse:false,tractionControl:true};
  const d=this.spec.direction,r=this.spec.radius,cx=this.entry.position.x-d*r,cz=this.entry.position.z;
  const phi=Math.atan2(-(t.position.z-cz),d*(t.position.x-cx)),look=10+Math.max(0,t.speed)*.25,targetPhi=phi+look/r;
  const tx=cx+d*r*Math.cos(targetPhi),tz=cz-r*Math.sin(targetPhi),dx=tx-t.position.x,dz=tz-t.position.z,a=yaw(t.quaternion),forward=-Math.sin(a)*dx-Math.cos(a)*dz,left=-Math.cos(a)*dx+Math.sin(a)*dz;
  const headingError=Math.atan2(left,forward),desired=Math.atan2(2*2.667*Math.sin(headingError),Math.hypot(dx,dz));
  // Integral of measured yaw deficit supplies the model's slip angle; bounded
  // against windup. The same physical wheel-angle request is inverse-mapped.
  const yawError=d*Math.max(0,t.speed)/r-t.angularVelocity.y;
  const radialError=d*(Math.hypot(t.position.x-cx,t.position.z-cz)-r);
  this.integral=clamp(this.integral+(yawError*.045+radialError*.0008)/60,-.08,.08);
  this.speedIntegral=clamp(this.speedIntegral+(this.speed-t.speed)/60*.12,0,.9);
  this.elapsed+=1/60;
  return {throttle:clamp(.20+(this.speed-t.speed)*.4+this.speedIntegral,0,1),brake:0,steer:steeringDemandForAngle(desired+this.integral,t.speed,this.profile),reverse:false,tractionControl:true};
 }
 sample(t:VehicleTelemetry,c:VehicleControl){const e=this.entry,d=this.spec.direction,r=this.spec.radius,cx=e?e.position.x-d*r:0,cz=e?.position.z??0;return {elapsed:this.elapsed,scored:!!e&&this.elapsed>=4,error:e?Math.hypot(t.position.x-cx,t.position.z-cz)-r:0,speedErrorFraction:(t.speed-this.speed)/this.speed,command:{demand:c.steer,device:'evidence-analog-control-only',beforeSpeed:c.steer*.6,beforeBrake:c.steer*steeringLimit(t.speed,this.profile),requested:steeringRequest(c.steer,t.speed,this.profile,c.brake),actual:t.steer,visualHandWheel:t.steer*10,visualRatio:10,saturated:Math.abs(c.steer)>=.999},intervention:'none',input:c,telemetry:t}}
}
export async function createSweeper(profile:HandlingProfileId,spec:SweeperSpec){const sim=await Simulation.create(MOTION_PAD,profile);sim.reset({x:0,y:.025,z:35});sim.enableDiagnostics();return {sim,protocol:new SweeperProtocol(profile,spec)}}
