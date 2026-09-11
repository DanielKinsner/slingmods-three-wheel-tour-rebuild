import {PRODUCT,COLORS,defaultAppearance,type Appearance} from './catalog';
export const CAREER_DB='slingmods-twt-rebuild-career-v1';
export interface Receipt {id:string;kind:'award'|'purchase';amount:number;balance:number;first:boolean;at:string}
export interface Career {version:1;revision:number;credits:number;owned:boolean;equipped:boolean;appearance:Appearance;chapters:{entry:boolean;firstCompletion:boolean;firstBuild:boolean};receipts:Record<string,Receipt>}
export const freshCareer=():Career=>({version:1,revision:0,credits:0,owned:false,equipped:false,appearance:defaultAppearance(),chapters:{entry:false,firstCompletion:false,firstBuild:false},receipts:{}});
export type Command={type:'award';id:string;valid:boolean;timeMs:number;event:'harbor'}|{type:'purchase';id:string;productId:string;vehicleId:string}|{type:'equip';equipped:boolean}|{type:'appearance';patch:Partial<Appearance>}|{type:'entry'};
export interface Result {state:Career;changed:boolean;receipt?:Receipt;story?:'entry'|'firstCompletion'|'firstBuild'}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** One pure mutation used inside the real readwrite transaction and the session fallback. */
export function transition(current:Career,command:Command,at=new Date().toISOString()):Result {
 const s=structuredClone(current);let receipt:Receipt|undefined,story:Result['story'];
 if(command.type==='award'){
  if(!uuid.test(command.id))throw Error('Invalid attempt ID');
  if(!command.valid||command.event!=='harbor'||!Number.isFinite(command.timeMs)||command.timeMs<=0)return {state:s,changed:false};
  if(s.receipts[command.id])return {state:s,changed:false,receipt:s.receipts[command.id]};
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
 constructor(initial=freshCareer()){this.state=structuredClone(initial)}
 async read(){return structuredClone(this.state)}
 async execute(c:Command){const r=transition(this.state,c);this.state=r.state;if(r.changed)this.listeners.forEach(fn=>fn());return structuredClone(r)}
 subscribe(fn:()=>void){this.listeners.add(fn);return()=>{this.listeners.delete(fn)}}close(){this.listeners.clear()}
}
class IndexedCareerStore implements CareerStore {
 readonly durable=true;private listeners=new Set<()=>void>();private channel:BroadcastChannel|undefined;
 constructor(private db:IDBDatabase){try{this.channel=new BroadcastChannel(CAREER_DB);this.channel.onmessage=()=>this.listeners.forEach(fn=>fn())}catch{}db.onversionchange=()=>db.close()}
 read():Promise<Career>{return new Promise((resolve,reject)=>{const tx=this.db.transaction('career','readonly'),request=tx.objectStore('career').get('current');let s:Career;request.onsuccess=()=>{s=request.result??freshCareer()};tx.oncomplete=()=>resolve(structuredClone(s));tx.onabort=tx.onerror=()=>reject(tx.error??Error('Career storage unavailable'))})}
 execute(command:Command):Promise<Result>{return new Promise((resolve,reject)=>{
  // IndexedDB serializes this read-modify-write across every tab, including first rewards.
  const tx=this.db.transaction('career','readwrite'),store=tx.objectStore('career'),request=store.get('current');let result:Result,error:unknown;
  request.onsuccess=()=>{try{result=transition(request.result??freshCareer(),command);if(result.changed)store.put(result.state,'current')}catch(e){error=e;tx.abort()}};
  tx.oncomplete=()=>{if(result.changed){this.channel?.postMessage(result.state.revision);this.listeners.forEach(fn=>fn())}resolve(structuredClone(result))};
  tx.onabort=tx.onerror=()=>reject(error??tx.error??Error('Transaction did not commit. Nothing was purchased.'));
 })}
 subscribe(fn:()=>void){this.listeners.add(fn);return()=>{this.listeners.delete(fn)}}close(){this.channel?.close();this.db.close();this.listeners.clear()}
}
export async function openCareer(fallback=freshCareer()):Promise<CareerStore>{
 try{const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(CAREER_DB,1);let failed=false;const timer=setTimeout(()=>{failed=true;reject(Error('Career storage blocked'))},3000);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('career'))r.result.createObjectStore('career')};r.onerror=r.onblocked=()=>{failed=true;clearTimeout(timer);reject(r.error??Error('Career storage blocked'))};r.onsuccess=()=>{clearTimeout(timer);if(failed)r.result.close();else resolve(r.result)}});const store=new IndexedCareerStore(db);await store.read();return store}catch{return new MemoryCareerStore(fallback)}
}
