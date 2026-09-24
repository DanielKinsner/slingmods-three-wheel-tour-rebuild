import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {CourseBox} from '../course/environment';
import type {VehicleTelemetry,RaceWorld} from '../simulation';
import {loadRaceAsphalt} from '../presentation/race-asphalt';
import {GymkhanaScore,GYM,GYM_MEDALS,type GymEvent} from './gymkhana-score';
import {gameCue} from './audio-bus';
import {isAttract} from './attract-flag';
import {comparisonLabel} from './build-identity';
/**
 * Gymkhana Lot (owner decision 2026-09-24): an open asphalt lot on the Harbor Express infield (clear of every course
 * collider, checked with scripts/game-feel/lot-search.ts), reached as a free test drive with ?gymkhana=1. Two donut
 * poles, a cone slalom and a perimeter barrier; scoring lives in gymkhana-score.ts. The physics only gains the lot's
 * asphalt surface and its barrier / pole colliders; the car, tune and drift layer are the normal free-drive ones.
 */
export const LOT={cx:-185,cz:-330,w:90,l:110} as const;
export const POLES=[{x:LOT.cx-15,z:LOT.cz-24},{x:LOT.cx+15,z:LOT.cz-24}] as const;
export const START={x:LOT.cx,z:LOT.cz+45,yaw:0} as const;
export const CONES:readonly {x:number;z:number}[]=[...Array.from({length:7},(_,i)=>({x:LOT.cx-27+i*9,z:LOT.cz+16})),...Array.from({length:6},(_,i)=>({x:LOT.cx-22.5+i*9,z:LOT.cz+2}))];
export const inLot=(x:number,z:number)=>inside(x,z,-2);
const inside=(x:number,z:number,margin=0)=>Math.abs(x-LOT.cx)<=LOT.w/2-margin&&Math.abs(z-LOT.cz)<=LOT.l/2-margin;
const BARRIER=.6,BARRIER_H=.9;
function colliders():CourseBox[]{
 const h=BARRIER_H/2,{cx,cz,w,l}=LOT;
 return [{id:'gym-wall-n',center:[cx,h,cz-l/2-BARRIER/2],size:[w+2*BARRIER,BARRIER_H,BARRIER]},{id:'gym-wall-s',center:[cx,h,cz+l/2+BARRIER/2],size:[w+2*BARRIER,BARRIER_H,BARRIER]},
  {id:'gym-wall-w',center:[cx-w/2-BARRIER/2,h,cz],size:[BARRIER,BARRIER_H,l]},{id:'gym-wall-e',center:[cx+w/2+BARRIER/2,h,cz],size:[BARRIER,BARRIER_H,l]},
  ...POLES.map((p,i)=>({id:'gym-pole-'+i,center:[p.x,1.7,p.z],size:[.36,3.4,.36]}))];
}
/** The lot's physics, added to the built Harbor Express world: asphalt inside, a closed barrier and two solid poles.
 *  Everything else is the course as-is. */
