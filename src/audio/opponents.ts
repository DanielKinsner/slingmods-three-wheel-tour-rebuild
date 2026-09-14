import {createAudioGraph,type AudioBank} from './graph';
import {mapAudio,type AudioLife} from './mapper';import type {VehicleTelemetry} from '../simulation';
/** Two persistent slots share the player's decoded bank and context. No rival light/audio session clones. */
export class OpponentAudio {
 private slots;private selected:{id:string;distance:number;pan:number;gain:number;rpm:number}[]=[];
 constructor(private ctx:BaseAudioContext,bank:AudioBank){this.slots=Array.from({length:2},()=>{const pan=ctx.createStereoPanner();pan.connect(ctx.destination);return {pan,graph:createAudioGraph(ctx,bank,pan),id:'',changed:0}})}
 update(player:VehicleTelemetry,peers:Record<string,VehicleTelemetry>,life:AudioLife){const nearest=Object.entries(peers).map(([id,t])=>({id,t,distance:Math.hypot(t.position.x-player.position.x,t.position.z-player.position.z)})).sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id)).slice(0,2);const assigned=this.slots.map(slot=>nearest.find(r=>r.id===slot.id));for(let i=0;i<assigned.length;i++)if(!assigned[i])assigned[i]=nearest.find(r=>!assigned.includes(r));this.selected=[];
 for(let i=0;i<2;i++){const slot=this.slots[i],r=assigned[i];if(!r){slot.graph.master.gain.setTargetAtTime(0,this.ctx.currentTime,.06);continue}if(slot.id!==r.id){slot.id=r.id;slot.changed=this.ctx.currentTime}const fade=Math.min(1,(this.ctx.currentTime-slot.changed)/.15),gain=.24/(1+(r.distance/9)**2)*fade,q=player.quaternion,yaw=Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.y*q.y+q.z*q.z)),dx=r.t.position.x-player.position.x,dz=r.t.position.z-player.position.z,pan=Math.max(-1,Math.min(1,(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/Math.max(5,r.distance)));
 const parameters=mapAudio(r.t,{...life,cockpit:false,volume:life.volume*gain});parameters.layers=parameters.layers.map(l=>({...l,gain:/engine/.test(l.name)?l.gain:0}));slot.pan.pan.setTargetAtTime(pan,this.ctx.currentTime,.08);slot.graph.apply(parameters);this.selected.push({id:r.id,distance:r.distance,pan,gain,rpm:r.t.rpm});}}
 silence(){for(const s of this.slots)s.graph.master.gain.setTargetAtTime(0,this.ctx.currentTime,.025)}
 inspect(){return {slots:2,sharedContext:true,sharedDecodedBuffers:true,selected:this.selected,buses:this.slots.map(s=>s.graph.inspect())}}
 dispose(){for(const s of this.slots){s.graph.dispose();s.pan.disconnect()}}
}
