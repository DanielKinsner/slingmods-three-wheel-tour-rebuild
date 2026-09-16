/** Versioned game tuning; values are author estimates, never OEM/product specifications. */
export type HandlingProfileId='legacy-p08a'|'slingmods-sport-v1'|'slingmods-sport-v2'|'slingmods-sport-v3';
export const CURRENT_HANDLING_PROFILE='slingmods-sport-v3' as const;
export const HANDLING_PROFILES={
 'legacy-p08a':{id:'legacy-p08a',name:'Legacy P08A',torqueScale:1,shiftSeconds:.24,steerLock:.53,steerFalloff:.037,lateralSteerLimit:5.4,steerRate:1.7,asphaltGripScale:1,tireStiffness:7,brakeScale:1,brakeSteerRelief:0,damperFront:3800,damperRear:6500},
 'slingmods-sport-v1':{id:'slingmods-sport-v1',name:'SlingMods Sport',torqueScale:1.30,shiftSeconds:.18,steerLock:.60,steerFalloff:.021,lateralSteerLimit:8.2,steerRate:2.7,asphaltGripScale:1.15,tireStiffness:8,brakeScale:.7,brakeSteerRelief:.35,damperFront:3800,damperRear:6500},
 // V2 retains v1 power/steering/grip; brake demand=1g, load allocation in Simulation,
 // 15% brake steering relief; flat-floor support belongs to tires/chassis, not guards.
 'slingmods-sport-v2':{id:'slingmods-sport-v2',name:'SlingMods Sport v2',torqueScale:1.30,shiftSeconds:.18,steerLock:.60,steerFalloff:.021,lateralSteerLimit:8.2,steerRate:2.7,asphaltGripScale:1.15,tireStiffness:8,brakeScale:1,brakeSteerRelief:.15,damperFront:3800,damperRear:6500},
 'slingmods-sport-v3':{id:'slingmods-sport-v3',name:'SlingMods Sport v3',torqueScale:1.30,shiftSeconds:.18,steerLock:.60,steerFalloff:.021,lateralSteerLimit:8.2,steerRate:2.7,asphaltGripScale:1.15,tireStiffness:8,brakeScale:1,brakeSteerRelief:0,damperFront:3800,damperRear:6500},
} as const;
export function handlingProfile(id:HandlingProfileId='legacy-p08a'){const p=HANDLING_PROFILES[id];if(!p)throw Error('Unknown handling profile: '+id);return p}
export function steeringLimit(speed:number,id:HandlingProfileId='legacy-p08a',wheelbase=2.667){const p=handlingProfile(id);const geometric=Math.atan(p.lateralSteerLimit*wheelbase/Math.max(speed*speed,1));
 // V3 permits finite tire-slip steering reserve instead of treating a no-slip
 // bicycle angle as the tire's maximum command. This is an input envelope, not
 // added grip: existing three-tire combined-force saturation remains unchanged.
 const reserve=id==='slingmods-sport-v3'?.025*speed*speed/(speed*speed+100)/(1+speed*speed/500):0;
 return Math.min(p.steerLock/(1+Math.abs(speed)*p.steerFalloff),geometric+reserve)}
export function steeringRequest(demand:number,speed:number,id:HandlingProfileId='legacy-p08a',brake=0,wheelbase=2.667){const p=handlingProfile(id),d=Math.max(-1,Math.min(1,Number.isFinite(demand)?demand:0));return d*steeringLimit(speed,id,wheelbase)*(id==='legacy-p08a'?1:1-p.brakeSteerRelief*Math.max(0,Math.min(1,brake)))}
/** Inverse request mapping shared by physical rival/recovery controllers. */
export function steeringDemandForAngle(angle:number,speed:number,id:HandlingProfileId='legacy-p08a',brake=0,wheelbase=2.667){return Math.max(-1,Math.min(1,angle/steeringRequest(1,speed,id,brake,wheelbase)))}