export function addGymkhanaLot(world:RaceWorld){world.extendEnvironment({obstacles:colliders(),surface:(x,z)=>inside(x,z)?{id:'asphalt',mu:1.05,rolling:.014}:null})}
const RECORDS='slingmods-gx-gymkhana-v1';
export function gymkhanaBest(identity:string):{score:number;medal:string|null}|null{try{return JSON.parse(localStorage.getItem(RECORDS)??'{}')[identity]??null}catch{return null}}
function saveBest(identity:string,score:number,medal:string|null){if(isAttract())return false;try{const all=JSON.parse(localStorage.getItem(RECORDS)??'{}');if((all[identity]?.score??-1)>=score)return false;all[identity]={score:Math.round(score),medal,at:new Date().toISOString()};localStorage.setItem(RECORDS,JSON.stringify(all));return true}catch{return false}}
function paintTexture(){
 const S=10,c=document.createElement('canvas');c.width=LOT.w*S;c.height=LOT.l*S;const g=c.getContext('2d')!,px=(x:number)=>(x-LOT.cx+LOT.w/2)*S,pz=(z:number)=>(z-LOT.cz+LOT.l/2)*S;
 g.clearRect(0,0,c.width,c.height);g.strokeStyle='rgba(240,240,232,.92)';g.fillStyle='rgba(240,240,232,.92)';
 g.lineWidth=.2*S;g.strokeRect(2*S,2*S,c.width-4*S,c.height-4*S);
 g.setLineDash([1.2*S,.9*S]);for(const p of POLES){g.beginPath();g.arc(px(p.x),pz(p.z),8*S,0,Math.PI*2);g.stroke()}g.setLineDash([]);
 g.lineWidth=.15*S;g.strokeRect(px(START.x-3),pz(START.z-4.5),6*S,9*S);g.font=`italic 900 ${2.2*S}px sans-serif`;g.textAlign='center';g.fillText('START',px(START.x),pz(START.z+6.4));
 g.fillStyle='rgba(255,59,47,.85)';g.font=`italic 900 ${5*S}px sans-serif`;g.fillText('SLINGMODS',px(LOT.cx),pz(LOT.cz+36));g.fillStyle='rgba(240,240,232,.85)';g.font=`italic 800 ${2.4*S}px sans-serif`;g.fillText('GYMKHANA LOT',px(LOT.cx),pz(LOT.cz+39.5));
 for(const cone of CONES){g.beginPath();g.arc(px(cone.x),pz(cone.z),.45*S,0,Math.PI*2);g.stroke()}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
function stripeTexture(a:string,b:string,bands:number){const c=document.createElement('canvas');c.width=8;c.height=64;const g=c.getContext('2d')!;for(let i=0;i<bands;i++){g.fillStyle=i%2?b:a;g.fillRect(0,i*64/bands,8,64/bands)}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function coneGeometry(){
 const colour=(g:THREE.BufferGeometry,hex:string)=>{const c=new THREE.Color(hex),n=g.getAttribute('position').count,a=new Float32Array(n*3);for(let i=0;i<n;i++)c.toArray(a,i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));return g.toNonIndexed()};
 const base=colour(new THREE.BoxGeometry(.4,.04,.4).translate(0,.02,0),'#151515'),body=colour(new THREE.ConeGeometry(.16,.56,16,1,true).translate(0,.32,0),'#ff5a14'),band=colour(new THREE.CylinderGeometry(.095,.12,.1,16,1,true).translate(0,.34,0),'#f2f2ea');
 const keep=(g:THREE.BufferGeometry)=>{for(const k of Object.keys(g.attributes))if(!['position','normal','color'].includes(k))g.deleteAttribute(k);return g};
 return mergeGeometries([keep(base),keep(body),keep(band)])!;
}
type ConeState={x:number;z:number;down:boolean;t:number;vx:number;vz:number;spin:number;px:number;pz:number;rot:number};
export class GymkhanaLot {
 readonly score=new GymkhanaScore(POLES);readonly group=new THREE.Group();
 private cones:ConeState[];private coneMesh:THREE.InstancedMesh;private hud=document.createElement('section');private results=document.createElement('section');private m=new THREE.Matrix4();private q=new THREE.Quaternion();private e=new THREE.Euler();private disposers:(()=>void)[]=[];private recorded=false;
 private constructor(private scene:THREE.Scene,private identity:string,private actions:{retry:()=>void;exit:()=>void}){
  this.group.name='gymkhana_lot';scene.add(this.group);this.cones=CONES.map(c=>({...c,down:false,t:0,vx:0,vz:0,spin:0,px:c.x,pz:c.z,rot:0}));
  this.coneMesh=new THREE.InstancedMesh(coneGeometry(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55}),CONES.length);this.coneMesh.castShadow=true;this.coneMesh.name='gymkhana_cones';this.group.add(this.coneMesh);this.placeCones();
 }
 static async create(scene:THREE.Scene,renderer:THREE.WebGLRenderer,parent:HTMLElement,identity:string,actions:{retry:()=>void;exit:()=>void}){
  const lot=new GymkhanaLot(scene,identity,actions);await lot.build(renderer);lot.mountHud(parent);return lot;
 }
 private async build(renderer:THREE.WebGLRenderer){
  const pad=new THREE.PlaneGeometry(LOT.w+2*BARRIER,LOT.l+2*BARRIER);pad.rotateX(-Math.PI/2);const uv=pad.getAttribute('uv') as THREE.BufferAttribute,pos=pad.getAttribute('position');for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+LOT.cx)/6,(pos.getZ(i)+LOT.cz)/6);
  const asphalt=await loadRaceAsphalt(renderer,6);this.disposers.push(()=>asphalt.dispose());const padMesh=new THREE.Mesh(pad,asphalt.material);padMesh.position.set(LOT.cx,.012,LOT.cz);padMesh.receiveShadow=true;padMesh.name='gymkhana_pad';this.group.add(padMesh);
  const paintMap=paintTexture(),paint=new THREE.Mesh(new THREE.PlaneGeometry(LOT.w,LOT.l).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:paintMap,transparent:true,roughness:.7,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));paint.position.set(LOT.cx,.02,LOT.cz);paint.receiveShadow=true;paint.renderOrder=1;paint.name='gymkhana_paint';this.group.add(paint);
  const concrete=new THREE.MeshStandardMaterial({color:'#b9b6ae',roughness:.9}),top=new THREE.MeshStandardMaterial({map:stripeTexture('#e8e6df','#d1261d',2),roughness:.7});
  for(const c of colliders().filter(c=>c.id.startsWith('gym-wall'))){const wall=new THREE.Mesh(new THREE.BoxGeometry(c.size[0],c.size[1],c.size[2]),concrete);wall.position.set(c.center[0],c.center[1],c.center[2]);wall.castShadow=wall.receiveShadow=true;this.group.add(wall);
   const along=c.size[0]>c.size[2],cap=new THREE.Mesh(new THREE.BoxGeometry(c.size[0]+.01,.12,c.size[2]+.01),top);const tex=(top.map as THREE.Texture);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;cap.position.set(c.center[0],BARRIER_H-.05,c.center[2]);const uvs=cap.geometry.getAttribute('uv') as THREE.BufferAttribute;for(let i=0;i<uvs.count;i++)uvs.setY(i,uvs.getY(i)*(along?c.size[0]:c.size[2])/2);this.group.add(cap)}
  const stripes=stripeTexture('#f2f2ea','#d1261d',8),poleMat=new THREE.MeshStandardMaterial({map:stripes,roughness:.5}),lamp=new THREE.MeshStandardMaterial({color:'#ff2a1f',emissive:'#ff2a1f',emissiveIntensity:2.2});
  for(const p of POLES){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.13,.16,3.4,16),poleMat);pole.position.set(p.x,1.7,p.z);pole.castShadow=true;this.group.add(pole);const cap=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),lamp);cap.position.set(p.x,3.48,p.z);this.group.add(cap);const foot=new THREE.Mesh(new THREE.CylinderGeometry(.5,.55,.08,20),concrete);foot.position.set(p.x,.04,p.z);foot.receiveShadow=true;this.group.add(foot)}
  this.disposers.push(()=>{paintMap.dispose();stripes.dispose();(top.map as THREE.Texture).dispose();for(const o of [concrete,top,poleMat,lamp])o.dispose()});
 }
 private mountHud(parent:HTMLElement){
  this.hud.className='gx-gym';this.hud.setAttribute('aria-live','polite');const best=gymkhanaBest(this.identity);
  this.hud.innerHTML=`<div class="gx-gym-head"><span>GYMKHANA LOT</span><b data-gym="time">1:30</b></div><strong data-gym="score">0</strong><em data-gym="chain">x1</em><p data-gym="hint">Leave the start box to begin · drift, donut the poles, figure 8 · mind the cones${best?` · best ${best.score.toLocaleString('en-US')}`:''}</p><div class="gx-gym-feed" data-gym="feed"></div>`;
  this.results.className='gx-gym-results';this.results.hidden=true;parent.append(this.hud,this.results);
  this.results.addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLElement>('[data-gym-action]');if(!b)return;if(b.dataset.gymAction==='retry')this.actions.retry();else this.actions.exit()});
 }
 private placeCones(){this.cones.forEach((c,i)=>{this.e.set(c.down?Math.PI/2*.94:0,c.rot,0);this.q.setFromEuler(this.e);this.m.compose(new THREE.Vector3(c.px,c.down?.15:0,c.pz),this.q,new THREE.Vector3(1,1,1));this.coneMesh.setMatrixAt(i,this.m)});this.coneMesh.instanceMatrix.needsUpdate=true}
 /** Per frame with the player's car. dt = 0 while paused. */
 update(t:VehicleTelemetry,dt:number){
  if(dt<=0)return;const s=this.score,x=t.position.x,z=t.position.z,q=t.quaternion,fx=-2*(q.x*q.z+q.w*q.y),fz=-(1-2*(q.x*q.x+q.y*q.y)),fl=Math.hypot(fx,fz)||1,ux=fx/fl,uz=fz/fl;
  if(s.phase==='ready'&&(Math.abs(x-START.x)>3.2||Math.abs(z-START.z)>4.8)){s.start();gameCue('gx.go');this.text('hint','')}
  const events:GymEvent[]=[];
  // Cones: knocked by the car's footprint (about 2 m wide, 4 m long around its centre).
  let moved=false;for(const c of this.cones){if(c.down){if(c.t<1.2){c.t+=dt;const k=Math.max(0,1-c.t*1.6);c.px+=c.vx*dt*k;c.pz+=c.vz*dt*k;c.rot+=c.spin*dt*k;moved=true}continue}
   const dx=c.x-x,dz=c.z-z,lz=dx*ux+dz*uz,lx=dx*-uz+dz*ux;if(Math.abs(lx)<1.1&&lz>-2.1&&lz<2.2){c.down=true;c.t=0;c.vx=t.velocity.x*.7+(Math.random()-.5)*2;c.vz=t.velocity.z*.7+(Math.random()-.5)*2;c.spin=(Math.random()-.5)*8;moved=true;events.push(...s.cone());gameCue('gx.pos-down')}}
  if(moved)this.placeCones();
  const rear=t.wheels[2];events.push(...s.update({x,z,speed:Math.abs(t.speed),rearSlip:rear?.contact?rear.slipAngle:0,inLot:inside(x,z,.5)},dt));
  for(const e of events)this.announce(e);
  if(s.phase!=='ready'){const r=Math.ceil(s.remaining);this.text('time',`${Math.floor(r/60)}:${String(r%60).padStart(2,'0')}`)}
  this.text('score',Math.round(s.score).toLocaleString('en-US'));this.text('chain','x'+s.chain);this.hud.dataset.chain=String(s.chain);
  if(s.phase==='running'&&!inside(x,z,.5))this.text('hint','Back onto the lot to score');else if(s.phase==='running')this.text('hint','');
 }
 private values=new Map<string,string>();
 private text(key:string,value:string){if(this.values.get(key)===value)return;this.values.set(key,value);const el=this.hud.querySelector<HTMLElement>(`[data-gym=${key}]`);if(el)el.textContent=value}
 private announce(e:GymEvent){
  if(e.kind==='end'){this.finish();return}
  const label=e.kind==='donut'?`DONUT +${e.points}`:e.kind==='figure8'?`FIGURE 8 +${e.points}`:e.kind==='cone'?`CONE ${e.points}`:`CHAIN x${e.chain}`;
  if(e.kind==='donut')gameCue('gx.reward');else if(e.kind==='figure8')gameCue('gx.levelup');else if(e.kind==='chain')gameCue('gx.tick');
  const feed=this.hud.querySelector<HTMLElement>('[data-gym=feed]')!,item=document.createElement('b');item.textContent=label;item.dataset.kind=e.kind;feed.prepend(item);while(feed.children.length>3)feed.lastElementChild?.remove();setTimeout(()=>item.remove(),2400);
 }
 private finish(){
  if(this.recorded)return;this.recorded=true;const s=this.score,medal=s.medal(),best=gymkhanaBest(this.identity),improved=saveBest(this.identity,s.score,medal);gameCue(medal?'gx.record':'gx.reward');
  const names:Record<string,string>={gold:'Gold',silver:'Silver',bronze:'Bronze'},next=medal==='gold'?null:medal==='silver'?['Gold',GYM_MEDALS.gold]:medal==='bronze'?['Silver',GYM_MEDALS.silver]:['Bronze',GYM_MEDALS.bronze];
  this.results.innerHTML=`<p class="gx-gym-kicker">GYMKHANA LOT · ${comparisonLabel(this.identity)}</p><h2>${Math.round(s.score).toLocaleString('en-US')}</h2><p class="gx-gym-medal" data-medal="${medal??'none'}">${medal?names[medal]+' medal':'No medal yet'}${next?` · ${next[0]} at ${Number(next[1]).toLocaleString('en-US')}`:''}</p>
   <dl><div><dt>Drift</dt><dd>${Math.round(s.driftPoints).toLocaleString('en-US')}</dd></div><div><dt>Donuts</dt><dd>${s.donuts}</dd></div><div><dt>Figure 8s</dt><dd>${s.figure8s}</dd></div><div><dt>Cones</dt><dd>${s.conesHit}</dd></div></dl>
   <p class="gx-gym-best">${improved?'New best for this build':best?`Best ${best.score.toLocaleString('en-US')}`:''}</p><div class="gx-gym-actions"><button data-gym-action="retry" class="is-primary">Run it again</button><button data-gym-action="exit">Back to events</button></div>`;
  this.results.hidden=false;this.results.querySelector<HTMLButtonElement>('[data-gym-action=retry]')?.focus();
 }
 /** Retry: standing cones, a fresh clock and score. */
 reset(){this.score.reset();this.recorded=false;this.results.hidden=true;this.cones=CONES.map(c=>({...c,down:false,t:0,vx:0,vz:0,spin:0,px:c.x,pz:c.z,rot:0}));this.placeCones();this.values.clear();this.text('time','1:30');this.text('hint','Leave the start box to begin · drift, donut the poles, figure 8 · mind the cones')}
 inspect(){const s=this.score;return {phase:s.phase,score:Math.round(s.score),chain:s.chain,time:+s.time.toFixed(2),donuts:s.donuts,figure8s:s.figure8s,conesHit:s.conesHit,conesDown:this.cones.filter(c=>c.down).length}}
 dispose(){for(const d of this.disposers)d();this.coneMesh.geometry.dispose();(this.coneMesh.material as THREE.Material).dispose();this.group.traverse(o=>{if(o instanceof THREE.Mesh&&o!==this.coneMesh)o.geometry.dispose()});this.group.removeFromParent();this.hud.remove();this.results.remove()}
}
export {GYM};
