import type {BuildRecipe} from '../signature/config';
/** New Spyder results freeze mechanics and assists; historical keys stay readable and untouched. */
export function comparisonIdentity(r:BuildRecipe){
 if(!r.spyder)return r.vehicleId;
 const b=r.spyder,parts=['throttle','front','rear','sway','underglow','wheels'] as const;
 return [r.vehicleId,r.definitionId,r.handlingProfile,'auto-se6',...parts.map(p=>p+'='+Number(!!b.parts[p])),b.parts.throttle?b.mode:'stock',b.parts.front?JSON.stringify(b.front):'stock',b.parts.rear?JSON.stringify(b.rear):'stock'].join('|');
}
export function comparisonLabel(id:string){if(!id.startsWith('can-am-spyder-f3'))return id==='can-am-ryker-900'?'Ryker 900':'Slingshot R';const parts=id.split('|').filter(s=>s.endsWith('=1')).map(s=>s.slice(0,-2));return 'Spyder F3 · '+(parts.join(' + ')||'Stock')+' · '+(id.split('|')[10]??'auto SE6');}
