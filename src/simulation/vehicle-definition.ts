import spyder from '../../public/assets/spyder/manifest.json';
import slingshot from '../../public/assets/slingshot-contact-layout.json';
import ryker from '../../public/assets/ryker/manifest.json';

export type VehicleId='slingshot-r-2024'|'can-am-ryker-900'|'can-am-spyder-f3';
export interface VehicleDefinition {
 readonly id:VehicleId;readonly revision:string;readonly powertrain:'five-speed'|'cvt'|'six-speed';
 readonly layout:{wheelbase:number;wheels:{id:string;center:number[];radius:number;width:number}[]};
 readonly mass:number;readonly comHeight:number;readonly inertia:readonly [number,number,number];
 readonly chassis:readonly [number,number,number];readonly chassisOffset:readonly [number,number,number];
 readonly frontSpring:number;readonly rearSpring:number;readonly restLength:number;readonly rearRestLength?:number;readonly travel:number;
}
function immutable<T>(value:T):T {if(value&&typeof value==='object'){Object.values(value).forEach(immutable);Object.freeze(value)}return value}
/** Legacy physical values are deliberately byte-for-byte numerical equivalents. */
export const SLINGSHOT_DEFINITION=immutable<VehicleDefinition>({id:'slingshot-r-2024',revision:'slingshot-p01',powertrain:'five-speed',layout:structuredClone(slingshot),mass:850,comHeight:.46,inertia:[700,950,330],chassis:[.63,.16,1.45],chassisOffset:[0,-.1,0],frontSpring:28000,rearSpring:48000,restLength:.24,travel:.15});
/** BRP 2025 base 900 physical reference; visual year unknown. See assets/ryker/PHYSICS.md.
 * Mass: 280 dry + 80 rider + 15 fuel + 5 fluids. Contacts/radii measured from preserved mesh.
 * CG, inertia, rates, damping and assists are simulation estimates, not OEM calibration.
 */
export const RYKER_DEFINITION=immutable<VehicleDefinition>({id:'can-am-ryker-900',revision:'ryker-900-v1',powertrain:'cvt',
 layout:{wheelbase:1.709,wheels:['front_left','front_right','rear'].map((id,i)=>{const w=ryker.wheels[id as keyof typeof ryker.wheels];return {id,center:[...w.center],radius:w.radius,width:i===2?.168:.135}})},
 mass:380,comHeight:.48,inertia:[122,140,54],chassis:[.255,.12,.72],chassisOffset:[0,-.22,-.04],frontSpring:23500,rearSpring:43000,restLength:.091,rearRestLength:.100,travel:.045});
export const SPYDER_DEFINITION=immutable<VehicleDefinition>({id:'can-am-spyder-f3',revision:'spyder-f3-v1',powertrain:'six-speed',layout:{wheelbase:spyder.wheelbase,wheels:structuredClone(spyder.wheels)},mass:508,comHeight:.51,inertia:[178,202,88],chassis:[.31,.13,.83],chassisOffset:[0,-.23,0],frontSpring:27000,rearSpring:47000,restLength:.115,rearRestLength:.125,travel:.065});
export function vehicleDefinition(id:VehicleId):VehicleDefinition {switch(id){case 'slingshot-r-2024':return SLINGSHOT_DEFINITION;case 'can-am-ryker-900':return RYKER_DEFINITION;case 'can-am-spyder-f3':return SPYDER_DEFINITION;default:throw Error('Unknown vehicle: '+id)}}
