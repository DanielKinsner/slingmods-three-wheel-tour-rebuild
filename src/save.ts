export const SAVE_KEY = 'slingmods-twt-rebuild-v1';
export interface Save { version:1; vehicleId:'slingshot-r-2024'; settings:{camera:'near'|'far'|'cockpit';mute:boolean;volume:number} }
export const freshSave = ():Save => ({version:1,vehicleId:'slingshot-r-2024',settings:{camera:'near',mute:false,volume:.55}});
export function decodeSave(raw:string|null):Save {
  if(!raw) return freshSave();
  try { const v=JSON.parse(raw); if(v.version===1&&v.vehicleId==='slingshot-r-2024'&&['near','far','cockpit'].includes(v.settings?.camera)) return {version:1,vehicleId:v.vehicleId,settings:{camera:v.settings.camera,mute:v.settings.mute===true,volume:Number.isFinite(v.settings.volume)?Math.max(0,Math.min(1,v.settings.volume)):.55}}; }catch{}
  return freshSave();
}
export function loadSave(storage:Pick<Storage,'getItem'>):Save{return decodeSave(storage.getItem(SAVE_KEY));}
export function writeSave(storage:Pick<Storage,'setItem'>,save:Save){storage.setItem(SAVE_KEY,JSON.stringify(decodeSave(JSON.stringify(save))));}
