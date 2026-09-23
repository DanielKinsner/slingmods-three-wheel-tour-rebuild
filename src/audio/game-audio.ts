import {OpponentAudio} from './opponents';
import {LiveGameCapture} from './evidence';
import {BayDoorAudio} from './bay-door';
import {InterfaceAudio,type CueId} from './interface';
import {ThermalDepartureAudio} from './thermal-departure';
import type {VehicleTelemetry} from '../simulation';
import {loadSave,writeSave,browserStorage} from '../save';
import {mapAudio,ShiftEvents,type AudioLife} from './mapper';
import {mapAudioLegacy} from './mapper-legacy';
import {createAudioGraph,loadAudioBank} from './graph';
export type AudioTimelineFrame={time:number;telemetry:VehicleTelemetry;life:AudioLife};
export class GameAudio {
 private sportExhaust=false;private departureActive=false;private departureElapsed=0;
 private mix?:GainNode;private limiter?:DynamicsCompressorNode;private capture?:LiveGameCapture;
 private bayDoor?:BayDoorAudio;private interfaceAudio?:InterfaceAudio;private thermal?:ThermalDepartureAudio;
 private opponents?:OpponentAudio;private bank?:Awaited<ReturnType<typeof loadAudioBank>>;
 private context?:AudioContext;private graph?:ReturnType<typeof createAudioGraph>;private shifts=new ShiftEvents();private last?:VehicleTelemetry;private paused=false;private cockpit=false;private enabled=false;private failure='';private loading=false;private disposed=false;
 readonly settings=loadSave(browserStorage()).settings;readonly ui=document.createElement('div');private enable=document.createElement('button');private mute=document.createElement('button');
 constructor(parent:Element){
  this.ui.id='game-audio';this.enable.id='enable-sound';this.enable.textContent='Enable sound';this.mute.id='mute-sound';this.mute.textContent=this.settings.mute?'Unmute':'Mute';
  const settings=document.createElement('details');settings.className='audio-settings';const summary=document.createElement('summary');summary.textContent='Sound mix';settings.append(summary);
  const fields=[['volume','Master','master'],['interfaceVolume','Interface','interface'],['engineVolume','Engine','engine']] as const;
  for(const [key,label,id] of fields){const row=document.createElement('label'),input=document.createElement('input'),value=document.createElement('output');row.textContent=label;input.id='audio-'+id;input.type='range';input.min='0';input.max='1';input.step='.05';input.value=String(this.settings[key]);input.setAttribute('aria-label',label+' volume');value.value=Math.round(this.settings[key]*100)+'%';input.oninput=()=>{this.settings[key]=Number(input.value);value.value=Math.round(this.settings[key]*100)+'%';this.persist();this.refresh()};row.append(input,value);settings.append(row)}
  this.ui.append(this.enable,this.mute,settings);parent.append(this.ui);this.enable.onclick=()=>void this.unlock();this.mute.onclick=()=>{this.settings.mute=!this.settings.mute;this.persist();this.refresh()};
  // Prior explicit sound activation is a per-tab intent, never an autoplay-policy bypass.
  try{if(sessionStorage.getItem('slingmods-sound-activated')==='1')queueMicrotask(()=>void this.unlock())}catch{}
 }
 private persist(){const save=loadSave(browserStorage());Object.assign(save.settings,{mute:this.settings.mute,volume:this.settings.volume,interfaceVolume:this.settings.interfaceVolume,engineVolume:this.settings.engineVolume});writeSave(browserStorage(),save)}
 private stateChanged(){if(this.disposed)return;this.enabled=this.context?.state==='running'&&!!this.graph;this.enable.hidden=this.enabled;if(this.enabled)try{sessionStorage.setItem('slingmods-sound-activated','1')}catch{}this.enable.textContent=this.failure||'Enable sound';this.refresh()}
 async unlock(){if(this.loading||this.disposed)return;this.loading=true;try{
  if(!this.context||this.context.state==='closed'){this.releaseGraph();this.context=new AudioContext();this.context.onstatechange=()=>this.stateChanged()}
  await Promise.race([this.context.resume(),new Promise(resolve=>setTimeout(resolve,800))]);if(this.disposed)return;
  if(!this.graph){const bank=await loadAudioBank(this.context);if(this.disposed||this.context.state==='closed')return;this.mix=this.context.createGain();this.mix.gain.value=1;this.limiter=this.context.createDynamicsCompressor();this.limiter.threshold.value=-3;this.limiter.knee.value=3;this.limiter.ratio.value=12;this.limiter.attack.value=.003;this.limiter.release.value=.12;this.mix.connect(this.limiter);this.limiter.connect(this.context.destination);this.graph=createAudioGraph(this.context,bank,this.mix);this.bank=bank;this.interfaceAudio=new InterfaceAudio(this.context,this.mix);this.thermal=new ThermalDepartureAudio(this.context,this.mix);await Promise.all([this.interfaceAudio.prepare(),this.thermal.prepare()]);if(this.disposed)return}
  this.failure='';this.stateChanged()
 }catch{if(!this.disposed){this.releaseGraph();this.failure='Sound unavailable — retry';this.enabled=false;this.enable.hidden=false;this.enable.textContent=this.failure}}finally{this.loading=false}}
 async suspendContext(){await this.context?.suspend()}
 cue(id:CueId,transactionKey?:string){return this.interfaceAudio?.play(id,transactionKey)??false}
 setExhaustTreatment(enabled:boolean){this.sportExhaust=enabled;if(!enabled)this.thermal?.stop();this.graph?.setTreatment(enabled);this.refresh()}
 startBayDoor(){if(!this.context||!this.mix||!this.enabled||this.disposed||this.settings.mute)return;this.bayDoor??=new BayDoorAudio(this.context,this.mix);this.bayDoor.update(this.life());void this.bayDoor.start()}
 stopBayDoor(){this.bayDoor?.stop()}
 beginDeparture(equipped:boolean){this.departureActive=true;this.departureElapsed=0;this.thermal?.begin(equipped,this.enabled&&!this.settings.mute&&!this.paused);this.refresh()}
 updateDeparture(elapsed:number,paused:boolean){this.departureElapsed=elapsed;this.paused=paused;this.thermal?.update(elapsed,paused,this.enabled&&!this.settings.mute,this.settings.volume*this.settings.engineVolume);this.refresh()}
 stopDeparture(){this.departureActive=false;this.thermal?.stop();this.refresh()}
 updateOpponents(player:VehicleTelemetry,peers:Record<string,VehicleTelemetry>){if(!this.opponents&&this.context&&this.bank)this.opponents=new OpponentAudio(this.context,this.bank,this.mix);this.opponents?.update(player,peers,this.engineLife())}
 startEvidenceCapture(){if(this.capture)throw Error('Evidence recording already active');if(!this.context||!this.limiter||!this.enabled)throw Error('Activate game sound first');this.capture=new LiveGameCapture(this.context,this.limiter);return{sampleRate:this.context.sampleRate}}
 evidenceMarker(id:string){if(!this.capture)throw Error('No evidence recording');return this.capture.marker(id)}
 async stopEvidenceCapture(){if(!this.capture)throw Error('No evidence recording');const active=this.capture;this.capture=undefined;return active.stop()}
 lifecycle(paused:boolean){this.paused=paused;this.opponents?.silence();if(this.departureActive)this.thermal?.update(this.departureElapsed,paused,this.enabled&&!this.settings.mute,this.settings.volume*this.settings.engineVolume);this.refresh()}
 private refresh(){const label=this.settings.mute?'Unmute':'Mute';if(this.mute.textContent!==label)this.mute.textContent=label;if(this.last)this.graph?.apply(mapAudio(this.last,this.engineLife()),false);this.bayDoor?.update(this.life());this.interfaceAudio?.update(this.enabled&&!this.paused&&!this.settings.mute,this.settings.volume*this.settings.interfaceVolume)}
 life(reset=false):AudioLife{return{enabled:this.enabled,paused:this.paused,mute:this.settings.mute,volume:this.settings.volume,cockpit:this.cockpit,reset}}
 private engineLife(reset=false):AudioLife{const duck=this.departureActive&&this.thermal?.active?0:1;return{...this.life(reset),volume:this.settings.volume*this.settings.engineVolume*duck}}
 update(t:VehicleTelemetry,paused:boolean,cockpit:boolean,reset=false){this.last=t;this.paused=paused;this.cockpit=cockpit;const life=this.engineLife(reset),parameters=mapAudio(t,life),shift=this.shifts.update(t,reset);this.graph?.setTreatment(this.sportExhaust);this.graph?.apply(parameters,shift);this.bayDoor?.update(this.life(reset));this.interfaceAudio?.update(this.enabled&&!paused&&!this.settings.mute,this.settings.volume*this.settings.interfaceVolume);return{life,parameters,shift}}
 inspect(){return{enabled:this.enabled,loading:this.loading,failure:this.failure,soundTreatment:this.last?.powertrain==='cvt'?'ryker-original-three-cylinder-synthesis':this.sportExhaust?'p09b-authored-sport-mix':'p09b-authored-stock-mix',life:this.life(),levels:{master:this.settings.volume,interface:this.settings.interfaceVolume,engine:this.settings.engineVolume},bayDoor:this.bayDoor?.inspect(),thermal:this.thermal?.inspect(),cues:this.interfaceAudio?.inspect(),opponents:this.opponents?.inspect(),graph:this.graph?.inspect(),captureBus:'post-limiter master including engine, rivals, interface, door and Thermal'}}
 private releaseGraph(){this.bayDoor?.dispose();this.bayDoor=undefined;this.thermal?.dispose();this.thermal=undefined;this.interfaceAudio?.dispose();this.interfaceAudio=undefined;this.capture?.abort();this.capture=undefined;this.opponents?.dispose();this.opponents=undefined;this.graph?.dispose();this.graph=undefined;this.mix?.disconnect();this.limiter?.disconnect()}
 dispose(){this.disposed=true;this.releaseGraph();void this.context?.close();this.ui.remove()}
}
export async function renderOfflineGameAudio(timeline:AudioTimelineFrame[],duration:number,revision:'old'|'new'='new'){const ctx=new OfflineAudioContext(2,Math.round(duration*48000),48000),bank=await loadAudioBank(ctx,revision==='old'?'p03b2':'p09b'),graph=createAudioGraph(ctx,bank),events=new ShiftEvents();for(const f of timeline)graph.apply((revision==='old'?mapAudioLegacy:mapAudio)(f.telemetry,f.life),events.update(f.telemetry,!!f.life.reset),f.time);const rendered=await ctx.startRendering();const pcm=new ArrayBuffer(44+rendered.length*4),v=new DataView(pcm);const text=(offset:number,s:string)=>[...s].forEach((x,i)=>v.setUint8(offset+i,x.charCodeAt(0)));text(0,'RIFF');v.setUint32(4,pcm.byteLength-8,true);text(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,48000,true);v.setUint32(28,192000,true);v.setUint16(32,4,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,rendered.length*4,true);let peak=0,nonfinite=0,clipped=0;for(let i=0;i<rendered.length;i++)for(let ch=0;ch<2;ch++){const x=rendered.getChannelData(ch)[i];if(!Number.isFinite(x))nonfinite++;peak=Math.max(peak,Math.abs(x));if(Math.abs(x)>=1)clipped++;v.setInt16(44+(i*2+ch)*2,Math.round(Math.max(-1,Math.min(1,x))*32767),true)}let binary='';const bytes=new Uint8Array(pcm);for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return{wavBase64:btoa(binary),samplePeak:peak,nonfinite,clipped,duration,method:'OfflineAudioContext using identical runtime graph factory, source buffers, mapper and full logical timeline; not live hardware capture'}}
