import {VEHICLE_VISUAL} from './vehicle-asset';
import type {VehicleVisual} from './vehicle-context';
/**
 * One purchased biker rides every current vehicle, each with its own fit (seated rest pose + IK attachment,
 * scripts/build-biker-rider.py). ?rider=tour and ?rider=legacy keep the earlier riders for comparison, and the
 * comparison-only Slingshot visuals (josh, legacy) keep the rider their seats were fitted for.
 */
export const BIKER_RIDER_URL = '/assets/drivers/biker/biker-rider.glb';
export const TOUR_RIDER_URL = '/assets/drivers/tour-rider/tour-rider.glb';
export const LEGACY_RIDER_URL = '/assets/drivers/test-driver.glb';
const SPYDER_TOUR_RIDER_URL = '/assets/spyder/spyder-rider.glb';
export type RiderKind = 'biker' | 'tour' | 'legacy';
const BIKER_FITS: Partial<Record<VehicleVisual, string>> = {'2026': 'slingshot', ryker: 'ryker', spyder: 'spyder'};
const TOUR_ATTACHMENTS: Partial<Record<VehicleVisual, string>> = {'2026': '/assets/model02/driver-attachment.json', ryker: '/assets/ryker/driver-attachment.json', spyder: '/assets/spyder/driver-attachment.json'};

const params = (search?: string) => new URLSearchParams(search ?? globalThis.location?.search ?? '');
export function riderKind(search?: string): RiderKind {
  const rider = params(search).get('rider');
  return rider === 'tour' || rider === 'legacy' ? rider : 'biker';
}
// An explicit search string is self-contained (tests, fleet lookups); otherwise the resolved vehicle applies.
const visualOf = (search?: string) => (search === undefined ? VEHICLE_VISUAL : params(search).get('visual') ?? '2026') as VehicleVisual;
const usesBiker = (visual: VehicleVisual, search?: string) => riderKind(search) === 'biker' && !!BIKER_FITS[visual];

export function riderAssetURL(search?: string) {
  const visual = visualOf(search);
  if (riderKind(search) === 'legacy') return LEGACY_RIDER_URL;
  if (usesBiker(visual, search)) return BIKER_RIDER_URL;
  return visual === 'spyder' ? SPYDER_TOUR_RIDER_URL : TOUR_RIDER_URL;
}

/** The fit that belongs with riderAssetURL() on a vehicle: the pair must always travel together. */
export function riderAttachmentURL(visual: VehicleVisual = VEHICLE_VISUAL, search?: string) {
  if (usesBiker(visual, search)) return `/assets/drivers/biker/fit-${BIKER_FITS[visual]}.json`;
  return TOUR_ATTACHMENTS[visual] ?? '/assets/drivers/test-driver-attachment.json';
}
