/** Verified product facts are separate from the deliberately estimated game model. */
export const SUSPENSION = Object.freeze({
 id:'ddmworks-sm3223-silver',part:'SM-3223',manufacturerPart:'DDM-18-2',name:'DDMWorks 3-Way Adjustable Sport Shocks',
 configuration:'Set of 3 · silver housing / silver springs',vehicleId:'slingshot-r-2024',price:1000,
 fitment:'Retailer explicitly lists 2024 Slingshot R. Manufacturer lists all Slingshot years.',
 url:'https://www.slingmods.com/polaris-slingshot-3-way-adjustable-sport-shocks-coilovers-ddmworks',
 manufacturer:'https://www.ddmworks.com/Polaris-Slingshot-3-Way-Adjustable-Coilovers-by-DDMWorks_p_823.html',
 instructions:'https://www.slingmods.com/pdf/ddmworks-adjustable-shocks-install-instructions.pdf',verifiedAt:'2026-09-15',
 limitation:'Game approximation, not measured DDMWorks curves or installation advice. No claimed grip, power or lap-time gain.',
});
export interface SuspensionSetup {frontCompression:number;frontRebound:number;rearCompression:number;rearRebound:number;rideHeightMm:number}
/** Manufacturer street starting clicks, from full soft; ride height is a game offset. */
export const streetSetup=():SuspensionSetup=>({frontCompression:2,frontRebound:6,rearCompression:1,rearRebound:3,rideHeightMm:0});
export function validSetup(s:unknown):s is SuspensionSetup {
 if(!s||typeof s!=='object')return false;const p=s as SuspensionSetup;
 return ['frontCompression','frontRebound','rearCompression','rearRebound'].every(k=>Number.isInteger(p[k as keyof SuspensionSetup])&&p[k as keyof SuspensionSetup]>=0&&p[k as keyof SuspensionSetup]<=19)&&Number.isInteger(p.rideHeightMm)&&p.rideHeightMm>=-20&&p.rideHeightMm<=20;
}
/** 19 clicks from full-soft (0). Linear damping is an estimate, NOT product dyno data.
 * Keep springs, tire law, mass, travel, contact hardpoints and drivetrain stock.
 * Street click baseline equals stock damping; offsets change compression/rebound independently.
 */
export function suspensionParameters(setup:SuspensionSetup){
 if(!validSetup(setup))throw Error('Invalid suspension setup');
 return {frontCompression:3800*(1+(setup.frontCompression-2)*.035),frontRebound:3800*(1+(setup.frontRebound-6)*.035),rearCompression:6500*(1+(setup.rearCompression-1)*.035),rearRebound:6500*(1+(setup.rearRebound-3)*.035),rideHeight:setup.rideHeightMm/1000};
}
