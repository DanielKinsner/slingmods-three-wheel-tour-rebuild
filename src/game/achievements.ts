import type {Career} from '../career/store';
import {tourProgress} from './progress';
import {MEDALS,MEDAL_NAMES,trialBest,trialTime,type Medal,type TrialRoute} from './time-attack';
/**
 * Achievements: read-only goals over data the game already keeps (career save, Time Attack bests) plus one small local
 * stats counter. Unlocks are remembered in their own key so the toast plays once; nothing here can change a save.
 */
const SEEN='slingmods-gx-achievements-v1',STATS='slingmods-gx-stats-v1';
export interface DriveStats {drives:number;races:number;trials:number;tests:number;ryker:number;slingshot:number}
const readJSON=<T>(k:string,fallback:T):T=>{try{const v=JSON.parse(localStorage.getItem(k)??'null');return v&&typeof v==='object'?{...fallback,...v}:fallback}catch{return fallback}};
const writeJSON=(k:string,v:unknown)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{/* private mode */}};
export const driveStats=()=>readJSON<DriveStats>(STATS,{drives:0,races:0,trials:0,tests:0,ryker:0,slingshot:0});
/** Counted once per started run (countdown to green), never for paused or aborted menus. */
export function countDrive(kind:'race'|'trial'|'test',vehicle:string){const s=driveStats();s.drives++;s[kind==='race'?'races':kind==='trial'?'trials':'tests']++;if(vehicle==='can-am-ryker-900')s.ryker++;else s.slingshot++;writeJSON(STATS,s)}

const ROUTES:TrialRoute[]=['harbor','express','ridge'],VEHICLES=['slingshot-r-2024','can-am-ryker-900'];
const bestMedal=(route:TrialRoute):Medal|null=>{let best:Medal|null=null;for(const v of VEHICLES){const m=trialBest(route,v)?.medal??null;if(m&&(!best||MEDALS.indexOf(m)<MEDALS.indexOf(best)))best=m}return best};
const atLeast=(m:Medal|null,target:Medal)=>!!m&&MEDALS.indexOf(m)<=MEDALS.indexOf(target);
interface Ctx {career:Career|null;stats:DriveStats}
export interface Achievement {id:string;title:string;detail:string;icon:string;done(c:Ctx):boolean;progress?(c:Ctx):[number,number]}
const owns=(c:Career)=>c.owned||c.suspension.owned||Object.keys(c.ownBuild.products).length>0||(c.ownBuild.ryker?.owned.length??0)>0;
export const ACHIEVEMENTS:Achievement[]=[
 {id:'off-the-line',title:'Off the Line',detail:'Finish your first career event.',icon:'🏁',done:c=>!!c.career?.chapters.firstCompletion},
 {id:'found-the-line',title:'Found the Line',detail:'Finish Maya’s duel.',icon:'〰',done:c=>!!c.career?.buildMatters.duelCompleted},
 {id:'maya-who',title:'Maya Who?',detail:'Win Maya’s duel.',icon:'⚡',done:c=>!!c.career?.buildMatters.duelWon},
 {id:'one-of-the-crew',title:'One of the Crew',detail:'Clear First Night with a top-three finish.',icon:'★',done:c=>!!c.career?.crew.cleared},
 {id:'harbor-hero',title:'Harbor Hero',detail:'Win the First Night crew race.',icon:'🏆',done:c=>c.career?.crew.bestPlace===1},
 {id:'make-it-yours',title:'Make It Yours',detail:'Buy your first part in the career workshop.',icon:'🔧',done:c=>!!c.career&&owns(c.career)},
 {id:'coastline',title:'Coastline Complete',detail:'Finish the SlingMods Coastline Cup.',icon:'🌊',done:c=>!!c.career?.ownBuild.completed['coastline-cup']},
 {id:'ridge-runner',title:'Ridge Runner',detail:'Finish the Summit Invitational.',icon:'⛰',done:c=>!!c.career?.ownBuild.ridge.completed['summit-invitational']},
 {id:'tour-regular',title:'Tour Regular',detail:'Reach Tour Rep level 5.',icon:'Ⅴ',done:c=>tourProgress(c.career).level>=5,progress:c=>[Math.min(5,tourProgress(c.career).level),5]},
 {id:'tour-legend',title:'Tour Legend',detail:'Reach Tour Rep level 10.',icon:'Ⅹ',done:c=>tourProgress(c.career).level>=10,progress:c=>[Math.min(10,tourProgress(c.career).level),10]},
 {id:'against-the-clock',title:'Against the Clock',detail:'Set a Time Attack time.',icon:'⏱',done:()=>ROUTES.some(r=>VEHICLES.some(v=>trialBest(r,v)))},
 {id:'gold-standard',title:'Gold Standard',detail:'Earn a Gold medal in Time Attack.',icon:'🥇',done:()=>ROUTES.some(r=>atLeast(bestMedal(r),'gold'))},
 {id:'golden-coast',title:'Golden Coast',detail:'Gold or better on all three courses.',icon:'✦',done:()=>ROUTES.every(r=>atLeast(bestMedal(r),'gold')),progress:()=>[ROUTES.filter(r=>atLeast(bestMedal(r),'gold')).length,3]},
 {id:'slingmods-certified',title:'SlingMods Certified',detail:'Beat a SlingMods medal time.',icon:'◆',done:()=>ROUTES.some(r=>bestMedal(r)==='slingmods')},
 {id:'two-ways',title:'Three Wheels, Two Ways',detail:'Drive both the Slingshot and the Ryker.',icon:'⇄',done:c=>c.stats.ryker>0&&c.stats.slingshot>0},
 {id:'road-trip',title:'Road Trip',detail:'Start 25 drives.',icon:'∞',done:c=>c.stats.drives>=25,progress:c=>[Math.min(25,c.stats.drives),25]},
];
const seen=()=>new Set(readJSON<{ids:string[]}>(SEEN,{ids:[]}).ids);
export function achievementState(career:Career|null){const c={career,stats:driveStats()},s=seen();return ACHIEVEMENTS.map(a=>({a,done:a.done(c),seen:s.has(a.id),progress:a.progress?.(c)}))}
/** Newly satisfied achievements since last check; marks them seen. `career` null skips nothing but can't unlock career goals. */
export function claimAchievements(career:Career|null){const s=seen(),fresh=achievementState(career).filter(x=>x.done&&!s.has(x.a.id)).map(x=>x.a);if(fresh.length){for(const a of fresh)s.add(a.id);writeJSON(SEEN,{ids:[...s]})}return fresh}
export function recordsTable(){return ROUTES.map(route=>({route,rows:VEHICLES.map(v=>({vehicle:v,best:trialBest(route,v)}))}))}
export {MEDAL_NAMES,trialTime};
