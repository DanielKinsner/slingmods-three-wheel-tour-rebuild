import {openCareer,freshCareer,type Career,type Command,type Result} from './store';
export const RAE={entry:"Welcome to the harbor. Give me one clean lap, then we'll make this thing yours.",firstCompletion:"Clean lap. You're in. Your first workshop credits are ready.",firstBuild:"That's your first build. Take it out after dark."};
/** Per-page connection, latest committed state only. A failed transaction never reports success. */
export async function careerClient(){
 // One-shot same-origin scene handoff keeps denied-storage play coherent without durable storage.
 // It is tab memory, consumed immediately, never a URL parameter or sent to the product site.
 let fallback=freshCareer();const prefix='twt-career-transfer:';
 try{if(window.name.startsWith(prefix)){const transfer=JSON.parse(window.name.slice(prefix.length));window.name=typeof transfer.previousName==='string'?transfer.previousName:'';if(transfer.origin===location.origin&&transfer.target===location.pathname+location.search&&transfer.state?.version===1)fallback=transfer.state}}catch{window.name=''}
 const store=await openCareer(fallback);let state=await store.read(),closed=false,stale=false;const listeners=new Set<()=>void>();
 async function refresh(){stale=true;listeners.forEach(f=>f());try{const next=await store.read();if(next.revision>=state.revision)state=next}finally{stale=false;if(!closed)listeners.forEach(f=>f())}}
 function handoff(url:string){if(store.durable)return;const target=new URL(url,location.href);if(target.origin!==location.origin||!['bay','pad','vehicle','harbor'].includes(target.searchParams.get('scene')??'bay'))return;window.name=prefix+JSON.stringify({origin:location.origin,target:target.pathname+target.search,previousName:window.name,state})}
 const internalClick=(event:MouseEvent)=>{const a=(event.target as Element)?.closest<HTMLAnchorElement>('a[href]');if(a&&a.target!=='_blank'&&!event.ctrlKey&&!event.metaKey)handoff(a.href)};document.addEventListener('click',internalClick,true);
 const unsub=store.subscribe(()=>{void refresh().catch(()=>{})});const focus=()=>{void refresh().catch(()=>{})};addEventListener('focus',focus);
 return {navigate(url:string){handoff(url);location.href=url},get state():Career{return state},get stale(){return stale},durable:store.durable,async execute(c:Command):Promise<Result>{const r=await store.execute(c);if(r.state.revision>=state.revision)state=r.state;listeners.forEach(f=>f());return r},refresh,subscribe(f:()=>void){listeners.add(f);return()=>listeners.delete(f)},close(){closed=true;unsub();document.removeEventListener('click',internalClick,true);removeEventListener('focus',focus);store.close();listeners.clear()}};
}
export type CareerClient=Awaited<ReturnType<typeof careerClient>>;
