import {sampleRoad,type CourseRoute} from '../course/environment';
/**
 * SlingMods Points (Phase 4): floating brand tokens along each route, on the racing line and on the risky lines.
 * Pure placement + scoring (no DOM / three.js) so it runs in tests; game/points-run.ts draws and collects them.
 *  - 10 on the racing line, 25 out by the wall on straights, 50 on the inside edge of tight corners, 100 at the three
 *    tightest apexes.
 *  - Chain: another token within 2 s multiplies (x2 ... x5); contact or leaving the tarmac drops the chain.
 * Arcade races only (Quick Race, series). Points keep their own per-route bests; they are not career credits, so the
 * career save and its certified rewards stay untouched.
 */
export interface Token {id:number;x:number;y:number;z:number;value:10|25|50|100;station:number}
export const POINTS={spacing:55,firstStation:90,lastGap:60,chainWindow:2,chainMax:5,radius:1.9,height:1.05} as const;
function curvatureAt(route:CourseRoute,d:number){const a=sampleRoad(route,d-20),b=sampleRoad(route,d+20);return Math.atan2(a.dx*b.dz-a.dz*b.dx,a.dx*b.dx+a.dz*b.dz)}
/** Deterministic token layout for a route. */
export function placeTokens(route:CourseRoute):Token[]{
 const half=route.width/2,out:Token[]=[],stations:number[]=[];for(let d=POINTS.firstStation;d<route.length-POINTS.lastGap;d+=POINTS.spacing)stations.push(d);
 // "Tight" is relative to the route: its sharpest fifth of bends (and never a near-straight); the three sharpest get a 100.
 const bends=stations.map(d=>Math.abs(curvatureAt(route,d))),cut=Math.max(.12,[...bends].sort((a,b)=>b-a)[Math.floor(bends.length*.2)]??1),apexes=new Set([...stations.keys()].filter(i=>bends[i]>=cut).sort((a,b)=>bends[b]-bends[a]).slice(0,3));
 stations.forEach((d,i)=>{
  const turn=curvatureAt(route,d),tight=Math.abs(turn)>=cut,p=sampleRoad(route,d),inside=Math.sign(turn)||1;
  // Lateral offset is to the left of travel (+) / right (-); the inside of a left-hand bend is +.
  let lateral=Math.sin(i*1.7)*.8,value:Token['value']=10;
  if(apexes.has(i)){value=100;lateral=inside*(half-1.1)}
  else if(tight&&i%2===0){value=50;lateral=inside*(half-1.2)}
  else if(!tight&&i%4===3){value=25;lateral=(i%8===3?1:-1)*(half-1.6)}
  const x=p.x+-p.dz*lateral,z=p.z+p.dx*lateral,y=(p.y??route.start.y)+POINTS.height;
  out.push({id:i,x,y,z,value,station:d});
 });
 return out;
}
export type PointsEvent={kind:'collect';token:Token;points:number;chain:number}|{kind:'drop';chain:number};
export class PointsScore {
 total=0;chain=1;best=0;collected=new Set<number>();private lastAt=-Infinity;private time=0;count=0;
 constructor(readonly tokens:readonly Token[]){}
 /** A lap passed: every token is back. */
 respawn(){this.collected.clear()}
 update(x:number,y:number,z:number,dt:number,onTarmac:boolean,impact:boolean):PointsEvent[]{
  this.time+=dt;const events:PointsEvent[]=[];
  if((impact||!onTarmac)&&this.chain>1){events.push({kind:'drop',chain:this.chain});this.chain=1}
  for(const t of this.tokens){if(this.collected.has(t.id))continue;if(Math.hypot(t.x-x,t.z-z)>POINTS.radius||Math.abs(t.y-POINTS.height-y)>2.5)continue;
   this.collected.add(t.id);this.chain=this.time-this.lastAt<=POINTS.chainWindow?Math.min(POINTS.chainMax,this.chain+1):1;this.lastAt=this.time;
   const points=t.value*this.chain;this.total+=points;this.count++;this.best=Math.max(this.best,this.chain);events.push({kind:'collect',token:t,points,chain:this.chain})}
  if(this.chain>1&&this.time-this.lastAt>POINTS.chainWindow)this.chain=1;
  return events;
 }
 remaining(){return this.tokens.filter(t=>!this.collected.has(t.id))}
}
const KEY='slingmods-gx-points-v1';
export interface PointsRecord {best:number;lifetime:number}
export function pointsRecords():Record<string,PointsRecord>{try{const v=JSON.parse(localStorage.getItem(KEY)??'{}');return v&&typeof v==='object'?v:{}}catch{return {}}}
/** Adds a finished race's points to the route's record; returns whether it was a new best. */
export function recordPoints(route:string,total:number){const all=pointsRecords(),r=all[route]??{best:0,lifetime:0},improved=total>r.best;all[route]={best:Math.max(r.best,Math.round(total)),lifetime:r.lifetime+Math.round(total)};try{localStorage.setItem(KEY,JSON.stringify(all))}catch{}return improved}
