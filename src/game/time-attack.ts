import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {gameCue} from './audio-bus';
/**
 * Time Attack: one standing-start lap, instant retries, medal targets and a ghost of your best run.
 *
 * Medal targets come from the production rivals lapping each course alone in the real Rapier world with the production
 * crew rules (scripts/game-feel/ai-lap-times.ts, 2026-09-23). Standing-lap AI times: Harbor 67.8-70.8 s, Express
 * 77.5-81.2 s, Smoky Ridge 110.6-115.8 s. The rivals follow scripted speed profiles, so the Ryker benchmark lands on the
 * same times and one target table serves both rides. Gold beats the quickest rival (Jett); SlingMods is a genuine stretch.
 *
 * Everything here is presentation and local bests only: race rules, rewards and career saves are untouched.
 */
export type Medal='slingmods'|'gold'|'silver'|'bronze';
export const MEDALS:readonly Medal[]=['slingmods','gold','silver','bronze'];
export const MEDAL_NAMES:Record<Medal,string>={slingmods:'SlingMods',gold:'Gold',silver:'Silver',bronze:'Bronze'};
export const MEDAL_TARGETS:Record<'harbor'|'express'|'ridge',Record<Medal,number>>={
 harbor:{slingmods:64500,gold:67000,silver:71000,bronze:77000},
 express:{slingmods:74000,gold:77000,silver:81500,bronze:88000},
 ridge:{slingmods:105000,gold:110000,silver:116000,bronze:125000},
};
export type TrialRoute=keyof typeof MEDAL_TARGETS;
export const medalFor=(route:TrialRoute,ms:number):Medal|null=>MEDALS.find(m=>ms<=MEDAL_TARGETS[route][m])??null;
export const trialTime=(ms:number)=>{const s=ms/1000,m=Math.floor(s/60);return `${m}:${(s-m*60).toFixed(3).padStart(6,'0')}`};

const KEY='slingmods-gx-time-attack-v1';
export interface TrialBest {timeMs:number;medal:Medal|null;at:string;runs:number;ghost?:number[]}
type Store=Record<string,TrialBest>;
const read=():Store=>{try{const v=JSON.parse(localStorage.getItem(KEY)??'{}');return v&&typeof v==='object'?v:{}}catch{return {}}};
const write=(s:Store)=>{try{localStorage.setItem(KEY,JSON.stringify(s));return true}catch{return false}};
export const trialKey=(route:TrialRoute,vehicle:string)=>`${route}:${vehicle}`;
export function trialBest(route:TrialRoute,vehicle:string):TrialBest|null{return read()[trialKey(route,vehicle)]??null}

const STRIDE=8,SAMPLE_MS=50;
/** Flattened [ms,x,y,z,qx,qy,qz,qw] samples, rounded so a lap stays well under 100 KB of local storage. */
export class Track {
 data:number[]=[];
 push(ms:number,p:THREE.Vector3,q:THREE.Quaternion){this.data.push(Math.round(ms),+p.x.toFixed(3),+p.y.toFixed(3),+p.z.toFixed(3),+q.x.toFixed(4),+q.y.toFixed(4),+q.z.toFixed(4),+q.w.toFixed(4))}
 static sample(data:number[],ms:number,p:THREE.Vector3,q:THREE.Quaternion){
  const n=data.length/STRIDE;if(n<1)return false;
  let lo=0,hi=n-1;if(ms<=data[0]){lo=hi=0}else if(ms>=data[(n-1)*STRIDE]){lo=hi=n-1}else{while(hi-lo>1){const mid=(lo+hi)>>1;if(data[mid*STRIDE]<=ms)lo=mid;else hi=mid}}
  const a=lo*STRIDE,b=hi*STRIDE,span=data[b]-data[a],t=span>0?(ms-data[a])/span:0;
  p.set(data[a+1]+(data[b+1]-data[a+1])*t,data[a+2]+(data[b+2]-data[a+2])*t,data[a+3]+(data[b+3]-data[a+3])*t);
  q.set(data[a+4],data[a+5],data[a+6],data[a+7]);if(t>0){const qb=new THREE.Quaternion(data[b+4],data[b+5],data[b+6],data[b+7]);q.slerp(qb,t)}return true
 }
}

