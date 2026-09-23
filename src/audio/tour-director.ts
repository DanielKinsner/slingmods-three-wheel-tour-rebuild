import type {VehicleTelemetry} from '../simulation';
import {loadAudioBank,type AudioBank} from './graph';
import type {AudioLife} from './mapper';

export type SoundScene={place:'showroom'|'harbor'|'express'|'ridge';night:boolean;wet:boolean;free:boolean;phase:string};
export const DEFAULT_SOUND_SCENE:SoundScene={place:'showroom',night:false,wet:false,free:false,phase:'garage'};
const clamp=(n:number,max=1)=>Number.isFinite(n)?Math.max(0,Math.min(max,n)):0;
export function worldMix(scene:SoundScene,t?:VehicleTelemetry){
 const speed=clamp(Math.abs(t?.speed??0)/32),ground=t?.wheels.filter(w=>w.contact)??[];
 const slip=ground.reduce((n,w)=>Math.max(n,clamp(Math.abs(w.slipAngle)*1.8+Math.abs(w.slipRatio)*.6-.12)),0);
 const road=scene.place!=='showroom'&&scene.phase==='running';
 return {[scene.place]:scene.place==='showroom'?.32:.42*(1-.65*speed),night:scene.night&&scene.place!=='showroom'?.16:0,rain:scene.wet?.28:0,
  'tire-scrub':road&&ground.length?slip*speed*.65:0,gravel:road&&ground.some(w=>w.surface==='gravel')?speed*.5:0,
  wind:road?speed**1.7*.24:0,road:road&&ground.length?clamp(ground.reduce((v,w)=>v+Math.abs(w.longitudinalSpeed),0)/ground.length/28)*.25:0,
  'wet-tire':road&&ground.length&&scene.wet?speed*.4:0};
}
/** Read-only motion events. No forces, input, race validity or career writes. */
export class MotionSounds {
 private previous?:{time:number;speed:number;travel:number[];contacts:number};private lastImpact=-Infinity;private lastBump=-Infinity;
 update(t:VehicleTelemetry,reset=false){
  const now={time:t.time,speed:Math.abs(t.speed),travel:t.wheels.map(w=>w.travel),contacts:t.wheels.filter(w=>w.contact).length},old=this.previous;this.previous=now;
  if(reset||!old||!Number.isFinite(now.time)||now.time<=old.time||now.time-old.time>.2)return [];
  const dt=now.time-old.time,result:{id:string;gain:number}[]=[];
  const loss=old.speed-now.speed;
  // Deliberately above ordinary braking. This is an inferred body hit, not a collision callback.
  if(loss>2.4&&loss/dt>30&&now.time-this.lastImpact>.7){result.push({id:'impact',gain:clamp(loss/12)*.65});this.lastImpact=now.time}
  const travel=Math.max(0,...now.travel.map((v,i)=>Math.abs(v-(old.travel[i]??v))));
  if(now.speed>2&&now.time-this.lastBump>.35&&(travel>.055||old.contacts===0&&now.contacts>0)){result.push({id:'suspension',gain:Math.min(.3,.08+travel)});this.lastBump=now.time}
  return result;
 }
}
type Voice={source:AudioBufferSourceNode;gain:GainNode};
/** Scene atmosphere, contact foley and sparse score. All routes feed the same captured master. */
export class TourDirector {
 private bank?:AudioBank;private dead=false;private bus:GainNode;private musicBus:GainNode;
 private loops=new Map<string,Voice>();private shots=new Set<Voice>();private music?:Voice;private outgoing=new Set<Voice>();
 private musicId='';private requested='';private ticket=0;private cache=new Map<string,AudioBuffer>();
 private motion=new MotionSounds();private scene:SoundScene={...DEFAULT_SOUND_SCENE};private t?:VehicleTelemetry;
 private life:AudioLife={enabled:false,paused:false,mute:false,volume:0,cockpit:false};private levels={environment:.8,music:.45};
 private duckTimer?:ReturnType<typeof setTimeout>;private duckUntil=0;private failures:string[]=[];private lastPlay=new Map<string,number>();private musicTarget=0;private worldTarget=0;
 constructor(private ctx:AudioContext,output:AudioNode){this.bus=ctx.createGain();this.musicBus=ctx.createGain();this.bus.gain.value=0;this.musicBus.gain.value=0;this.bus.connect(output);this.musicBus.connect(output)}
 async prepare(){try{const bank=await loadAudioBank(this.ctx,'tour-world-v1');if(!this.dead){this.bank=bank;this.sync()}}catch{this.failures.push('Environment unavailable');}}
 setScene(value:Partial<SoundScene>){Object.assign(this.scene,value);this.sync()}
 update(life:AudioLife,levels:{environment:number;music:number},telemetry?:VehicleTelemetry){this.life=life;this.levels=levels;
  if(telemetry){this.t=telemetry;for(const shot of this.motion.update(telemetry,life.reset||life.paused||!life.enabled||life.mute||this.scene.place==='showroom'))this.play(shot.id,shot.gain)}
  this.sync();
 }
 duck(seconds=.8){this.duckUntil=this.ctx.currentTime+seconds;clearTimeout(this.duckTimer);this.duckTimer=setTimeout(()=>this.sync(),seconds*1000+30);this.sync()}
 play(id:string,level=.3){if(!this.bank?.[id]||this.dead||!this.life.enabled||this.life.mute||this.life.paused||this.levels.environment<=0||this.shots.size>=6)return false;
  if(this.ctx.currentTime-(this.lastPlay.get(id)??-Infinity)<.16)return false;this.lastPlay.set(id,this.ctx.currentTime);
  const voice=this.voice(this.bank[id],this.bus,false);voice.gain.gain.value=level;this.shots.add(voice);voice.source.onended=()=>{this.clean(voice);this.shots.delete(voice)};return true;
 }
 private voice(buffer:AudioBuffer,output:AudioNode,loop:boolean):Voice{const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;source.loop=loop;gain.gain.value=0;source.connect(gain);gain.connect(output);source.start();return{source,gain}}
 private clean(v:Voice){v.source.disconnect();v.gain.disconnect()}
 private stop(v:Voice,fade=.04){v.gain.gain.cancelScheduledValues(this.ctx.currentTime);v.gain.gain.setTargetAtTime(0,this.ctx.currentTime,fade/4);v.source.stop(this.ctx.currentTime+fade);}
 private sync(){if(this.dead)return;const active=this.life.enabled&&!this.life.paused&&!this.life.mute;
  const target=active?this.life.volume*this.levels.environment:0;if(target!==this.worldTarget){this.worldTarget=target;this.bus.gain.setTargetAtTime(target,this.ctx.currentTime,.045)}
  const gains=worldMix(this.scene,this.t);for(const[name,gain]of Object.entries(gains)){let voice=this.loops.get(name);if(!voice&&gain>0&&this.bank?.[name]){voice=this.voice(this.bank[name],this.bus,true);this.loops.set(name,voice)}if(voice)voice.gain.gain.setTargetAtTime(gain*(this.life.cockpit?.8:1),this.ctx.currentTime,.25)}
  for(const[name,v]of this.loops)if(!(name in gains)){this.stop(v,.5);v.source.onended=()=>this.clean(v);this.loops.delete(name)}
  if(!active){for(const shot of this.shots)this.stop(shot);this.shots.clear()}
  // Free driving breathes: first 18 s of each 100 s window are scenery-only; music then fades back.
  const freeSpace=this.scene.free&&this.scene.phase==='running'&&((this.t?.time??0)%100)<18;
  const duck=this.ctx.currentTime<this.duckUntil?.32:1;
  const sceneLevel=this.scene.place==='showroom'?.62:this.scene.phase==='countdown'?.14:this.scene.phase==='running'?.72:.5;
  const mt=active&&!freeSpace?this.life.volume*this.levels.music*sceneLevel*duck:0;
  if(mt!==this.musicTarget){this.musicTarget=mt;this.musicBus.gain.setTargetAtTime(mt,this.ctx.currentTime,active?.5:.025)}
  const id=this.scene.place==='showroom'||this.scene.phase==='finished'?'music-garage':this.scene.free||this.scene.place==='ridge'?'music-ridge':'music-race';
  if(active&&this.levels.music>0&&id!==this.requested){this.requested=id;void this.selectMusic(id)}
 }
 private async selectMusic(id:string){const ticket=++this.ticket;try{let buffer=this.cache.get(id);if(!buffer){const root='/assets/audio/'+id+'-v1/';const response=await fetch(root+id+'.ogg');if(!response.ok)throw Error('Music unavailable');buffer=await this.ctx.decodeAudioData(await response.arrayBuffer());if(this.dead||ticket!==this.ticket)return;this.cache.set(id,buffer);while(this.cache.size>2)this.cache.delete(this.cache.keys().next().value!)}
   if(this.dead||ticket!==this.ticket)return;for(const v of this.outgoing){v.source.onended=null;v.source.stop();this.clean(v)}this.outgoing.clear();const old=this.music;this.music=this.voice(buffer,this.musicBus,true);this.musicId=id;this.music.gain.gain.setTargetAtTime(1,this.ctx.currentTime,.65);
   if(old){this.outgoing.add(old);old.source.onended=()=>{this.clean(old);this.outgoing.delete(old)};this.stop(old,2)}
  }catch{if(ticket===this.ticket){this.failures.push(id+' unavailable');this.requested=id;}}
 }
 inspect(){return{scene:{...this.scene},loaded:!!this.bank,loops:[...this.loops.keys()],shots:this.shots.size,shotLimit:6,music:this.musicId,musicTarget:this.musicTarget,worldTarget:this.worldTarget,musicVoices:(this.music?1:0)+this.outgoing.size,cachedTracks:this.cache.size,failures:[...this.failures],bus:'captured-master'}}
 dispose(){if(this.dead)return;this.dead=true;clearTimeout(this.duckTimer);this.ticket++;for(const v of [...this.loops.values(),...this.shots,...this.outgoing,...(this.music?[this.music]:[])]){v.source.onended=null;v.source.stop();this.clean(v)}this.loops.clear();this.shots.clear();this.outgoing.clear();this.cache.clear();this.bank=undefined;this.bus.disconnect();this.musicBus.disconnect()}
}
