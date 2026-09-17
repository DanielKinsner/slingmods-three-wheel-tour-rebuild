/** Presentation/retail identity. Never substitute this for a saved recipe key. */
export type VehicleVisual='2026'|'josh'|'legacy';
export interface VehicleContext {year:number;model:'R';visual:VehicleVisual;rollHoops:'square';label:string;controls:string}
export function vehicleContext(visual:VehicleVisual):VehicleContext {
 const year=visual==='2026'?2026:2024;
 return {year,model:'R',visual,rollHoops:'square',label:`${year} Slingshot R`,controls:visual==='2026'?'R Manual source · automatic game controls':'Automatic game controls'};
}
