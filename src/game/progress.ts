import type {Career,Receipt} from '../career/store';
import {EVENTS,RIDGE_EVENTS} from '../career-experience/model';
/**
 * Tour Rep: a driver level derived purely from the career's existing receipt ledger. Nothing is stored, so every save
 * (old or new) gets a level from what it already earned, and the level can never disagree with the credits history.
 *  - each race award pays its credits as rep, plus a flat participation bonus;
 *  - purchases never cost rep.
 */
export const AWARD_KINDS:readonly Receipt['kind'][]=['award','crew-award','duel-award','chapter-award'];
export const PARTICIPATION_REP=150;
/** Cumulative rep needed to reach a level (level 1 = 0). Gentle early levels, steadier later. */
export const repForLevel=(level:number)=>level<=1?0:Math.round(400*Math.pow(level-1,1.5)/10)*10;
export function levelForRep(rep:number){let level=1;while(level<99&&rep>=repForLevel(level+1))level++;return level}
export interface TourProgress {credits:number;rep:number;level:number;levelFloor:number;levelNext:number;fraction:number;completed:number;total:number;chapter:1|2|3;title:string}
const TITLES=['Rookie','Weekend Rider','Harbor Regular','Crew Contender','Coastline Driver','Coastline Ace','Ridge Runner','Ridge Veteran','Tour Pro','Tour Legend'];
export const rankTitle=(level:number)=>TITLES[Math.min(TITLES.length-1,Math.max(0,level-1))];
export function receiptRep(r:Pick<Receipt,'kind'|'amount'>){return AWARD_KINDS.includes(r.kind)?Math.max(0,r.amount)+PARTICIPATION_REP:0}
export function tourProgress(s:Career|null):TourProgress{
 const rep=s?Object.values(s.receipts).reduce((sum,r)=>sum+receiptRep(r),0):0,level=levelForRep(rep),levelFloor=repForLevel(level),levelNext=repForLevel(level+1);
 const chapterOne=s?[s.chapters.firstCompletion,s.buildMatters.duelCompleted,s.crew.completed].filter(Boolean).length:0;
 const coast=s?Object.keys(EVENTS).filter(e=>s.ownBuild.completed[e as keyof typeof s.ownBuild.completed]).length:0;
 const ridge=s?Object.keys(RIDGE_EVENTS).filter(e=>(s.ownBuild.ridge.completed as Record<string,boolean>)[e]).length:0;
 const total=3+Object.keys(EVENTS).length+Object.keys(RIDGE_EVENTS).length,completed=chapterOne+coast+ridge;
 const chapter:1|2|3=chapterOne<3?1:coast<Object.keys(EVENTS).length?2:3;
 return {credits:s?.credits??0,rep,level,levelFloor,levelNext,fraction:levelNext>levelFloor?Math.min(1,(rep-levelFloor)/(levelNext-levelFloor)):1,completed,total,chapter,title:rankTitle(level)};
}
/** Rep and level movement for one newly committed receipt: drives the results-screen bar fill and level-up moment. */
export function repGain(before:Career|null,receipt:Pick<Receipt,'kind'|'amount'>|undefined){const from=tourProgress(before),gain=receipt?receiptRep(receipt):0,to=levelForRep(from.rep+gain);return {from,gain,rep:from.rep+gain,level:to,levelUp:to>from.level}}