/** A single-draw holographic silhouette of the player's own vehicle: merged position/normal geometry, one additive material. */
function ghostModel(source:THREE.Object3D){
 source.updateMatrixWorld(true);const inverse=new THREE.Matrix4().copy(source.matrixWorld).invert(),parts:THREE.BufferGeometry[]=[],m=new THREE.Matrix4();
 source.traverse(o=>{const mesh=o as THREE.Mesh;if(!mesh.isMesh||(o as THREE.SkinnedMesh).isSkinnedMesh||!o.visible||!mesh.geometry?.attributes.position)return;const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];if(mats.some(x=>x.transparent&&x.opacity<.5))return;
  const g=new THREE.BufferGeometry();g.setAttribute('position',mesh.geometry.attributes.position.clone());if(mesh.geometry.attributes.normal)g.setAttribute('normal',mesh.geometry.attributes.normal.clone());else g.computeVertexNormals();if(mesh.geometry.index)g.setIndex(mesh.geometry.index.clone());
  g.applyMatrix4(m.multiplyMatrices(inverse,o.matrixWorld));parts.push(g.index?g.toNonIndexed():g)});
 const merged=parts.length?mergeGeometries(parts,false):new THREE.BoxGeometry(1.5,.8,3.5);for(const p of parts)p.dispose();
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uColor:{value:new THREE.Color('#46c8ff')},uOpacity:{value:.55}},
  vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uColor;uniform float uOpacity;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.);gl_FragColor=vec4(uColor*(.18+1.4*f),1.)*uOpacity;}'});
 const mesh=new THREE.Mesh(merged,material);mesh.name='time-attack-ghost';mesh.frustumCulled=true;mesh.renderOrder=5;return {mesh,material}
}

