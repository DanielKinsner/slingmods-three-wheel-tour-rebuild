import {RivalController} from '../src/competition/rival';
import type {CourseRoute} from '../src/course/environment';
import type {VehicleTelemetry} from '../src/simulation';
import {toDevice} from './p08b-driving-evidence-agent';
export {toDevice};
/** Qualifying first-finisher fixture takes an inner line without traffic speed planning. Actual collisions, rivals, power and race gates remain authoritative. Isolated evidence-only planner. Its only output is pedals/steering; production rivals and bodies are untouched. */
export class FinishFirstDriver {
 private controller:RivalController;
 readonly plan=(globalThis as any).FINISH_PLAN??{pace:56,lateral:6.3,braking:4.4,headway:.75,line:-2.7,initialLane:1.8,ignoreTraffic:true};
 constructor(route:CourseRoute){
  this.controller=new RivalController(route,'player',11,'slingmods-sport-v3');
  // TS-private planning fields belong to this test-only controller instance, never the game's rival controllers.
  const planner=this.controller as unknown as {trait:{pace:number;lateral:number;braking:number;headway:number;line:number};preference:number;targetLane:number;lane:number};
  planner.trait={pace:this.plan.pace,lateral:this.plan.lateral,braking:this.plan.braking,headway:this.plan.headway,line:this.plan.line};planner.preference=this.plan.line;planner.targetLane=this.plan.initialLane;planner.lane=this.plan.initialLane;
 }
 sample(t:VehicleTelemetry,field:Record<string,VehicleTelemetry>,dt=1/60){return toDevice(this.controller.control(t,this.plan.ignoreTraffic?{}:field,dt))}
 inspect(){return {method:'Evidence-only control planner; no production trait/physics/pose changes',plan:this.plan,controller:this.controller.inspect()}}
}
