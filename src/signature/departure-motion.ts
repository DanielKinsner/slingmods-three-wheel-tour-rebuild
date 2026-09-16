const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const t=clamp(v);return t*t*(3-2*t)};
export const DEPARTURE_SECONDS=5.8;
/** Presentation path only: never updates physics, race telemetry or a build recipe. */
export function departurePose(seconds:number){
 const t=ease((seconds-2.3)/3.5),u=1-t;
 const x=9*u*t*t+7.8*t*t*t,z=-4.5*u*u*t+1.2*u*t*t+.4*t*t*t;
 const dx=18*t-3.6*t*t,dz=-4.5+20.4*t-15.9*t*t;
 return {door:ease(seconds/3.3),x,z,yaw:-Math.atan2(dx,-dz),travel:t,camera:ease(seconds/3.8),complete:seconds>=DEPARTURE_SECONDS};
}
