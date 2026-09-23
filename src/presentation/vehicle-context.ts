/** Presentation/retail identity. Never substitute this for a saved recipe key. */
export type VehicleVisual='2026'|'josh'|'legacy'|'ryker'|'spyder';
export interface VehicleContext {year:number;model:'R'|'Ryker 900'|'Spyder F3';visual:VehicleVisual;rollHoops:'square'|'none';label:string;controls:string}
export function vehicleContext(visual:VehicleVisual):VehicleContext {
 if(visual==='spyder')return {year:2023,model:'Spyder F3',visual,rollHoops:'none',label:'Can-Am Spyder F3 Custom',controls:'1330 inline-three · 6-speed / reverse · auto-shift game assist'};
 if(visual==='ryker')return {year:0,model:'Ryker 900',visual,rollHoops:'none',label:'Can-Am Ryker 900',controls:'900 ACE · CVT / reverse · Ryker Road v1'};
 const year=visual==='2026'?2026:2024;
 return {year,model:'R',visual,rollHoops:'square',label:`${year} Slingshot R`,controls:visual==='2026'?'R Manual source · automatic game controls':'Automatic game controls'};
}
