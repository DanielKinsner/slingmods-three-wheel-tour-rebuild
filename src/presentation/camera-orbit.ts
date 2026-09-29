import * as THREE from 'three';
/**
 * Showroom camera moves (feel pass). A straight line between two views around a car cuts through it (front <-> rear
 * passed ~1.5 m from the centre at hoop height) and zooms in and back out; every move also took a fixed 800 ms and the
 * lens snapped. Here the camera swings around the aim point instead: angle, height and distance ease separately, the
 * path lifts a little over long swings and on the way into the cockpit, the lens eases with it, and the time scales
 * with how far the camera travels.
 */
export interface OrbitMove {fromTarget:THREE.Vector3;toTarget:THREE.Vector3;fromFov:number;toFov:number;start:number;duration:number;
 radius:[number,number];azimuth:[number,number];elevation:[number,number];lift:number}
const ease=(u:number)=>u<.5?4*u*u*u:1-(-2*u+2)**3/2;
const TAU=Math.PI*2;
function spherical(offset:THREE.Vector3){const r=Math.max(1e-4,offset.length());return{r,azimuth:Math.atan2(offset.x,offset.z),elevation:Math.asin(THREE.MathUtils.clamp(offset.y/r,-1,1))}}
export function orbitMove(from:THREE.Vector3,to:THREE.Vector3,fromTarget:THREE.Vector3,toTarget:THREE.Vector3,fromFov:number,toFov:number,start:number,duration?:number):OrbitMove{
 const a=spherical(from.clone().sub(fromTarget)),b=spherical(to.clone().sub(toTarget));
 let turn=b.azimuth-a.azimuth;turn-=Math.round(turn/TAU)*TAU;   // shortest way round
 const closing=Math.max(0,a.r-b.r)/Math.max(a.r,1);   // diving in towards the cockpit
 const lift=Math.min(.3,.08*Math.abs(turn)+.3*closing);
 const time=duration??THREE.MathUtils.clamp(420+300*Math.abs(turn)+90*Math.abs(a.r-b.r),450,1150);
 return{fromTarget:fromTarget.clone(),toTarget:toTarget.clone(),fromFov,toFov,start,duration:time,radius:[a.r,b.r],azimuth:[a.azimuth,a.azimuth+turn],elevation:[a.elevation,b.elevation],lift};
}
/** Writes the camera position and aim point for `now`; returns the lens and whether the move has finished. */
export function sampleOrbit(m:OrbitMove,now:number,position:THREE.Vector3,target:THREE.Vector3){
 const t=THREE.MathUtils.clamp((now-m.start)/m.duration,0,1),u=ease(t),lerp=THREE.MathUtils.lerp;
 target.lerpVectors(m.fromTarget,m.toTarget,u);
 const r=lerp(m.radius[0],m.radius[1],u),azimuth=lerp(m.azimuth[0],m.azimuth[1],u),elevation=THREE.MathUtils.clamp(lerp(m.elevation[0],m.elevation[1],u)+m.lift*Math.sin(Math.PI*u),-1.45,1.45);
 position.set(Math.sin(azimuth)*Math.cos(elevation),Math.sin(elevation),Math.cos(azimuth)*Math.cos(elevation)).multiplyScalar(r).add(target);
 return{fov:lerp(m.fromFov,m.toFov,u),done:t>=1};
}
