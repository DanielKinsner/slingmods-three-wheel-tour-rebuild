import * as THREE from 'three';
import type {VehicleTelemetry} from '../simulation';
import {sampleRoad,projectRoad,type CourseRoute} from '../course/environment';
import {gameCue} from './audio-bus';
import {setPrompts} from './shell';
/**
 * Instant replay. The recorder keeps every car's telemetry at 30 Hz from the countdown until shortly after the finish
 * (memory only, per race). Playback never touches the simulation: the drive poses the cars from interpolated frames and
 * hands the camera to a broadcast director (trackside TV cameras, chase, helicopter, low tracking).
 */
type Field=Record<string,VehicleTelemetry>;
interface Frame {t:number;raceMs:number;field:Field}
const RECORD_STEP=1/30,MAX_FRAMES=30*60*6;

export class ReplayRecorder {
 frames:Frame[]=[];private attempt='';private endAt:number|null=null;private lastT=-Infinity;
 record(s:{phase:string;paused:boolean;elapsedMs:number;attemptId?:string|null;playerResult:unknown;allFinished:boolean},field:Field){
  const key=s.attemptId??'';if(key!==this.attempt||s.phase==='ready'){if(key!==this.attempt||this.frames.length){this.frames=[];this.endAt=null;this.lastT=-Infinity}this.attempt=key;if(s.phase==='ready')return}
  const p=field.player;if(!p||s.paused||!['countdown','running','finished'].includes(s.phase))return;
  if(p.time<this.lastT-.5){this.frames=[];this.endAt=null;this.lastT=-Infinity}
  if(this.endAt===null&&s.playerResult)this.endAt=p.time+(s.allFinished?2:12);
  if(this.endAt!==null&&(p.time>this.endAt||s.allFinished&&p.time>this.endAt-10))return;
  if(p.time-this.lastT<RECORD_STEP-1e-6||this.frames.length>=MAX_FRAMES)return;
  this.lastT=p.time;this.frames.push({t:p.time,raceMs:s.elapsedMs,field});
 }
 get available(){return this.frames.length>60}
}

const lerp=THREE.MathUtils.lerp;
function blend(a:VehicleTelemetry,b:VehicleTelemetry,k:number):VehicleTelemetry{
 if(k<=0)return a;if(k>=1)return b;const qa=new THREE.Quaternion(a.quaternion.x,a.quaternion.y,a.quaternion.z,a.quaternion.w).slerp(new THREE.Quaternion(b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w),k);
 return {...a,time:lerp(a.time,b.time,k),position:{x:lerp(a.position.x,b.position.x,k),y:lerp(a.position.y,b.position.y,k),z:lerp(a.position.z,b.position.z,k)},quaternion:{x:qa.x,y:qa.y,z:qa.z,w:qa.w},speed:lerp(a.speed,b.speed,k),rpm:lerp(a.rpm,b.rpm,k),steer:lerp(a.steer,b.steer,k),
  wheels:a.wheels.map((w,i)=>{const v=b.wheels[i];return v?{...w,travel:lerp(w.travel,v.travel,k),steer:lerp(w.steer,v.steer,k),localCenter:{x:w.localCenter.x,y:lerp(w.localCenter.y,v.localCenter.y,k),z:w.localCenter.z}}:w})};
}

type CamMode='director'|'tv'|'chase'|'heli'|'low';
const MODES:CamMode[]=['director','tv','chase','heli','low'];
const MODE_LABEL:Record<CamMode,string>={director:'Director',tv:'Trackside',chase:'Chase',heli:'Helicopter',low:'Low tracking'};

/** Broadcast camera: trackside posts along the course, plus chase / helicopter / low tracking shots. Also films attract
 * mode live (it only needs the car's telemetry). */
