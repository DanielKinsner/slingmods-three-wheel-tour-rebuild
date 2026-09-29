import type {DriftDynamics} from '../simulation';

/**
 * Opted in by the Redstone host only. Road Ryker handling and arcade drift keep their old defaults.
 * A dirt slide a little looser than the road layer (held angle ~32 vs 28 degrees, peak ~49 vs 43), with the road's
 * exit catch and nearly its speed carry. The v2 values (.52/.75/3/3.8/1.1) swung past 60 degrees and bled twice the speed.
 */
export const RALLY_DRIFT:Readonly<DriftDynamics>={rearGripReduction:.45,holdSlip:.63,carryAccel:2.8,exitAlignment:4.6,exitDamping:1.2};
export const RALLY_CAMERA={roughShakeScale:.16,headBuzzScale:.25} as const;
// Each drift retune gets its own comparison id; records from earlier rules stay stored but never compete.
export const RALLY_RULES_ID='redstone-rally-v3';
