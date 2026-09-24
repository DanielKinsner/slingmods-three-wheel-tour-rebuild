import type {BuildRecipe} from '../signature/config';
import type {VehicleTuning} from '../simulation';
/**
 * Game tuning (owner decision 2026-09-24): fitted parts give modest, believable stat gains on top of what they already
 * do (shocks keep their real damping model). These are GAME values, labelled as such in the garage: not performance
 * claims for the real products. Only the current handling tunes use them (see `tuningFor`), so older recorded runs
 * replay exactly.
 */
export interface PartTuning {power?:number;grip?:number;aeroGrip?:number;drag?:number}
/** Per part: power/grip/drag are fractions (+0.04 = +4%); aeroGrip is extra grip reached at high speed. */
export const PART_TUNING:Record<string,PartTuning>={
 // Slingshot
 'SM-7720':{power:.04},'SM-3223':{grip:.03},'SM-26801':{aeroGrip:.03,drag:.03},
 // Ryker
 'ryker:exhaust':{power:.04},'ryker:shocks':{grip:.03},'ryker:body':{drag:-.02},
 // Spyder (the throttle controller only sharpens response: its power is unchanged)
 'spyder:front':{grip:.015},'spyder:rear':{grip:.015},'spyder:sway':{grip:.02},
};
const CURRENT=new Set(['slingmods-sport-v5','ryker-road-v1','spyder-f3-v1']);
/** Parts fitted to a build, as PART_TUNING keys. */
export function fittedParts(recipe:BuildRecipe):string[]{
 if(recipe.vehicleId==='can-am-ryker-900')return Object.entries(recipe.ryker??{}).filter(([,on])=>on).map(([k])=>'ryker:'+k);
 if(recipe.vehicleId==='can-am-spyder-f3')return Object.entries(recipe.spyder?.parts??{}).filter(([,on])=>on).map(([k])=>'spyder:'+k);
 return Object.keys(recipe.products);
}
/** Combined physics modifiers for a build (neutral for historical handling tunes). */
export function tuningFor(recipe:BuildRecipe):VehicleTuning{
 const t={power:1,grip:1,aeroGrip:0,drag:1};if(!CURRENT.has(recipe.handlingProfile))return t;
 for(const id of fittedParts(recipe)){const p=PART_TUNING[id];if(!p)continue;t.power+=p.power??0;t.grip+=p.grip??0;t.aeroGrip+=p.aeroGrip??0;t.drag+=p.drag??0}
 return t;
}
/** Garage stat bars, 0-100. Base values give each vehicle its character; parts move them by their tuning. */
const BASE:Record<BuildRecipe['vehicleId'],{acceleration:number;topSpeed:number;grip:number;stability:number}>={
 'slingshot-r-2024':{acceleration:68,topSpeed:70,grip:66,stability:58},
 'can-am-ryker-900':{acceleration:60,topSpeed:58,grip:60,stability:62},
 'can-am-spyder-f3':{acceleration:64,topSpeed:66,grip:62,stability:72},
};
export type StatId='acceleration'|'topSpeed'|'grip'|'stability';
export const STAT_LABELS:Record<StatId,string>={acceleration:'Acceleration',topSpeed:'Top speed',grip:'Grip',stability:'Stability'};
export function buildStats(recipe:BuildRecipe):Record<StatId,number>{
 const base=BASE[recipe.vehicleId]??BASE['slingshot-r-2024'],t=tuningFor(recipe),r=(v:number)=>Math.max(0,Math.min(100,Math.round(v)));
 return {acceleration:r(base.acceleration+(t.power-1)*250),topSpeed:r(base.topSpeed+(t.power-1)*120-(t.drag-1)*180),grip:r(base.grip+(t.grip-1)*300+t.aeroGrip*100),stability:r(base.stability+t.aeroGrip*400+(t.grip-1)*100)};
}
/** One short line per part for the product panel, e.g. "+4% power". Empty for cosmetic parts. */
export function tuningLine(partId:string){const p=PART_TUNING[partId];if(!p)return '';const bits:string[]=[];if(p.power)bits.push(`+${Math.round(p.power*100)}% power`);if(p.grip)bits.push(`+${+(p.grip*100).toFixed(1)}% grip`);if(p.aeroGrip)bits.push(`+${Math.round(p.aeroGrip*100)}% grip at speed`);if(p.drag)bits.push(`${p.drag>0?'+':''}${Math.round(p.drag*100)}% drag`);return bits.join(' · ')}