export class ReplayCamera {
 mode:CamMode='director';private posts:{station:number;pos:THREE.Vector3}[]=[];private post=-1;private shot:Exclude<CamMode,'director'>='tv';private shotUntil=0;private pos=new THREE.Vector3();private look=new THREE.Vector3();private fov=40;private snap=true;private orbit=0;
 private f=new THREE.Vector3();private r=new THREE.Vector3();private q=new THREE.Quaternion();private car=new THREE.Vector3();
 constructor(private route:CourseRoute,private ground:(x:number,z:number)=>number,private blocked?:(from:THREE.Vector3,to:THREE.Vector3)=>boolean){
  const spacing=Math.max(70,Math.min(130,route.length/18));let side=1;
  for(let d=0;d<route.length;d+=spacing){const p=sampleRoad(route,d),n=new THREE.Vector2(-p.dz,p.dx).normalize().multiplyScalar(route.width/2+route.runoff+5+((d/spacing)%3)*2),x=p.x+n.x*side,z=p.z+n.y*side;this.posts.push({station:d,pos:new THREE.Vector3(x,this.ground(x,z)+3.8+((d/spacing)%2)*2,z)});side=-side}
 }
 reset(){this.snap=true;this.post=-1;this.shotUntil=0}
 update(camera:THREE.PerspectiveCamera,t:VehicleTelemetry,dt:number,clock:number){
  this.car.set(t.position.x,t.position.y+.7,t.position.z);this.q.set(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w);this.f.set(0,0,-1).applyQuaternion(this.q).setY(0).normalize();this.r.set(1,0,0).applyQuaternion(this.q).setY(0).normalize();
  let shot:Exclude<CamMode,'director'>=this.mode==='director'?this.shot:this.mode;
  if(this.mode==='director'&&clock>=this.shotUntil){const pool:Exclude<CamMode,'director'>[]=['tv','tv','chase','tv','heli','low'];let next=pool[Math.floor(Math.random()*pool.length)];if(next===this.shot)next=next==='tv'?'chase':'tv';this.shot=shot=next;this.shotUntil=clock+(next==='tv'?7:4.5);this.snap=true}
  let wantPos=new THREE.Vector3(),fov=40,smooth=6;
  if(shot==='tv'){const prog=projectRoad(this.route,t.position.x,t.position.z).progress,L=this.route.length;let best=-1,ahead=Infinity;this.posts.forEach((c,i)=>{const a=((c.station-(prog-35))%L+L)%L;if(a<ahead&&!this.blocked?.(c.pos,this.car)){ahead=a;best=i}});
   if(best<0)shot='chase';else{if(best!==this.post){this.post=best;this.snap=true}wantPos.copy(this.posts[best].pos);const dist=wantPos.distanceTo(this.car);fov=THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2*Math.atan(5.5/dist)),9,48);smooth=40}}
  if(shot==='chase')wantPos.copy(this.car).addScaledVector(this.f,-7).add(new THREE.Vector3(0,2.1,0)),fov=52,smooth=5;
  if(shot==='heli'){this.orbit+=dt*.25;wantPos.set(this.car.x+Math.cos(this.orbit)*16,this.car.y+10,this.car.z+Math.sin(this.orbit)*16);fov=38;smooth=3}
  if(shot==='low')wantPos.copy(this.car).addScaledVector(this.r,3.6).addScaledVector(this.f,1.2).add(new THREE.Vector3(0,-.35,0)),fov=58,smooth=8;
  wantPos.y=Math.max(wantPos.y,this.ground(wantPos.x,wantPos.z)+.35);
  const snap=this.snap;this.snap=false;const k=snap?1:1-Math.exp(-smooth*dt);this.pos.lerp(wantPos,k);const lookAt=shot==='low'?this.car.clone().addScaledVector(this.f,3):this.car;if(snap)this.look.copy(lookAt);else this.look.lerp(lookAt,Math.min(1,k*1.6));
  this.fov=lerp(this.fov,fov,k);camera.position.copy(this.pos);camera.up.set(0,1,0);camera.fov=this.fov;camera.lookAt(this.look);camera.updateProjectionMatrix();
  return shot;
 }
 cycle(){this.mode=MODES[(MODES.indexOf(this.mode)+1)%MODES.length];this.shotUntil=0;this.snap=true;return this.mode}
 get label(){return MODE_LABEL[this.mode]}
}

