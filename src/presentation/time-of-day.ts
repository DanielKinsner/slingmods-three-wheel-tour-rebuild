import type {LightPreset} from './harbor-lighting';
/**
 * Time-of-day LOOKS for the flat harbour routes. A look is presentation only: a sky, a light rig, fog, a bloom setting
 * and a colour grade. Each look sits on one of the two validated base presets ('day' | 'night'), which is what every
 * existing system (records, saves, lamps, window glow, vehicle optics) keeps using. 'day' and 'night' themselves are the
 * untouched pre-Phase 2 looks.
 */
export type TimeOfDay='day'|'golden-hour'|'dusk'|'night'|'after-rain'|'dusk-rain'|'night-rain';
export interface Look {id:TimeOfDay;label:string;base:LightPreset;/** 2K HDR; null keeps the validated day sky / analytic night sky. */sky:string|null;skyGain:number;environment:number;exposure:number;sun:{color:string;intensity:number}|null;hemisphere:{sky:string;ground:string;intensity:number}|null;fog:{color:string;near:number;far:number}|null;/** Street and trackside lamps lit. */lampsOn:boolean;bloom:{threshold:number;intensity:number};grade:{tint:[number,number,number];saturation:number;contrast:number};/** Consumed by the wet-road slice (2C); visual only, grip never changes. */wet:boolean}
const SKIES='/assets/p11/skies/',NEUTRAL={tint:[1,1,1] as [number,number,number],saturation:1,contrast:1};
export const LOOKS={
 day:{id:'day',label:'Day',base:'day',sky:null,skyGain:1,environment:.95,exposure:.95,sun:null,hemisphere:null,fog:null,lampsOn:false,bloom:{threshold:1.35,intensity:.55},grade:NEUTRAL,wet:false},
 'golden-hour':{id:'golden-hour',label:'Golden hour',base:'day',sky:SKIES+'golden-hour-2k.hdr',skyGain:.85,environment:.85,exposure:.98,sun:{color:'#ffb066',intensity:2.6},hemisphere:{sky:'#ffd9b0',ground:'#6b5a4c',intensity:.34},fog:{color:'#e8c9a4',near:260,far:1300},lampsOn:false,bloom:{threshold:1.2,intensity:.7},grade:{tint:[1.06,.99,.9],saturation:1.08,contrast:1.06},wet:false},
 dusk:{id:'dusk',label:'Dusk',base:'night',sky:SKIES+'dusk-2k.hdr',skyGain:.5,environment:.5,exposure:1.0,sun:{color:'#ff9a6a',intensity:.55},hemisphere:{sky:'#8fa3c8',ground:'#3a3340',intensity:.5},fog:{color:'#6f7896',near:220,far:1100},lampsOn:true,bloom:{threshold:.85,intensity:.95},grade:{tint:[.98,.94,1.1],saturation:1.1,contrast:1.1},wet:false},
 night:{id:'night',label:'Night',base:'night',sky:null,skyGain:1,environment:1,exposure:1.05,sun:null,hemisphere:null,fog:null,lampsOn:true,bloom:{threshold:.8,intensity:.95},grade:NEUTRAL,wet:false},
 'after-rain':{id:'after-rain',label:'After rain',base:'day',sky:SKIES+'after-rain-2k.hdr',skyGain:1.0,environment:.9,exposure:.92,sun:{color:'#fff1de',intensity:1.5},hemisphere:{sky:'#c4d2e0',ground:'#6d6f70',intensity:.42},fog:{color:'#aebcc8',near:300,far:1200},lampsOn:false,bloom:{threshold:1.6,intensity:.4},grade:{tint:[.97,1,1.04],saturation:.96,contrast:1.05},wet:true}} as Record<TimeOfDay,Look>;
// The wet variants are the same light with a wet road. Wet is visual only: grip, physics and records never change.
LOOKS['dusk-rain']={...LOOKS.dusk,id:'dusk-rain',label:'Dusk, after rain',wet:true,bloom:{threshold:.8,intensity:1.05}};LOOKS['night-rain']={...LOOKS.night,id:'night-rain',label:'Night, after rain',wet:true,bloom:{threshold:.75,intensity:1.05}};
export const LOOK_ORDER:readonly TimeOfDay[]=['day','golden-hour','dusk','night','after-rain','dusk-rain','night-rain'];
export const LOOK_KEY='slingmods-look-v1';
/** Showcase default for the flat routes (owner decision 3A). Ridge keeps its own late-afternoon / blue-hour atmospheres. */
export const DEFAULT_LOOK:Record<'express'|'harbor',TimeOfDay>={express:'dusk-rain',harbor:'after-rain'};
export const lookSkyURLs=()=>LOOK_ORDER.map(id=>LOOKS[id].sky).filter((u):u is string=>!!u);
const valid=(v:unknown):v is TimeOfDay=>typeof v==='string'&&(LOOK_ORDER as readonly string[]).includes(v);
function stored(storage:Pick<Storage,'getItem'>|undefined):Record<string,unknown>{try{const raw=storage?.getItem(LOOK_KEY);const v=raw?JSON.parse(raw):{};return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return{}}}
const browser=()=>{try{return typeof localStorage==='undefined'?undefined:localStorage}catch{return undefined}};
/**
 * `?look=` wins, then an explicit night request (the pre-existing `lighting=night` path), then the remembered choice
 * for that route, then the showcase default. Ridge keeps its authored atmosphere. Explicit story lighting keeps its day/night requirement; all other entries share the same looks.
 */
export function resolveLook(context:{route:'express'|'harbor'|'ridge';career:boolean;requested:LightPreset;explicitLighting:boolean;search?:string;storage?:Pick<Storage,'getItem'>}):Look{
 if(context.route==='ridge'||context.career&&context.explicitLighting)return LOOKS[context.requested];
 const query=new URLSearchParams(context.search??(typeof location==='undefined'?'':location.search)).get('look');if(valid(query))return LOOKS[query];
 if(context.explicitLighting)return LOOKS[context.requested];
 const remembered=stored(context.storage??browser())[context.route];return LOOKS[valid(remembered)?remembered:DEFAULT_LOOK[context.route]];
}
export function rememberLook(route:'express'|'harbor',look:TimeOfDay,storage:Pick<Storage,'getItem'|'setItem'>|undefined=browser()){try{storage?.setItem(LOOK_KEY,JSON.stringify({...stored(storage),[route]:look}));return true}catch{return false}}
