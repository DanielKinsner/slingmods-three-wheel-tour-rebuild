import {ridgePoint} from './route';
import type {GraphicsQuality} from '../presentation/graphics-settings';
export interface ForestPlacement {x:number;y:number;z:number;yaw:number;scale:number;variant:number}
export const FOREST_BUDGET={low:{near:0,mid:60,far:140,end:460,cover:38,shafts:false},medium:{near:28,mid:85,far:180,end:560,cover:65,shafts:false},high:{near:42,mid:110,far:230,end:680,cover:90,shafts:true},ultra:{near:55,mid:130,far:260,end:740,cover:110,shafts:true}} as const;
export function forestLOD(distance:number,quality:GraphicsQuality){const b=FOREST_BUDGET[quality];return distance<b.near?0:distance<b.mid?1:distance<b.far?2:distance<b.end?3:-1}
/** Deterministic foliage behind the runoff; overlooks, paddock and road stay clear. */
export function forestFloorPlan(){
 const cover:ForestPlacement[]=[],rocks:ForestPlacement[]=[],air:ForestPlacement[]=[];let seed=2917;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 for(let s=180;s<3090;s+=6)for(const side of[-1,1]){
  if(side<0&&s>1440&&s<2140)continue;
  for(let row=0;row<3;row++){const p=ridgePoint(s+random()*5,side*(10.5+row*3.8+random()*2.2));cover.push({...p,yaw:random()*Math.PI*2,scale:.55+random()*.65,variant:random()<.55?0:random()<.6?1:2})}
  if(Math.floor(s/6)%9===0){const p=ridgePoint(s+2,side*(13+random()*7));rocks.push({...p,y:p.y-.12,yaw:random()*6.28,scale:.18+random()*.28,variant:Math.floor(random()*2)})}
 }
 for(let s=260;s<1360;s+=140){const p=ridgePoint(s,-13);air.push({...p,y:p.y+6,yaw:0,scale:1,variant:1})}
 for(const s of[330,790,1170,2820]){const p=ridgePoint(s,0);air.push({...p,y:p.y+.7,yaw:0,scale:1,variant:0})}
 return{cover,rocks,air};
}
