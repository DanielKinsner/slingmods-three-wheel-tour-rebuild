/** Opt-in isolated recording of the live mixed game graph, never microphone or system audio. */
export class LiveGameCapture {
 private destination:MediaStreamAudioDestinationNode;
 private recorder!:MediaRecorder;
 private chunks:Blob[]=[];
 private startedWall=0;
 private startedAudio=0;
 private closed=false;
 private released=false;private aborted=false;private failure='';
 readonly markers:{id:string;audioTime:number;wallTime:number;frequency:number;duration:number}[]=[];
 constructor(private context:AudioContext,private mix:AudioNode){
  if(context.state!=='running')throw Error('Activate game sound before recording');
  this.destination=context.createMediaStreamDestination();
  this.destination.channelCount=2;
  try{
  const mimeType=['audio/webm;codecs=opus','audio/webm'].find(m=>MediaRecorder.isTypeSupported(m));
  if(!mimeType)throw Error('Live Web Audio recording is unavailable');
  this.recorder=new MediaRecorder(this.destination.stream,{mimeType,audioBitsPerSecond:192000});
  this.recorder.ondataavailable=e=>{if(!this.aborted&&e.data.size)this.chunks.push(e.data)};
  this.recorder.onerror=()=>{this.failure='Live recorder failed';this.aborted=true;this.closeResources()};
  mix.connect(this.destination);
  this.startedWall=performance.now();this.startedAudio=context.currentTime;
  this.recorder.start(1000);
  }catch(error){this.closed=true;this.aborted=true;this.closeResources();throw error}
 }
 private closeResources(){if(this.released)return;this.released=true;try{this.mix.disconnect(this.destination)}catch{/* Constructor may fail before connection. */}this.destination.stream.getTracks().forEach(t=>t.stop())}
 /** Three disclosed sync chirps are routed into the evidence stream only, not the player's speakers. */
 marker(id:string){
  if(this.closed)throw Error('Recording already closed');
  const audioTime=this.context.currentTime+.08,frequency=3000+this.markers.length*400,duration=.08;
  const tone=this.context.createOscillator(),gain=this.context.createGain();tone.frequency.value=frequency;
  gain.gain.setValueAtTime(0,audioTime);gain.gain.linearRampToValueAtTime(.12,audioTime+.005);gain.gain.setValueAtTime(.12,audioTime+duration-.005);gain.gain.linearRampToValueAtTime(0,audioTime+duration);
  tone.connect(gain);gain.connect(this.destination);tone.start(audioTime);tone.stop(audioTime+duration);tone.onended=()=>{tone.disconnect();gain.disconnect()};
  const mark={id,audioTime,wallTime:0,frequency,duration};this.markers.push(mark);
  const flash=()=>{if(this.closed)return;if(this.context.currentTime<audioTime){requestAnimationFrame(flash);return}
   mark.wallTime=performance.now();const node=document.createElement('div');node.dataset.audioSync=id;node.textContent='A/V SYNC '+id;
   node.style.cssText='position:fixed;left:0;top:0;width:180px;height:40px;z-index:20000;background:#ff00ff;color:#000;font:700 16px monospace;display:grid;place-items:center';document.body.append(node);setTimeout(()=>node.remove(),120);
  };requestAnimationFrame(flash);
  return mark;
 }
 async stop(){
  if(this.closed)throw Error('Recording already closed');this.closed=true;
  const endedWall=performance.now(),endedAudio=this.context.currentTime;
  try{
  if(this.failure)throw Error(this.failure);
  await new Promise<void>((resolve,reject)=>{this.recorder.onstop=()=>resolve();this.recorder.onerror=()=>reject(Error('Live recorder failed'));this.recorder.stop()});
  }catch(error){this.aborted=true;this.chunks=[];throw error}finally{this.closeResources()}
  const blob=new Blob(this.chunks,{type:this.recorder.mimeType}),bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
  this.chunks=[];
  return{base64:btoa(binary),mimeType:this.recorder.mimeType,contextSampleRate:this.context.sampleRate,channels:2,startedWall:this.startedWall,endedWall,startedAudio:this.startedAudio,endedAudio,markers:this.markers,method:'Actual realtime player plus spatial-opponent mix tapped after all buses. Three disclosed evidence-only sync chirps and DOM flashes; no microphone, system loopback, offline synthesis or video-clock control.'};
 }
 abort(){if(this.closed)return;this.closed=true;this.aborted=true;try{if(this.recorder.state!=='inactive')this.recorder.stop()}finally{this.closeResources();this.chunks=[]}}
}
