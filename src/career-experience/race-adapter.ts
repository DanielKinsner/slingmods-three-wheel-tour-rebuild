import {careerClient,type CareerClient} from '../career/client';
import {EVENTS,competition,certifyCareerFinish,uuid,type Attempt,type ChapterEvent} from './model';
import type {CrewRace} from '../competition';

export function routeVersion(event:ChapterEvent,stage=0){return event==='coastline-cup'&&stage===0?'1':'express-layout-v1'}
export async function beginCareerEvent(client:CareerClient,event:ChapterEvent,retryOf?:string){
 const b=client.state.ownBuild,cup=b.activeCupId?b.cups[b.activeCupId]:undefined;
 const result=await client.execute({type:'chapter-begin',event,retryOf,id:crypto.randomUUID(),cupId:crypto.randomUUID(),routeVersion:routeVersion(event,cup?.stages.length??0)});
 return result.state.ownBuild.active!;
}
export function careerRaceHref(attempt:Attempt){return `?scene=express&play=career&attempt=${attempt.id}`}
/** A career URL carries an identity, never an equipment or credit payload. */
export async function openCareerRace(params:URLSearchParams){
 if(params.get('play')!=='career')return null;
 const client=await careerClient();let attempt=client.state.ownBuild.active;
 if(!uuid(params.get('attempt'))||!attempt||attempt.id!==params.get('attempt')||attempt.status!=='prepared'){
  // A completed/abandoned or foreign entry returns to the saved chapter, not an asset-error screen.
  client.navigate('?scene=career&play=career');await new Promise<never>(()=>{});
 }
 return {
  client,get attempt(){return structuredClone(attempt!)},get recipe(){return structuredClone(attempt!.recipe)},get route(){return attempt!.route},get eventId(){return attempt!.competitionId},get participants(){return [...attempt!.participants]},get laps(){return attempt!.laps},get title(){return EVENTS[attempt!.event].title},get subtitle(){return `${EVENTS[attempt!.event].description} ${attempt!.event==='coastline-cup'?`Cup event ${attempt!.stage+1} / 2.`:''} ${EVENTS[attempt!.event].line}`},returnTo:'?scene=career&play=career',
  async restart(){attempt=await beginCareerEvent(client,attempt!.event,attempt!.id);history.replaceState(null,'',careerRaceHref(attempt));return structuredClone(attempt)},
  async commit(snapshot:ReturnType<CrewRace['snapshot']>){const proof=certifyCareerFinish(attempt!,snapshot);return client.execute({type:'chapter-result',result:proof})},
  async abandon(){return client.execute({type:'chapter-abandon'})},close(){client.close()},
 };
}
export type CareerRaceAdapter=NonNullable<Awaited<ReturnType<typeof openCareerRace>>>;
