/**
 * Graphics quality: four presets, remembered on this browser under its OWN key. It is deliberately not part of the
 * game save (records, career, builds), so no save schema changes and old saves load untouched.
 */
export type GraphicsQuality='low'|'medium'|'high'|'ultra';
export const GRAPHICS_KEY='slingmods-graphics-v1',GRAPHICS_ORDER:readonly GraphicsQuality[]=['low','medium','high','ultra'];
export interface GraphicsPreset {label:string;/** Render through the post pipeline. Every preset does; `false` exists for the automatic fallback when a GPU cannot. */post:boolean;/** MSAA samples on the scene target. */samples:number;pixelRatioCap:number;/** Bloom mip levels; 0 disables bloom. */bloomLevels:number;dynamicResolution:boolean;/** Wet roads mirror the cars, underglow and lamps (one extra half-res pass). 0 = puddles mirror the sky only; 2 = refresh every other frame (the image is sampled through the matrix it was drawn with, so the world stays put; only the car's own reflection trails it by one frame); 1 = every frame. */wetReflections:0|1|2;/** Existing load-time lighting/shadow budget. */lighting:'low'|'standard';/** Harbor water: vertex swell and boat bob (a 2 m grid instead of one quad). */waterSwell:boolean}
export const GRAPHICS_PRESETS:Record<GraphicsQuality,GraphicsPreset>={
 // Low still uses the pipeline: measured, drawing straight to the screen was SLOWER (the mirror passes then flip every
 // material between two shader variants) and it would lose dynamic resolution, the most useful tool on a weak GPU.
 low:{label:'Low',post:true,samples:0,pixelRatioCap:1,bloomLevels:0,dynamicResolution:true,wetReflections:0,lighting:'low',waterSwell:false},
 medium:{label:'Medium',post:true,samples:2,pixelRatioCap:1,bloomLevels:4,dynamicResolution:true,wetReflections:0,lighting:'standard',waterSwell:true},
 high:{label:'High',post:true,samples:4,pixelRatioCap:1.5,bloomLevels:5,dynamicResolution:true,wetReflections:2,lighting:'standard',waterSwell:true},
 ultra:{label:'Ultra',post:true,samples:4,pixelRatioCap:2,bloomLevels:6,dynamicResolution:false,wetReflections:1,lighting:'standard',waterSwell:true}};
const valid=(v:unknown):v is GraphicsQuality=>typeof v==='string'&&(GRAPHICS_ORDER as readonly string[]).includes(v);
/** `?quality=` wins (benchmarks, links); `standard` is the pre-Phase 2 spelling of High. Otherwise the remembered choice, else High. */
export function loadGraphicsQuality(search=typeof location==='undefined'?'':location.search,storage:Pick<Storage,'getItem'>|undefined=safeStorage()):GraphicsQuality{
 const query=new URLSearchParams(search).get('quality');if(query==='standard')return'high';if(valid(query))return query;
 try{const stored=storage?.getItem(GRAPHICS_KEY);if(valid(stored))return stored}catch{/* storage may be unavailable */}return'high';
}
export function saveGraphicsQuality(quality:GraphicsQuality,storage:Pick<Storage,'setItem'>|undefined=safeStorage()){try{storage?.setItem(GRAPHICS_KEY,quality);return true}catch{return false}}
function safeStorage(){try{return typeof localStorage==='undefined'?undefined:localStorage}catch{return undefined}}

/**
 * Dynamic resolution: trades pixels for frame time so the PACE holds. Steps down quickly when frames run long, climbs back
 * slowly when there is headroom, never below `minScale`. Pure logic: feed it frame intervals, read `scale`.
 */
export class DynamicResolution {
 scale=1;private average=0;private hold=0;private fastest=Infinity;private seen=0;private sinceClimb=Infinity;private ceiling=1;private ceilingFor=0;
 constructor(readonly minScale=.6,readonly step=.05){}
 /** Display refresh is learned from the quickest steady frames, so 60, 120 and 144 Hz panels each get the right target. */
 get targetMs(){return Number.isFinite(this.fastest)?Math.min(16.8,Math.max(6.9,this.fastest)):16.7}
 update(frameMs:number,enabled=true){
  if(!Number.isFinite(frameMs)||frameMs<=0||frameMs>250)return this.scale; // tab switches and load stalls are not rendering cost
  this.seen++;this.average=this.average?this.average+(frameMs-this.average)*.08:frameMs;if(this.seen>20)this.fastest=Math.min(this.fastest===Infinity?this.average:this.fastest+.002,this.average);
  if(!enabled){this.scale=1;return this.scale}
  this.hold=Math.max(0,this.hold-frameMs);this.sinceClimb+=frameMs;this.ceilingFor=Math.max(0,this.ceilingFor-frameMs);if(this.ceilingFor===0)this.ceiling=1;if(this.hold>0||this.seen<40)return this.scale;
  const target=this.targetMs;
  // With vsync a frame that misses by a hair costs a whole refresh, so a climb can bounce straight back down. When that
  // happens the level it climbed to is remembered as a ceiling for a minute (and only that one step is undone) instead of being retried every two seconds.
  if(this.average>target*1.18&&this.scale>this.minScale){const bounced=this.sinceClimb<3000;if(bounced){this.ceiling=Math.max(this.minScale,+(this.scale-this.step).toFixed(2));this.ceilingFor=60000}this.scale=Math.max(this.minScale,+(this.scale-this.step*(!bounced&&this.average>target*1.6?2:1)).toFixed(2));this.hold=bounced?1500:500}
  else if(this.average<target*1.04&&this.scale<this.ceiling){this.scale=Math.min(this.ceiling,+(this.scale+this.step).toFixed(2));this.hold=1500;this.sinceClimb=0}
  return this.scale;
 }
}
