import type {Career,Receipt} from '../career/store';
import {freshRecipe,validateRecipe,type BuildRecipe,type FinishId} from '../signature/config';
import {PRODUCTS,productById,type ProductId} from '../signature/catalog';
import type {CrewRace} from '../competition';

export type ChapterEvent='open-it-up'|'hold-your-nerve'|'coastline-cup';
export type RouteId='harbor'|'express';
export const CREDIT_TABLE={'SM-133':600,'SM-3223':1000,'SM-7720':700,'SM-26801':650,'SM-28919':450} as const;
export const EVENTS={
 'open-it-up':{title:'Open It Up',description:'One clean Express lap. Find your braking landmarks.',line:'RAE: Open it up on the straight. Brake before the bend. Bring back one clean lap.',first:800,repeat:100,unlock:'SM-7720'},
 'hold-your-nerve':{title:'Jett / Hold Your Nerve',description:'One Express lap against Jett. Finishing advances the chapter; winning adds 100.',line:'JETT: Speed is easy. Let’s see who still has their nerve at the braking boards.',first:700,repeat:100,unlock:'SM-26801'},
 'coastline-cup':{title:'SlingMods Coastline Cup',description:'Original Harbor, then Express. Two races. One aggregate result.',line:'MAYA: Two coastlines, one build. Keep it tidy. Every finish counts.',first:900,repeat:150,unlock:'SM-28919'},
} as const;
export interface Attempt {version:1;id:string;event:ChapterEvent;competitionId:string;route:RouteId;routeVersion:string;handlingProfile:string;laps:1;participants:string[];recipe:BuildRecipe;cupId:string|null;stage:0|1;status:'prepared'|'completed'|'abandoned'}
export interface RaceRecord {attemptId:string;competitionId:string;route:RouteId;routeVersion:string;handlingProfile:string;laps:1;recipe:BuildRecipe;timeMs:number;place:number;standings:{id:string;place:number;status:string;timeMs:number|null}[]}
export interface Cup {id:string;status:'active'|'completed'|'abandoned';stages:RaceRecord[];recipe:BuildRecipe;handlingProfile:string}
export interface OwnBuild {version:1;finish:FinishId;products:Partial<Record<ProductId,{owned:true;equipped:boolean}>>;completed:Record<ChapterEvent,boolean>;won:Record<ChapterEvent,boolean>;active:Attempt|null;attempts:Record<string,Attempt>;cups:Record<string,Cup>;activeCupId:string|null;records:RaceRecord[]}
export const freshOwnBuild=():OwnBuild=>({version:1,finish:'blue-orange',products:{},completed:{'open-it-up':false,'hold-your-nerve':false,'coastline-cup':false},won:{'open-it-up':false,'hold-your-nerve':false,'coastline-cup':false},active:null,attempts:{},cups:{},activeCupId:null,records:[]});
export const uuid=(value:unknown):value is string=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
function freeze<T>(value:T):T {if(value&&typeof value==='object'){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value}
export const chapterAvailable=(s:Career)=>s.crew.completed||s.buildMatters.legacyCrewAccess;
export function eventAvailable(s:Career,event:ChapterEvent){return chapterAvailable(s)&&(event==='open-it-up'||event==='hold-your-nerve'&&s.ownBuild.completed['open-it-up']||event==='coastline-cup'&&s.ownBuild.completed['hold-your-nerve'])}
export function productUnlocked(s:Career,id:ProductId){return id==='SM-133'||id==='SM-3223'||Object.entries(EVENTS).some(([event,value])=>value.unlock===id&&s.ownBuild.completed[event as ChapterEvent])}
export function productOwned(s:Career,id:ProductId){return id==='SM-133'?s.owned:id==='SM-3223'?s.suspension.owned:!!s.ownBuild.products[id]?.owned}
export function productEquipped(s:Career,id:ProductId){return id==='SM-133'?s.equipped:id==='SM-3223'?s.suspension.equipped:!!s.ownBuild.products[id]?.equipped}
export function careerRecipe(s:Career):BuildRecipe {const recipe=freshRecipe();recipe.finish=s.ownBuild.finish;recipe.lights=structuredClone(s.appearance);recipe.suspension=structuredClone(s.suspension.setup);for(const p of PRODUCTS)if(productEquipped(s,p.id))recipe.products[p.id]=p.option;return validateRecipe(recipe)}
export function competition(event:ChapterEvent,stage:0|1){const route:RouteId=event==='coastline-cup'&&stage===0?'harbor':'express';return {route,eventId:`p09a-${event}-${route}-v1`,participants:event==='open-it-up'?['player']:event==='hold-your-nerve'?['jett','player']:['maya','jett','nico','player']}}
export function cupStandings(cup:Cup){return ['maya','jett','nico','player'].map(id=>({id,points:cup.stages.reduce((n,r)=>{const s=r.standings.find(s=>s.id===id);return n+(s?.status==='finished'?([0,10,7,5,3][s.place]??0):0)},0),timeMs:cup.stages.reduce((n,r)=>n+(r.standings.find(s=>s.id===id)?.timeMs??1e9),0)})).sort((a,b)=>b.points-a.points||a.timeMs-b.timeMs||a.id.localeCompare(b.id))}
export function validateOwnBuild(raw:unknown):OwnBuild {
 const s=raw as OwnBuild;const fail=()=>{throw Error('Chapter save requires recovery')};
 if(!s||s.version!==1||[s.products,s.completed,s.won,s.attempts,s.cups].some(v=>!v||typeof v!=='object'||Array.isArray(v))||!Array.isArray(s.records))return fail();
 const r=freshRecipe();r.finish=s.finish;validateRecipe(r);
 for(const event of Object.keys(EVENTS) as ChapterEvent[])if(typeof s.completed[event]!=='boolean'||typeof s.won[event]!=='boolean'||s.won[event]&&!s.completed[event])return fail();
 for(const [id,p]of Object.entries(s.products))if(!['SM-7720','SM-26801','SM-28919'].includes(id)||!p||p.owned!==true||typeof p.equipped!=='boolean'||!productById(id))return fail();
 for(const [id,a]of Object.entries(s.attempts)){if(!uuid(id)||id!==a.id||a.version!==1||!Object.hasOwn(EVENTS,a.event)||![0,1].includes(a.stage)||!['prepared','completed','abandoned'].includes(a.status)||a.laps!==1||a.routeVersion!==(a.route==='express'?'express-layout-v1':'1')||!Array.isArray(a.participants))return fail();const spec=competition(a.event,a.stage);if(a.competitionId!==spec.eventId||a.route!==spec.route||!same(a.participants,spec.participants)||a.event!=='coastline-cup'&&(a.stage!==0||a.cupId!==null)||a.event==='coastline-cup'&&!uuid(a.cupId))return fail();if(validateRecipe(a.recipe).handlingProfile!==a.handlingProfile)return fail()}
 if(s.active!==null&&(!s.active||!same(s.attempts[s.active.id],s.active)||s.active.status!=='prepared'))return fail();
 for(const [id,c]of Object.entries(s.cups)){if(!uuid(id)||c.id!==id||!['active','completed','abandoned'].includes(c.status)||!Array.isArray(c.stages)||c.stages.length>2||c.status==='completed'&&c.stages.length!==2||validateRecipe(c.recipe).handlingProfile!==c.handlingProfile)return fail();for(let i=0;i<c.stages.length;i++){const record=c.stages[i],a=s.attempts[record.attemptId];if(!a||a.cupId!==id||a.stage!==i||!same(a.recipe,c.recipe)||a.handlingProfile!==c.handlingProfile||!same(s.records.find(r=>r.attemptId===record.attemptId),record))return fail()}}
 if(s.activeCupId!==null&&(!uuid(s.activeCupId)||s.cups[s.activeCupId]?.status!=='active'))return fail();
 if(Object.values(s.cups).filter(c=>c.status==='active').length!==(s.activeCupId?1:0))return fail();
 for(const a of Object.values(s.attempts)){if(a.cupId&&!s.cups[a.cupId]||a.status==='completed'&&!s.records.some(r=>r.attemptId===a.id))return fail()}
 if(s.active?.cupId&&s.active.cupId!==s.activeCupId)return fail();
 if(new Set(s.records.map(r=>r.attemptId)).size!==s.records.length)return fail();
 for(const record of s.records){const a=s.attempts[record.attemptId];if(!a||a.status!=='completed'||record.competitionId!==a.competitionId||record.route!==a.route||record.routeVersion!==a.routeVersion||record.handlingProfile!==a.handlingProfile||record.laps!==1||!same(record.recipe,a.recipe)||!Number.isFinite(record.timeMs)||record.timeMs<=0||!Number.isInteger(record.place)||record.place<1||record.place>a.participants.length||!Array.isArray(record.standings)||!same(record.standings.map(v=>v.id).sort(),[...a.participants].sort())||record.standings.some(v=>!['finished','dnf','invalid','unfinished'].includes(v.status)||!Number.isInteger(v.place)||v.place<1||v.place>a.participants.length||v.status==='finished'&&(!Number.isFinite(v.timeMs)||v.timeMs!<=0)))return fail()}
 return structuredClone(s);
}
const issued=new WeakSet<object>();
declare const verified:unique symbol;
export type CareerFinish=Readonly<RaceRecord>&{readonly [verified]:true};
/** Only the live race's validated checkpoint result can mint a result command. This is a local integrity boundary, not anti-cheat authentication. */
export function certifyCareerFinish(attempt:Attempt,race:ReturnType<CrewRace['snapshot']>):CareerFinish {
 const p=race.playerResult;if(!p?.valid||p.status!=='finished'||p.participantId!=='player'||p.attemptId!==attempt.id||p.event!==attempt.competitionId||p.laps!==attempt.laps||!p.timeMs||!p.place||race.handlingProfileId!==attempt.handlingProfile||race.event!==attempt.competitionId||race.laps!==attempt.laps||!race.allFinished||!same([...race.standings.map(s=>s.id)].sort(),[...attempt.participants].sort()))throw Error('Career result requires the completed, matching competition');
 const record={attemptId:attempt.id,competitionId:attempt.competitionId,route:attempt.route,routeVersion:attempt.routeVersion,handlingProfile:attempt.handlingProfile,laps:attempt.laps,recipe:structuredClone(attempt.recipe),timeMs:p.timeMs,place:p.place,standings:race.standings.map(s=>({id:s.id,place:s.place,status:s.status,timeMs:s.timeMs}))};
 if(!uuid(attempt.id)||!Number.isFinite(p.timeMs)||p.timeMs<=0||!Number.isInteger(p.place)||p.place<1||p.place>attempt.participants.length||race.standings.some(s=>!['finished','dnf','invalid','unfinished'].includes(s.status)||s.status==='finished'&&(!Number.isFinite(s.timeMs)||s.timeMs!<=0))||race.standings.find(s=>s.id==='player')?.timeMs!==p.timeMs||race.standings.find(s=>s.id==='player')?.place!==p.place)throw Error('Career result contains invalid timing or standings');
 const proof=freeze(record) as CareerFinish;issued.add(proof);return proof;
}
export type OwnBuildCommand={type:'chapter-begin';event:ChapterEvent;id:string;cupId?:string;routeVersion:string}|{type:'chapter-abandon'}|{type:'chapter-result';result:CareerFinish}|{type:'chapter-purchase';id:string;productId:ProductId;option:string;vehicleId:string}|{type:'chapter-equip';productId:ProductId;equipped:boolean}|{type:'chapter-finish';finish:FinishId};
export function ownBuildTransition(s:Career,c:OwnBuildCommand,at:string):{changed:boolean;receipt?:Receipt}{
 const b=s.ownBuild;
 if(c.type==='chapter-finish'){const recipe=careerRecipe(s);recipe.finish=c.finish;validateRecipe(recipe);b.finish=c.finish;return {changed:true}}
 if(c.type==='chapter-purchase'){
  const p=productById(c.productId);if(!uuid(c.id)||!p||!['SM-7720','SM-26801','SM-28919'].includes(c.productId)||p.vehicleId!==c.vehicleId||p.option!==c.option)throw Error('Invalid product, option or fitment');
  if(productOwned(s,c.productId))return {changed:false};if(!productUnlocked(s,c.productId))throw Error('Complete the named chapter event to unlock this product');if(s.receipts[c.id])throw Error('Transaction ID already used');const price=CREDIT_TABLE[c.productId];if(s.credits<price)throw Error(`${price} game credits required`);s.credits-=price;b.products[c.productId]={owned:true,equipped:true};return {changed:true,receipt:{id:c.id,kind:'chapter-purchase',amount:-price,balance:s.credits,first:true,at,productId:c.productId}}
 }
 if(c.type==='chapter-equip'){if(!productOwned(s,c.productId)||!['SM-7720','SM-26801','SM-28919'].includes(c.productId)||typeof c.equipped!=='boolean')throw Error('Owned chapter product required');b.products[c.productId]!.equipped=c.equipped;return {changed:true}}
 if(c.type==='chapter-abandon'){if(b.active){b.attempts[b.active.id].status='abandoned';b.active=null}if(b.activeCupId){b.cups[b.activeCupId].status='abandoned';b.activeCupId=null}return {changed:true}}
 if(c.type==='chapter-begin'){
  if(!uuid(c.id)||b.attempts[c.id]||s.receipts[c.id]||!Object.hasOwn(EVENTS,c.event)||!eventAvailable(s,c.event)||!['express-layout-v1','1'].includes(c.routeVersion))throw Error('Event locked or invalid new attempt');
  if(b.active){b.attempts[b.active.id].status='abandoned';b.active=null}
  let cup:Cup|undefined;if(c.event==='coastline-cup'){if(b.activeCupId)cup=b.cups[b.activeCupId];else {if(!uuid(c.cupId)||b.cups[c.cupId])throw Error('A new Cup needs a fresh identity');const recipe=careerRecipe(s);cup={id:c.cupId,status:'active',stages:[],recipe,handlingProfile:recipe.handlingProfile};b.cups[cup.id]=cup;b.activeCupId=cup.id}}else if(b.activeCupId)throw Error('Resume or abandon your active Cup first');
  const stage=(cup?.stages.length??0) as 0|1,spec=competition(c.event,stage),recipe=structuredClone(cup?.recipe??careerRecipe(s));if(c.routeVersion!==(spec.route==='express'?'express-layout-v1':'1'))throw Error('Route version mismatch');const attempt:Attempt={version:1,id:c.id,event:c.event,competitionId:spec.eventId,route:spec.route,routeVersion:c.routeVersion,handlingProfile:recipe.handlingProfile,laps:1,participants:spec.participants,recipe,cupId:cup?.id??null,stage,status:'prepared'};b.attempts[c.id]=attempt;b.active=structuredClone(attempt);return {changed:true};
 }
 const r=c.result;if(!issued.has(r))throw Error('Career result requires verified competition proof');const a=b.attempts[r.attemptId];if(!a||r.competitionId!==a.competitionId||r.route!==a.route||r.routeVersion!==a.routeVersion||r.handlingProfile!==a.handlingProfile||r.laps!==a.laps||!same(r.recipe,a.recipe))throw Error('Result does not match committed entry');
 const prior=s.receipts[r.attemptId];if(prior){if(prior.kind!=='chapter-award'||!same(b.records.find(v=>v.attemptId===r.attemptId),r))throw Error('Attempt ID belongs to another result');return {changed:false,receipt:prior}}
 if(a.status!=='prepared'||b.active?.id!==a.id)throw Error('Attempt was abandoned or superseded');
 a.status='completed';b.active=null;b.records.push(structuredClone(r));let amount=0,first=false,bonus=0;
 if(a.event==='coastline-cup'){const cup=b.cups[a.cupId!];if(cup.status!=='active'||cup.stages.length!==a.stage)throw Error('Cup event order does not match');cup.stages.push(structuredClone(r));if(Number(cup.stages.length)===2){cup.status='completed';b.activeCupId=null;first=!b.completed[a.event];const won=cupStandings(cup)[0].id==='player';bonus=won&&!b.won[a.event]?100:0;amount=(first?EVENTS[a.event].first:EVENTS[a.event].repeat)+bonus;b.completed[a.event]=true;b.won[a.event] ||=won}}
 else{first=!b.completed[a.event];const won=a.event==='hold-your-nerve'&&r.place===1;bonus=won&&!b.won[a.event]?100:0;amount=(first?EVENTS[a.event].first:EVENTS[a.event].repeat)+bonus;b.completed[a.event]=true;b.won[a.event] ||=won}
 s.credits+=amount;return {changed:true,receipt:{id:a.id,kind:'chapter-award',amount,balance:s.credits,first,at,event:a.competitionId,place:r.place,timeMs:r.timeMs,chapterBonus:bonus,handlingProfile:a.handlingProfile as Receipt['handlingProfile'],chapterRecord:structuredClone(r)}};
}

