import {wheelAngularSpeed} from './drivetrain';
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
/** Estimated curve through published 130.1 Nm/5000 RPM and 85.8 kW/7250 RPM anchors. */
export function spyderTorque(rpm:number){const points=[[0,65],[1200,82],[2500,108],[4000,125],[5000,130.1],[6000,125],[7250,85800/(7250*Math.PI/30)],[8200,94]];const i=Math.max(1,points.findIndex(p=>p[0]>=rpm));const a=points[i-1],b=points[i];return Math.min(130.1,85800/Math.max(1,rpm*Math.PI/30),rpm>8200?94:a[1]+(b[1]-a[1])*clamp((rpm-a[0])/(b[0]-a[0]),0,1))}
/** Ratios, clutch, idle, redline and shift controller are game estimates, not BRP calibration. */
export const SPYDER_SE6=Object.freeze({ratios:[3.05,2.12,1.59,1.28,1.08,.94] as readonly number[],reverse:2.8,finalDrive:5.15,idle:1000,redline:8100,efficiency:.9,shiftSeconds:.22,reverseLimit:5.0,autoShiftAssist:true});
export class SpyderSE6 {
 gear=1;rpm=1000;inputWheelAngularSpeed=0;shiftRemaining=0;reversePending=false;clutch=0;private cooldown=0;
 reset(){this.gear=1;this.rpm=1000;this.inputWheelAngularSpeed=0;this.shiftRemaining=0;this.reversePending=false;this.clutch=0;this.cooldown=0}
 step(speed:number,overspeed:number,radius:number,throttle:number,brake:number,reverse:boolean,dt:number){
  this.reversePending=reverse!==(this.gear<0);
  if(this.reversePending&&Math.abs(speed)<.3){this.gear=reverse?-1:1;this.reversePending=false;this.shiftRemaining=.3;this.clutch=0}
  if(this.reversePending){throttle=0;brake=Math.max(brake,.65)}
  this.inputWheelAngularSpeed=wheelAngularSpeed(speed,overspeed,radius);
  const wheelRPM=Math.abs(this.inputWheelAngularSpeed)*30/Math.PI,ratio=()=>this.gear<0?SPYDER_SE6.reverse:SPYDER_SE6.ratios[this.gear-1];
  this.cooldown=Math.max(0,this.cooldown-dt);this.shiftRemaining=Math.max(0,this.shiftRemaining-dt);
  const coupled=wheelRPM*ratio()*SPYDER_SE6.finalDrive;
  if(this.gear>0&&!this.reversePending&&this.cooldown===0&&this.shiftRemaining===0){const up=throttle>.65?7100:throttle>.15?4800:3600,down=throttle>.5?2800:1600;let next=this.gear;if(coupled>up&&this.gear<6)next++;else if(coupled<down&&this.gear>1)next--;if(next!==this.gear){this.gear=next;this.shiftRemaining=SPYDER_SE6.shiftSeconds;this.cooldown=.7}}
  const engaged=wheelRPM*ratio()*SPYDER_SE6.finalDrive,target=Math.max(1000,engaged,1000+throttle*2000*clamp(1-Math.abs(speed)/5,0,1));
  this.rpm=clamp(this.rpm+clamp(target-this.rpm,-8000*dt,6000*dt),1000,8100);
  const shiftGain=this.shiftRemaining>0?0:1;this.clutch=clamp((this.rpm-1100)/1100,0,1)*shiftGain;
  const torque=spyderTorque(this.rpm)*throttle*this.clutch,limit=this.gear<0?clamp((5-Math.abs(speed))/1.2,0,1):clamp((8100-engaged)/350,0,1);
  const force=Math.min(torque*ratio()*SPYDER_SE6.finalDrive*.9/radius,torque*this.rpm*Math.PI/30*.9/Math.max(.5,Math.abs(speed)))*(this.gear<0?-1:1)*limit;
  return {force,throttle,brake};
 }
}
