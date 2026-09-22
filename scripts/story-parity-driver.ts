import {RivalController} from '../src/competition/rival';
import {CURRENT_HANDLING_PROFILE} from '../src/simulation/profile';
import type {CourseRoute} from '../src/course/environment';
export {toDevice} from './p08b-driving-evidence-agent';
import {toDevice} from './p08b-driving-evidence-agent';
/** Test-only controller: pedals and steering, never transforms or result injection. */
export class EvidenceDriver {
 private controller:RivalController;
 constructor(route:CourseRoute){this.controller=new RivalController(route,'player',11,CURRENT_HANDLING_PROFILE)}
 sample(t:Parameters<RivalController['control']>[0],field:Parameters<RivalController['control']>[1]){return toDevice(this.controller.control(t,field,1/60))}
}
