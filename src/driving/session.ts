import {Simulation,FIXED_DT,type VehicleTelemetry} from '../simulation';
import {InputResolver,type DeviceReader} from './input';
export const PRACTICE_START={x:0,z:88,y:0.025,yaw:0} as const;
/** Both requestAnimationFrame and the isolated clock harness enter here. No alternate tire or input path. */
export class DrivingSession {
 readonly input=new InputResolver();current:VehicleTelemetry;previous:VehicleTelemetry;accumulator=0;ticks=0;private lastNow:number|undefined;
 constructor(readonly simulation:Simulation,public reader:DeviceReader){this.current=this.previous=simulation.telemetry()}
 sync(){this.current=this.previous=this.simulation.telemetry();this.accumulator=0}
 reset(){this.simulation.reset(PRACTICE_START);this.input.reset();this.sync()}
 frame(now:number){
  const dt=this.lastNow===undefined?0:Math.max(0,Math.min(.1,(now-this.lastNow)/1000));this.lastNow=now;
  const state=this.input.poll(now,this.reader());if(state.reset)this.reset();
  if(state.paused||state.reset)this.accumulator=0;
  else{this.accumulator+=dt;while(this.accumulator+1e-10>=FIXED_DT){this.previous=this.current;this.simulation.step(state.control,FIXED_DT);this.current=this.simulation.telemetry();this.ticks++;this.accumulator-=FIXED_DT}}
  return {...state,dt,ticks:this.ticks,current:this.current,previous:this.previous,alpha:Math.max(0,Math.min(1,this.accumulator/FIXED_DT))};
 }
}
