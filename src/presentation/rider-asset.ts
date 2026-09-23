/** Isolated rider asset switch. No save, vehicle selection, or fit changes. */
export const TOUR_RIDER_URL = '/assets/drivers/tour-rider/tour-rider.glb';
export const LEGACY_RIDER_URL = '/assets/drivers/test-driver.glb';
export function riderAssetURL(search = globalThis.location?.search ?? '') {
  return new URLSearchParams(search).get('rider') === 'legacy' ? LEGACY_RIDER_URL : TOUR_RIDER_URL;
}
