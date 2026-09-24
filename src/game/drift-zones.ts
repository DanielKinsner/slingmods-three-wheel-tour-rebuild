import * as THREE from 'three';
import {projectRoad,sampleRoad,type CourseRoute} from '../course/environment';
import type {VehicleTelemetry} from '../simulation';
import {gameCue} from './audio-bus';
import {isAttract} from './attract-flag';
/**
 * Drift zones (Phase 4): marked stretches of twisty road on every route. Inside a zone, sliding scores angle x speed;
 * leaving it banks the score against the zone's local top five. Arcade drives only (Quick Race, series, free test
 * drives); never career events, time trials or challenges. Local records only.
 */
export interface DriftZone {id:string;route:'harbor'|'express'|'ridge';name:string;start:number;end:number}
export const DRIFT_ZONES:readonly DriftZone[]=[
 {id:'harbor-waterfront',route:'harbor',name:'Waterfront Hairpins',start:220,end:520},
 {id:'harbor-seawall',route:'harbor',name:'Seawall Bends',start:760,end:1000},
 {id:'express-sweeper',route:'express',name:'Coastal Sweeper',start:920,end:1180},
 {id:'express-esses',route:'express',name:'Harbor Esses',start:1740,end:2080},
 {id:'ridge-switchbacks',route:'ridge',name:'Smoky Switchbacks',start:720,end:1040},
 {id:'ridge-overlook',route:'ridge',name:'Overlook Bends',start:1260,end:1520},
];
export const ZONE_SCORE={minSpeed:5,slideSlip:.2,rate:.25} as const;
/** Pure scorer for one pass through a zone. */
export class ZonePass {
 score=0;
 add(speed:number,rearSlip:number,dt:number,onTarmac:boolean){if(!onTarmac||speed<ZONE_SCORE.minSpeed||Math.abs(rearSlip)<ZONE_SCORE.slideSlip)return 0;const p=Math.abs(rearSlip)*57.3*speed*ZONE_SCORE.rate*dt;this.score+=p;return p}
}
const KEY='slingmods-gx-drift-zones-v1';
export interface ZoneEntry {score:number;build:string;at:string}
export function zoneBoard(id:string):ZoneEntry[]{try{const v=JSON.parse(localStorage.getItem(KEY)??'{}')[id];return Array.isArray(v)?v:[]}catch{return []}}
/** Adds a pass to the zone's top five; returns its place (1-5) or 0 when it did not make the board. */
export function recordZone(id:string,score:number,build:string){if(isAttract()||score<1)return 0;let all:Record<string,ZoneEntry[]>={};try{all=JSON.parse(localStorage.getItem(KEY)??'{}')}catch{}
 const entry={score:Math.round(score),build,at:new Date().toISOString()},board=[...(all[id]??[]),entry].sort((a,b)=>b.score-a.score).slice(0,5),place=board.indexOf(entry)+1;all[id]=board;try{localStorage.setItem(KEY,JSON.stringify(all))}catch{}return place}
export class DriftZoneRun {
 private zones:DriftZone[];private active:DriftZone|null=null;private pass=new ZonePass();private markers=new THREE.Group();private hud=document.createElement('div');private shownScore=-1;private toastTimer=0;
 constructor(scene:THREE.Scene,private route:CourseRoute,routeId:string,parent:HTMLElement,private build:string){
  this.zones=DRIFT_ZONES.filter(z=>z.route===routeId);this.markers.name='drift_zones';
  const L=route.length,w=route.width,mat=new THREE.MeshBasicMaterial({color:'#b46bff',transparent:true,opacity:.8,depthWrite:false,toneMapped:false}),post=new THREE.MeshBasicMaterial({color:'#b46bff',toneMapped:false});
  const gate=(s:number)=>{const p=sampleRoad(route,((s%L)+L)%L),y=p.y??route.heightAt?.(p.x,p.z)??0,g=new THREE.Group();g.position.set(p.x,y,p.z);g.rotation.y=Math.atan2(p.dx,p.dz);
   const line=new THREE.Mesh(new THREE.PlaneGeometry(w,.6),mat);line.rotation.x=-Math.PI/2;line.position.y=.04;g.add(line);for(const side of [-1,1]){const pole=new THREE.Mesh(new THREE.BoxGeometry(.18,2.6,.18),post);pole.position.set(side*(w/2+.6),1.3,0);g.add(pole)}return g};
  for(const z of this.zones)this.markers.add(gate(z.start),gate(z.end));scene.add(this.markers);
  this.hud.className='gx-zone';this.hud.hidden=true;this.hud.setAttribute('aria-live','polite');this.hud.innerHTML='<span data-z="name"></span><b data-z="score">0</b><small data-z="best"></small>';parent.append(this.hud);
 }
 private zoneAt(progress:number){return this.zones.find(z=>progress>=z.start&&progress<=z.end)??null}
 /** Per frame; dt 0 while paused. */
 update(t:VehicleTelemetry,dt:number,onTarmac:boolean){
  if(dt<=0)return;const pr=projectRoad(this.route,t.position.x,t.position.z);const zone=pr.distance<=this.route.width/2+this.route.runoff+2?this.zoneAt(pr.progress):null;
  if(zone!==this.active){if(this.active)this.bank(this.active);this.active=zone;this.pass=new ZonePass();if(zone){this.hud.hidden=false;this.hud.classList.remove('is-banked');this.set('name','DRIFT ZONE · '+zone.name.toUpperCase());const best=zoneBoard(zone.id)[0];this.set('best',best?`best ${best.score.toLocaleString('en-US')}`:'no score yet');gameCue('gx.tab')}}
  if(!this.active)return;const rear=t.wheels[2];this.pass.add(Math.abs(t.speed),rear?.contact?rear.slipAngle:0,dt,onTarmac);const s=Math.round(this.pass.score);if(s!==this.shownScore){this.shownScore=s;this.set('score',s.toLocaleString('en-US'))}
 }
 private bank(zone:DriftZone){const score=Math.round(this.pass.score),place=recordZone(zone.id,score,this.build);this.hud.classList.add('is-banked');this.set('best',score<1?'no drift scored':place?(place===1?'NEW ZONE BEST':`#${place} on this zone`):`best ${zoneBoard(zone.id)[0]?.score.toLocaleString('en-US')??'-'}`);if(score>0)gameCue(place===1?'gx.record':'gx.reward');clearTimeout(this.toastTimer);this.toastTimer=window.setTimeout(()=>{if(!this.active)this.hud.hidden=true},2600)}
 private set(k:string,v:string){const e=this.hud.querySelector<HTMLElement>(`[data-z=${k}]`);if(e)e.textContent=v}
 inspect(){return {zones:this.zones.map(z=>z.id),active:this.active?.id??null,score:Math.round(this.pass.score)}}
 reset(){this.active=null;this.pass=new ZonePass();this.hud.hidden=true}
 dispose(){clearTimeout(this.toastTimer);this.markers.removeFromParent();const mats=new Set<THREE.Material>();this.markers.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();mats.add(o.material as THREE.Material)}});for(const m of mats)m.dispose();this.hud.remove()}
}
