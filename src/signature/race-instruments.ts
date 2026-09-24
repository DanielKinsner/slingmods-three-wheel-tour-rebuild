import {DRIVETRAIN} from '../simulation/drivetrain';
import {displaySpeed,speedLabel} from '../game/units';
import type {VehicleTelemetry} from '../simulation';
export const tachRatio=(rpm:number,redline:number=DRIVETRAIN.redline)=>Math.min(1,Math.max(0,rpm/redline));
/** Shift light: five LEDs from 72% of the limiter (green, green, amber, amber, red), flashing from 95%. A CVT never
 *  shifts, so it has none. Presentation only. */
export const shiftLight=(rpm:number,redline:number,powertrain?:string)=>{if(powertrain==='cvt')return {level:0,flash:false};const r=tachRatio(rpm,redline);return {level:Math.max(0,Math.min(5,Math.floor((r-.72)/.05)+1)),flash:r>=.95}};
export const displayedGear=(gear:number,powertrain?:string)=>gear<0?'R':gear===0?'N':powertrain==='cvt'?'D':String(gear);
const point=(degrees:number,radius:number)=>[160+Math.cos(degrees*Math.PI/180)*radius,170+Math.sin(degrees*Math.PI/180)*radius];
export function tachMarkup(){
 const segments=Array.from({length:34},(_,i)=>{const angle=201+i*138/33,a=point(angle,143),b=point(angle,153);return `<path data-tach-segment="${i}" d="M${a.join(' ')} L${b.join(' ')}"/>`}).join('');
 const labels=[0,2000,4000,6000,8000].map(rpm=>{const p=point(200+140*rpm/DRIVETRAIN.redline,173);return `<text x="${p[0]}" y="${p[1]}">${rpm/1000}</text>`}).join('');
 return `<svg class="race-tach" viewBox="0 0 320 176" aria-hidden="true">${segments}${labels}</svg><div class="race-speed-readout"><strong id="race-speed">0</strong><span>${speedLabel()}</span></div><div class="race-transmission"><b id="race-gear">N</b><span>GEAR</span></div><div class="race-engine-readout"><b id="race-rpm">${DRIVETRAIN.idle}</b><span> RPM / ${DRIVETRAIN.redline} LIMIT</span></div><div class="race-shift" data-level="0" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>`;
}
/** Stable SVG nodes and changed-only updates; rendering never changes the drivetrain. */
export class RaceInstruments {
 private segments:SVGPathElement[];private lit=-1;private redline=0;private values=new Map<string,string>();private shift='';
 constructor(private root:HTMLElement){this.segments=[...root.querySelectorAll<SVGPathElement>('[data-tach-segment]')]}
 private text(id:string,value:string){if(this.values.get(id)===value)return;this.values.set(id,value);const e=this.root.querySelector(id);if(e)e.textContent=value}
 update(t:VehicleTelemetry){const redline=t.powertrain==='six-speed'?8100:DRIVETRAIN.redline;if(this.redline!==redline){this.redline=redline;this.text('.race-engine-readout span',` RPM / ${redline} LIMIT`);this.root.querySelectorAll<SVGTextElement>('.race-tach text').forEach((label,i)=>{const at=point(200+140*(i*2000)/redline,173);label.setAttribute('x',String(at[0]));label.setAttribute('y',String(at[1]))})}this.text('#race-speed',String(displaySpeed(t.speed)));this.text('#race-gear',displayedGear(t.gear,t.powertrain));this.text('#race-rpm',String(Math.round(t.rpm)));const count=Math.round(tachRatio(t.rpm,redline)*this.segments.length);if(count!==this.lit){this.lit=count;for(let i=0;i<this.segments.length;i++){this.segments[i].classList.toggle('lit',i<count);this.segments[i].classList.toggle('limit',i>=Math.floor(this.segments.length*.88))}}{const s=shiftLight(t.rpm,redline,t.powertrain),key=s.level+(s.flash?'!':'');if(key!==this.shift){this.shift=key;const e=this.root.querySelector<HTMLElement>('.race-shift');if(e){e.dataset.level=String(s.level);e.classList.toggle('is-flash',s.flash)}}}this.root.querySelector('.race-gauges')?.classList.toggle('is-reverse',t.gear<0)}
}
export function raceHeader(title:string,trial=false){return `<div class="race-top"><div class="race-identity"><img src="/assets/brand/slingmods-logo-main.png" alt="SlingMods"><div class="race-position"><span>${trial?'CHECKPOINTS':'POSITION'}</span><strong id="race-position">1</strong><i>/</i><b id="race-field">1</b></div><div class="race-laps"><span>${trial?'EVENT':'LAP'}</span><strong id="race-lap">1</strong><i>/</i><b id="race-laps">1</b></div><span id="race-progress" class="race-progress-detail"></span></div><span class="race-label race-course-title">${title}</span><div class="race-timing"><span>${trial?'LAP TIME':'RACE TIME'}</span><strong id="race-time">0:00.000</strong><small id="race-best" hidden></small></div><button id="race-pause" aria-label="Pause">Ⅱ</button></div>`}
