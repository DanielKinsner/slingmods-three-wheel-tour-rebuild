import type {VehicleTelemetry} from '../simulation';
export type AudioLife={enabled:boolean;paused:boolean;mute:boolean;volume:number;cockpit:boolean;reset?:boolean;draft?:number};
const finite=(v:number,fallback=0)=>Number.isFinite(v)?v:fallback,clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,finite(v)));
export const ENGINE_RPMS=[1200,1650,2200,3000,4000,5300,6800] as const;
/** Actual applied telemetry only; these are presentation mix estimates, not a second powertrain. */
export function mapAudio(t:VehicleTelemetry,life:AudioLife){
 const rpm=clamp(finite(t.rpm,950),950,8500),speed=Math.abs(finite(t.speed)),load=clamp(t.throttle)*(t.shifting?.25:1),contact=t.wheels.filter(w=>w.contact),slip=contact.reduce((a,w)=>a+Math.min(1,Math.abs(finite(w.slipRatio))*.6+Math.abs(finite(w.slipAngle))*.8),0)/Math.max(1,contact.length);
 // Only adjacent RPM beds contribute: equal-power log interpolation limits pitch excursions.
 const weights=ENGINE_RPMS.map(()=>0);let hi=ENGINE_RPMS.findIndex(r=>r>=rpm);if(hi<0)weights[weights.length-1]=1;else if(hi===0)weights[0]=1;else{const lo=hi-1,f=Math.max(0,Math.min(1,Math.log(rpm/ENGINE_RPMS[lo])/Math.log(ENGINE_RPMS[hi]/ENGINE_RPMS[lo])));weights[lo]=Math.cos(f*Math.PI/2);weights[hi]=Math.sin(f*Math.PI/2)}
 const layers=ENGINE_RPMS.flatMap((ref,i)=>[{name:`engine-${ref}-load`,rate:clamp(rpm/ref,.72,1.4),gain:weights[i]*(.055+.28*load)},{name:`engine-${ref}-lift`,rate:clamp(rpm/ref,.72,1.4),gain:weights[i]*(.16*(1-load))}]);
 const roadSpeed=contact.reduce((a,w)=>a+Math.abs(finite(w.longitudinalSpeed)),0)/Math.max(1,contact.length);
 const surface=contact.some(w=>w.surface==='gravel')?1.35:contact.some(w=>w.surface==='wet')?.85:1;
 layers.push({name:'road',rate:1,gain:contact.length?clamp(roadSpeed/28)*(.06+.10*slip)*surface:0},{name:'wind',rate:1,gain:clamp(speed/32)**1.7*.13*(1-1.5*clamp(life.draft??0))});
 return{powertrain:t.powertrain,rpm,speed,load,layers,master:life.enabled&&!life.paused&&!life.mute?clamp(life.volume):0,cutoff:life.cockpit?2600:6500,shiftGain:.18,reset:!!life.reset};
}
export class ShiftEvents {
 private gear:number|undefined;private shifting=false;private pending=false;
 update(t:VehicleTelemetry,reset=false){if(t.powertrain==='cvt'){this.gear=t.gear;this.shifting=false;this.pending=false;return false}if(reset||this.gear===undefined){this.gear=t.gear;this.shifting=t.shifting;this.pending=t.shifting;return false}
 let event=false;if(t.shifting&&!this.shifting){event=true;this.pending=true}if(t.gear!==this.gear){if(!this.pending)event=true;this.pending=false}if(!t.shifting&&!this.shifting)this.pending=false;this.gear=t.gear;this.shifting=t.shifting;return event;
 }
}
export type AudioParameters=Omit<ReturnType<typeof mapAudio>,'powertrain'>&{powertrain?:VehicleTelemetry['powertrain']};
