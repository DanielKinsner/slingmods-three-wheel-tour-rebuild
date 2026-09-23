import type {Vector3} from 'three';
import asset from '../../public/assets/ryker/manifest.json';
import {RYKER_DEFINITION} from '../simulation/vehicle-definition';
const layout=RYKER_DEFINITION.layout;
/** Visual positions only. Authoritative collision/raycast telemetry is never modified. */
export const rykerWheels=['front_left','front_right','rear'].map((id,i)=>({...asset.wheels[id as keyof typeof asset.wheels],width:i===2?.168:.135}));
export function visualWheel(out:Vector3,i:number,center:{x:number;y:number;z:number},ryker:boolean){
 if(!ryker)return out.set(center.x,center.y,center.z);
 const w=rykerWheels[i];return out.set(w.center[0],w.center[1]+center.y-layout.wheels[i].center[1],w.center[2]);
}
