/** Presentation/retail identity. Never substitute this for a saved recipe key. */
export type VehicleVisual='2026'|'josh'|'legacy'|'ryker';
export interface VehicleContext {year:number;model:'R'|'Ryker 900';visual:VehicleVisual;rollHoops:'square'|'none';label:string;controls:string}
export function vehicleContext(visual:VehicleVisual):VehicleContext {
 if(visual==='ryker')return {year:0,model:'Ryker 900',visual,rollHoops:'none',label:'Can-Am Ryker 900',controls:'Automatic game controls · shared Sport v5 handling'};
 const year=visual==='2026'?2026:2024;
 return {year,model:'R',visual,rollHoops:'square',label:`${year} Slingshot R`,controls:visual==='2026'?'R Manual source · automatic game controls':'Automatic game controls'};
}
