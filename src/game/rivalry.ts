/**
 * Rivalries (Phase 4): a running head-to-head with each crew rival across races, plus "heat" (0-100) that rises with
 * close finishes and swapping places, and cools when you do not race each other. The hottest rival calls you out on
 * the radio before the start; the result lists where the rivalry stands. Presentation and local stats only: race
 * results, rewards and saves are untouched.
 */
import {isAttract} from './attract-flag';
export type RivalId='maya'|'jett'|'nico';
export const RIVALS:readonly RivalId[]=['maya','jett','nico'];
export interface RivalRecord {races:number;ahead:number;behind:number;heat:number}
const KEY='slingmods-gx-rivalry-v1',EMPTY:RivalRecord={races:0,ahead:0,behind:0,heat:0};
export function rivalRecords():Record<RivalId,RivalRecord>{let v:Partial<Record<RivalId,RivalRecord>>={};try{v=JSON.parse(localStorage.getItem(KEY)??'{}')??{}}catch{}return {maya:{...EMPTY,...v.maya},jett:{...EMPTY,...v.jett},nico:{...EMPTY,...v.nico}}}
export const heatLabel=(heat:number)=>heat>=70?'Boiling':heat>=45?'Heated':heat>=20?'Warming up':'Cool';
/** Pure update for one finished race against one rival. */
export function updateRecord(r:RivalRecord,o:{ahead:boolean;swaps:number;gapMs:number|null}):RivalRecord{
 let heat=Math.max(0,r.heat-10)+Math.min(30,o.swaps*6)+(o.gapMs!==null&&o.gapMs<2000?20:o.gapMs!==null&&o.gapMs<5000?8:0);
 return {races:r.races+1,ahead:r.ahead+(o.ahead?1:0),behind:r.behind+(o.ahead?0:1),heat:Math.max(0,Math.min(100,Math.round(heat)))};
}
const NUMBER=['zero','one','two','three','four','five','six','seven','eight','nine','ten'];
const say=(n:number)=>NUMBER[n]??String(n),cap=(s:string)=>s[0].toUpperCase()+s.slice(1);
/** A rival's call-out before the start, in their voice, from the real record. */
export function rivalStartLine(id:RivalId,r:RivalRecord):string{
 const me=r.ahead,them=r.behind,score=`${cap(say(Math.max(me,them)))}-${say(Math.min(me,them))}`,lead=me>them,level=me===them;
 if(id==='jett')return level?`${score}. Tonight I break the tie. Brakes are for the cautious.`:lead?`${score} to you? Not after tonight, rookie.`:`${score} to me. Try braking later. Oh wait.`;
 if(id==='maya')return level?`${score}. I'll be on the inside. You'll see.`:lead?`${score} to you. You won't get past me twice.`:`${score} to me. The inside line is mine.`;
 return level?`${score}. Smooth wins it. See you out there.`:lead?`${score} to you. I'll be patient.`:`${score} my way. Keep it tidy and it might change.`;
}
/** Tracks one race: place swaps between the player and each rival; finalises once when the player's result lands. */
export class RivalryTracker {
 private order=new Map<RivalId,boolean>();private swaps=new Map<RivalId,number>();private done=false;private summary:{id:RivalId;record:RivalRecord}|null=null;
 constructor(private present:readonly string[]){}
 /** Per frame with the race standings (ordered by place). */
 update(standings:readonly {id:string}[]){const me=standings.findIndex(s=>s.id==='player');if(me<0)return;for(const id of RIVALS){if(!this.present.includes(id))continue;const at=standings.findIndex(s=>s.id===id);if(at<0)continue;const ahead=me<at,prev=this.order.get(id);if(prev!==undefined&&prev!==ahead)this.swaps.set(id,(this.swaps.get(id)??0)+1);this.order.set(id,ahead)}}
 /** The player's result: updates every rival met and returns the hottest rivalry for the results (once). */
 finish(standings:readonly {id:string;place:number;timeMs?:number|null}[]){
  if(this.done)return this.summary;this.done=true;const me=standings.find(s=>s.id==='player');if(!me||isAttract())return null;const all=rivalRecords();
  for(const id of RIVALS){const s=standings.find(x=>x.id===id);if(!s)continue;const gap=me.timeMs!=null&&s.timeMs!=null?Math.abs(me.timeMs-s.timeMs):null;all[id]=updateRecord(all[id],{ahead:me.place<s.place,swaps:this.swaps.get(id)??0,gapMs:gap})}
  try{localStorage.setItem(KEY,JSON.stringify(all))}catch{}
  const hottest=RIVALS.filter(id=>standings.some(s=>s.id===id)).sort((a,b)=>all[b].heat-all[a].heat)[0];this.summary=hottest?{id:hottest,record:all[hottest]}:null;return this.summary;
 }
 reset(){this.order.clear();this.swaps.clear();this.done=false;this.summary=null}
 inspect(){return {swaps:Object.fromEntries(this.swaps),done:this.done}}
}
/** The rival to call out before a race: the hottest one already raced twice, with some heat. */
export function hottestRival(present:readonly string[]):{id:RivalId;text:string}|null{const all=rivalRecords();const id=RIVALS.filter(r=>present.includes(r)&&all[r].races>=2&&all[r].heat>=20).sort((a,b)=>all[b].heat-all[a].heat)[0];return id?{id,text:rivalStartLine(id,all[id])}:null}
