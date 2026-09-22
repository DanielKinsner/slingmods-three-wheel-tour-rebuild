import {CAREER_DB,migrateCareer,type Career} from './store';
import {activeProfile,profileHref,DEMO_CAREER_KEY,type Profile} from '../demo/profile';
import {readTransfer,writeTransfer} from './transfer';
/**
 * Read-only career view for pages that present or preview a build but never transact: the free showroom and free test
 * drives. It never opens a career store, creates/migrates/writes a record, shows recovery dialogs or grants anything.
 * A temporary (non-durable) career that arrived in this tab is kept in memory and handed back on every same-tab exit.
 */
export interface CareerContext {readonly profile:Profile;readonly state:Career|null;readonly temporary:boolean;readonly source:'transfer'|'saved'|'demo-session'|'none';relay(url:string):string;navigate(url:string):void;dispose():void}
/** Opens an existing career database only. A missing database is not created (the upgrade is aborted). */
export function readSavedCareer(timeoutMs=3000):Promise<{available:boolean;state:Career|null}>{
 return new Promise(resolve=>{
  let settled=false,missing=false;const done=(value:{available:boolean;state:Career|null})=>{if(!settled){settled=true;clearTimeout(timer);resolve(value)}};const timer=setTimeout(()=>done({available:false,state:null}),timeoutMs);
  let request:IDBOpenDBRequest;try{request=indexedDB.open(CAREER_DB)}catch{done({available:false,state:null});return}
  request.onupgradeneeded=()=>{missing=true;request.transaction?.abort()};
  request.onblocked=()=>done({available:false,state:null});
  request.onerror=()=>done({available:missing,state:null});
  request.onsuccess=()=>{const db=request.result;if(settled||!db.objectStoreNames.contains('career')){db.close();done({available:true,state:null});return}
   try{const get=db.transaction('career','readonly').objectStore('career').get('current');get.onsuccess=()=>{let state:Career|null=null;try{state=get.result===undefined?null:migrateCareer(get.result)}catch{state=null}db.close();done({available:true,state})};get.onerror=()=>{db.close();done({available:false,state:null})}}catch{db.close();done({available:false,state:null})}};
 });
}
function readDemoSession():{available:boolean;state:Career|null}{try{const raw=window.sessionStorage.getItem(DEMO_CAREER_KEY);return {available:true,state:raw===null?null:migrateCareer(JSON.parse(raw))}}catch{return {available:false,state:null}}}
export async function readCareerContext(options:{saved?:boolean}={}):Promise<CareerContext>{
 const profile=activeProfile(),visitor=import.meta.env.MODE==='demo',carried=readTransfer(profile,visitor);
 // Mirror careerClient precedence: readable storage wins; a carried temporary career is used only when storage is not.
 let state:Career|null=null,source:CareerContext['source']='none',temporary=false;
 const stored=options.saved===false?{available:false,state:null}:profile==='demo'?readDemoSession():await readSavedCareer();
 if(stored.available){state=stored.state;source=state?(profile==='demo'?'demo-session':'saved'):'none'}
 else if(carried){state=carried;source='transfer';temporary=true}
 const relay=(url:string)=>{const href=profile==='demo'&&!new URL(url,location.href).searchParams.has('play')?profileHref(url,profile):url;if(temporary&&state)writeTransfer(href,profile,state,visitor);return href};
 const click=(event:MouseEvent)=>{const a=(event.target as Element)?.closest?.<HTMLAnchorElement>('a[href]');if(!a||a.target==='_blank'||event.ctrlKey||event.metaKey||event.defaultPrevented)return;if(new URL(a.href).origin!==location.origin)return;a.href=relay(a.href)};
 document.addEventListener('click',click,true);
 return {profile,state,temporary,source,relay,navigate(url){location.assign(relay(url))},dispose(){document.removeEventListener('click',click,true)}};
}
