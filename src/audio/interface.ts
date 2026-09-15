import {loadAudioBank,type AudioBank} from './graph';
export const CUES={
 'ui.nav':{gain:.10,cooldown:.12,priority:0},'ui.confirm':{gain:.13,cooldown:.12,priority:1},'ui.back':{gain:.10,cooldown:.12,priority:0},'ui.detent':{gain:.045,cooldown:.10,priority:0},power:{gain:.17,cooldown:.2,priority:1},
 'finish.apply':{gain:.15,cooldown:.16,priority:1},'part.shocks.attach':{gain:.28,cooldown:.18,priority:2},'part.lights.attach':{gain:.17,cooldown:.18,priority:2},'part.exhaust.attach':{gain:.25,cooldown:.18,priority:2},'part.aero.attach':{gain:.22,cooldown:.18,priority:2},'part.storage.attach':{gain:.20,cooldown:.18,priority:2},'part.remove':{gain:.16,cooldown:.18,priority:2},'build.save':{gain:.17,cooldown:.3,priority:2},'build.preset':{gain:.20,cooldown:.3,priority:2},'career.unlock':{gain:.22,cooldown:.4,priority:3},'race.count':{gain:.19,cooldown:.3,priority:3},'race.start':{gain:.25,cooldown:.4,priority:3},'race.finish':{gain:.24,cooldown:.4,priority:3}
} as const;
export type CueId=keyof typeof CUES;
/** Call only on committed state transitions, never on render/hover/rehydration. */
export class CueGate {
 private last=new Map<CueId,number>();private keys=new Set<string>();
 accept(id:CueId,time:number,key?:string){if(key&&this.keys.has(key))return false;if(time-(this.last.get(id)??-Infinity)<CUES[id].cooldown)return false;this.last.set(id,time);if(key){this.keys.add(key);if(this.keys.size>256)this.keys.delete(this.keys.values().next().value!)}return true}
}
export class InterfaceAudio {
 private bank?:AudioBank;private dead=false;private gain:GainNode;private gate=new CueGate();private active=new Set<{source:AudioBufferSourceNode;gain:GainNode;priority:number}>();private audible=false;private lastLevel=-1;private played=0;private rejected=0;private counts:Partial<Record<CueId,number>>={};
 constructor(private ctx:AudioContext,output:AudioNode){this.gain=ctx.createGain();this.gain.gain.value=0;this.gain.connect(output)}
 async prepare(){const bank=await loadAudioBank(this.ctx,'p09b-cues');if(!this.dead)this.bank=bank}
 update(enabled:boolean,level:number){this.audible=enabled&&level>0;const target=this.audible?level:0;if(target!==this.lastLevel){this.lastLevel=target;this.gain.gain.setTargetAtTime(target,this.ctx.currentTime,.015)}if(!this.audible&&this.active.size)this.stop()}
 play(id:CueId,key?:string){if(this.dead||!this.audible||!this.bank?.[id]||!this.gate.accept(id,this.ctx.currentTime,key)){this.rejected++;return false}const cue=CUES[id];if(this.active.size>=8){const victim=[...this.active].sort((a,b)=>a.priority-b.priority)[0];if(victim.priority>cue.priority){this.rejected++;return false}this.release(victim)}const source=this.ctx.createBufferSource(),gain=this.ctx.createGain(),shot={source,gain,priority:cue.priority};source.buffer=this.bank[id];gain.gain.value=cue.gain;source.connect(gain);gain.connect(this.gain);this.active.add(shot);source.onended=()=>{source.disconnect();gain.disconnect();this.active.delete(shot)};source.start();this.played++;this.counts[id]=(this.counts[id]??0)+1;return true}
 private release(shot:{source:AudioBufferSourceNode;gain:GainNode;priority:number}){shot.gain.gain.setTargetAtTime(0,this.ctx.currentTime,.008);shot.source.stop(this.ctx.currentTime+.035);this.active.delete(shot)}
 stop(){for(const shot of this.active)this.release(shot)}
 inspect(){return{loaded:!!this.bank,active:this.active.size,poolLimit:8,played:this.played,rejected:this.rejected,counts:{...this.counts},bus:'captured-master'}}
 dispose(){this.dead=true;this.stop();this.gain.disconnect()}
}