export interface TrialSnapshot {phase:string;paused:boolean;elapsedMs:number;playerResult:{valid:boolean;timeMs:number|null}|null}
export class TimeAttack {
 private best:TrialBest|null;private recording=new Track();private lastSample=-Infinity;private done=false;private runKey='';private lastElapsed=0;private ghost?:{mesh:THREE.Mesh;material:THREE.ShaderMaterial};private p=new THREE.Vector3();private q=new THREE.Quaternion();private hud=document.createElement('div');private result?:{timeMs:number;medal:Medal|null;improved:boolean;previous:TrialBest|null};
 constructor(private scene:THREE.Scene,private hero:THREE.Object3D,readonly route:TrialRoute,readonly vehicle:string,hudParent:Element){
  this.best=trialBest(route,vehicle);
  if(this.best?.ghost?.length)this.ensureGhost();
  this.hud.className='gx-trial';this.hud.setAttribute('aria-label','Time attack targets');hudParent.append(this.hud);this.renderHud(null);
 }
 private ensureGhost(){if(this.ghost)return;this.ghost=ghostModel(this.hero);this.ghost.mesh.visible=false;this.scene.add(this.ghost.mesh)}
 private renderHud(currentMs:number|null){
  const t=MEDAL_TARGETS[this.route],best=this.best?.timeMs;
  const next=MEDALS.slice().reverse().find(m=>best===undefined||best>t[m]);const rows=MEDALS.map(m=>`<li data-medal="${m}" ${best!==undefined&&best<=t[m]?'data-earned="true"':''} ${m===next?'data-next="true"':''}><i></i><span>${MEDAL_NAMES[m]}</span><b>${trialTime(t[m])}</b></li>`).join('');
  this.hud.innerHTML=`<span class="gx-trial-title">TIME ATTACK</span><ol>${rows}</ol><p><span>YOUR BEST</span><b>${best!==undefined?trialTime(best):'—'}</b></p>${this.best?.ghost?'<small><i></i> GHOST: YOUR BEST</small>':''}`;
  void currentMs;
 }
 /** Per rendered frame, after the hero is posed. */
 frame(s:TrialSnapshot,camera:THREE.Camera){
  // A new run starts at every countdown and whenever the race clock jumps back (hold-R restart, retry).
  const newRun=((s.phase==='countdown'||s.phase==='ready')&&this.runKey!=='armed')||s.elapsedMs+100<this.lastElapsed;
  if(newRun){this.runKey='armed';this.recording=new Track();this.lastSample=-Infinity;this.done=false;this.result=undefined;if(this.ghost)this.ghost.mesh.visible=false}
  if(s.phase==='running'){this.runKey=''}
  this.lastElapsed=s.elapsedMs;
  const running=s.phase==='running'&&!s.paused&&!s.playerResult;
  if(running&&s.elapsedMs-this.lastSample>=SAMPLE_MS){this.lastSample=s.elapsedMs;this.recording.push(s.elapsedMs,this.hero.getWorldPosition(this.p),this.hero.getWorldQuaternion(this.q))}
  if(this.ghost&&this.best?.ghost){const g=this.ghost,data=this.best.ghost;const show=s.phase==='countdown'||s.phase==='running'&&!s.playerResult||s.phase==='ready';g.mesh.visible=show&&Track.sample(data,s.phase==='running'?s.elapsedMs:0,g.mesh.position,g.mesh.quaternion);
   if(g.mesh.visible){const d=g.mesh.position.distanceTo(this.hero.getWorldPosition(this.p)),cam=g.mesh.position.distanceTo(camera.position);g.material.uniforms.uOpacity.value=Math.min(.55,Math.max(.06,(d-1.2)/6))*Math.min(1,cam/3)}}
  if(s.playerResult&&!this.done){this.done=true;this.finish(s)}
 }
 private finish(s:TrialSnapshot){
  const r=s.playerResult!;if(!r.valid||r.timeMs==null){this.result=undefined;return}
  const store=read(),k=trialKey(this.route,this.vehicle),previous=store[k]??null,medal=medalFor(this.route,r.timeMs),improved=!previous||r.timeMs<previous.timeMs;
  this.recording.push(r.timeMs,this.hero.getWorldPosition(this.p),this.hero.getWorldQuaternion(this.q));
  const runs=(previous?.runs??0)+1;store[k]=improved?{timeMs:r.timeMs,medal,at:new Date().toISOString(),runs,ghost:this.recording.data}:{...previous!,runs};
  if(!write(store)&&improved){delete store[k].ghost;write(store)}
  this.result={timeMs:r.timeMs,medal,improved,previous};if(improved){this.best=store[k];if(this.best.ghost)this.ensureGhost();this.renderHud(null)}
  const prevMedal=previous?.medal??null,newMedal=medal&&(!prevMedal||MEDALS.indexOf(medal)<MEDALS.indexOf(prevMedal));
  setTimeout(()=>gameCue(improved?'gx.record':'gx.reward'),900);
  if(improved)setTimeout(()=>document.dispatchEvent(new CustomEvent('gx:radio',{detail:{moment:medal==='gold'||medal==='slingmods'?'trialGold':'trialImproved'}})),1500);
  document.getElementById('race-menu')&&this.decorate(!!newMedal);
 }
 /** Results panel: medal won, delta to your previous best, and next target. */
 decorate(newMedal=false){
  const menu=document.getElementById('race-menu'),r=this.result;if(!menu||!r||menu.querySelector('.gx-trial-result'))return;
  const next=MEDALS.slice().reverse().find(m=>r.timeMs>MEDAL_TARGETS[this.route][m]),delta=r.previous?r.timeMs-r.previous.timeMs:null;
  const panel=document.createElement('section');panel.className='gx-trial-result';panel.dataset.medal=r.medal??'none';
  panel.innerHTML=`<div class="gx-medal" data-medal="${r.medal??'none'}"><i></i><b>${r.medal?MEDAL_NAMES[r.medal].toUpperCase():'NO MEDAL'}</b>${newMedal?'<span>NEW MEDAL</span>':''}</div><div class="gx-trial-lines">${r.improved?`<p class="is-record"><b>${r.previous?'NEW PERSONAL BEST':'FIRST TIME SET'}</b>${delta!==null?`<span>${(delta/1000).toFixed(3)}s</span>`:''}</p>`:`<p><b>BEST ${trialTime(r.previous!.timeMs)}</b><span>+${((delta??0)/1000).toFixed(3)}s</span></p>`}${next?`<p><b>NEXT: ${MEDAL_NAMES[next].toUpperCase()}</b><span>${trialTime(MEDAL_TARGETS[this.route][next])} · ${((r.timeMs-MEDAL_TARGETS[this.route][next])/1000).toFixed(3)}s to find</span></p>`:'<p><b>EVERY MEDAL EARNED</b><span>Go find another tenth.</span></p>'}${r.improved?'<p><small>Your ghost now drives this lap.</small></p>':''}</div>`;
  menu.insertBefore(panel,menu.querySelector('.menu-actions'));
 }
 private observer?:MutationObserver;
 observe(){const menu=document.getElementById('race-menu');if(!menu)return;this.observer?.disconnect();this.observer=new MutationObserver(()=>{if(menu.dataset.phase==='result')this.decorate()});this.observer.observe(menu,{childList:true})}
 dispose(){this.observer?.disconnect();if(this.ghost){this.scene.remove(this.ghost.mesh);this.ghost.mesh.geometry.dispose();this.ghost.material.dispose()}this.hud.remove()}
}
