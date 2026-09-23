import {VEHICLE_VISUAL} from './vehicle-asset';
/** Rider weights follow the resolved vehicle, including a shared build fragment. */
export const TOUR_RIDER_URL = '/assets/drivers/tour-rider/tour-rider.glb';
export const LEGACY_RIDER_URL = '/assets/drivers/test-driver.glb';
export function riderAssetURL(search?:string) {
  const params=new URLSearchParams(search??globalThis.location?.search??'');
  return params.get('rider') === 'legacy' ? LEGACY_RIDER_URL : (search===undefined?VEHICLE_VISUAL:params.get('visual'))==='spyder'?'/assets/spyder/spyder-rider.glb':TOUR_RIDER_URL;
}
