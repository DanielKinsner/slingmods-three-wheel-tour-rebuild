import {handlingProfile,type HandlingProfileId} from './profile';
export const DRIVETRAIN={ratios:[3.6,2.19,1.41,1,0.83],finalDrive:3.73,efficiency:0.88,idle:950,redline:8500,shiftSeconds:0.24} as const;
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
/** Estimated naturally aspirated curve, Nm. No measured/manufacturer torque assertion. */
export const engineTorque=(rpm:number)=>clamp(180-0.0000038*(rpm-5500)**2,80,180);
/** Signed angular-speed calculation shared by powertrain coupling and wheel presentation. */
export const wheelAngularSpeed=(longitudinalSpeed:number,overspeed:number,radius:number)=>longitudinalSpeed/radius+overspeed;
export class AutoDrive {
 constructor(readonly profileId:HandlingProfileId='legacy-p08a'){}
 private get tune(){return handlingProfile(this.profileId)}
 gear=1;rpm:number=DRIVETRAIN.idle;inputWheelAngularSpeed=0;shiftRemaining=0;reversePending=false;private shiftTarget=1;
 reset():void{this.gear=1;this.rpm=DRIVETRAIN.idle;this.inputWheelAngularSpeed=0;this.shiftRemaining=0;this.shiftTarget=1;this.reversePending=false}
 step(speed:number,rearOverspeed:number,radius:number,requestedThrottle:number,requestedBrake:number,reverse:boolean,dt:number){
  let throttle=requestedThrottle,brake=requestedBrake;
  this.reversePending=reverse!==(this.gear<0);
  if(this.reversePending&&Math.abs(speed)<0.5){this.gear=reverse?-1:1;this.shiftRemaining=this.tune.shiftSeconds;this.shiftTarget=this.gear;this.reversePending=false}
  if(this.reversePending){throttle=0;brake=Math.max(brake,0.6)}
  if(this.shiftRemaining>0){this.shiftRemaining=Math.max(0,this.shiftRemaining-dt);if(this.shiftRemaining===0)this.gear=this.shiftTarget}
  const ratio=this.gear<0?3.5:DRIVETRAIN.ratios[this.gear-1];
  // Tick-start body-forward speed remains the existing longitudinal approximation.
  this.inputWheelAngularSpeed=wheelAngularSpeed(speed,rearOverspeed,radius);
  const wheelRpm=Math.abs(this.inputWheelAngularSpeed)*60/(2*Math.PI);
  const targetRpm=Math.max(DRIVETRAIN.idle,wheelRpm*ratio*DRIVETRAIN.finalDrive,DRIVETRAIN.idle+throttle*1300*(1-clamp(Math.abs(speed)/5,0,1)));
  // Rate-limited crank response is the initial clutch/rotational-inertia approximation.
  this.rpm+=clamp(targetRpm-this.rpm,-10000*dt,10000*dt);this.rpm=clamp(this.rpm,DRIVETRAIN.idle,DRIVETRAIN.redline);
  if(this.shiftRemaining===0&&this.gear>0){if(this.rpm>6900&&this.gear<5){this.shiftTarget=this.gear+1;this.shiftRemaining=this.tune.shiftSeconds}else if(this.rpm<2500&&this.gear>1){this.shiftTarget=this.gear-1;this.shiftRemaining=this.tune.shiftSeconds}}
  const force=this.shiftRemaining>0||this.rpm>8400?0:(this.profileId==='legacy-p08a'?engineTorque(this.rpm):engineTorque(this.rpm)*this.tune.torqueScale)*throttle*ratio*DRIVETRAIN.finalDrive*DRIVETRAIN.efficiency/radius*(this.gear<0?-1:1)*(this.gear<0?clamp((6+speed)/2,0,1):1);
  return {force,throttle,brake};
 }
}
