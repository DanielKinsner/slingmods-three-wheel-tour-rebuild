/** Speed display units for the HUD and results (presentation only; physics and records stay SI). */
export type SpeedUnits='mph'|'kmh';
const KEY='slingmods-gx-units';
export function speedUnits():SpeedUnits{try{return localStorage.getItem(KEY)==='kmh'?'kmh':'mph'}catch{return 'mph'}}
export function setSpeedUnits(u:SpeedUnits){try{localStorage.setItem(KEY,u)}catch{/* session default */}}
export const speedFactor=(u=speedUnits())=>u==='kmh'?3.6:2.23694;
export const speedLabel=(u=speedUnits())=>u==='kmh'?'KM/H':'MPH';
/** Metres per second to the display number. */
export const displaySpeed=(metresPerSecond:number,u=speedUnits())=>Math.round(Math.abs(metresPerSecond)*speedFactor(u));
