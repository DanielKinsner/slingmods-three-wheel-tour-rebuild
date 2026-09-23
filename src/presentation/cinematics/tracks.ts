/** Authored in vehicle space: X right, Y up, -Z forward. Seconds, metres, degrees.
 * Each edit is a deliberate cut; camera translation continues through each shot.
 * The simulation is never retimed or replayed by these tracks. */
export type Film = 'arrival' | 'grid' | 'victory';
export type V3 = readonly [number, number, number];
export interface Shot {
  name: string; duration: number; from: V3; to: V3;
  aim: V3; aimEnd?: V3; lens: number; lensEnd?: number;
  aperture: number; orbit?:boolean; title?: boolean;
}
export const FILMS: Record<Film, readonly Shot[]> = {
  arrival: [
    {name:'The approach',duration:3.4,from:[-9,14,-19],to:[-6,8,-13],aim:[0,0,-6],aimEnd:[0,.4,-2],lens:44,lensEnd:48,aperture:0},
    {name:'Asphalt level',duration:2.3,from:[-2.8,.28,-5],to:[-1.65,.36,-3.2],aim:[-.6,.42,-.9],lens:52,aperture:.65},
    {name:'The signature',duration:3.8,from:[-4.8,1.9,-6.9],to:[-3.6,1.05,-6.1],aim:[1.65,.55,0],lens:42,lensEnd:46,aperture:.24,title:true},
  ],
  grid: [
    {name:'Contact patch',duration:1.65,from:[-2.4,.32,-2],to:[-1.7,.38,-2.6],aim:[-.9,.36,-1],lens:62,aperture:.85},
    {name:'The machine',duration:1.7,from:[-2.7,.9,.8],to:[-2.6,.95,-1.1],aim:[0,.55,-.25],lens:48,aperture:.6},
    {name:'One way forward',duration:2.4,from:[-3.9,1.1,-6.2],to:[-3.15,.85,-5.8],aim:[1.55,.55,-.1],lens:43,lensEnd:46,aperture:.28,title:true},
    {name:'Take the wheel',duration:1.25,from:[0,4.8,7.8],to:[0,3.1,6.4],aim:[0,.5,-1.5],lens:50,lensEnd:55,aperture:0},
  ],
  victory: [
    {name:'Across the line',duration:1.8,from:[-4.5,.45,-4.2],to:[-3.6,.6,-3.8],aim:[0,.48,-.4],lens:43,aperture:.35},
    {name:'Earned, never given',duration:2.2,from:[-4.8,1.25,3.2],to:[-4.4,1.6,-4.2],aim:[0,.7,0],lens:42,lensEnd:46,aperture:.4,orbit:true},
    {name:'The victory portrait',duration:4.3,from:[-4.5,1.65,-7.2],to:[-3.8,1.05,-6.7],aim:[1.9,.65,0],lens:43,lensEnd:46,aperture:.25,title:true},
  ],
};
export const filmDuration = (film: Film) => FILMS[film].reduce((n,s)=>n+s.duration,0);
export const clamp01 = (n:number) => Math.max(0,Math.min(1,n));
export const smooth = (n:number) => {const t=clamp01(n);return t*t*(3-2*t)};
export function sampleFilm(film: Film, elapsed: number) {
  const shots=FILMS[film];let start=0,index=0;
  for(;index<shots.length-1;index++){if(elapsed<start+shots[index].duration)break;start+=shots[index].duration}
  const shot=shots[index],u=clamp01((elapsed-start)/shot.duration);
  // Continuous travel, with a small acceleration/deceleration at the ends of a take.
  const t=u*.72+smooth(u)*.28;
  const mix=(a:V3,b:V3):[number,number,number]=>a.map((v,i)=>v+(b[i]-v)*t) as [number,number,number];
  const position=mix(shot.from,shot.to);
  if(shot.orbit){const a=Math.atan2(shot.from[0],shot.from[2]),b=Math.atan2(shot.to[0],shot.to[2]);let delta=b-a;while(delta>Math.PI)delta-=Math.PI*2;while(delta<-Math.PI)delta+=Math.PI*2;const radius=Math.hypot(shot.from[0],shot.from[2])*(1-t)+Math.hypot(shot.to[0],shot.to[2])*t;position[0]=Math.sin(a+delta*t)*radius;position[2]=Math.cos(a+delta*t)*radius}
  return {shot,index,local:elapsed-start,u,position,aim:mix(shot.aim,shot.aimEnd??shot.aim),fov:shot.lens+((shot.lensEnd??shot.lens)-shot.lens)*t,done:elapsed>=filmDuration(film)};
}

/** Exactly once per valid attempt; no fabricated winners for retired/invalid runs. */
export class FinishFilmGate {
  private seen=new Set<string>();
  accept(result:{attemptId:string;valid:boolean;place:number|null}|null|undefined,paused:boolean){
    if(paused||!result?.valid||!result.attemptId||this.seen.has(result.attemptId))return false;
    this.seen.add(result.attemptId);return true;
  }
}
