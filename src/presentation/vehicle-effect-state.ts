import type {VehicleTelemetry,WheelTelemetry} from '../simulation';
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
/** Presentation thresholds only. No state or force is written into the simulation. */
export function tireActivity(w:WheelTelemetry,speed:number,wet:boolean){
 if(!w.contact||w.load<20)return 0;
 const moving=Math.max(Math.abs(speed),Math.abs(w.angularSpeed)*(w.id==='rear'?.3455:.32985));
 if(moving<2)return 0;
 if(w.surface!=='asphalt')return clamp((moving-2)/15);
 if(wet)return clamp((Math.abs(speed)-4)/22);
 return clamp(Math.max((Math.abs(w.slipAngle)-.11)/.24,(Math.abs(w.slipRatio)-.17)/.55));
}
export function skidActivity(w:WheelTelemetry,speed:number,wet:boolean){return !wet&&w.surface==='asphalt'?tireActivity(w,speed,false):0}
export class VehicleEffectState {
 heat=0;previousThrottle=0;cooldown=0;flame=false;
 update(t:VehicleTelemetry,dt:number,exhaust:boolean,reduced:boolean){
  this.flame=false;if(dt<=0)return;
  this.cooldown=Math.max(0,this.cooldown-dt);
  const work=t.brake*Math.min(1,Math.abs(t.speed)/28)*(t.wheels.some(w=>w.contact)?1:0);
  this.heat=clamp(this.heat+dt*(work*.28-.065));
  if(exhaust&&!reduced&&this.cooldown===0&&this.previousThrottle>.55&&t.throttle<.12&&t.rpm>3800&&Math.abs(t.speed)>5){this.flame=true;this.cooldown=1.3}
  this.previousThrottle=t.throttle;
 }
 reset(t:VehicleTelemetry){this.previousThrottle=t.throttle;this.cooldown=0;this.flame=false;this.heat=0}
}
