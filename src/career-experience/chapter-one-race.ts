import {CrewRace,CREW_EVENT_ID} from '../competition/race';
import {RaceAttempt} from '../race/attempt';
import {DUEL_EVENT,type DuelAwardProof} from '../career/duel-result';
import type {CrewAwardProof} from '../career/crew-result';
import type {CareerClient} from '../career/client';
import {uuid} from './model';
import {browserStorage,loadSave,recordKey,saveBest} from '../save';
import type {CourseRoute} from '../course/environment';
import type {VehicleControl,VehicleTelemetry} from '../simulation';

export const SHAKEDOWN_EVENT='harbor-shakedown-standing-lap-v1';
/** Keep Chapter 01's standing-lap timing and validity rules in the shared renderer. */
export class ShakedownRace extends CrewRace {
 private trial:RaceAttempt;
 constructor(route:CourseRoute,preset:'day'|'night',profile:string,vehicleId='slingshot-r-2024'){
  super(route,['player'],'player',false,{eventId:SHAKEDOWN_EVENT,laps:1,handlingProfileId:profile,timeTrial:true});
  const key=recordKey(route,preset,`${vehicleId}-${profile}`);
  this.trial=new RaceAttempt(route,preset,loadSave(browserStorage()).records[key]?.timeMs??null);
 }
 override restart(id:string){super.restart(id);this.trial.restart()}
 override setPaused(value:boolean){super.setPaused(value);this.trial.setPaused(value)}
 override control(_id:string,control:VehicleControl){return this.trial.control(control)}
 override tick(previous:Record<string,VehicleTelemetry>,current:Record<string,VehicleTelemetry>,dt:number){this.trial.tick(previous.player,current.player,dt)}
 override snapshot(){
  const base=super.snapshot(),s=this.trial.snapshot(),r=s.result;
  const status=r?(r.valid?'finished':'invalid'):'running';
  return {...base,phase:s.phase,paused:s.paused,countdown:s.countdown,elapsedMs:s.elapsedMs,
   standings:[{...base.standings[0],status:status as 'finished'|'invalid'|'running',lap:1,nextGate:s.checkpoint+1,timeMs:r?.timeMs??null,valid:!s.invalidReason,invalidReason:s.invalidReason}],
   playerResult:r?{event:SHAKEDOWN_EVENT,attemptId:base.attemptId,participantId:'player',status:status as 'finished'|'invalid',valid:r.valid,laps:1,timeMs:r.timeMs,place:1,invalidReason:r.invalidReason}:null,
   allFinished:!!r,standingLap:s};
 }
}

/** Chapter 01 owns rewards and access; vehicle/rendering/input all use express.ts. */
export async function chapterOneRace(client:CareerClient,params:URLSearchParams){
 const solo=params.get('scene')==='harbor',duel=!solo&&params.get('event')==='duel';
 if(!solo&&(!client.state.chapters.firstCompletion||!duel&&!client.state.buildMatters.legacyCrewAccess&&!client.state.buildMatters.duelCompleted))return null;
 const event=solo?'shakedown':duel?'duel':'crew',requested=solo&&params.get('preset')!=='night'?'day':'night';
 const saved=client.state.ownBuild.chapterOne,requestedId=params.get('entry');
 let entry=uuid(requestedId)?saved?.entries[requestedId]:saved?.activeId?saved.entries[saved.activeId]:undefined;
 if(!entry||entry.status!=='prepared'||entry.event!==event){const result=await client.execute({type:'chapter-one-begin',id:crypto.randomUUID(),event,preset:requested});const saved=result.state.ownBuild.chapterOne!;entry=saved.entries[saved.activeId!]}
 const recipe=structuredClone(entry.recipe),preset=entry.preset;
 let attempt={id:entry.id,recipe,handlingProfile:recipe.handlingProfile},bestPersisted=true;
 const updateURL=()=>{if(typeof location==='undefined')return;const url=new URL(location.href);url.searchParams.set('entry',attempt.id);url.searchParams.set('visual',recipe.vehicleId==='can-am-ryker-900'?'ryker':'2026');history.replaceState(null,'',url.pathname+url.search+url.hash)};updateURL();
 return {kind:'chapter-one' as const,get bestPersisted(){return bestPersisted},client,get attempt(){return structuredClone(attempt)},get recipe(){return structuredClone(recipe)},route:'harbor' as const,
  eventId:solo?SHAKEDOWN_EVENT:duel?DUEL_EVENT:CREW_EVENT_ID,participants:solo?['player']:duel?['maya','player']:['maya','jett','nico','player'],
  preset:preset as 'day'|'night',fixedLighting:true,laps:(solo||duel?1:2) as 1|2,
  title:solo?'Harbor Shakedown':duel?'Maya’s Duel':'Harbor Crew',
  subtitle:solo?'One clean harbor lap. Find your braking points and bring it home.':duel?'MAYA: One clean lap together. Finishing earns your crew invitation.':'Two laps with the crew. Bring your earned build.',
  returnTo:`?scene=bay&play=${client.profile}&visual=${recipe.vehicleId==='can-am-ryker-900'?'ryker':'2026'}`,
  async restart(){const id=crypto.randomUUID();await client.execute({type:'chapter-one-begin',id,event,preset,retryOf:attempt.id});attempt={...attempt,id};updateURL();return structuredClone(attempt)},
  async commit(race:CrewRace){
   const s=race.snapshot(),r=s.playerResult;
   if(s.attemptId!==attempt.id||s.event!==this.eventId||s.handlingProfileId!==recipe.handlingProfile||!r?.valid||!r.timeMs)throw Error('Chapter finish does not match this entry');
   if(solo){
    const result=await client.execute({type:'award',id:attempt.id,valid:true,timeMs:r.timeMs,event:'harbor',handlingProfile:recipe.handlingProfile});
    bestPersisted=saveBest(browserStorage(),recordKey(race.route,preset,`${recipe.vehicleId}-${recipe.handlingProfile}`),r.timeMs).persisted;
    return result;
   }
   const proof=race.awardProof();if(!proof)throw Error('No certified Chapter 01 result');
   return client.execute(duel?{type:'duel-award',result:proof as DuelAwardProof,handlingProfile:recipe.handlingProfile}:{type:'crew-award',result:proof as CrewAwardProof,handlingProfile:recipe.handlingProfile});
  },
  async abandon(){},close(){client.close()},
 };
}
