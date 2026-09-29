import type {DriftDynamics} from '../simulation';

/** Opted in by the Redstone host only. Road Ryker handling and arcade drift keep their old defaults. */
export const RALLY_DRIFT:Readonly<DriftDynamics>={rearGripReduction:.52,holdSlip:.75,carryAccel:3,exitAlignment:3.8,exitDamping:1.1};
export const RALLY_CAMERA={roughShakeScale:.16,headBuzzScale:.25} as const;
// Keep records from the original drift tuning intact and separate from the revised stage rules.
export const RALLY_RULES_ID='redstone-rally-v2';
