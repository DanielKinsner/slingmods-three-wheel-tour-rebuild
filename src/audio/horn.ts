/**
 * Horn (Phase 4C): a synthesised dual-tone car horn, two detuned saw voices (~420 / 510 Hz) through a soft clip and
 * a band-pass, so it needs no sample. Press/release follow the key with a fast attack and a short tail.
 */
export class Horn {
 private out:GainNode;private voices:OscillatorNode[]=[];private on=false;
 constructor(private ctx:AudioContext,destination:AudioNode){
  this.out=ctx.createGain();this.out.gain.value=0;
  const band=ctx.createBiquadFilter();band.type='bandpass';band.frequency.value=900;band.Q.value=.7;
  const clip=ctx.createWaveShaper();const curve=new Float32Array(1024);for(let i=0;i<curve.length;i++){const x=i/511.5-1;curve[i]=Math.tanh(2.2*x)}clip.curve=curve;
  const mix=ctx.createGain();mix.gain.value=.5;
  for(const [f,g] of [[420,1],[508,.85],[842,.18]] as const){const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;const v=ctx.createGain();v.gain.value=g;o.connect(v);v.connect(mix);o.start();this.voices.push(o)}
  mix.connect(clip);clip.connect(band);band.connect(this.out);this.out.connect(destination);
 }
 /** Hold state and loudness (0 = silent: muted, paused or sound off). */
 set(pressed:boolean,volume:number){
  const target=pressed?.34*Math.max(0,Math.min(1,volume)):0,now=this.ctx.currentTime;if(pressed===this.on)return;this.on=pressed;
  this.out.gain.cancelScheduledValues(now);this.out.gain.setTargetAtTime(target,now,pressed?.012:.05);
 }
 inspect(){return {pressed:this.on,gain:Math.round(this.out.gain.value*1000)/1000}}
 dispose(){for(const o of this.voices){try{o.stop()}catch{}o.disconnect()}this.out.disconnect()}
}
