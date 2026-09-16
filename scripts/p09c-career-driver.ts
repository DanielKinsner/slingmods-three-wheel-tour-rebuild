import {RivalController} from '../src/competition/rival';
import type {CourseRoute} from '../src/course/environment';
import type {VehicleTelemetry} from '../src/simulation';
export {toDevice} from './p08b-driving-evidence-agent';
import {toDevice} from './p08b-driving-evidence-agent';
/** Test-only pedal/steering generator. No pose changes, checkpoint changes or synthetic race results. */
export class EvidenceDriver {private controller:RivalController;constructor(route:CourseRoute,seed=11){this.controller=new RivalController(route,'player',seed,'slingmods-sport-v3')}sample(t:VehicleTelemetry,field:Record<string,VehicleTelemetry>,dt=1/60){return toDevice(this.controller.control(t,field,dt))}inspect(){return this.controller.inspect()}}
