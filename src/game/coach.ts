import type {VehicleTelemetry} from '../simulation';
import {projectRoad,type CourseRoute} from '../course/environment';
import {inputKind} from './shell';
import {driveStats} from './achievements';
import {cornerProfile,STEP} from './corner-profile';
/**
 * Driving coach. From the course centreline it builds a corner-speed profile (radius from heading change over a short
 * arc, v = sqrt(lateral grip x radius)); during a run it flashes BRAKE when the car could not shed enough speed before the
 * next corner at a comfortable deceleration. New players also get first-drive hints (throttle, steering, camera, reset).
 * Presentation only.
 */
export type CoachMode='auto'|'on'|'off';
const KEY='slingmods-gx-coach';
export function coachMode():CoachMode{try{const v=localStorage.getItem(KEY);return v==='on'||v==='off'?v:'auto'}catch{return 'auto'}}
export function setCoachMode(m:CoachMode){try{localStorage.setItem(KEY,m)}catch{/* session default */}}
const DECEL=7,LOOK=170;

const HINTS:{id:string;key:string[];pad:string[];touch:string[];text:string;touchText?:string}[]=[
 {id:'throttle',key:['W','↑'],pad:['RT'],touch:['GAS'],text:'Hold to accelerate'},
 {id:'steer',key:['A','D'],pad:['LS'],touch:['◀ ▶'],text:'Steer through the bends',touchText:'Drag on the left to steer'},
 {id:'camera',key:['C'],pad:['Y'],touch:['CAM'],text:'Change camera'},
 {id:'reset',key:['R'],pad:['A'],touch:['RESET'],text:'Hold to reset onto the road'},
];
export class Coach {
 readonly root=document.createElement('div');private brake=document.createElement('div');private hint=document.createElement('div');
 private profile:{length:number;limit:number[]};private enabled:boolean;private hints:boolean;private shown=new Set<string>();private hintUntil=0;private at=0;private runTime=0;private stuck=0;private state='';
 constructor(parent:Element,private course:CourseRoute){
  this.profile=cornerProfile(course);const mode=coachMode(),newbie=driveStats().drives<4;this.enabled=mode==='on'||mode==='auto'&&newbie;this.hints=mode!=='off'&&newbie;
  this.root.className='gx-coach';this.brake.className='gx-coach-brake';this.brake.innerHTML='<b>BRAKE</b><span></span>';this.hint.className='gx-coach-hint';this.root.append(this.brake,this.hint);parent.append(this.root);
 }
 private say(id:string){if(!this.hints||this.shown.has(id))return;const h=HINTS.find(x=>x.id===id)!;this.shown.add(id);const touch=!!document.querySelector('.gx-touch:not([hidden])'),pad=!touch&&inputKind()==='pad';this.hint.innerHTML=`${(touch?h.touch:pad?h.pad:h.key).map(k=>`<kbd class="gx-glyph ${pad?'gx-pad gx-pad-'+k.toLowerCase():'gx-key'}">${k}</kbd>`).join('')}<span>${touch&&h.touchText||h.text}</span>`;this.hint.classList.remove('is-on');void this.hint.offsetWidth;this.hint.classList.add('is-on');this.hintUntil=performance.now()+3800}
 update(t:VehicleTelemetry,running:boolean,countdown:boolean){
  const now=performance.now();if(now>this.hintUntil)this.hint.classList.remove('is-on');
  if(countdown){this.say('throttle');this.runTime=0}
  if(!running){this.at=now;this.show('');return}
  const dt=Math.min(.2,(now-(this.at||now))/1000);this.at=now;this.runTime+=dt;
  if(this.runTime>4&&Math.abs(t.steer)>.25)this.say('steer');if(this.runTime>22)this.say('camera');
  this.stuck=Math.abs(t.speed)<1.5&&t.throttle>.5?this.stuck+dt:0;if(this.stuck>2.5)this.say('reset');
  if(!this.enabled||t.speed<8){this.show('');return}
  const p=projectRoad(this.course,t.position.x,t.position.z).progress,v=Math.abs(t.speed),P=this.profile;let need=0,dist=0;
  for(let x=0;x<LOOK;x+=STEP){const k=Math.min(P.limit.length-1,Math.floor(((p+x)%P.length+P.length)%P.length/STEP)),vmax=P.limit[k];const excess=v*v-vmax*vmax-2*DECEL*x;if(excess>need){need=excess;dist=x}}
  this.show(need>18&&t.brake<.35?'brake':need>18?'braking':'',dist);
 }
 private show(state:string,dist=0){if(state!==this.state){this.state=state;this.brake.dataset.state=state}if(state)(this.brake.lastElementChild as HTMLElement).textContent=state==='braking'?'GOOD':`${Math.round(dist)} m`}
 dispose(){this.root.remove()}
}
