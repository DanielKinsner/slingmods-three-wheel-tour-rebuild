import {loadAudioBank,type AudioBank} from './graph';
/** Offset follows the cinematic clock. Muted/locked begin is intentionally never armed. */
export class ThermalDepartureAudio {
 private bank?:AudioBank;private gain:GainNode;private source?:AudioBufferSourceNode;private dead=false;private armed=false;private starts=0;private elapsed=0;private startElapsed=0;private startTime=0;private level=0;private paused=false;
 constructor(private ctx:AudioContext,output:AudioNode){this.gain=ctx.createGain();this.gain.gain.value=0;this.gain.connect(output)}
 async prepare(){const bank=await loadAudioBank(this.ctx,'p09b-departure');if(!this.dead)this.bank=bank}
 begin(equipped:boolean,audible:boolean){this.stop();this.armed=equipped&&audible&&!!this.bank?.thermal;this.elapsed=0}
 update(elapsed:number,paused:boolean,audible:boolean,level:number){this.elapsed=Math.max(0,elapsed);this.paused=paused;this.level=level;
  if(!this.armed||this.dead)return;if(!audible){this.stop();return}if(paused){this.pauseSource();return}
  const buffer=this.bank?.thermal;if(!buffer||this.elapsed>=Math.min(5.8,buffer.duration)){this.stop();return}
  const expected=this.startElapsed+(this.ctx.currentTime-this.startTime);if(this.source&&Math.abs(expected-this.elapsed)>.12)this.pauseSource();
  const fade=Math.min(1,this.elapsed/.07,Math.max(0,(5.8-this.elapsed)/.28));this.gain.gain.setTargetAtTime(level*.8*fade,this.ctx.currentTime,.025);
  if(!this.source){const source=this.ctx.createBufferSource();source.buffer=buffer;source.connect(this.gain);this.source=source;this.startElapsed=this.elapsed;this.startTime=this.ctx.currentTime;source.onended=()=>{source.disconnect();if(this.source===source)this.source=undefined};source.start(0,this.elapsed);this.starts++}
 }
 private pauseSource(){if(this.source){const old=this.source;this.source=undefined;this.gain.gain.setTargetAtTime(0,this.ctx.currentTime,.008);old.stop(this.ctx.currentTime+.035)}}
 stop(){this.armed=false;this.pauseSource()}
 get active(){return this.armed}
 inspect(){return{loaded:!!this.bank,armed:this.armed,playing:!!this.source,elapsed:this.elapsed,offset:this.startElapsed,starts:this.starts,paused:this.paused,level:this.level,clock:'cinematic-elapsed',bus:'captured-master'}}
 dispose(){this.dead=true;this.stop();this.gain.disconnect()}
}
