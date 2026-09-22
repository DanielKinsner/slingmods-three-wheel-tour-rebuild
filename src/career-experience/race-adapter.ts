import {careerClient,type CareerClient} from '../career/client';
import {ALL_EVENTS,competition,chapterRouteVersion,isRidgeEvent,RIDGE_EVENTS,certifyCareerFinish,uuid,type Attempt,type ChapterEvent} from './model';
import type {CrewRace} from '../competition';
import {chapterOneRace} from './chapter-one-race';
import {CURRENT_HANDLING_PROFILE} from '../simulation/profile';

export function routeVersion(event:ChapterEvent,stage=0){return chapterRouteVersion(competition(event,stage as 0|1).route)}
export async function beginCareerEvent(client:CareerClient,event:ChapterEvent,retryOf?:string){
 const b=client.state.ownBuild,cup=b.activeCupId?b.cups[b.activeCupId]:undefined;
 const result=await client.execute({type:'chapter-begin',event,retryOf,id:crypto.randomUUID(),cupId:crypto.randomUUID(),routeVersion:routeVersion(event,cup?.stages.length??0)});
 return result.state.ownBuild.active!;
}
export function careerRaceHref(attempt:Attempt){return `?scene=${attempt.route==='ridge'?'ridge':'express'}&play=career&attempt=${attempt.id}`}
/** Keep the current view and test-clock query when only the prepared identity changes. */
export function replaceCareerRaceHref(attempt:Attempt,href:string){
 const url=new URL(href);for(const [key,value] of new URLSearchParams(careerRaceHref(attempt).slice(1)))url.searchParams.set(key,value);
 return url.pathname+url.search+url.hash;
}
/** A career URL carries an identity, never an equipment or credit payload. */
export async function openCareerRace(params:URLSearchParams){
 if(['harbor','crew'].includes(params.get('scene')??'')){
  const client=await careerClient(),entry=chapterOneRace(client,params);
  if(entry)return entry;
  client.navigate(`?scene=bay&play=${client.profile}`);await new Promise<never>(()=>{});
 }
 if(params.get('play')!=='career')return null;
 const client=await careerClient();let attempt=client.state.ownBuild.active;
 if(!uuid(params.get('attempt'))||!attempt||attempt.id!==params.get('attempt')||attempt.status!=='prepared'){
  // A completed/abandoned or foreign entry returns to the saved chapter, not an asset-error screen.
  client.navigate('?scene=career&play=career');await new Promise<never>(()=>{});
 }
 // A new attempt keeps the original entry as abandoned evidence and the exact
 // equipment. Completed Cup stages and their original physics remain untouched.
 if(attempt!.handlingProfile!==CURRENT_HANDLING_PROFILE){attempt=await beginCareerEvent(client,attempt!.event,attempt!.id);history.replaceState(null,'',replaceCareerRaceHref(attempt,location.href))}
 return {
  kind:'chapter' as const,fixedLighting:isRidgeEvent(attempt!.event),
  client,get attempt(){return structuredClone(attempt!)},get recipe(){return structuredClone(attempt!.recipe)},get route(){return attempt!.route},get eventId(){return attempt!.competitionId},get participants(){return [...attempt!.participants]},get preset(): 'day'|'night'{return isRidgeEvent(attempt!.event)?RIDGE_EVENTS[attempt!.event].preset:'day'},get laps(){return attempt!.laps},get title(){return ALL_EVENTS[attempt!.event].title},get subtitle(){return `${ALL_EVENTS[attempt!.event].description} ${attempt!.event==='coastline-cup'?`Cup event ${attempt!.stage+1} / 2.`:''} ${ALL_EVENTS[attempt!.event].line}`},returnTo:'?scene=career&play=career',
  async restart(){attempt=await beginCareerEvent(client,attempt!.event,attempt!.id);history.replaceState(null,'',replaceCareerRaceHref(attempt,location.href));return structuredClone(attempt)},
  async commit(race:CrewRace){const proof=certifyCareerFinish(attempt!,race.snapshot());return client.execute({type:'chapter-result',result:proof})},
  async abandon(){return client.execute({type:'chapter-abandon'})},close(){client.close()},
 };
}
export type CareerRaceAdapter=NonNullable<Awaited<ReturnType<typeof openCareerRace>>>;
