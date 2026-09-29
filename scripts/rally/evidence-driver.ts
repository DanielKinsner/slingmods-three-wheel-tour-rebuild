import {RivalController} from '../../src/competition/rival';
import type {CourseRoute} from '../../src/course/environment';
import type {VehicleTelemetry} from '../../src/simulation';
import {toDevice} from '../p08b-driving-evidence-agent';
export {toDevice};
/** Validation only: pedals and steering through the same input path as a controller. */
export class RallyDriver {
  private driver:RivalController;
  constructor(route:CourseRoute){this.driver=new RivalController(route,'player',11,'slingmods-sport-v5',.83);}
  sample(t:VehicleTelemetry,field:Record<string,VehicleTelemetry>){return toDevice(this.driver.control(t,field));}
}
