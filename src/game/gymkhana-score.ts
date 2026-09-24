/**
 * Gymkhana scoring (owner decision 2026-09-24): a 90 second score attack on the Harbor Express infield lot.
 *  - DRIFT: points while the rear slides (angle x speed), with a chain multiplier that grows while you keep sliding.
 *  - DONUT: a full slide-circle around a pole (within 11 m).
 *  - FIGURE 8: a donut around one pole, then the other in the opposite direction, within 8 s.
 *  - CONE: knocking a cone over costs points and breaks the chain.
 * Pure logic (no DOM, no three.js) so it runs headless in tests; the lot (game/gymkhana.ts) feeds it.
 */
export const GYM={seconds:90,poleRadius:11,donut:400,figure8:1500,cone:-150,chainStep:2,chainMax:5,figure8Window:8,slideSlip:.2,minSpeed:3} as const;
export const GYM_MEDALS={bronze:3000,silver:6500,gold:11000} as const;
export type GymEvent={kind:'donut'|'figure8'|'cone'|'chain'|'end';points:number;chain:number};
export interface GymSample {x:number;z:number;speed:number;rearSlip:number;inLot:boolean}
export class GymkhanaScore {
 score=0;chain=1;time=0;phase:'ready'|'running'|'done'='ready';driftPoints=0;donuts=0;figure8s=0;conesHit=0;
 private sliding=0;private quiet=0;private angle:number[];private prevAngle:(number|null)[];private lastDonut:{pole:number;dir:number;at:number}|null=null;
 constructor(private poles:readonly {x:number;z:number}[]){this.angle=poles.map(()=>0);this.prevAngle=poles.map(()=>null)}
 get remaining(){return Math.max(0,GYM.seconds-this.time)}
 /** Start the clock (first move out of the start box). */
 start(){if(this.phase==='ready')this.phase='running'}
 cone():GymEvent[]{if(this.phase!=='running')return [];this.conesHit++;this.score=Math.max(0,this.score+GYM.cone);this.chain=1;this.sliding=0;return [{kind:'cone',points:GYM.cone,chain:1}]}
 update(s:GymSample,dt:number):GymEvent[]{
  if(this.phase!=='running'||dt<=0)return [];
  const events:GymEvent[]=[];this.time+=dt;
  const slideDeg=Math.abs(s.rearSlip)*57.3,sliding=s.inLot&&s.speed>GYM.minSpeed&&Math.abs(s.rearSlip)>GYM.slideSlip;
  if(sliding){this.quiet=0;this.sliding+=dt;const next=Math.min(GYM.chainMax,1+Math.floor(this.sliding/GYM.chainStep));if(next>this.chain){this.chain=next;events.push({kind:'chain',points:0,chain:next})}
   const pts=slideDeg*s.speed*.25*dt*this.chain;this.score+=pts;this.driftPoints+=pts}
  else{this.quiet+=dt;if(this.quiet>.6){this.sliding=0;this.chain=1}}
  // Donuts: accumulate the angle swept around each pole while sliding close to it.
  this.poles.forEach((p,i)=>{const dx=s.x-p.x,dz=s.z-p.z,near=Math.hypot(dx,dz)<GYM.poleRadius;if(!near||!sliding){if(!near||this.quiet>1){this.angle[i]=0;this.prevAngle[i]=null}return}
   const a=Math.atan2(dz,dx),prev=this.prevAngle[i];this.prevAngle[i]=a;if(prev===null)return;let d=a-prev;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;this.angle[i]+=d;
   if(Math.abs(this.angle[i])>=2*Math.PI){const dir=Math.sign(this.angle[i]);this.angle[i]-=dir*2*Math.PI;this.donuts++;const donut=GYM.donut*this.chain;this.score+=donut;events.push({kind:'donut',points:donut,chain:this.chain});
    const l=this.lastDonut;if(l&&l.pole!==i&&l.dir!==dir&&this.time-l.at<=GYM.figure8Window){this.figure8s++;this.score+=GYM.figure8;events.push({kind:'figure8',points:GYM.figure8,chain:this.chain});this.lastDonut=null}else this.lastDonut={pole:i,dir,at:this.time}}});
  if(this.time>=GYM.seconds){this.phase='done';events.push({kind:'end',points:0,chain:this.chain})}
  return events;
 }
 medal(){return this.score>=GYM_MEDALS.gold?'gold':this.score>=GYM_MEDALS.silver?'silver':this.score>=GYM_MEDALS.bronze?'bronze':null}
 reset(){this.score=0;this.chain=1;this.time=0;this.phase='ready';this.driftPoints=0;this.donuts=0;this.figure8s=0;this.conesHit=0;this.sliding=0;this.quiet=0;this.angle=this.poles.map(()=>0);this.prevAngle=this.poles.map(()=>null);this.lastDonut=null}
}
