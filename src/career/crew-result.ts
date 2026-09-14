export const CREW_EVENT='harbor-crew-night-v1' as const;
export const CHAPTER_ID='harbor-first-night-v1' as const;
const issued=new WeakSet<object>();
declare const verified:unique symbol;
export interface CrewFinish {event:typeof CREW_EVENT;attemptId:string;participantId:'player';status:'finished';valid:true;laps:2;timeMs:number;place:1|2|3|4}
export type CrewAwardProof=Readonly<CrewFinish>&{readonly [verified]:true};
/** Called by the authoritative competition manager, never from UI placement fields. This is an in-process trust boundary, not anti-cheat cryptography. */
export function certifyCrewFinish(result:CrewFinish):CrewAwardProof {
 if(result.event!==CREW_EVENT||result.participantId!=='player'||result.status!=='finished'||result.valid!==true||result.laps!==2||!Number.isFinite(result.timeMs)||result.timeMs<=0||!Number.isInteger(result.place)||result.place<1||result.place>4||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result.attemptId))throw Error('Competition finish is not eligible for a reward');
 const proof=Object.freeze({...result})as CrewAwardProof;issued.add(proof);return proof;
}
export function isCrewAwardProof(value:unknown):value is CrewAwardProof{return !!value&&typeof value==='object'&&issued.has(value)}
