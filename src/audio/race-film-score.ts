import {FILMS,type Film} from '../presentation/cinematics/tracks';

/** Original synthesis. No recording, network request or additional AudioContext.
 * Uses the existing interface-volume bus and the game's captured master limiter. */
export class RaceFilmScore {
  private bus:GainNode;private noise:AudioBuffer;private film:Film|null=null;private elapsed=-1;
  private active=new Set<AudioScheduledSourceNode>();
  constructor(private ctx:AudioContext,output:AudioNode){
    this.bus=ctx.createGain();this.bus.gain.value=0;this.bus.connect(output);
    this.noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
    const data=this.noise.getChannelData(0);let seed=17;
    for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296*2-1)*.5}
  }
  private own<T extends AudioScheduledSourceNode>(source:T,nodes:AudioNode[],duration:number){
    this.active.add(source);source.onended=()=>{this.active.delete(source);source.disconnect();for(const node of nodes)node.disconnect()};
    source.start();source.stop(this.ctx.currentTime+duration);return source;
  }
  private tone(hz:number,duration:number,level:number,delay=0){
    const now=this.ctx.currentTime,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(hz*1.012,now);osc.frequency.exponentialRampToValueAtTime(hz,now+.15);
    gain.gain.setValueAtTime(0,now);gain.gain.setValueAtTime(0,now+delay);gain.gain.linearRampToValueAtTime(level,now+delay+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);
    osc.connect(gain);gain.connect(this.bus);this.own(osc,[gain],delay+duration+.05);
  }
  private air(duration:number,level:number){
    const now=this.ctx.currentTime,source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();
    source.buffer=this.noise;filter.type='bandpass';filter.Q.value=.6;
    filter.frequency.setValueAtTime(180,now);filter.frequency.exponentialRampToValueAtTime(2400,now+duration*.55);filter.frequency.exponentialRampToValueAtTime(320,now+duration);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(level,now+duration*.35);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    source.connect(filter);filter.connect(gain);gain.connect(this.bus);this.own(source,[filter,gain],duration+.05);
  }
  update(film:Film|null,elapsed:number,enabled:boolean,level:number){
    if(!film||!enabled||level<=0){this.stop();return}
    this.bus.gain.setTargetAtTime(level,this.ctx.currentTime,.025);
    if(film!==this.film||elapsed<this.elapsed){this.stop();this.film=film;this.elapsed=-.01;this.bus.gain.setTargetAtTime(level,this.ctx.currentTime,.025)}
    let at=0;
    for(const [index,shot]of FILMS[film].entries()){
      // Don't dump missed cues if sound was unlocked halfway through a sequence.
      if(this.elapsed<at&&elapsed>=at&&elapsed-at<.18){
        this.air(index===0?1.3:.7,index===0?.16:.09);
        this.tone(index===0?49:73.416,1.4,.20);
        if(shot.title){
          const chord=film==='victory'?[146.832,220,293.665,369.994]:[146.832,220,293.665];
          chord.forEach((hz,i)=>this.tone(hz,2.8,.085,i*.075));
          this.tone(587.33,2,.026,.23);
        }else this.tone(146.832+index*36.708,.85,.055);
      }
      at+=shot.duration;
    }
    this.elapsed=elapsed;
  }
  stop(){this.bus.gain.setTargetAtTime(0,this.ctx.currentTime,.012);for(const source of this.active){try{source.stop(this.ctx.currentTime+.04)}catch{}}this.active.clear();this.film=null;this.elapsed=-1}
  dispose(){this.stop();this.bus.disconnect()}
}
