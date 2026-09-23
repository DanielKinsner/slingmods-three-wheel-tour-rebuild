import {MEDALS,MEDAL_NAMES,MEDAL_TARGETS,trialTime,type Medal,type TrialRoute} from './time-attack';
/**
 * Daily Run: one Time Attack course per calendar day (local time) with a target medal. Beat the target on that course
 * that day to extend your streak. Deterministic from the date, so every player sees the same daily course.
 */
export interface DailyRun {key:string;route:TrialRoute;medal:Medal;targetMs:number;name:string}
export interface DailyState {lastDone:string|null;streak:number;best:number}
const KEY='slingmods-gx-daily-v1';
const ROUTES:TrialRoute[]=['harbor','express','ridge'];
const NAMES:Record<TrialRoute,string>={harbor:'Original Harbor',express:'Harbor Express',ridge:'Smoky Ridge'};
export const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dayNumber=(key:string)=>Math.floor(Date.UTC(+key.slice(0,4),+key.slice(5,7)-1,+key.slice(8,10))/864e5);
export function dailyRun(d=new Date()):DailyRun{
 const key=dayKey(d),n=dayNumber(key),route=ROUTES[((n*7)%3+3)%3],medal:Medal=(n%4===3)?'gold':'silver';
 return {key,route,medal,targetMs:MEDAL_TARGETS[route][medal],name:NAMES[route]};
}
export function dailyState():DailyState{try{const v=JSON.parse(localStorage.getItem(KEY)??'null');if(v&&typeof v==='object')return {lastDone:typeof v.lastDone==='string'?v.lastDone:null,streak:Number(v.streak)||0,best:Number(v.best)||0}}catch{/* private mode */}return {lastDone:null,streak:0,best:0}}
/** Streak as shown today: an unbroken run up to today or yesterday counts; older runs have lapsed. */
export function liveStreak(s=dailyState(),today=dayKey()){if(!s.lastDone)return 0;const gap=dayNumber(today)-dayNumber(s.lastDone);return gap<=1?s.streak:0}
export const dailyDone=(s=dailyState(),today=dayKey())=>s.lastDone===today;
/** Called by Time Attack on every valid finish. Returns true when this finish completed today's Daily Run. */
export function recordDaily(route:TrialRoute,timeMs:number,d=new Date()){
 const run=dailyRun(d),s=dailyState();if(route!==run.route||timeMs>run.targetMs||s.lastDone===run.key)return false;
 const gap=s.lastDone?dayNumber(run.key)-dayNumber(s.lastDone):Infinity,streak=gap===1?s.streak+1:1;
 const next={lastDone:run.key,streak,best:Math.max(s.best,streak)};try{localStorage.setItem(KEY,JSON.stringify(next))}catch{return false}return true;
}
export function dailyCardMarkup(){
 const run=dailyRun(),s=dailyState(),done=dailyDone(s,run.key),streak=liveStreak(s,run.key);
 return `<aside class="gx-daily" data-done="${done}" data-medal="${run.medal}" aria-label="Daily Run"><span class="gx-kicker">DAILY RUN · ${run.key.slice(5).replace('-','/')}</span><strong>${run.name}</strong><p><i></i>Beat ${trialTime(run.targetMs)} · ${MEDAL_NAMES[run.medal]} target</p><div class="gx-daily-foot"><span class="gx-daily-streak" title="Daily streak">🔥 ${streak}<small>DAY STREAK</small></span>${done?'<b class="gx-daily-done">✓ DONE TODAY</b>':`<button data-action="time-attack" data-value="${run.route}" data-gx-sfx="select">Go</button>`}</div></aside>`;
}
export {MEDALS};
