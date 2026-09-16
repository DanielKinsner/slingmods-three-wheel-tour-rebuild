import type {AudioLife} from './mapper';
/** One owned cue on the live game mix, with resumable playback and cancelled late loads. */
export class BayDoorAudio {
 private buffer?:AudioBuffer;private source?:AudioBufferSourceNode;private gain:GainNode;
 private requested=false;private dead=false;private generation=0;private offset=0;private started=0;private starts=0;private failed=false;private gainTarget=0;
 private life:AudioLife={enabled:false,paused:false,mute:false,volume:0,cockpit:false,reset:false};
 constructor(private context:AudioContext,output:AudioNode){this.gain=context.createGain();this.gain.gain.value=0;this.gain.connect(output)}
 async start(){
  this.stop();this.requested=true;this.failed=false;const ticket=this.generation;
  try{if(!this.buffer){const response=await fetch('/assets/audio/showroom/bay-door-open.mp3');if(!response.ok)throw Error('Door sound unavailable');const buffer=await this.context.decodeAudioData(await response.arrayBuffer());if(this.dead||ticket!==this.generation)return;this.buffer=buffer}this.sync()}
  catch{if(ticket===this.generation){this.failed=true;this.requested=false}}
 }
 update(life:AudioLife){this.life=life;this.sync()}
 private sync(){
  if(this.dead)return;this.gainTarget=this.life.enabled&&!this.life.paused&&!this.life.mute?this.life.volume*.32:0;this.gain.gain.setValueAtTime(this.gainTarget,this.context.currentTime);
  if(this.life.paused||!this.life.enabled){this.pauseSource();return}
  if(!this.requested||!this.buffer||this.source)return;
  if(this.offset>=this.buffer.duration){this.requested=false;return}
  const source=this.context.createBufferSource();source.buffer=this.buffer;source.connect(this.gain);this.source=source;this.started=this.context.currentTime;this.starts++;
  source.onended=()=>{source.disconnect();if(this.source===source){this.source=undefined;this.offset=this.buffer!.duration;this.requested=false}};
  source.start(0,this.offset);
 }
 private pauseSource(){const source=this.source;if(!source)return;this.offset+=Math.max(0,this.context.currentTime-this.started);this.source=undefined;source.stop();source.disconnect()}
 stop(){this.generation++;this.requested=false;this.pauseSource();this.offset=0;this.gainTarget=0;this.gain.gain.setValueAtTime(0,this.context.currentTime)}
 inspect(){return{requested:this.requested,playing:!!this.source,loaded:!!this.buffer,offset:this.offset,starts:this.starts,failed:this.failed,gainTarget:this.gainTarget,gain:this.gain.gain.value}}
 dispose(){if(this.dead)return;this.stop();this.dead=true;this.gain.disconnect()}
}
