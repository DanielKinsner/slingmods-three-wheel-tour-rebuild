import type {VehicleTelemetry} from '../simulation';
export type AudioLife={enabled:boolean;paused:boolean;mute:boolean;volume:number;cockpit:boolean;reset?:boolean};
const finite=(v:number,fallback=0)=>Number.isFinite(v)?v:fallback,clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,finite(v)));
export const ENGINE_RPMS=[1200,3600,6200] as const;
/** Actual applied telemetry only; these are presentation mix estimates, not a second powertrain. */
export function mapAudio(t:VehicleTelemetry,life:AudioLife){
 const rpm=clamp(finite(t.rpm,950),950,8500),speed=Math.abs(finite(t.speed)),load=clamp(t.throttle)*(t.shifting?.25:1),contact=t.wheels.filter(w=>w.contact),slip=contact.reduce((a,w)=>a+Math.min(1,Math.abs(finite(w.slipRatio))*.6+Math.abs(finite(w.slipAngle))*.8),0)/Math.max(1,contact.length);
 const raw=ENGINE_RPMS.map(r=>Math.max(0,1-Math.abs(Math.log(rpm/r))/1.08)),norm=Math.sqrt(raw.reduce((a,x)=>a+x*x,0))||1;
 const weights=raw.map(x=>x/norm),layers=ENGINE_RPMS.flatMap((ref,i)=>[{name:`engine-${ref}-load`,rate:rpm/ref,gain:weights[i]*(.08+.30*load)},{name:`engine-${ref}-lift`,rate:rpm/ref,gain:weights[i]*(.20*(1-load))}]);
 const roadSpeed=contact.reduce((a,w)=>a+Math.abs(finite(w.longitudinalSpeed)),0)/Math.max(1,contact.length);
 const surface=contact.some(w=>w.surface==='gravel')?1.35:contact.some(w=>w.surface==='wet')?.85:1;
 layers.push({name:'road',rate:1,gain:contact.length?clamp(roadSpeed/28)*(.06+.10*slip)*surface:0},{name:'wind',rate:1,gain:clamp(speed/32)**1.7*.13});
 return{rpm,speed,load,layers,master:life.enabled&&!life.paused&&!life.mute?clamp(life.volume):0,cutoff:life.cockpit?2600:6500,shiftGain:.18,reset:!!life.reset};
}
export class ShiftEvents {
 private gear:number|undefined;private shifting=false;private pending=false;
 update(t:VehicleTelemetry,reset=false){if(reset||this.gear===undefined){this.gear=t.gear;this.shifting=t.shifting;this.pending=t.shifting;return false}
 let event=false;if(t.shifting&&!this.shifting){event=true;this.pending=true}if(t.gear!==this.gear){if(!this.pending)event=true;this.pending=false}if(!t.shifting&&!this.shifting)this.pending=false;this.gear=t.gear;this.shifting=t.shifting;return event;
 }
}
export type AudioParameters=ReturnType<typeof mapAudio>;
