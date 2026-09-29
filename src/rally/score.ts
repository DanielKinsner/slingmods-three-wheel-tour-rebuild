import type {VehicleTelemetry} from '../simulation';
import type {CrewRace} from '../competition/race';
import {RaceRoad} from '../competition/road';
import {RALLY_ROUTE} from './route';

export const RALLY_RECORD_KEY='slingmods-redstone-rally-v1';
export interface RallyRecord {timeMs:number;drift:number;runs:number;at:string}
export function readRallyRecord(build:string,storage:Pick<Storage,'getItem'>=localStorage):RallyRecord|null {
  try {const r=JSON.parse(storage.getItem(RALLY_RECORD_KEY)??'{}')[build];return r&&Number.isFinite(r.timeMs)&&r.timeMs>0&&Number.isFinite(r.drift)&&r.drift>=0?r:null;}catch{return null;}
}
export function saveRallyRecord(build:string,timeMs:number,drift:number,storage:Pick<Storage,'getItem'|'setItem'>=localStorage){
  if(!Number.isFinite(timeMs)||timeMs<=0||!Number.isFinite(drift)||drift<0)return false;
  try {let all=JSON.parse(storage.getItem(RALLY_RECORD_KEY)??'{}');if(!all||typeof all!=='object'||Array.isArray(all))all={};const old=readRallyRecord(build,storage);all[build]={timeMs:Math.min(old?.timeMs??Infinity,timeMs),drift:Math.max(old?.drift??0,Math.round(drift)),runs:(old?.runs??0)+1,at:new Date().toISOString()};storage.setItem(RALLY_RECORD_KEY,JSON.stringify(all));return true;}catch{return false;}
}
/** Fixed-tick scorer. Only forward, new course distance scores: donuts and repeated bends cannot farm records. */
export class RallyScore {
  score=0;slideSeconds=0;chain=0;bestChain=0;active=false;private quiet=0;private farthest=0;private road=new RaceRoad(RALLY_ROUTE);private segment=0;
  reset(){this.score=0;this.slideSeconds=0;this.chain=0;this.bestChain=0;this.active=false;this.quiet=0;this.farthest=0;this.segment=0;}
  tick(t:VehicleTelemetry,race:ReturnType<CrewRace['snapshot']>,dt:number){
    this.active=false;if(race.phase!=='running'||race.paused||race.playerResult)return;
    const p=this.road.project(t.position.x,t.position.z,this.segment);this.segment=p.segment;
    const progress=race.standings.find(s=>s.id==='player')?.progress??0,advance=Math.max(0,Math.min(Math.abs(t.speed)*dt*1.5,progress-this.farthest));this.farthest=Math.max(this.farthest,progress);
    const w=t.wheels[2],angle=Math.abs(w?.slipAngle??0),forward=t.velocity.x*p.dx+t.velocity.z*p.dz;
    if(w?.contact&&p.distance<=RALLY_ROUTE.width/2&&forward>4&&Math.abs(t.speed)>6&&angle>.14&&angle<1.05&&advance>.01){
      this.active=true;this.quiet=0;this.slideSeconds+=dt;this.chain+=dt;this.bestChain=Math.max(this.bestChain,this.chain);this.score+=advance*Math.min(1,angle/.55)*12*(1+Math.min(2,this.chain/4));
    }else {this.quiet+=dt;if(this.quiet>1.2||p.distance>14||angle>1.05)this.chain=0;}
  }
}
