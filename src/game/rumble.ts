import type {VehicleTelemetry} from '../simulation';
import {inputKind} from './shell';
/**
 * Controller rumble from the driving telemetry (Gamepad API dual-rumble; silently absent where unsupported).
 *  - kerbs and off-road surfaces: light continuous buzz;
 *  - suspension hits: a thump sized by how fast the travel changed;
 *  - impacts: a sharp pulse when the car loses speed far faster than braking can explain;
 *  - wheelspin / lock-up: weak motor texture from slip;
 *  - engine near the limiter: faint high-frequency tickle.
 * Presentation only. Plays only while a controller is the active device and the option is on.
 */
const KEY='slingmods-gx-rumble';
export function rumbleEnabled(){try{return localStorage.getItem(KEY)!=='off'}catch{return true}}
export function setRumbleEnabled(on:boolean){try{localStorage.setItem(KEY,on?'on':'off')}catch{/* session default */}}
type Actuator={playEffect?(type:string,params:{duration:number;startDelay?:number;strongMagnitude:number;weakMagnitude:number}):Promise<unknown>;reset?():Promise<unknown>};
const actuator=():Actuator|null=>{const pad=(Array.from(navigator.getGamepads?.()??[]) as (Gamepad|null)[]).find(p=>p?.connected&&p.mapping==='standard');return (pad as (Gamepad&{vibrationActuator?:Actuator})|undefined)?.vibrationActuator??null};
export function pulse(strong:number,weak:number,ms:number){if(!rumbleEnabled()||inputKind()!=='pad')return;void actuator()?.playEffect?.('dual-rumble',{duration:ms,strongMagnitude:Math.min(1,strong),weakMagnitude:Math.min(1,weak)})?.catch(()=>{})}
export class Rumble {
 private travel:number[]=[];private speed=0;private at=0;private hold=0;
 /** Call once per rendered frame with the current player telemetry. */
 update(t:VehicleTelemetry,dt:number,active:boolean){
  if(!active||dt<=0||!rumbleEnabled()||inputKind()!=='pad'){this.travel=t.wheels.map(w=>w.travel);this.speed=t.speed;return}
  const now=performance.now();
  // Impacts: deceleration beyond ~1.6 g that braking alone does not explain.
  const decel=(this.speed-t.speed)/dt,braking=t.brake*9.81*1.1;
  if(Math.abs(this.speed)>4&&decel-braking>16){pulse(Math.min(1,(decel-braking)/40),.6,180);this.hold=now+180}
  // Suspension hits: fastest travel change across the wheels.
  let hit=0;t.wheels.forEach((w,i)=>{const prev=this.travel[i];if(prev!==undefined)hit=Math.max(hit,Math.abs(w.travel-prev)/dt)});
  this.travel=t.wheels.map(w=>w.travel);this.speed=t.speed;
  if(now<this.hold||now-this.at<90)return;
  const mph=Math.abs(t.speed)*2.237,rough=t.wheels.some(w=>w.contact&&w.surface!=='asphalt')?Math.min(1,mph/40):0;
  const slip=Math.max(...t.wheels.map(w=>w.contact?Math.min(1,Math.abs(w.slipRatio)*1.6):0));
  const limiter=t.rpm>7600&&t.powertrain!=='cvt'?.12:0;
  const strong=Math.max(hit>.9?Math.min(.9,hit*.25):0,rough*.35),weak=Math.max(rough*.45,slip>.35?slip*.35:0,limiter);
  if(strong>.04||weak>.04){this.at=now;pulse(strong,weak,110)}
 }
 stop(){void actuator()?.reset?.()?.catch(()=>{})}
}
