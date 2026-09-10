export const SAVE_KEY = 'slingmods-twt-rebuild-v1';
export interface Save { version:1; vehicleId:'slingshot-r-2024'; settings:{camera:'near'|'far'} }
export const freshSave = ():Save => ({version:1,vehicleId:'slingshot-r-2024',settings:{camera:'near'}});
export function decodeSave(raw:string|null):Save {
  if(!raw) return freshSave();
  try { const v=JSON.parse(raw); if(v.version===1&&v.vehicleId==='slingshot-r-2024'&&['near','far'].includes(v.settings?.camera)) return {version:1,vehicleId:v.vehicleId,settings:{camera:v.settings.camera}}; }catch{}
  return freshSave();
}
export function loadSave(storage:Pick<Storage,'getItem'>):Save{return decodeSave(storage.getItem(SAVE_KEY));}
export function writeSave(storage:Pick<Storage,'setItem'>,save:Save){storage.setItem(SAVE_KEY,JSON.stringify(decodeSave(JSON.stringify(save))));}
