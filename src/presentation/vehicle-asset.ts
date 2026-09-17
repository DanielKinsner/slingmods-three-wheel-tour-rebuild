/** The current development car is shared by bay, pad and Harbor. Historical files remain on disk. */
export const LEGACY_VEHICLE_URL='/assets/hoop-refinement/slingshot-hoops-refined.glb';
export const JOSH_VEHICLE_URL='/assets/model01/slingshot-josh-adapted.glb';
// Visual-only comparison follows navigation in this tab; no career/save schema change.
function selectedVisual(){
 if(typeof location==='undefined')return 'legacy';
 const requested=new URLSearchParams(location.search).get('visual');
 try{if(requested==='josh'||requested==='legacy')sessionStorage.setItem('slingmods-visual',requested);return sessionStorage.getItem('slingmods-visual')==='josh'?'josh':'legacy'}catch{return requested==='josh'?'josh':'legacy'}
}
export const VEHICLE_VISUAL=selectedVisual();
export const CURRENT_VEHICLE=VEHICLE_VISUAL==='josh'?'slingshot-josh-adapted.glb':'slingshot-hoops-refined.glb';
export const CURRENT_REAR_RIG='/assets/vehicles/slingshot-p04a1-rear-rig.json';

export const CURRENT_VEHICLE_URL=VEHICLE_VISUAL==='josh'?JOSH_VEHICLE_URL:LEGACY_VEHICLE_URL;
