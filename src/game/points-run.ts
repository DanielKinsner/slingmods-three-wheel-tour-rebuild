import * as THREE from 'three';
import type {CourseRoute} from '../course/environment';
import type {VehicleTelemetry} from '../simulation';
import {placeTokens,PointsScore,recordPoints,type PointsEvent} from './points';
import {gameCue} from './audio-bus';
import {isAttract} from './attract-flag';
/**
 * SlingMods Points in a race: spinning brand tokens (one instanced draw), collection with a rising chime and a burst,
 * a chain multiplier, the minimap dots, and a per-route best saved at the finish. Scoring: game/points.ts.
 */
const COLOURS:Record<number,string>={10:'#f4f2ea',25:'#39c6ff',50:'#ff3b2f',100:'#ffd23c'};
export class PointsRun {
 readonly score:PointsScore;private mesh:THREE.InstancedMesh;private rim:THREE.InstancedMesh;private hud=document.createElement('div');private m=new THREE.Matrix4();private q=new THREE.Quaternion();private s=new THREE.Vector3();private p=new THREE.Vector3();private time=0;private lastSpeed=0;private lastLap=1;private finished=false;private values=new Map<string,string>();
 constructor(scene:THREE.Scene,private route:CourseRoute,private routeId:string,parent:HTMLElement,private marks:(points:readonly {x:number;z:number;value:number}[])=>void,private burst:(at:THREE.Vector3,tier:number)=>void){
  this.score=new PointsScore(placeTokens(route));
  const coin=new THREE.CylinderGeometry(.42,.42,.08,28);coin.rotateX(Math.PI/2);
  this.mesh=new THREE.InstancedMesh(coin,new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),this.score.tokens.length);this.mesh.name='slingmods_points';this.mesh.frustumCulled=false;
  const ring=new THREE.TorusGeometry(.44,.055,8,32);this.rim=new THREE.InstancedMesh(ring,new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),this.score.tokens.length);this.rim.name='slingmods_points_rim';this.rim.frustumCulled=false;
  const c=new THREE.Color();this.score.tokens.forEach((t,i)=>{c.set(COLOURS[t.value]).multiplyScalar(t.value>=50?1.8:1.3);this.mesh.setColorAt(i,c);this.rim.setColorAt(i,c.set(t.value===50?'#f4f2ea':'#ff3b2f').multiplyScalar(1.6))});scene.add(this.mesh,this.rim);this.place();
  this.hud.className='gx-points';this.hud.setAttribute('aria-live','polite');this.hud.innerHTML='<span>SLINGMODS POINTS</span><b data-p="total">0</b><em data-p="chain"></em><i data-p="pop"></i>';parent.append(this.hud);
  this.marks(this.score.remaining());
 }
 private place(){const t=this.time;this.score.tokens.forEach((k,i)=>{const got=this.score.collected.has(k.id);this.q.setFromAxisAngle(new THREE.Vector3(0,1,0),t*2.4+i);this.s.setScalar(got?0:k.value>=50?1.25:1);this.p.set(k.x,k.y+Math.sin(t*2+i)*.12,k.z);this.m.compose(this.p,this.q,this.s);this.mesh.setMatrixAt(i,this.m);this.rim.setMatrixAt(i,this.m)});this.mesh.instanceMatrix.needsUpdate=true;this.rim.instanceMatrix.needsUpdate=true}
 private text(key:string,value:string){if(this.values.get(key)===value)return;this.values.set(key,value);const e=this.hud.querySelector<HTMLElement>(`[data-p=${key}]`);if(e)e.textContent=value}
 /** Per frame while racing. `lap` is the player's current lap; `onTarmac` false on grass/gravel. dt 0 when paused. */
 update(t:VehicleTelemetry,dt:number,lap:number,onTarmac:boolean,running:boolean){
  if(dt<=0)return;this.time+=dt;
  if(lap>this.lastLap){this.lastLap=lap;this.score.respawn();this.marks(this.score.remaining())}
  const v=Math.abs(t.speed),impact=dt>0&&this.lastSpeed-v>17*dt&&this.lastSpeed>5;this.lastSpeed=v;
  const events:PointsEvent[]=running?this.score.update(t.position.x,t.position.y,t.position.z,dt,onTarmac,impact):[];
  for(const e of events){
   if(e.kind==='collect'){gameCue('gx.select',undefined,1+.12*(e.chain-1));this.burst(this.p.set(e.token.x,e.token.y,e.token.z),e.token.value>=100?3:e.token.value>=50?3:e.token.value>=25?2:1);this.pop(`+${e.points}`);this.marks(this.score.remaining())}
   else this.pop('CHAIN LOST','drop');
  }
  this.text('total',this.score.total.toLocaleString('en-US'));this.text('chain',this.score.chain>1?'x'+this.score.chain:'');this.hud.dataset.chain=String(this.score.chain);
  this.place();
 }
 private popTimer=0;
 private pop(text:string,kind='gain'){const e=this.hud.querySelector<HTMLElement>('[data-p=pop]')!;e.textContent=text;e.dataset.kind=kind;e.classList.remove('is-on');void e.offsetWidth;e.classList.add('is-on');clearTimeout(this.popTimer);this.popTimer=window.setTimeout(()=>e.classList.remove('is-on'),900)}
 /** The player's race ended: keep the route record (once). */
 finish(){if(this.finished)return null;this.finished=true;const total=Math.round(this.score.total),improved=isAttract()?false:recordPoints(this.routeId,total);this.pop(improved?'NEW BEST':'FINISH');return {total,improved}}
 reset(){this.score.total=0;this.score.chain=1;this.score.count=0;this.score.respawn();this.lastLap=1;this.finished=false;this.values.clear();this.marks(this.score.remaining());this.place()}
 inspect(){return {total:Math.round(this.score.total),chain:this.score.chain,collected:this.score.collected.size,tokens:this.score.tokens.length,bestChain:this.score.best}}
 dispose(){clearTimeout(this.popTimer);for(const m of [this.mesh,this.rim]){m.removeFromParent();m.geometry.dispose();(m.material as THREE.Material).dispose()}this.hud.remove();this.marks([])}
}
