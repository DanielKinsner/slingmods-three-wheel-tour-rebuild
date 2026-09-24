import type {BuildRecipe} from '../signature/config';
import {fittedParts,PART_TUNING} from './tuning';
const PART_NAMES:Record<string,string>={'SM-7720':'Exhaust','SM-3223':'Shocks','SM-26801':'Wing','ryker:exhaust':'Exhaust','ryker:shocks':'Elka shocks','ryker:body':'Panther kit'};
/** New Spyder results freeze mechanics and assists; historical keys stay readable and untouched. */
export function comparisonIdentity(r:BuildRecipe){
 // Slingshot / Ryker: performance parts (game tuning) get their own record; stock keeps the original key.
 if(!r.spyder){const tuned=fittedParts(r).filter(p=>PART_TUNING[p]).sort();return tuned.length&&(r.handlingProfile==='slingmods-sport-v5'||r.handlingProfile==='ryker-road-v1')?r.vehicleId+'|tuned:'+tuned.join(','):r.vehicleId}
 const b=r.spyder,parts=['throttle','front','rear','sway','underglow','wheels'] as const;
 return [r.vehicleId,r.definitionId,r.handlingProfile,'auto-se6',...parts.map(p=>p+'='+Number(!!b.parts[p])),b.parts.throttle?b.mode:'stock',b.parts.front?JSON.stringify(b.front):'stock',b.parts.rear?JSON.stringify(b.rear):'stock'].join('|');
}
export function comparisonLabel(id:string){if(!id.startsWith('can-am-spyder-f3')){const [vehicle,tuned]=id.split('|tuned:'),name=vehicle==='can-am-ryker-900'?'Ryker 900':'Slingshot R';return tuned?name+' · '+tuned.split(',').map(p=>PART_NAMES[p]??p).join(' + '):name}const parts=id.split('|').filter(s=>s.endsWith('=1')).map(s=>s.slice(0,-2));return 'Spyder F3 · '+(parts.join(' + ')||'Stock')+' · '+(id.split('|')[10]??'auto SE6');}
