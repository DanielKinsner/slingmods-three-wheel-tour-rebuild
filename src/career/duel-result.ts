export const DUEL_EVENT='harbor-maya-duel-v1' as const;
const issued=new WeakSet<object>();
export interface DuelFinish {event:typeof DUEL_EVENT;attemptId:string;participantId:'player';status:'finished';valid:true;laps:1;timeMs:number;place:1|2}
declare const verified:unique symbol;
export type DuelAwardProof=Readonly<DuelFinish>&{readonly [verified]:true};
export function certifyDuelFinish(r:DuelFinish):DuelAwardProof {
 if(r.event!==DUEL_EVENT||r.participantId!=='player'||r.status!=='finished'||r.valid!==true||r.laps!==1||!Number.isFinite(r.timeMs)||r.timeMs<=0||![1,2].includes(r.place)||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(r.attemptId))throw Error('Duel reward requires a verified finish');
 const proof=Object.freeze({...r}) as DuelAwardProof;issued.add(proof);return proof;
}
export function isDuelAwardProof(r:unknown):r is DuelAwardProof{return !!r&&typeof r==='object'&&issued.has(r)}
