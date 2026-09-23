import {wheelAngularSpeed} from './drivetrain';
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
/** Estimated curve bounded by BRP's published 79.1 Nm and 61.1 kW peaks. */
export function rykerTorque(rpm:number){return Math.min(79.1,61100/Math.max(1,rpm*Math.PI/30),clamp(79.1-.0000018*(rpm-6500)**2,35,79.1))}
export const RYKER_CVT=Object.freeze({idle:1050,redline:8500,finalDrive:7.6,minRatio:.62,maxRatio:3.0,efficiency:.88,reverseLimit:5.5,provenance:'Estimated clutch, ratio range, response, idle/redline and final reduction; BRP specifies CVT/reverse/shaft, not these ratios.'});
export class RykerCVT {
 gear=1;rpm:number=RYKER_CVT.idle;inputWheelAngularSpeed=0;shiftRemaining=0;reversePending=false;ratio:number=RYKER_CVT.maxRatio;clutch=0;
 reset(){this.gear=1;this.rpm=RYKER_CVT.idle;this.inputWheelAngularSpeed=0;this.shiftRemaining=0;this.reversePending=false;this.ratio=RYKER_CVT.maxRatio;this.clutch=0}
 step(speed:number,overspeed:number,radius:number,requestedThrottle:number,requestedBrake:number,reverse:boolean,dt:number){
  let throttle=requestedThrottle,brake=requestedBrake;
  this.reversePending=reverse!==(this.gear<0);
  if(this.reversePending&&Math.abs(speed)<.35){this.gear=reverse?-1:1;this.reversePending=false;this.clutch=0}
  if(this.reversePending){throttle=0;brake=Math.max(brake,.65)}
  this.inputWheelAngularSpeed=wheelAngularSpeed(speed,overspeed,radius);
  const wheelRpm=Math.abs(this.inputWheelAngularSpeed)*30/Math.PI;
  const requestedRpm=throttle>.01?3200+throttle*4600:RYKER_CVT.idle;
  const desiredRatio=clamp(requestedRpm/Math.max(1,wheelRpm*RYKER_CVT.finalDrive),RYKER_CVT.minRatio,RYKER_CVT.maxRatio);
  this.ratio+=clamp(desiredRatio-this.ratio,-2.0*dt,2.8*dt);
  const coupled=wheelRpm*this.ratio*RYKER_CVT.finalDrive;
  const launch=RYKER_CVT.idle+throttle*2800*clamp(1-Math.abs(speed)/7,0,1);
  const target=Math.max(RYKER_CVT.idle,coupled,launch);
  this.rpm+=clamp(target-this.rpm,-6500*dt,6500*dt);this.rpm=clamp(this.rpm,RYKER_CVT.idle,RYKER_CVT.redline);
  this.clutch=clamp((this.rpm-1500)/1400,0,1);
  const direction=this.gear<0?-1:1,limiter=this.gear<0?clamp((RYKER_CVT.reverseLimit-Math.abs(speed))/1.4,0,1):clamp((8500-coupled)/350,0,1);
  const torque=rykerTorque(this.rpm)*throttle*this.clutch;
  // Launch slip dissipates power; it cannot create it. Wheel output also respects the engine power bound.
  const force=Math.min(torque*this.ratio*RYKER_CVT.finalDrive*RYKER_CVT.efficiency/radius,torque*this.rpm*Math.PI/30*RYKER_CVT.efficiency/Math.max(.5,Math.abs(speed)))*direction*limiter;
  return {force,throttle,brake};
 }
}
