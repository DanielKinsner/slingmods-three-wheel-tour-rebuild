import {SUSPENSION,streetSetup,validSetup,type SuspensionSetup} from './suspension';
import {DUEL_EVENT,isDuelAwardProof,type DuelAwardProof} from './duel-result';
import {isCrewAwardProof,type CrewAwardProof,CREW_EVENT,CHAPTER_ID} from './crew-result';
import {PRODUCT,COLORS,defaultAppearance,type Appearance} from './catalog';
export const CAREER_DB='slingmods-twt-rebuild-career-v1';
export interface Receipt {id:string;kind:'award'|'purchase'|'crew-award'|'duel-award'|'suspension-purchase';amount:number;balance:number;first:boolean;at:string;event?:typeof CREW_EVENT|typeof DUEL_EVENT;place?:number;timeMs?:number;chapterBonus?:number}
export interface Career {version:3;buildMatters:{legacyCrewAccess:boolean;duelCompleted:boolean;duelWon:boolean};suspension:{owned:boolean;equipped:boolean;setup:SuspensionSetup};revision:number;credits:number;owned:boolean;equipped:boolean;appearance:Appearance;chapters:{entry:boolean;firstCompletion:boolean;firstBuild:boolean};crew:{invitationSeen:boolean;completed:boolean;bestPlace:number|null;cleared:boolean;clearAcknowledged:boolean};receipts:Record<string,Receipt>}
export const freshCareer=():Career=>({version:3,buildMatters:{legacyCrewAccess:false,duelCompleted:false,duelWon:false},suspension:{owned:false,equipped:false,setup:streetSetup()},revision:0,credits:0,owned:false,equipped:false,appearance:defaultAppearance(),chapters:{entry:false,firstCompletion:false,firstBuild:false},crew:{invitationSeen:false,completed:false,bestPlace:null,cleared:false,clearAcknowledged:false},receipts:{}});
export type Command={type:'duel-award';result:DuelAwardProof}|{type:'suspension-purchase';id:string;productId:string;vehicleId:string}|{type:'suspension-equip';equipped:boolean}|{type:'suspension-setup';setup:SuspensionSetup}|{type:'award';id:string;valid:boolean;timeMs:number;event:'harbor'}|{type:'purchase';id:string;productId:string;vehicleId:string}|{type:'equip';equipped:boolean}|{type:'appearance';patch:Partial<Appearance>}|{type:'entry'}|{type:'crew-award';result:CrewAwardProof}|{type:'crew-invitation'}|{type:'crew-acknowledge'};
export interface Result {state:Career;changed:boolean;receipt?:Receipt;story?:'entry'|'firstCompletion'|'firstBuild'|'crewPodium'|'crewWin'|'crewFourth'|'duelComplete'|'duelWin'}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** One pure mutation used inside the real readwrite transaction and the session fallback. */
export function transition(current:Career,command:Command,at=new Date().toISOString()):Result {
 const s=migrateCareer(current);let receipt:Receipt|undefined,story:Result['story'];
 if(command.type==='duel-award'){
  const r=command.result;if(!isDuelAwardProof(r))throw Error('Duel reward requires a verified finish');
  if(!s.chapters.firstCompletion)throw Error('Complete a clean Harbor lap first');
  const prior=s.receipts[r.attemptId];if(prior){if(prior.kind!=='duel-award'||prior.event!==r.event||prior.place!==r.place||prior.timeMs!==r.timeMs)throw Error('Attempt ID is already bound to a different result');return {state:s,changed:false,receipt:prior}}
  const first=!s.buildMatters.duelCompleted,chapterBonus=first?500:0,amount=(r.place===1?250:150)+chapterBonus;
  s.credits+=amount;s.buildMatters.duelCompleted=true;s.buildMatters.duelWon ||=r.place===1;
  receipt={id:r.attemptId,kind:'duel-award',amount,balance:s.credits,first,at,event:DUEL_EVENT,place:r.place,timeMs:r.timeMs,chapterBonus};story=r.place===1?'duelWin':'duelComplete';
 }else if(command.type==='suspension-purchase'){
  if(!uuid.test(command.id))throw Error('Invalid purchase ID');
  if(command.productId!==SUSPENSION.id||command.vehicleId!==SUSPENSION.vehicleId)throw Error('Suspension does not fit selected vehicle');
  if(s.suspension.owned)return {state:s,changed:false};
  if(s.receipts[command.id])throw Error('Transaction ID already used');
  if(s.credits<SUSPENSION.price)throw Error('1000 game credits required. Maya’s duel funds the workshop.');
  s.credits-=SUSPENSION.price;s.suspension={owned:true,equipped:true,setup:streetSetup()};
  receipt={id:command.id,kind:'suspension-purchase',amount:-SUSPENSION.price,balance:s.credits,first:true,at};
 }else if(command.type==='suspension-equip'){
  if(!s.suspension.owned||typeof command.equipped!=='boolean')throw Error('Owned suspension required');s.suspension.equipped=command.equipped;
 }else if(command.type==='suspension-setup'){
  if(!s.suspension.owned||!validSetup(command.setup))throw Error('Owned suspension and valid setup required');s.suspension.setup={...command.setup};
 }else if(command.type==='crew-award'){
  const r=command.result;if(!isCrewAwardProof(r))throw Error('Crew reward requires a verified competition finish');
  if(!s.chapters.firstCompletion)throw Error('Complete a clean Harbor lap before the crew event');
  if(!s.buildMatters.legacyCrewAccess&&!s.buildMatters.duelCompleted)throw Error('Finish Maya’s duel to unlock the crew');
  const prior=s.receipts[r.attemptId];
  if(prior){if(prior.kind!=='crew-award'||prior.event!==r.event||prior.place!==r.place||prior.timeMs!==r.timeMs)throw Error('Attempt ID is already bound to a different result');return {state:s,changed:false,receipt:prior}}
  const first=r.place<=3&&!s.crew.cleared,chapterBonus=first?400:0,amount=([0,300,200,150,100][r.place]!)+chapterBonus;
  s.credits+=amount;s.crew.completed=true;s.crew.bestPlace=Math.min(s.crew.bestPlace??4,r.place);if(first)s.crew.cleared=true;
  receipt={id:r.attemptId,kind:'crew-award',amount,balance:s.credits,first,at,event:CREW_EVENT,place:r.place,timeMs:r.timeMs,chapterBonus};
  if(first)story=r.place===1?'crewWin':'crewPodium';else if(r.place===4)story='crewFourth';
 }else if(command.type==='crew-invitation'){
  if(!s.chapters.firstCompletion)throw Error('Finish a clean Harbor lap first');if(s.crew.invitationSeen)return {state:s,changed:false};s.crew.invitationSeen=true;
 }else if(command.type==='crew-acknowledge'){
  if(!s.crew.cleared||s.crew.clearAcknowledged)return {state:s,changed:false};s.crew.clearAcknowledged=true;
 }else if(command.type==='award'){
  if(!uuid.test(command.id))throw Error('Invalid attempt ID');
  if(!command.valid||command.event!=='harbor'||!Number.isFinite(command.timeMs)||command.timeMs<=0)return {state:s,changed:false};
  if(s.receipts[command.id]){if(s.receipts[command.id].kind!=='award')throw Error('Attempt ID already used by another event');return {state:s,changed:false,receipt:s.receipts[command.id]}};
  const first=!s.chapters.firstCompletion,amount=first?800:100;s.credits+=amount;s.chapters.firstCompletion=true;
  receipt={id:command.id,kind:'award',amount,balance:s.credits,first,at};if(first)story='firstCompletion';
 }else if(command.type==='purchase'){
  if(!uuid.test(command.id))throw Error('Invalid purchase ID');
  if(command.productId!==PRODUCT.id||command.vehicleId!==PRODUCT.vehicleId)throw Error('This kit does not fit the selected vehicle');
  if(s.owned)return {state:s,changed:false};
  if(s.receipts[command.id])throw Error('Transaction ID already used');
  if(s.credits<PRODUCT.price)throw Error('Earn a clean lap first — 600 game credits required');
  s.credits-=PRODUCT.price;s.owned=true;s.equipped=true;s.appearance=defaultAppearance();
  receipt={id:command.id,kind:'purchase',amount:-PRODUCT.price,balance:s.credits,first:true,at};
  if(!s.chapters.firstBuild){s.chapters.firstBuild=true;story='firstBuild'}
 }else if(command.type==='equip'){
  if(!s.owned)throw Error('Purchase the kit before installing');s.equipped=command.equipped;
 }else if(command.type==='appearance'){
  if(!s.owned)throw Error('Only owned appearance can be saved');const p=command.patch;
  if(p.color!==undefined){if(!Object.hasOwn(COLORS,p.color))throw Error('Unsupported color');s.appearance.color=p.color}
  if(p.brightness!==undefined){if(!Number.isFinite(p.brightness))throw Error('Invalid brightness');s.appearance.brightness=Math.max(.15,Math.min(.85,p.brightness))}
  if(p.enabled!==undefined){if(typeof p.enabled!=='boolean')throw Error('Invalid light state');s.appearance.enabled=p.enabled}
 }else if(command.type==='entry'){
  if(s.chapters.entry)return {state:s,changed:false};s.chapters.entry=true;story='entry';
 }
 if(receipt)s.receipts[receipt.id]=receipt;s.revision++;return {state:s,changed:true,receipt,story};
}
export interface CareerStore {readonly durable:boolean;read():Promise<Career>;execute(c:Command):Promise<Result>;subscribe(fn:()=>void):()=>void;close():void}
export class MemoryCareerStore implements CareerStore {
 readonly durable=false;private state:Career;private listeners=new Set<()=>void>();
 constructor(initial:unknown=freshCareer()){this.state=migrateCareer(initial)}
 async read(){return structuredClone(this.state)}
 async execute(c:Command){const r=transition(this.state,c);this.state=r.state;if(r.changed)this.listeners.forEach(fn=>fn());return structuredClone(r)}
 subscribe(fn:()=>void){this.listeners.add(fn);return()=>{this.listeners.delete(fn)}}close(){this.listeners.clear()}
}
/** A future/corrupt record is retained verbatim; callers may export it or explicitly choose temporary play. */
export class CareerDataError extends Error {
 constructor(message:string,readonly raw:unknown){super(message);this.name='CareerDataError'}
}
const object=(v:unknown):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function migrateCareer(raw:unknown):Career {
 const fail=()=>{throw new CareerDataError('Saved career needs recovery. Your stored progress has not been replaced.',raw)};
 if(!object(raw)||![1,2,3].includes(raw.version))return fail();
 if(!Number.isSafeInteger(raw.revision)||raw.revision<0||!Number.isSafeInteger(raw.credits)||raw.credits<0||typeof raw.owned!=='boolean'||typeof raw.equipped!=='boolean'||raw.equipped&&!raw.owned)return fail();
 const a=raw.appearance,c=raw.chapters;
 if(!object(a)||!Object.hasOwn(COLORS,a.color)||!Number.isFinite(a.brightness)||a.brightness<.15||a.brightness>.85||typeof a.enabled!=='boolean'||!object(c)||['entry','firstCompletion','firstBuild'].some(k=>typeof c[k]!=='boolean')||!object(raw.receipts))return fail();
 for(const [id,r]of Object.entries(raw.receipts))if(!object(r)||r.id!==id||!uuid.test(id)||!['award','purchase',...(raw.version>=2?['crew-award']:[]),...(raw.version===3?['duel-award','suspension-purchase']:[])].includes(r.kind)||!Number.isSafeInteger(r.amount)||!Number.isSafeInteger(r.balance)||r.balance<0||typeof r.first!=='boolean'||typeof r.at!=='string'||!Number.isFinite(Date.parse(r.at)))return fail();
 const s=structuredClone(raw);
 if(s.version===1){s.version=2;s.crew={invitationSeen:false,completed:false,bestPlace:null,cleared:false,clearAcknowledged:false}}
 if(s.version===2){s.version=3;s.buildMatters={legacyCrewAccess:s.chapters.firstCompletion,duelCompleted:false,duelWon:false};s.suspension={owned:false,equipped:false,setup:streetSetup()}}
 const b=s.buildMatters,u=s.suspension;
 if(!object(b)||['legacyCrewAccess','duelCompleted','duelWon'].some(k=>typeof b[k]!=='boolean')||b.duelWon&&!b.duelCompleted||!object(u)||typeof u.owned!=='boolean'||typeof u.equipped!=='boolean'||u.equipped&&!u.owned||!validSetup(u.setup))return fail();
 for(const r of Object.values(s.receipts)as Receipt[])if(r.kind==='duel-award'&&(r.event!==DUEL_EVENT||![1,2].includes(r.place!)||!Number.isFinite(r.timeMs)||r.timeMs!<=0||![0,500].includes(r.chapterBonus!)))return fail();
 const crew=s.crew;
 if(!object(crew)||['invitationSeen','completed','cleared','clearAcknowledged'].some(k=>typeof crew[k]!=='boolean')||!(crew.bestPlace===null||Number.isInteger(crew.bestPlace)&&crew.bestPlace>=1&&crew.bestPlace<=4)||crew.cleared&&(!crew.completed||crew.bestPlace===null||crew.bestPlace>3)||crew.clearAcknowledged&&!crew.cleared)return fail();
 for(const r of Object.values(s.receipts)as Receipt[])if(r.kind==='crew-award'&&(r.event!==CREW_EVENT||!Number.isInteger(r.place)||r.place!<1||r.place!>4||!Number.isFinite(r.timeMs)||r.timeMs!<=0||![0,400].includes(r.chapterBonus!)))return fail();
 return s as Career;
}
export {CHAPTER_ID};
class IndexedCareerStore implements CareerStore {
 readonly durable=true;private listeners=new Set<()=>void>();private channel:BroadcastChannel|undefined;private superseded=false;
 constructor(private db:IDBDatabase){try{this.channel=new BroadcastChannel(CAREER_DB);this.channel.onmessage=()=>this.listeners.forEach(fn=>fn())}catch{}db.onversionchange=()=>{this.superseded=true;db.close();this.listeners.forEach(fn=>fn())}}
 private transaction(mode:IDBTransactionMode){if(this.superseded)throw Error('Career upgraded in another tab. Refresh this tab before saving.');return this.db.transaction('career',mode)}
 read():Promise<Career>{return new Promise((resolve,reject)=>{
  // Reading and migration share the serialized writer path: no read/overwrite race.
  const tx=this.transaction('readwrite'),store=tx.objectStore('career'),request=store.get('current');let s:Career,error:unknown;
  request.onsuccess=()=>{try{s=request.result===undefined?freshCareer():migrateCareer(request.result);if(request.result===undefined||request.result.version<3)store.put(s,'current')}catch(e){error=e;tx.abort()}};
  tx.oncomplete=()=>resolve(structuredClone(s));tx.onabort=tx.onerror=()=>reject(error??tx.error??Error('Career storage unavailable'));
 })}
 execute(command:Command):Promise<Result>{return new Promise((resolve,reject)=>{
  const tx=this.transaction('readwrite'),store=tx.objectStore('career'),request=store.get('current');let result:Result,error:unknown;
  request.onsuccess=()=>{try{result=transition(request.result===undefined?freshCareer():migrateCareer(request.result),command);if(result.changed||request.result?.version<3)store.put(result.state,'current')}catch(e){error=e;tx.abort()}};
  tx.oncomplete=()=>{if(result.changed){this.channel?.postMessage(result.state.revision);this.listeners.forEach(fn=>fn())}resolve(structuredClone(result))};
  tx.onabort=tx.onerror=()=>reject(error??tx.error??Error('Transaction did not commit. Retry when storage is available.'));
 })}
 subscribe(fn:()=>void){this.listeners.add(fn);return()=>{this.listeners.delete(fn)}}close(){this.channel?.close();this.db.close();this.listeners.clear()}
}
export async function openCareer(fallback:unknown=freshCareer()):Promise<CareerStore>{
 let db:IDBDatabase;
 try{db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(CAREER_DB,2);let failed=false;const timer=setTimeout(()=>{failed=true;reject(Error('Career storage blocked'))},3000);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('career'))r.result.createObjectStore('career')};r.onerror=r.onblocked=()=>{failed=true;clearTimeout(timer);reject(r.error??Error('Career storage blocked'))};r.onsuccess=()=>{clearTimeout(timer);if(failed)r.result.close();else resolve(r.result)}})}catch(e){if((e as Error)?.name==='VersionError')throw new CareerDataError('This career was saved by a newer build. Refresh to the current build; stored progress is unchanged.',undefined);return new MemoryCareerStore(fallback)}
 const store=new IndexedCareerStore(db);
 try{await store.read();return store}catch(e){store.close();if(e instanceof CareerDataError)throw e;return new MemoryCareerStore(fallback)}
}
