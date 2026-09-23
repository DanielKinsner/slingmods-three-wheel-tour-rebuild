import {VEHICLE_VISUAL} from './vehicle-asset';
/** Each vehicle retains its own draft; remove only the source vehicle's share fragment. */
export function vehicleSelection(){
 const link=(visual:string)=>{const url=new URL(globalThis.location?.href??'http://localhost/');url.searchParams.set('visual',visual);url.hash='';return url.pathname+url.search};
 return `<nav class="vehicle-appearance-picker" aria-label="Choose your vehicle"><span>YOUR RIDE</span>${[['2026','Slingshot R'],['ryker','Can-Am Ryker 900']].map(([id,label])=>`<a href="${link(id).replace(/&/g,'&amp;')}" data-vehicle="${id}" aria-current="${(VEHICLE_VISUAL==='ryker'?'ryker':'2026')===id?'true':'false'}">${label}</a>`).join('')}</nav>`;
}
export function installVehicleSelection(){/* Selection is owned by the shared header. */}
