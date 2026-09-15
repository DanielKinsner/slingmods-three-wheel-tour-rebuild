import type {HandlingProfileId} from '../simulation/profile';
import {Simulation,FIXED_DT,type VehicleControl,type VehicleTelemetry} from '../simulation';
import {InputResolver,type DeviceReader} from './input';
export const PRACTICE_START={x:0,z:88,y:0.025,yaw:0} as const;
export interface DrivingSessionHooks {profileId?:HandlingProfileId;canReset?:()=>boolean;resetPose?:{x:number;z:number;y:number;yaw:number};beforeTick?:(control:VehicleControl,current:VehicleTelemetry)=>VehicleControl;afterTick?:(previous:VehicleTelemetry,current:VehicleTelemetry,dt:number)=>void;onReset?:()=>void;onPause?:(paused:boolean)=>void}
/** Both requestAnimationFrame and the isolated clock harness enter here. No alternate tire or input path. */
export class DrivingSession {
 readonly input:InputResolver;current:VehicleTelemetry;previous:VehicleTelemetry;accumulator=0;ticks=0;private lastNow:number|undefined;
 constructor(readonly simulation:Pick<Simulation,'reset'|'step'|'telemetry'>,public reader:DeviceReader,readonly hooks:DrivingSessionHooks={}){this.input=new InputResolver(hooks.profileId??'legacy-p08a');this.current=this.previous=simulation.telemetry()}
 sync(){this.current=this.previous=this.simulation.telemetry();this.accumulator=0}
 reset(){if(this.hooks.canReset?.()===false)return;this.hooks.onReset?.();this.simulation.reset(this.hooks.resetPose??PRACTICE_START);this.input.reset();this.sync()}
 frame(now:number){
  const dt=this.lastNow===undefined?0:Math.max(0,Math.min(.1,(now-this.lastNow)/1000));this.lastNow=now;
  const state=this.input.poll(now,this.reader(),this.current.speed);if(state.reset)this.reset();this.hooks.onPause?.(state.paused);
  if(state.paused||state.reset)this.accumulator=0;
  else{this.accumulator+=dt;while(this.accumulator+1e-10>=FIXED_DT){this.previous=this.current;this.simulation.step(this.hooks.beforeTick?.(state.control,this.current)??state.control,FIXED_DT);this.current=this.simulation.telemetry();this.hooks.afterTick?.(this.previous,this.current,FIXED_DT);this.ticks++;this.accumulator-=FIXED_DT}}
  return {...state,dt,ticks:this.ticks,current:this.current,previous:this.previous,alpha:Math.max(0,Math.min(1,this.accumulator/FIXED_DT))};
 }
}
