import {activeProfile,DEMO_SETTINGS_KEY} from './demo/profile';
export const SAVE_KEY = 'slingmods-twt-rebuild-v1';
export interface LapRecord {timeMs:number;recordedAt:string}
export interface Save { version:1; vehicleId:'slingshot-r-2024'; settings:{camera:'near'|'far'|'cockpit';mute:boolean;volume:number};records:Record<string,LapRecord> }
export const freshSave = ():Save => ({version:1,vehicleId:'slingshot-r-2024',settings:{camera:'near',mute:false,volume:.55},records:{}});
export function recordKey(route:{id:string;version:string},lighting:'day'|'night',vehicle='slingshot-r-2024-stock-v1',rules='standing-lap-v1'){return [route.id,route.version,vehicle,rules,lighting].map(encodeURIComponent).join('|')}
export function decodeSave(raw:string|null):Save {
 if(!raw)return freshSave();
 try{const v=JSON.parse(raw);if(v.version!==1||v.vehicleId!=='slingshot-r-2024')return freshSave();const out=freshSave();if(['near','far','cockpit'].includes(v.settings?.camera))out.settings.camera=v.settings.camera;out.settings.mute=v.settings?.mute===true;out.settings.volume=Number.isFinite(v.settings?.volume)?Math.max(0,Math.min(1,v.settings.volume)):.55;
 if(v.records&&typeof v.records==='object'&&!Array.isArray(v.records))for(const [key,value]of Object.entries(v.records)){const r=value as LapRecord;if(key.length<512&&r&&Number.isFinite(r.timeMs)&&r.timeMs>0&&typeof r.recordedAt==='string'&&r.recordedAt.length<64)Object.defineProperty(out.records,key,{value:{timeMs:r.timeMs,recordedAt:r.recordedAt},enumerable:true,writable:true,configurable:true})}return out;}catch{return freshSave()}
}
export function loadSave(storage:Pick<Storage,'getItem'>):Save{try{return decodeSave(storage.getItem(SAVE_KEY))}catch{return freshSave()}}
export function writeSave(storage:Pick<Storage,'setItem'>,save:Save):boolean{try{storage.setItem(SAVE_KEY,JSON.stringify(decodeSave(JSON.stringify(save))));return true}catch{return false}}
/** Call only for a validated result; preserves compatible and historical records. */
export function saveBest(storage:Pick<Storage,'getItem'|'setItem'>,key:string,timeMs:number,recordedAt=new Date().toISOString()):{save:Save;updated:boolean;persisted:boolean}{const save=loadSave(storage),old=save.records[key];if(!Number.isFinite(timeMs)||timeMs<=0||(old&&old.timeMs<=timeMs))return {save,updated:false,persisted:true};save.records[key]={timeMs,recordedAt};return {save,updated:true,persisted:writeSave(storage,save)}}

/** Browsers can deny even obtaining window.localStorage, before a method is called. */
export function browserStorage():Pick<Storage,'getItem'|'setItem'>{try{const q=typeof location==='undefined'?new URLSearchParams():new URLSearchParams(location.search);if(q.get('play')==='preview'||['signature','express'].includes(q.get('scene')??'')||(!q.has('scene')&&!['career','demo'].includes(q.get('play')??''))){const storage=window.sessionStorage;return {getItem:()=>storage.getItem('slingmods-signature-settings-v1'),setItem:(_key,value)=>storage.setItem('slingmods-signature-settings-v1',value)}}if(activeProfile()==='demo'){const storage=window.sessionStorage;return {getItem:()=>storage.getItem(DEMO_SETTINGS_KEY),setItem:(_key,value)=>storage.setItem(DEMO_SETTINGS_KEY,value)}}return window.localStorage}catch{return {getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable')}}}}
