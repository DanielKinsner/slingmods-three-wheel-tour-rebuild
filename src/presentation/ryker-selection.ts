import {VEHICLE_VISUAL} from './vehicle-asset';
/** Tab-local vehicle appearance selection; no career IDs, purchases or saved recipes are rewritten. */
export function installVehicleSelection(){
 if(!document.body.classList.contains('signature-showroom'))return;
 const host=document.createElement('label');host.className='vehicle-appearance-picker';
 host.style.cssText='position:fixed;right:20px;bottom:18px;z-index:55;display:grid;gap:5px;padding:9px 12px;border:1px solid #ffffff30;border-radius:8px;background:#111820ed;color:#f2f4f5;font:12px Arial;max-width:245px';
 const label=document.createElement('span');label.textContent='Vehicle';
 const select=document.createElement('select');select.setAttribute('aria-label','Vehicle appearance');select.style.cssText='background:#263039;color:white;border:1px solid #6b7680;border-radius:4px;padding:7px';
 for(const [value,text] of [['2026','2026 Slingshot R'],['ryker','Can-Am Ryker 900']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option)}select.value=VEHICLE_VISUAL==='ryker'?'ryker':'2026';
 select.onchange=()=>{const url=new URL(location.href);url.searchParams.set('visual',select.value);location.assign(url.href)};
 host.append(label,select);if(VEHICLE_VISUAL==='ryker'){const note=document.createElement('small');note.textContent='Stock Ryker appearance · shared game handling';host.append(note)}document.body.append(host);
}
