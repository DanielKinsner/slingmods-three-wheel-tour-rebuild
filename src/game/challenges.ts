import {projectRoad,sampleRoad,type CourseRoute} from '../course/environment';
import type {VehicleTelemetry} from '../simulation';
import {isAttract} from './attract-flag';
import {MEDALS,type Medal} from './time-attack';
/**
 * Challenges ("driving school"): short medal tests on the real courses, each a single skill.
 *  - sprint: standing start, reach the gate fastest (time, lower is better)
 *  - trap:   standing start, carry the most speed through the speed trap (m/s, higher is better)
 *  - brake:  standing start, reach the box inside the time limit and stop in it (metres from the line, lower is better)
 * Runs happen in the free-drive mode with the car placed at the challenge start; the judge only reads telemetry, so
 * physics, race rules and the career are untouched. Targets are measured, not invented: `scripts/game-feel/challenge-targets.ts`
 * runs the crew AI, Jett at raised pace scales (1.1-1.3) and Jett's steering at full throttle, and the best run that stays
 * on the road is the reference: SlingMods = the reference, then Gold 1.04x / Silver 1.12x / Bronze 1.25x its time (sprints)
 * or 0.96 / 0.90 / 0.80 of its trap speed (traps sit just after corners, so exit speed matters). Brake limits sit between
 * the committed late-braking runs of `challenge-brake-limits.ts`. Results live in their own local key.
 */
export type ChallengeKind='sprint'|'trap'|'brake';
export type ChallengeRoute='harbor'|'express'|'ridge';
export interface Challenge {id:string;route:ChallengeRoute;kind:ChallengeKind;title:string;brief:string;
 /** Start and target stations along the course (m); `end` is the gate, the trap or the box line. May wrap past the lap line. */
 start:number;end:number;
 /** brake only: time to stop in the box (ms). */
 limitMs?:number;
 /** Medal thresholds: ms (sprint), m/s (trap), metres (brake). */
 targets:Record<Medal,number>}
export const BOX_HALF=4,KIND_LABEL:Record<ChallengeKind,string>={sprint:'SPRINT',trap:'SPEED TRAP',brake:'BRAKE TEST'};

export const CHALLENGES:readonly Challenge[]=[
 {id:'harbor-brake',route:'harbor',kind:'brake',title:'Harbor Brake Test',brief:'Launch down the start straight and stop with your nose on the line. The box is 150 m ahead.',start:0,end:150,limitMs:11500,targets:{slingmods:.3,gold:.9,silver:2,bronze:BOX_HALF}},
 {id:'harbor-sprint',route:'harbor',kind:'sprint',title:'Waterfront Sprint',brief:'The tight middle of the harbor: 700 m of 90-degree corners. Brake early, clip the apex, go.',start:200,end:900,targets:{slingmods:35000,gold:36400,silver:39200,bronze:43700}},
 {id:'harbor-trap',route:'harbor',kind:'trap',title:'Seawall Speed Trap',brief:'Thread the last tight corners, then carry every mph you can onto the back straight and through the trap.',start:700,end:1020,targets:{slingmods:33.9,gold:32.5,silver:30.5,bronze:27.1}},
 {id:'express-trap',route:'express',kind:'trap',title:'Coastal Exit Trap',brief:'A fast sweeper onto the coastal straight. The earlier you get back on the throttle, the faster the trap.',start:900,end:1450,targets:{slingmods:46.5,gold:44.6,silver:41.8,bronze:37.2}},
 {id:'express-brake',route:'express',kind:'brake',title:'Coastal Brake Test',brief:'Full throttle for 260 m, then stop inside the box. Carry speed: the clock is tight.',start:1240,end:1500,limitMs:15000,targets:{slingmods:.3,gold:.9,silver:2,bronze:BOX_HALF}},
 {id:'express-sprint',route:'express',kind:'sprint',title:'Harbor Esses',brief:'Six hundred metres of linked bends back to the line. Smooth is fast.',start:1700,end:2300,targets:{slingmods:22300,gold:23200,silver:25000,bronze:27900}},
 {id:'ridge-trap',route:'ridge',kind:'trap',title:'Forest Exit Trap',brief:'Mountain bends, then a short straight to the trap. Exit speed is everything.',start:800,end:1200,targets:{slingmods:44.9,gold:43.1,silver:40.4,bronze:35.9}},
 {id:'ridge-brake',route:'ridge',kind:'brake',title:'Overlook Brake Test',brief:'A short run to the overlook box. Stop on the line before the mountain does it for you.',start:1415,end:1535,limitMs:12000,targets:{slingmods:.3,gold:.9,silver:2,bronze:BOX_HALF}},
 {id:'ridge-sprint',route:'ridge',kind:'sprint',title:'Smoky Switchbacks',brief:'Nine hundred metres of mountain road, climbing and falling through the trees.',start:700,end:1600,targets:{slingmods:28200,gold:29300,silver:31600,bronze:35300}},
];
export const challengeById=(id:string|null|undefined)=>CHALLENGES.find(c=>c.id===id);
export const betterIsLower=(k:ChallengeKind)=>k!=='trap';
export function challengeMedal(c:Challenge,value:number):Medal|null{return MEDALS.find(m=>betterIsLower(c.kind)?value<=c.targets[m]:value>=c.targets[m])??null}
export function formatValue(c:Challenge,value:number,units:'mph'|'kmh'='mph'){
 if(c.kind==='sprint'){const s=value/1000,m=Math.floor(s/60);return m?`${m}:${(s-m*60).toFixed(3).padStart(6,'0')}`:`${s.toFixed(3)} s`}
 if(c.kind==='trap')return units==='kmh'?`${(value*3.6).toFixed(1)} km/h`:`${(value*2.23694).toFixed(1)} mph`;
 return `${value.toFixed(2)} m`;
}
/** Car pose at a station, facing the direction of travel (same convention as free-drive recovery). */
export function stationPose(route:CourseRoute,station:number){const p=sampleRoad(route,station);return {x:p.x,y:p.y===undefined?route.start.y:p.y+.025,z:p.z,yaw:Math.atan2(-p.dx,-p.dz),...(p.dy===undefined?{}:{pitch:Math.atan(p.dy)})}}

