/** Curated product facts; game economics and solid-color controls are fictional. */
export const PRODUCT = Object.freeze({
 id:'tricled-sm133-base-rgb',name:'TricLED RGB Underglow',configuration:'Base Kit #1 · RF remote',brand:'TricLED',part:'SM-133',
 vehicleId:'slingshot-r-2024',slot:'lighting.underglow',price:600,
 url:'https://www.slingmods.com/polaris-slingshot-underglow-kit',verifiedAt:'2026-09-15',effect:'cosmetic_only',
 officialTitle:'Kit #1 Standard RGB LED UnderGlow Lighting Kit with Remote for the Polaris Slingshot',
 modeledVehicle:'2024 Polaris Slingshot R',fitment:'The listing includes the 2024 Slingshot R. This demo represents only Base Kit #1.',
 exclusions:'No interior, front/grille, swingarm, halo, wheel or chaser add-ons.',
 limitation:'Closed-course game visualization. Mounting and light output are approximations, not installation instructions.',
});
export const COLORS={red:'#C91820',blue:'#286CFF',cyan:'#21D9DC',purple:'#A65AFF',white:'#EEEDE4',amber:'#F7A72D'} as const;
export type KitColor=keyof typeof COLORS;
export interface Appearance {color:KitColor;brightness:number;enabled:boolean}
export const defaultAppearance=():Appearance=>({color:'red',brightness:.6,enabled:true});
