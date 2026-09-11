import {projectRoad,type CourseRoute,type CourseGate} from '../course/environment';
import type {VehicleControl,VehicleTelemetry} from '../simulation';
export const EVENT_RULES='standing-lap-v1';
export type RacePhase='ready'|'countdown'|'running'|'finished';
export interface RaceResult {timeMs:number;valid:boolean;invalidReason:string|null;previousBestMs:number|null;bestMs:number|null;differenceMs:number|null;firstRecord:boolean;newBest:boolean}
export interface RaceSnapshot {phase:RacePhase;paused:boolean;invalidReason:string|null;elapsedMs:number;countdown:number;checkpoint:number;total:number;result:RaceResult|null;attempt:number}
/** Plane crossing includes the segment fraction, independently of rendering cadence. */
export function crossGate(g:CourseGate,a:{x:number;z:number},b:{x:number;z:number}){const da=(a.x-g.x)*g.dx+(a.z-g.z)*g.dz,db=(b.x-g.x)*g.dx+(b.z-g.z)*g.dz;if(!((da<0&&db>=0)||(da>0&&db<=0)))return null;const fraction=da/(da-db),x=a.x+(b.x-a.x)*fraction,z=a.z+(b.z-a.z)*fraction;if(Math.abs((x-g.x)*-g.dz+(z-g.z)*g.dx)>g.halfWidth)return null;return {fraction,forward:db>da}}
function tirePositions(v:VehicleTelemetry){const q=v.quaternion;return v.wheels.map(w=>{const a=w.localCenter,tx=2*(q.y*a.z-q.z*a.y),ty=2*(q.z*a.x-q.x*a.z),tz=2*(q.x*a.y-q.y*a.x);return {x:v.position.x+a.x+q.w*tx+q.y*tz-q.z*ty,z:v.position.z+a.z+q.w*tz+q.x*ty-q.y*tx}})}
export class RaceAttempt {
 private phase:RacePhase='ready';private paused=false;private invalidReason:string|null=null;private elapsedMs=0;private countdownTicks=0;private next=1;private result:RaceResult|null=null;private attempt=0;private offSeconds=0;private progress=0;private launched=false;private best:number|null;
 constructor(readonly route:CourseRoute,readonly lighting:'day'|'night',previousBestMs:number|null=null){this.best=Number.isFinite(previousBestMs)&&previousBestMs!>0?previousBestMs:null}
 start(){if(this.phase==='ready')this.restart()}
 restart(){this.phase='countdown';this.paused=false;this.invalidReason=null;this.elapsedMs=0;this.countdownTicks=0;this.next=1;this.result=null;this.offSeconds=0;this.progress=0;this.launched=false;this.attempt++}
 setPaused(paused:boolean){this.paused=paused}
 invalidate(reason:string){if(this.phase==='running')this.invalidReason??=reason}
 control(control:VehicleControl):VehicleControl{return this.phase==='running'&&!this.paused?control:{throttle:0,brake:1,steer:0,reverse:false,tractionControl:true}}
 tick(previous:VehicleTelemetry,current:VehicleTelemetry,dt:number){
  if(this.paused||this.phase==='ready'||this.phase==='finished')return;
  if(this.phase==='countdown'){this.countdownTicks++;if(this.countdownTicks*dt>=3-1e-9)this.phase='running';return}
  const before=this.elapsedMs;this.elapsedMs+=dt*1000;
  const a=projectRoad(this.route,previous.position.x,previous.position.z),b=projectRoad(this.route,current.position.x,current.position.z),moved=Math.hypot(current.position.x-previous.position.x,current.position.z-previous.position.z);
  let delta=b.progress-a.progress;if(delta>this.route.length/2)delta-=this.route.length;if(delta< -this.route.length/2)delta+=this.route.length;
  if(Math.abs(delta)>moved*2+3)this.invalidate('Course corridor skipped');
  if(moved>Math.max(4,Math.abs(previous.speed)*dt*2+1))this.invalidate('Attempt relocated');
  this.progress+=delta;
  const allowed=this.route.width/2+this.route.runoff+.25;
  const off=tirePositions(current).filter(p=>projectRoad(this.route,p.x,p.z).distance>allowed).length;
  this.offSeconds=off>=2?this.offSeconds+dt:0;if(this.offSeconds>.35+1e-9)this.invalidate('Track limits — two tires beyond runoff');
  const crossings=this.route.checkpoints.map((g,i)=>({i,hit:crossGate(g,previous.position,current.position)})).filter(v=>v.hit).sort((a,b)=>a.hit!.fraction-b.hit!.fraction);
  for(const {i,hit}of crossings){
   if(!hit!.forward){this.invalidate(i===0?'Finish crossed backward':'Checkpoint crossed backward');continue}
   if(i===0){
    if(!this.launched){this.launched=true;if(this.next!==1)this.invalidate('Missing initial line crossing');continue}
    if(this.next!==this.route.checkpoints.length){this.invalidate('Finish reached before all checkpoints');continue}
    if(this.progress<this.route.length-15)this.invalidate('Course distance shortcut');
    this.elapsedMs=before+dt*1000*hit!.fraction;this.phase='finished';const valid=this.invalidReason===null,prior=this.best,newBest=valid&&(prior===null||this.elapsedMs<prior);if(newBest)this.best=this.elapsedMs;
    this.result={timeMs:this.elapsedMs,valid,invalidReason:this.invalidReason,previousBestMs:prior,bestMs:this.best,differenceMs:prior===null?null:this.elapsedMs-prior,firstRecord:valid&&prior===null,newBest};break;
   }
   if(!this.launched)this.invalidate('Checkpoint before start line');
   if(i!==this.next){this.invalidate('Checkpoint order skipped');continue}this.next++;
  }
 }
 snapshot():RaceSnapshot{return {phase:this.phase,paused:this.paused,invalidReason:this.invalidReason,elapsedMs:this.elapsedMs,countdown:this.phase==='countdown'?Math.max(0,3-this.countdownTicks/60):0,checkpoint:this.next-1,total:this.route.checkpoints.length-1,result:this.result?{...this.result}:null,attempt:this.attempt}}
}
