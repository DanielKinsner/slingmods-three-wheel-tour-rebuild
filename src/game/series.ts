import type {TrialRoute} from './time-attack';
/**
 * Tour Series: a three-race Quick Race championship, Harbor > Express > Smoky Ridge, 10/7/5/3 points per finish (DNF 0).
 * Local and arcade-only: it never touches career credits, rewards or saves. A retry of a race replaces that race's
 * points, so the series stays forgiving.
 */
export const SERIES_RACES:readonly TrialRoute[]=['harbor','express','ridge'];
export const SERIES_POINTS=[10,7,5,3];
export const SERIES_DRIVERS=['player','maya','jett','nico'] as const;
export const ROUTE_NAMES:Record<TrialRoute,string>={harbor:'Original Harbor',express:'Harbor Express',ridge:'Smoky Ridge'};
export interface SeriesState {counted?:boolean;id:string;index:number;results:(Record<string,number>|null)[];attempts:(string|null)[];difficulty:string;startedAt:string}
const KEY='slingmods-gx-series',WINS='slingmods-gx-series-wins';
export function seriesState():SeriesState|null{try{const v=JSON.parse(localStorage.getItem(KEY)??'null');if(v&&typeof v.index==='number'&&Array.isArray(v.results))return v}catch{/* none */}return null}
function save(s:SeriesState|null){try{if(s)localStorage.setItem(KEY,JSON.stringify(s));else localStorage.removeItem(KEY)}catch{/* private mode */}}
export function startSeries(difficulty:string):SeriesState{const s:SeriesState={id:Math.random().toString(36).slice(2,10),index:0,results:SERIES_RACES.map(()=>null),attempts:SERIES_RACES.map(()=>null),difficulty,startedAt:new Date().toISOString()};save(s);return s}
export function abandonSeries(){save(null)}
export const currentRace=(s:SeriesState)=>SERIES_RACES[Math.min(s.index,SERIES_RACES.length-1)];
export const seriesComplete=(s:SeriesState)=>s.results.every(Boolean);
/** Totals, highest first; ties broken by best single-race points, then driver order. */
export function seriesTotals(s:SeriesState){return SERIES_DRIVERS.map(id=>({id,points:s.results.reduce((a,r)=>a+(r?.[id]??0),0),best:Math.max(0,...s.results.map(r=>r?.[id]??0)),last:s.results[s.index]?.[id]??null})).sort((a,b)=>b.points-a.points||b.best-a.best||SERIES_DRIVERS.indexOf(a.id)-SERIES_DRIVERS.indexOf(b.id))}
/** Record the finished field of the current race (idempotent per attempt). */
export function recordSeriesRace(standings:{id:string;place:number;status:string}[],attemptId:string){
 const s=seriesState();if(!s||s.attempts[s.index]===attemptId)return s;
 const points:Record<string,number>={};for(const x of standings)points[x.id]=x.status==='finished'?SERIES_POINTS[x.place-1]??0:0;
 s.results[s.index]=points;s.attempts[s.index]=attemptId;save(s);
 if(seriesComplete(s)&&!s.counted&&seriesTotals(s)[0].id==='player'){s.counted=true;save(s);try{localStorage.setItem(WINS,String(seriesWins()+1))}catch{}}
 return s;
}
export function advanceSeries(){const s=seriesState();if(!s)return null;s.index=Math.min(SERIES_RACES.length-1,s.index+1);save(s);return s}
export function seriesWins(){try{return Number(localStorage.getItem(WINS))||0}catch{return 0}}
