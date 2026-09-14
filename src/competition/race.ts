import {certifyCrewFinish,type CrewAwardProof} from '../career/crew-result';
import {crossGate} from '../race/attempt';
import type {CourseRoute} from '../course/environment';
import type {VehicleControl,VehicleTelemetry} from '../simulation';
import {RaceRoad} from './road';
export const CREW_EVENT_ID='harbor-crew-night-v1';
export type CrewStatus='running'|'finished'|'invalid'|'dnf'|'unfinished';
export interface CrewStanding {id:string;place:number;status:CrewStatus;lap:number;nextGate:number;progress:number;timeMs:number|null;invalidReason:string|null;valid:boolean}
export interface CrewResult {event:typeof CREW_EVENT_ID;attemptId:string;participantId:string;status:CrewStatus;valid:boolean;laps:number;timeMs:number|null;place:number|null;invalidReason:string|null}
interface Participant {id:string;status:CrewStatus;completed:number;next:number;launched:boolean;distance:number;offSeconds:number;segment?:number;progress:number;timeMs:number|null;invalidReason:string|null;place:number|null}
const HOLD:VehicleControl={throttle:0,brake:1,steer:0,reverse:false,tractionControl:true};
export class CrewRace {
 private proof:CrewAwardProof|null=null;private road:RaceRoad;private states=new Map<string,Participant>();private phase:'ready'|'countdown'|'running'|'finished'='ready';private paused=false;private countdownTicks=0;private elapsedMs=0;private attemptId='';private terminalAt:number|null=null;
 constructor(readonly route:CourseRoute,readonly participantIds:readonly string[]=['maya','jett','nico','player'],readonly playerId='player'){if(participantIds.length!==4||new Set(participantIds).size!==4||!participantIds.includes(playerId))throw Error('Crew race requires four distinct participants including player');this.road=new RaceRoad(route);this.initialize()}
 private initialize(){this.states.clear();for(const id of this.participantIds)this.states.set(id,{id,status:'running',completed:0,next:1,launched:false,distance:0,offSeconds:0,progress:-this.participantIds.indexOf(id),timeMs:null,invalidReason:null,place:null})}
 restart(attemptId:string){if(!attemptId||attemptId===this.attemptId)throw Error('Each crew restart needs a fresh attempt ID');this.attemptId=attemptId;this.phase='countdown';this.paused=false;this.countdownTicks=0;this.elapsedMs=0;this.terminalAt=null;this.proof=null;this.initialize()}
 setPaused(value:boolean){this.paused=value}
 control(id:string,control:VehicleControl):VehicleControl{const s=this.states.get(id),cooldown=s?.status==='finished'&&id!==this.playerId&&this.elapsedMs-s.timeMs!<15000;return !this.paused&&(this.phase==='running'||this.phase==='finished')&&(s?.status==='running'||cooldown)?control:HOLD}
 awardProof(){return this.proof}
 retire(id:string,reason='Stranded — DNF'){const s=this.states.get(id);if(s?.status==='running'){s.status='dnf';s.invalidReason=reason;this.playerTerminal()}}
 abort(){for(const s of this.states.values())if(s.status==='running'){s.status='unfinished';s.invalidReason='Returned before finish'}this.phase='finished'}
 private invalidate(s:Participant,reason:string){s.invalidReason??=reason;s.status='invalid'}
 private playerTerminal(){if(this.states.get(this.playerId)!.status!=='running'&&this.terminalAt===null){this.terminalAt=this.elapsedMs;this.phase='finished'}}
 tick(previous:Record<string,VehicleTelemetry>,current:Record<string,VehicleTelemetry>,dt:number){
  if(Math.abs(dt-1/60)>1e-9)throw Error('Crew timing requires fixed 1/60 ticks');if(this.paused||this.phase==='ready')return;
  if(this.phase==='countdown'){if(++this.countdownTicks>=180)this.phase='running';return}
  const before=this.elapsedMs;this.elapsedMs+=dt*1000;const candidates:Participant[]=[];
  for(const s of this.states.values()){
   if(s.status!=='running')continue;const prev=previous[s.id],now=current[s.id];if(!prev||!now)throw Error(`Missing physical participant ${s.id}`);
   const a=this.road.project(prev.position.x,prev.position.z,s.segment),b=this.road.project(now.position.x,now.position.z,a.segment);s.segment=b.segment;
   const moved=Math.hypot(now.position.x-prev.position.x,now.position.z-prev.position.z);let delta=b.progress-a.progress;if(delta>this.route.length/2)delta-=this.route.length;if(delta< -this.route.length/2)delta+=this.route.length;
   if(!Number.isFinite(moved)||moved>Math.max(4,Math.abs(prev.speed)*dt*2+1))this.invalidate(s,'Attempt relocated');
   if(Math.abs(delta)>moved*2+3)this.invalidate(s,'Course corridor skipped');s.distance+=delta;
   const q=now.quaternion;let off=0;for(const w of now.wheels){const a=w.localCenter,tx=2*(q.y*a.z-q.z*a.y),ty=2*(q.z*a.x-q.x*a.z),tz=2*(q.x*a.y-q.y*a.x),x=now.position.x+a.x+q.w*tx+q.y*tz-q.z*ty,z=now.position.z+a.z+q.w*tz+q.x*ty-q.y*tx;if(this.road.project(x,z,b.segment).distance>this.route.width/2+this.route.runoff+.25)off++}s.offSeconds=off>=2?s.offSeconds+dt:0;if(s.offSeconds>.35+1e-9)this.invalidate(s,'Track limits — two tires beyond runoff');
   if(s.status!=='running')continue;
   const crossings=this.route.checkpoints.map((g,i)=>({i,hit:crossGate(g,prev.position,now.position)})).filter(v=>v.hit).sort((a,b)=>a.hit!.fraction-b.hit!.fraction);
   for(const {i,hit} of crossings){
    if(!hit!.forward){this.invalidate(s,i===0?'Finish crossed backward':'Checkpoint crossed backward');break}
    if(i===0){if(!s.launched){s.launched=true;continue}if(s.next!==this.route.checkpoints.length){this.invalidate(s,'Finish reached before all checkpoints');break}if(s.distance<(s.completed+1)*this.route.length-15){this.invalidate(s,'Course distance shortcut');break}s.completed++;s.next=1;if(s.completed===2){s.timeMs=before+dt*1000*hit!.fraction;candidates.push(s);break}}
    else {if(!s.launched||i!==s.next){this.invalidate(s,'Checkpoint order skipped');break}s.next++}
   }
   // Only accepted lap/sector history can increase ranking. Projection is bounded inside that sector.
   const lower=s.launched?this.route.checkpoints[s.next-1].distance:0,upper=s.next===this.route.checkpoints.length?this.route.length:this.route.checkpoints[s.next].distance;
   let projected=b.progress;if(s.next===this.route.checkpoints.length&&b.progress<this.route.length/2)projected+=this.route.length;
   s.progress=s.launched?s.completed*this.route.length+Math.max(lower,Math.min(upper,projected)):-Math.min(100,this.route.length-b.progress);
  }
  // Common timestamp with sub-tick crossing; lexical ID is used only for an exact floating-point tie.
  candidates.sort((a,b)=>a.timeMs!-b.timeMs!||a.id.localeCompare(b.id));let place=[...this.states.values()].filter(s=>s.status==='finished').length;
  for(const s of candidates){s.status='finished';s.place=++place;s.progress=2*this.route.length;if(s.id===this.playerId&&this.playerId==='player')this.proof=certifyCrewFinish({event:CREW_EVENT_ID,attemptId:this.attemptId,participantId:'player',status:'finished',valid:true,laps:2,timeMs:s.timeMs!,place:s.place as 1|2|3|4})}
  this.playerTerminal();if(this.terminalAt!==null&&this.elapsedMs-this.terminalAt>=30000-1e-7)for(const s of this.states.values())if(s.status==='running'){s.status='dnf';s.invalidReason='30-second postfinish limit'}
 }
 snapshot(){const states=[...this.states.values()].sort((a,b)=>{if(a.status==='finished'||b.status==='finished')return a.status==='finished'&&b.status==='finished'?a.place!-b.place!:a.status==='finished'?-1:1;if(a.status==='running'!== (b.status==='running'))return a.status==='running'?-1:1;return b.progress-a.progress||a.id.localeCompare(b.id)});
  const standings:CrewStanding[]=states.map((s,i)=>({id:s.id,place:s.place??i+1,status:s.status,lap:Math.min(2,s.completed+1),nextGate:s.next,progress:s.progress,timeMs:s.timeMs,invalidReason:s.invalidReason,valid:s.status==='running'||s.status==='finished'}));const p=this.states.get(this.playerId)!;
  const playerResult:CrewResult|null=p.status==='running'?null:{event:CREW_EVENT_ID,attemptId:this.attemptId,participantId:this.playerId,status:p.status,valid:p.status==='finished',laps:p.completed,timeMs:p.timeMs,place:p.place,invalidReason:p.invalidReason};
  return {phase:this.phase,paused:this.paused,countdown:this.phase==='countdown'?Math.max(0,3-this.countdownTicks/60):0,elapsedMs:this.elapsedMs,attemptId:this.attemptId,standings,playerResult,allFinished:states.every(s=>s.status!=='running')};
 }
}