export type JudgePhase='ready'|'running'|'done'|'failed';
export interface JudgeState {phase:JudgePhase;elapsedMs:number;travelled:number;toGo:number;speed:number;value:number|null;medal:Medal|null;reason:string}
/**
 * Pure run judge over telemetry. The clock starts on the first movement (drag-strip style rollout), progress is
 * unwrapped along the course so lap-line crossings work, and leaving the road, turning back or a recovery jump fails.
 */
export class ChallengeJudge {
 private phase:JudgePhase='ready';private t0=0;private lastT=0;private prog=0;private travelled=0;private value:number|null=null;private reason='';private lastPos:{x:number;z:number}|null=null;private speed=0;private peak=0;
 constructor(private route:CourseRoute,readonly challenge:Challenge){}
 get length(){const L=this.route.length;return ((this.challenge.end-this.challenge.start)%L+L)%L||L}
 reset(){this.phase='ready';this.t0=0;this.travelled=0;this.value=null;this.reason='';this.lastPos=null;this.peak=0}
 update(t:VehicleTelemetry):JudgeState{
  const c=this.challenge,L=this.route.length,pr=projectRoad(this.route,t.position.x,t.position.z);this.speed=Math.abs(t.speed);
  if(this.phase==='ready'){this.prog=pr.progress;this.lastPos={x:t.position.x,z:t.position.z};const moved=this.speed>.6;if(moved){this.phase='running';this.t0=t.time;this.travelled=0}}
  else if(this.phase==='running'){
   let d=pr.progress-this.prog;if(d>L/2)d-=L;if(d<-L/2)d+=L;this.prog=pr.progress;this.travelled+=d;
   const jump=this.lastPos?Math.hypot(t.position.x-this.lastPos.x,t.position.z-this.lastPos.z):0;this.lastPos={x:t.position.x,z:t.position.z};this.peak=Math.max(this.peak,this.speed);
   const elapsed=(t.time-this.t0)*1000,goal=this.length;
   if(jump>8)this.fail('Recovered: run cancelled');
   else if(pr.distance>this.route.width/2+this.route.runoff+1.5)this.fail('Off course');
   else if(this.travelled<-6)this.fail('Wrong way');
   else if(c.kind==='sprint'&&this.travelled>=goal)this.finish(elapsed);
   else if(c.kind==='trap'&&this.travelled>=goal)this.finish(this.speed);
   else if(c.kind==='brake'){
    if(this.travelled>goal+BOX_HALF)this.fail('Overshot the box');
    else if(c.limitMs&&elapsed>c.limitMs)this.fail('Too slow: out of time');
    // Stopping short is allowed (creep forward); the clock still runs.
    else if(this.speed<.25&&this.peak>5){const miss=Math.abs(this.travelled-goal);if(miss<=BOX_HALF)this.finish(miss)}
   }
  }
  this.lastT=t.time;return this.state();
 }
 private finish(v:number){this.phase='done';this.value=v}
 private fail(reason:string){this.phase='failed';this.reason=reason}
 state():JudgeState{const elapsed=this.phase==='ready'?0:(this.lastT-this.t0)*1000;return {phase:this.phase,elapsedMs:elapsed,travelled:this.travelled,toGo:this.length-this.travelled,speed:this.speed,value:this.value,medal:this.value===null?null:challengeMedal(this.challenge,this.value),reason:this.reason}}
}

// Local results (never part of the career save).
const KEY='slingmods-gx-challenges-v1';
export interface ChallengeBest {value:number;medal:Medal|null;vehicle:string;at:string;runs:number}
type Store=Record<string,ChallengeBest>;
function read():Store{try{const v=JSON.parse(localStorage.getItem(KEY)??'{}');return v&&typeof v==='object'?v:{}}catch{return {}}}
export function challengeBest(id:string):ChallengeBest|null{const b=read()[id];return b&&Number.isFinite(b.value)?b:null}
/** Record a finished run; returns whether it improved the best. */
export function recordChallenge(c:Challenge,value:number,vehicle:string):{best:boolean;previous:ChallengeBest|null}{
 if(isAttract())return {best:false,previous:null};const all=read(),prev=all[c.id]??null,improved=!prev||(betterIsLower(c.kind)?value<prev.value:value>prev.value);
 all[c.id]=improved?{value,medal:challengeMedal(c,value),vehicle,at:new Date().toISOString(),runs:(prev?.runs??0)+1}:{...prev!,runs:prev!.runs+1};
 try{localStorage.setItem(KEY,JSON.stringify(all))}catch{/* private mode */}return {best:improved,previous:prev};
}
export function challengeSummary(){const medals=CHALLENGES.map(c=>challengeBest(c.id)?.medal??null);return {total:CHALLENGES.length,medalled:medals.filter(Boolean).length,gold:medals.filter(m=>m==='gold'||m==='slingmods').length,slingmods:medals.filter(m=>m==='slingmods').length}}
