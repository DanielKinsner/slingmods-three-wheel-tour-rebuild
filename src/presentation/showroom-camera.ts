import * as THREE from 'three';
/**
 * Camera-safe interior of the shipped showroom (signature-showroom-refined.glb), shared by the free showroom and the
 * career garage. Measured by raycasting the loaded room's inner faces (see handoff/UX-REPAIR.md):
 * side walls x = ±5.91 m, back wall z = 6.78 m with cabinets from z = 6.11 m, floor y = 0, 4.2 m walls with NO ceiling
 * and a softbox panel at y = 3.825 m. The set is open toward -z, where the floor ends at z = -5 m; the long-standing
 * hero framing sits at z = -5.5 m looking into the room, so that face keeps its authored limit.
 * Every closed face keeps ≥0.3 m: the 0.06 m near plane reaches < 0.1 m from the eye even at the widest 60° lens.
 */
export const SHOWROOM_ROOM={sideWall:5.91,backWall:6.78,backFixtures:6.11,floorEdge:-5,floor:0,wallTop:4.2,softbox:3.825} as const;
export const SHOWROOM_CLEARANCE=.3;
export const SHOWROOM_SAFE_VOLUME:Readonly<THREE.Box3>=Object.freeze(new THREE.Box3(new THREE.Vector3(-5.6,.2,-5.5),new THREE.Vector3(5.6,3.5,5.8)));
/** Orbit limits for every named view. Close inspections may come nearer than the full-vehicle orbit, never farther than the room. */
export interface ShowroomPreset {position?:readonly [number,number,number];target?:readonly [number,number,number];direction?:readonly [number,number,number];minDistance:number;maxDistance:number}
export const SHOWROOM_PRESETS:Record<string,ShowroomPreset>={
 'route-relief':{position:[2.8,2.3,-2.7],target:[5.6,2.3,-2.7],minDistance:.6,maxDistance:10},
 'ryker-body':{position:[1.65,1.05,-2.4],target:[0,.42,-.78],minDistance:.6,maxDistance:10},
 'ryker-shocks':{position:[-1.15,.72,-1.8],target:[-.25,.31,-.85],minDistance:.5,maxDistance:10},
 'ryker-exhaust':{position:[1.25,.55,1.7],target:[.16,.25,.34],minDistance:.5,maxDistance:10},
 'ryker-underglow':{position:[1.7,.8,-2.1],target:[0,.47,-.72],minDistance:.6,maxDistance:10},
 hero:{direction:[-5,1.65,-6],minDistance:3,maxDistance:10},
 front:{direction:[0,1.8,-7],minDistance:3,maxDistance:10},
 rear:{direction:[4,2.2,6],minDistance:3,maxDistance:10},
 side:{direction:[7,1.8,0],minDistance:3,maxDistance:10},
 interior:{minDistance:.45,maxDistance:10},
 // Career workshop: the retired bay's front-right 3/4, framed into the canvas beside the open workshop panel.
 workshop:{direction:[4,2.3,-5],minDistance:3,maxDistance:10},
 // Test/evidence hook: exact authored cameras, still inside the room.
 reference:{minDistance:.1,maxDistance:10},
 'tour-wall':{position:[5.4,2.25,-1.4],minDistance:3,maxDistance:10},
 // Underglow: low passenger-side view along the lit sill strip (strips run at x = ±0.61 m, 0.17 m above the floor).
 'SM-133':{position:[3.1,.45,-2.2],target:[.35,.18,.15],minDistance:1,maxDistance:10},
 // Storage close-up is authored at 2.26 m; the full-vehicle 3 m minimum used to push it 33% farther away.
 'SM-28919':{position:[-1.4,1.8,-.35],target:[-.22,.43,1],minDistance:1.2,maxDistance:10},
 'SM-3223':{position:[3,1.3,-3.6],target:[.5,.55,-1.25],minDistance:1.2,maxDistance:10},
 'SM-3223-rear':{position:[1.3,.9,2.5],target:[.28,.58,1.08],minDistance:.8,maxDistance:10},
 'SM-3223-front':{position:[-1.5,.8,-2.7],target:[-.62,.43,-1.32],minDistance:.8,maxDistance:10},
 'SM-7720':{position:[3,1.25,5],target:[0,.45,1.5],minDistance:1.5,maxDistance:10},
 'SM-26801':{position:[4,2.5,5],target:[0,1.2,.7],minDistance:1.5,maxDistance:10},
};
export const presetLimits=(name:string)=>SHOWROOM_PRESETS[name]??SHOWROOM_PRESETS.hero;
/** Distance along a unit ray from an inside origin to the volume boundary (slab method). */
export function exitDistance(origin:THREE.Vector3,direction:THREE.Vector3,volume:Readonly<THREE.Box3>=SHOWROOM_SAFE_VOLUME){
 let t=Infinity;for(const axis of ['x','y','z'] as const){const d=direction[axis];if(d>1e-9)t=Math.min(t,(volume.max[axis]-origin[axis])/d);else if(d<-1e-9)t=Math.min(t,(volume.min[axis]-origin[axis])/d)}return Math.max(0,t);
}
const offset=new THREE.Vector3(),unit=new THREE.Vector3();
/** Keeps the orbit target inside, then pulls the eye toward it along its own view ray. The view direction never changes. */
export function containCamera(camera:THREE.Camera,target:THREE.Vector3,volume:Readonly<THREE.Box3>=SHOWROOM_SAFE_VOLUME){
 let moved=false;if(!volume.containsPoint(target)){volume.clampPoint(target,target);moved=true}
 offset.subVectors(camera.position,target);const length=offset.length();if(length<1e-6)return moved;
 const limit=exitDistance(target,unit.copy(offset).divideScalar(length),volume);
 if(length>limit+1e-6){camera.position.copy(target).addScaledVector(unit,limit);moved=true}return moved;
}
/** Before OrbitControls.update(): zoom and orbit can never ask for a radius the room cannot hold, so fit and clamp never fight. */
export function limitOrbit(controls:{object:THREE.Camera;target:THREE.Vector3;minDistance:number;maxDistance:number},preset:ShowroomPreset,volume:Readonly<THREE.Box3>=SHOWROOM_SAFE_VOLUME){
 offset.subVectors(controls.object.position,controls.target);const length=offset.length();
 const room=length>1e-6?exitDistance(controls.target,unit.copy(offset).divideScalar(length),volume):preset.maxDistance;
 controls.maxDistance=Math.max(.05,Math.min(preset.maxDistance,room));controls.minDistance=Math.min(preset.minDistance,controls.maxDistance);
}
/** Everything a player's view consists of: eye, orbit target, lens, safe-region offset and whether it was a named view. */
export interface CameraSnapshot {position:THREE.Vector3;target:THREE.Vector3;fov:number;view:string;manual:boolean;offset:{fullWidth:number;fullHeight:number;offsetX:number;offsetY:number;width:number;height:number}|null}
export function snapshotCamera(camera:THREE.PerspectiveCamera,target:THREE.Vector3,view:string,manual:boolean):CameraSnapshot{const v=camera.view;return {position:camera.position.clone(),target:target.clone(),fov:camera.fov,view,manual,offset:v?.enabled?{fullWidth:v.fullWidth,fullHeight:v.fullHeight,offsetX:v.offsetX,offsetY:v.offsetY,width:v.width,height:v.height}:null}}
