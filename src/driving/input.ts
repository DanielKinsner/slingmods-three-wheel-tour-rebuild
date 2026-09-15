import type {HandlingProfileId} from '../simulation/profile';
import type {VehicleControl} from '../simulation';
export const INPUT_TUNING={steeringDeadzone:.08,steeringExponent:1.25,triggerNeutral:.02,activityDelta:.025,resetHoldMs:1000} as const;
export interface PadSample {index:number;id:string;connected:boolean;mapping:string;axes:readonly number[];buttons:readonly {value:number;pressed?:boolean}[]}
export interface DeviceSample {keys:ReadonlySet<string>;pads:readonly (PadSample|null)[];focused:boolean;pressedKeys?:ReadonlySet<string>;keyboardResetSince?:number}
export type DeviceReader=()=>DeviceSample;
type Action='camera'|'lookBack'|'direction'|'reset'|'pause';
type Intent={throttle:number;brake:number;steer:number;actions:Record<Action,boolean>};
const keyActions={camera:'KeyC',lookBack:'KeyB',direction:'KeyX',reset:'KeyR',pause:'Escape'} as const;
const actions:Action[]=['camera','lookBack','direction','reset','pause'];
const finite=(v:number)=>Number.isFinite(v)?v:0;
const clamp=(v:number,min=0,max=1)=>Math.min(max,Math.max(min,finite(v)));
export function stickSteering(x:number){const a=Math.abs(clamp(x,-1,1));return a<=INPUT_TUNING.steeringDeadzone?0:-Math.sign(x)*((a-INPUT_TUNING.steeringDeadzone)/(1-INPUT_TUNING.steeringDeadzone))**INPUT_TUNING.steeringExponent}
const empty=():Intent=>({throttle:0,brake:0,steer:0,actions:{camera:false,lookBack:false,direction:false,reset:false,pause:false}});
const neutral=(i:Intent)=>Math.abs(i.steer)<1e-8&&i.throttle<=INPUT_TUNING.triggerNeutral&&i.brake<=INPUT_TUNING.triggerNeutral&&!actions.some(a=>i.actions[a]);
const meaningful=(i:Intent)=>!neutral(i);
function keyboard(keys:ReadonlySet<string>):Intent{const i=empty();i.throttle=Number(keys.has('KeyW')||keys.has('ArrowUp'));i.brake=Number(keys.has('KeyS')||keys.has('ArrowDown'));i.steer=Number(keys.has('KeyA')||keys.has('ArrowLeft'))-Number(keys.has('KeyD')||keys.has('ArrowRight'));for(const [a,k]of Object.entries({camera:'KeyC',lookBack:'KeyB',direction:'KeyX',reset:'KeyR',pause:'Escape'}))i.actions[a as Action]=keys.has(k);return i}
function padIntent(p:PadSample):Intent{const i=empty();i.steer=stickSteering(p.axes[0]);i.throttle=clamp(p.buttons[7]?.value);i.brake=clamp(p.buttons[6]?.value);for(const [a,b]of Object.entries({camera:3,lookBack:4,direction:1,reset:0,pause:9}))i.actions[a as Action]=p.buttons[b]?.pressed===true||clamp(p.buttons[b]?.value)>.5;return i}
const changed=(a:Intent,b:Intent)=>Math.max(Math.abs(a.steer-b.steer),Math.abs(a.throttle-b.throttle),Math.abs(a.brake-b.brake))>INPUT_TUNING.activityDelta;
export class InputResolver {
 constructor(readonly profileId:HandlingProfileId='legacy-p08a'){}
 private directionReleased=false;private automaticReverse=false;private signedSpeed=0;
 paused=false;armed=false;reverse=false;activeDevice='keyboard';status='Press a controller button to connect';
 private prior=new Map<string,Intent>();private activity=new Map<string,Intent>();private readyPads=new Set<string>();private connected=new Set<string>();private holdStart:number|undefined;private holdLatched=false;private baselineNext=false;private lastNow=0;private holdNotBefore=0;
 suspend(){this.directionReleased=false;this.holdNotBefore=this.lastNow;this.paused=true;this.armed=false;this.holdStart=undefined;this.holdLatched=false;this.baselineNext=true}
 disconnect(){this.readyPads.clear();this.connected.clear();this.prior.clear();this.activity.clear();this.suspend()}
 reset(){this.directionReleased=false;this.automaticReverse=false;this.holdNotBefore=this.lastNow;this.reverse=false;this.armed=false;this.holdStart=undefined;this.holdLatched=true}
 poll(now:number,sample:DeviceSample,signedSpeed=0){
  this.signedSpeed=Number.isFinite(signedSpeed)?signedSpeed:0;
  now=Math.max(this.lastNow,finite(now));this.lastNow=now;
  const intents=new Map<string,Intent>([['keyboard',keyboard(sample.keys)]]),connected=new Set<string>();let unsupported=false;
  for(const p of sample.pads){if(!p?.connected)continue;if(p.mapping!=='standard'){unsupported=true;continue}const id=`pad:${p.index}:${p.id}`;connected.add(id);const intent=padIntent(p);if(neutral(intent))this.readyPads.add(id);intents.set(id,intent)}
  for(const id of this.connected)if(!connected.has(id)){this.readyPads.delete(id);this.prior.delete(id);this.activity.delete(id);if(this.activeDevice===id){this.suspend();this.activeDevice='keyboard'}}
  this.connected=connected;this.status=unsupported?'Unrecognized controller mapping — use keyboard':connected.size?'Controller connected':'Press a controller button to connect';
  if(!sample.focused){this.suspend();this.prior=intents;return this.output(empty(),false,false)}
  if(this.baselineNext){this.prior=intents;this.baselineNext=false;if(!sample.pressedKeys?.size)return this.output(empty(),false,false)}
  // Only a changed meaningful input takes ownership. Simultaneous changes favor keyboard.
  let owner=this.activeDevice;
  for(const [id,i]of [...intents].reverse()){if(neutral(i))this.activity.set(id,empty());if((id==='keyboard'||this.readyPads.has(id))&&(meaningful(i)||(id==='keyboard'&&!!sample.pressedKeys?.size))&&((id==='keyboard'&&!!sample.pressedKeys?.size)||changed(i,this.activity.get(id)??empty())||actions.some(a=>i.actions[a]&&!(this.prior.get(id)??empty()).actions[a]))){owner=id;this.activity.set(id,i)}}
  if(owner!==this.activeDevice){const priorOwner=this.prior.get(owner)??empty();this.directionReleased=this.armed&&Math.abs(this.signedSpeed)<.5&&priorOwner.throttle<=.02&&priorOwner.brake<=.02;this.activeDevice=owner;this.holdNotBefore=now;this.holdStart=undefined;this.holdLatched=false}
  const intent=intents.get(owner)??empty(),previous=this.prior.get(owner)??empty();const rise=(a:Action)=>(owner==='keyboard'&&sample.pressedKeys?.has(keyActions[a]))||(intent.actions[a]&&!previous.actions[a]);this.prior=intents;
  let camera=false,reset=false;
  if(rise('pause')){this.directionReleased=false;this.paused=!this.paused;this.armed=false;this.holdStart=undefined;this.holdLatched=false}
  const allNeutral=[...intents.values()].every(neutral);
  if(!this.paused&&!this.armed&&allNeutral)this.armed=true;
  if(!intent.actions.reset){this.holdStart=undefined;this.holdLatched=false}
  if(!this.paused&&this.armed){camera=rise('camera');if(rise('direction')){this.reverse=!this.reverse;this.automaticReverse=false;this.directionReleased=false}
   if(this.profileId==='slingmods-sport-v1'){
    const nearStop=Math.abs(this.signedSpeed)<.5,pedalsReleased=intent.throttle<=.02&&intent.brake<=.02;
    if(nearStop&&pedalsReleased)this.directionReleased=true;
    const freshBrake=intent.brake>.02&&previous.brake<=.02,freshThrottle=intent.throttle>.02&&previous.throttle<=.02;
    if(!this.reverse&&nearStop&&this.directionReleased&&freshBrake&&intent.throttle<=.02&&!intent.actions.direction){this.reverse=true;this.automaticReverse=true;this.directionReleased=false}
    else if(this.reverse&&this.automaticReverse&&nearStop&&this.directionReleased&&freshThrottle&&intent.brake<=.02&&!intent.actions.direction){this.reverse=false;this.automaticReverse=false;this.directionReleased=false}
    if(!nearStop||!pedalsReleased)this.directionReleased=false;
   }
   if(intent.actions.reset&&!this.holdLatched){if(owner==='keyboard'&&sample.keyboardResetSince!==undefined)this.holdStart=Math.max(this.holdNotBefore,Math.min(now,finite(sample.keyboardResetSince)));else this.holdStart??=now;if(now-this.holdStart>=INPUT_TUNING.resetHoldMs){reset=true;this.reset()}}
  }else this.holdStart=undefined;
  return this.output(intent,camera,reset);
 }
 private output(i:Intent,camera:boolean,reset:boolean){const enabled=this.armed&&!this.paused;const reversePedals=this.profileId==='slingmods-sport-v1'&&this.reverse&&this.automaticReverse;const control:VehicleControl={throttle:enabled?(reversePedals?i.brake:i.throttle):0,brake:enabled?(reversePedals?i.throttle:i.brake):0,steer:enabled?i.steer:0,reverse:this.reverse,tractionControl:true};return {control,direction:this.reverse?'R':'D',directionHelp:this.profileId==='slingmods-sport-v1'?'Stop, release pedals, then press brake for reverse. Forward pedal brakes reverse; release and press again to drive. X/right face selects direction explicitly.':'X / right face selects direction',paused:this.paused,armed:this.armed,activeDevice:this.activeDevice,status:this.status,camera,reset,lookBack:enabled&&i.actions.lookBack,resetProgress:this.holdStart===undefined?0:Math.min(1,(this.lastNow-this.holdStart)/INPUT_TUNING.resetHoldMs)}}
}

/** Browser key events outlive a slow rendering frame; holds remain tied to actual down/up. */
export class KeyboardBuffer {
 readonly held=new Set<string>();private pressed=new Set<string>();private resetSince:number|undefined;
 down(code:string,now:number,repeat=false){if(!repeat&&!this.held.has(code)){if(['KeyC','KeyX','Escape'].includes(code))this.pressed.add(code);if(code==='KeyR')this.resetSince=now}this.held.add(code)}
 up(code:string){this.held.delete(code);if(code==='KeyR')this.resetSince=undefined}
 clear(){this.held.clear();this.pressed.clear();this.resetSince=undefined}
 read(){const result={keys:new Set(this.held),pressedKeys:new Set(this.pressed),keyboardResetSince:this.resetSince};this.pressed.clear();return result}
}
