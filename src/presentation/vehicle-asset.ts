import {vehicleContext,type VehicleVisual} from './vehicle-context';
/** The current development car is shared by bay, pad and Harbor. Historical files remain on disk. */
export const LEGACY_VEHICLE_URL='/assets/hoop-refinement/slingshot-hoops-refined.glb';
export const JOSH_VEHICLE_URL='/assets/model01/slingshot-josh-adapted.glb';
export const MODEL_2026_URL='/assets/model02/slingshot-2026.glb';
// Visual-only comparison follows navigation in this tab; no career/save schema change.
function selectedVisual(){
 if(typeof location==='undefined')return '2026';
 const requested=new URLSearchParams(location.search).get('visual');
 const valid=(v:string|null)=>v==='josh'||v==='legacy'||v==='2026';
 try{if(valid(requested))sessionStorage.setItem('slingmods-visual',requested!);const saved=sessionStorage.getItem('slingmods-visual');return valid(saved)?saved!:'2026'}catch{return valid(requested)?requested!:'2026'}
}
export const VEHICLE_VISUAL=selectedVisual() as VehicleVisual;
export const CURRENT_VEHICLE_CONTEXT=vehicleContext(VEHICLE_VISUAL);
export const CURRENT_VEHICLE=VEHICLE_VISUAL==='2026'?'slingshot-2026.glb':VEHICLE_VISUAL==='josh'?'slingshot-josh-adapted.glb':'slingshot-hoops-refined.glb';
export const CURRENT_REAR_RIG=VEHICLE_VISUAL==='2026'?'/assets/model02/rear-rig.json':'/assets/vehicles/slingshot-p04a1-rear-rig.json';
export const CURRENT_DRIVER_ATTACHMENT=VEHICLE_VISUAL==='2026'?'/assets/model02/driver-attachment.json':'/assets/drivers/test-driver-attachment.json';
export const CURRENT_PRODUCTS_URL=VEHICLE_VISUAL==='2026'?'/assets/model02/2026-mounted-products.glb':VEHICLE_VISUAL==='josh'?'/assets/model01/josh-mounted-products.glb':'/assets/p08b/signature-products.glb';
export const VEHICLE_MODEL_LABEL=CURRENT_VEHICLE_CONTEXT.label;

/** The underglow kit is CONFORMED to one car's underside, so each vehicle needs its own fit (scripts/product_sm133_fit_2026.py). */
export const CURRENT_UNDERGLOW=VEHICLE_VISUAL==='2026'?{glb:'/assets/model02/tricled-sm133-2026.glb',attachment:'/assets/model02/tricled-sm133-2026.attachment.json'}:{glb:'/assets/products/tricled-sm133-base.glb',attachment:'/assets/products/tricled-sm133-base.attachment.json'};
export const CURRENT_VEHICLE_URL=VEHICLE_VISUAL==='2026'?MODEL_2026_URL:VEHICLE_VISUAL==='josh'?JOSH_VEHICLE_URL:LEGACY_VEHICLE_URL;
