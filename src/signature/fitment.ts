import seed from './fitment-seed.json';
import {productById} from './catalog';
import {CURRENT_VEHICLE_CONTEXT} from '../presentation/vehicle-asset';
import type {VehicleContext} from '../presentation/vehicle-context';
const conditions:Record<string,string>={
 'SM-133':'Base Kit #1 only; optional halos and add-ons are not included.',
 'SM-3223':'Set of three with silver housings and silver springs. Game damping remains an estimate.',
 'SM-26801':'Requires factory square-style roll hoops. Excludes round hoops; confirm installation with the retailer.',
 'SM-28919':'Lower pair only; optional overnight bags are not included.',
 'SM-7720':'Available as a game preview with its sound. The linked exhaust is not listed for the 2026.'
};
export type FitmentState='supported'|'conditional'|'unsupported'|'unknown';
export function retailFitment(id:string,context:VehicleContext=CURRENT_VEHICLE_CONTEXT,option?:string){
 const p=productById(id),row=seed.products.find(p=>p.id===id);
 let state:FitmentState='unknown',label=`Fitment for ${context.year} R not established`,condition='Check the exact product and option before purchase.';
 if(p&&(!option||option===p.option)&&context.model==='R'){
  if(context.year===2026&&row){
   state=row.state==='listed_compatible'?'supported':row.state==='listed_compatible_conditional'?'conditional':'unsupported';
   label=state==='unsupported'?'Experimental game fit — reference product is for 2020–2024':state==='conditional'?'Listed for 2026 R · factory square hoops required':'Listed for 2026 R';
   condition=conditions[id]??row.condition;
  }else if(context.year===2024){state=id==='SM-26801'?'conditional':'supported';label='Listed for 2024 Slingshot R';condition=id==='SM-26801'?'Factory square hoops required.':'Selected catalog option only.'}
 }
 if(context.visual==='spyder'){state='unsupported';label='Slingshot part — not fitted to this Spyder';condition='Use the scoped Spyder F3 catalog.'}
 if(context.visual==='ryker'){state='unsupported';label='Slingshot part — not fitted to this Ryker';condition='This purchased Ryker preview uses its stock parts. Model year is unspecified.'}
 const compatible=state==='supported'||state==='conditional';
 return {state,label,condition,compatible,source:row?.source??p?.shopUrl??'',reviewedAt:seed.reviewedAt,linkLabel:state==='unsupported'?'View reference product (2020–2024) ↗':compatible?'View on SlingMods ↗':'View reference product ↗'};
}