/** Playback state + on-screen controls. The drive calls frame() instead of its normal presentation while active. */
export class ReplayPlayer {
 active=false;private clock=0;private rate=1;private playing=true;private frames:Frame[]=[];private cam:ReplayCamera;private ui=document.createElement('section');private padToken=0;private seeked=true;
 constructor(route:CourseRoute,ground:(x:number,z:number)=>number,blocked:((from:THREE.Vector3,to:THREE.Vector3)=>boolean)|undefined,private onExit:()=>void){
  this.cam=new ReplayCamera(route,ground,blocked);
  this.ui.className='gx-replay-ui';this.ui.hidden=true;this.ui.setAttribute('aria-label','Replay controls');
  this.ui.innerHTML=`<div class="gx-replay-bug"><i></i>REPLAY</div><div class="gx-replay-time"><b data-rp="race">0:00.000</b><small data-rp="cam"></small></div><div class="gx-replay-bar" data-rp="bar"><i data-rp="fill"></i></div><div class="gx-replay-buttons"><button data-rp="back">−5s</button><button data-rp="play" class="is-primary">Pause</button><button data-rp="fwd">+5s</button><button data-rp="rate">1×</button><button data-rp="camera">Camera</button><button data-rp="exit">Exit replay</button></div>`;
  document.body.append(this.ui);
  this.ui.addEventListener('click',e=>{const bar=(e.target as Element).closest<HTMLElement>('[data-rp=bar]');if(bar){const r=bar.getBoundingClientRect();this.seek(((e as MouseEvent).clientX-r.left)/r.width*this.duration);return}const b=(e.target as Element).closest<HTMLElement>('button[data-rp]');if(b)this.command(b.dataset.rp!)});
  addEventListener('keydown',this.onKey,true);
 }
 get duration(){return this.frames.length?this.frames[this.frames.length-1].t-this.frames[0].t:0}
 private onKey=(e:KeyboardEvent)=>{if(!this.active)return;const map:Record<string,string>={Escape:'exit',Backspace:'exit',Space:'play',Enter:'play',ArrowLeft:'back',ArrowRight:'fwd',ArrowUp:'rate',ArrowDown:'rate',KeyC:'camera'};const a=map[e.code];if(!a)return;if(e.target instanceof HTMLButtonElement&&(e.code==='Enter'||e.code==='Space'))return;e.preventDefault();e.stopPropagation();this.command(a)};
 private command(a:string){if(a==='exit'){this.exit();return}if(a==='play'){if(!this.playing&&this.clock>=this.duration-.05)this.seek(0);this.playing=!this.playing}if(a==='back')this.seek(this.clock-5);if(a==='fwd')this.seek(this.clock+5);if(a==='rate'){this.rate=this.rate===1?.5:this.rate===.5?.25:1}if(a==='camera')this.cam.cycle();gameCue('gx.tab');this.paint()}
 private seek(s:number){this.clock=THREE.MathUtils.clamp(s,0,this.duration);this.seeked=true;this.cam.reset();this.paint()}
 enter(frames:Frame[]){if(this.active||frames.length<2)return;this.frames=frames;this.active=true;this.clock=0;this.rate=1;this.playing=true;this.seeked=true;this.cam.reset();document.body.classList.add('gx-replay');document.body.dataset.gxModal='1';this.ui.hidden=false;gameCue('gx.whoosh');setPrompts([{key:'confirm',label:'Play / pause'},{key:'adjust',label:'Skip 5 s'},{key:'camera',label:'Camera'},{key:'back',label:'Exit'}]);this.paint();this.padLoop()}
 exit(){if(!this.active)return;this.active=false;this.padToken++;document.body.classList.remove('gx-replay');delete document.body.dataset.gxModal;this.ui.hidden=true;gameCue('gx.back');setPrompts(null);this.onExit()}
 /** Advance and return the interpolated field for this render frame, plus whether the caller should reset trails. */
 frame(dt:number,camera:THREE.PerspectiveCamera):{field:Field;reset:boolean}{
  if(this.playing){this.clock+=dt*this.rate;if(this.clock>=this.duration){this.clock=this.duration;this.playing=false;this.paint()}}
  const F=this.frames,target=F[0].t+this.clock;let lo=0,hi=F.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(F[m].t<=target)lo=m;else hi=m}
  const a=F[lo],b=F[hi],k=b.t>a.t?(target-a.t)/(b.t-a.t):0,field:Field={};for(const id of Object.keys(a.field))field[id]=b.field[id]?blend(a.field[id],b.field[id],k):a.field[id];
  this.cam.update(camera,field.player,this.playing?dt*this.rate:0,this.clock);this.raceMs=lerp(a.raceMs,b.raceMs,k);
  const reset=this.seeked;this.seeked=false;if(performance.now()-this.painted>100)this.paint();return {field,reset};
 }
 private raceMs=0;private painted=0;
 private paint(){this.painted=performance.now();const q=(s:string)=>this.ui.querySelector<HTMLElement>(`[data-rp=${s}]`)!;const ms=Math.max(0,this.raceMs),sec=ms/1000,m=Math.floor(sec/60);q('race').textContent=`${m}:${(sec-m*60).toFixed(3).padStart(6,'0')}`;q('cam').textContent=`${this.cam.label.toUpperCase()} CAMERA${this.rate!==1?` · ${this.rate}× SLOW MOTION`:''}`;q('fill').style.width=`${this.duration?this.clock/this.duration*100:0}%`;q('play').textContent=this.playing?'Pause':this.clock>=this.duration-.05?'Replay again':'Play';q('rate').textContent=`${this.rate}×`}
 private padLoop(){const token=++this.padToken;let prior:boolean[]=[true,true,true,true,true,true,true];const tick=()=>{if(!this.active||token!==this.padToken)return;const pad=(Array.from(navigator.getGamepads?.()??[]) as (Gamepad|null)[]).find(p=>p?.connected&&p.mapping==='standard');
  if(pad){const b=(i:number)=>(pad.buttons[i]?.value??0)>.5,now=[b(0),b(1),b(3),b(4),b(5),b(12),b(13)],acts=['play','exit','camera','back','fwd','rate','rate'];now.forEach((v,i)=>{if(v&&!prior[i])this.command(acts[i])});prior=now}
  requestAnimationFrame(tick)};requestAnimationFrame(tick)}
 dispose(){this.exit();removeEventListener('keydown',this.onKey,true);this.ui.remove()}
}
