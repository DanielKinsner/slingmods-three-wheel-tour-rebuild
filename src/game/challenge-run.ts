import * as THREE from 'three';
import {sampleRoad,type CourseRoute} from '../course/environment';
import type {VehicleTelemetry} from '../simulation';
import {gameCue} from './audio-bus';
import {setPrompts} from './shell';
import {speedUnits} from './units';
import {MEDALS,MEDAL_NAMES,type Medal} from './time-attack';
import {BOX_HALF,CHALLENGES,ChallengeJudge,KIND_LABEL,challengeBest,formatValue,recordChallenge,type Challenge,type JudgeState} from './challenges';
/**
 * The in-drive side of a challenge: on-road markers (gate, speed trap or stop box), the live HUD card with the medal
 * ladder, and the result card (retry / next / back). The drive supplies the telemetry and three navigation callbacks.
 */
const esc=(s:string)=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!));
export class ChallengeRun {
 private judge:ChallengeJudge;private hud=document.createElement('section');private result=document.createElement('section');private markers=new THREE.Group();private last:JudgeState['phase']='ready';private shown=false;private spilled=0;private crates:{mesh:THREE.Mesh;v:THREE.Vector3;spin:THREE.Vector3;t:number;floor:number}[]=[];private crateGeo=new THREE.BoxGeometry(.5,.38,.42);private crateMat=new THREE.MeshStandardMaterial({color:'#9a6b3d',roughness:.85});private scene:THREE.Scene;
 constructor(parent:HTMLElement,scene:THREE.Scene,private route:CourseRoute,readonly challenge:Challenge,private vehicle:string,private nav:{retry:()=>void;next:(c:Challenge)=>void;menu:()=>void},secured=false){
  this.scene=scene;this.judge=new ChallengeJudge(route,challenge,challenge.kind==='cargo'&&secured);
  this.hud.className='gx-chal';this.hud.setAttribute('aria-live','polite');
  this.hud.innerHTML=`<header><span>${KIND_LABEL[challenge.kind]}</span><b>${esc(challenge.title)}</b></header><div class="gx-chal-live"><strong data-c="value">—</strong><small data-c="sub">Timer starts when you move</small></div><ol class="gx-chal-ladder">${MEDALS.map(m=>`<li data-medal="${m}"><i></i>${MEDAL_NAMES[m]}<em>${formatValue(challenge,challenge.targets[m],speedUnits())}</em></li>`).join('')}</ol><p class="gx-chal-brief">${esc(challenge.brief)}${challenge.kind==='cargo'?(secured?' <b class="gx-chal-secured">Your storage bags are fitted: the load is secured.</b>':' <b class="gx-chal-loose">No storage bags fitted: the load is loose.</b>'):''}</p>`;
  this.result.className='gx-chal-result';this.result.hidden=true;this.result.setAttribute('role','dialog');this.result.setAttribute('aria-label','Challenge result');
  parent.append(this.hud,this.result);
  this.result.addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLElement>('[data-chal]');if(b)this.command(b.dataset.chal!)});
  addEventListener('keydown',this.onKey,true);
  this.buildMarkers();scene.add(this.markers);
 }
 private onKey=(e:KeyboardEvent)=>{if(this.result.hidden)return;const a=e.code==='Enter'||e.code==='Space'||e.code==='KeyR'?'retry':e.code==='KeyN'?'next':e.code==='Escape'||e.code==='Backspace'?'menu':'';if(!a)return;e.preventDefault();e.stopImmediatePropagation();this.command(a)};
 private command(a:string){gameCue(a==='menu'?'gx.back':'gx.select');if(a==='retry'){this.hideResult();this.judge.reset();this.last='ready';this.clearCrates();this.nav.retry()}else if(a==='next')this.nav.next(this.nextChallenge());else if(a==='menu')this.nav.menu()}
 private nextChallenge(){const i=CHALLENGES.indexOf(this.challenge);return CHALLENGES[(i+1)%CHALLENGES.length]}
 private hideResult(){this.result.hidden=true;this.shown=false;delete document.body.dataset.gxModal;setPrompts(null)}
 /** Gate / trap arch or stop box drawn on the road at the target station (presentation only, no colliders). */
 private buildMarkers(){
  const c=this.challenge,L=this.route.length,at=(s:number)=>{const p=sampleRoad(this.route,((s%L)+L)%L),y=p.y??this.route.heightAt?.(p.x,p.z)??0;return {p,y,yaw:Math.atan2(p.dx,p.dz)}};
  const w=this.route.width+2,colour=c.kind==='brake'?0xff3b2f:c.kind==='trap'?0x35c8ff:0xffc93c;
  const glow=(col:number,o=.9)=>new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:o,depthWrite:false,toneMapped:false});
  const arch=(s:number,col:number)=>{const {p,y,yaw}=at(s),g=new THREE.Group();g.position.set(p.x,y,p.z);g.rotation.y=yaw;
   for(const side of [-1,1]){const post=new THREE.Mesh(new THREE.BoxGeometry(.35,4.2,.35),glow(col));post.position.set(side*w/2,2.1,0);g.add(post)}
   const beam=new THREE.Mesh(new THREE.BoxGeometry(w+.35,.45,.35),glow(col));beam.position.y=4.2;g.add(beam);
   const line=new THREE.Mesh(new THREE.PlaneGeometry(w,.5),glow(col,.75));line.rotation.x=-Math.PI/2;line.position.y=.04;g.add(line);return g};
  if(c.kind==='brake'){const {p,y,yaw}=at(c.end),g=new THREE.Group();g.position.set(p.x,y,p.z);g.rotation.y=yaw;
   const box=new THREE.Mesh(new THREE.PlaneGeometry(this.route.width,BOX_HALF*2),glow(0x3ddc84,.22));box.rotation.x=-Math.PI/2;box.position.y=.035;g.add(box);
   const line=new THREE.Mesh(new THREE.PlaneGeometry(this.route.width,.35),glow(0xffffff,.9));line.rotation.x=-Math.PI/2;line.position.y=.045;g.add(line);
   for(const z of [-BOX_HALF,BOX_HALF]){const edge=new THREE.Mesh(new THREE.PlaneGeometry(this.route.width,.2),glow(0x3ddc84,.9));edge.rotation.x=-Math.PI/2;edge.position.set(0,.04,z);g.add(edge)}
   this.markers.add(g,arch(c.end+BOX_HALF+2,colour))}
  else this.markers.add(arch(c.end,colour));
  this.markers.add(arch(c.start,0xffffff));
 }
 /** Once per rendered frame with the player's telemetry. */
 frame(t:VehicleTelemetry){
  const s=this.judge.update(t),c=this.challenge,u=speedUnits(),q=(k:string)=>this.hud.querySelector<HTMLElement>(`[data-c=${k}]`)!;
  if(s.phase!==this.last){if(s.phase==='running')gameCue('gx.go');this.last=s.phase;if(s.phase==='done'||s.phase==='failed')this.finish(s)}
  this.hud.dataset.phase=s.phase;
  if(s.phase==='ready'){this.spilled=0;q('value').textContent=c.kind==='sprint'||c.kind==='cargo'?'0.000 s':c.kind==='trap'?formatValue(c,0,u):`${Math.round(this.judge.length)} m`;q('sub').textContent='Timer starts when you move';return}
  const toGo=Math.max(0,s.toGo);
  if(s.spills>this.spilled){this.spilled=s.spills;this.dropCrate(t);gameCue('gx.pos-down')}this.animateCrates();
  if(c.kind==='cargo'){const n=c.crates??4;q('value').textContent=formatValue(c,s.elapsedMs+s.spills*2000);q('sub').textContent=`${Math.round(toGo)} m to the gate · ${s.secured?'load secured':`cargo ${n-s.spills}/${n}${s.spills?` (+${s.spills*2} s)`:''}`}`}
  else if(c.kind==='sprint'){q('value').textContent=formatValue(c,s.elapsedMs);q('sub').textContent=`${Math.round(toGo)} m to the gate`}
  else if(c.kind==='trap'){q('value').textContent=formatValue(c,s.speed,u);q('sub').textContent=`${Math.round(toGo)} m to the trap`}
  else{q('value').textContent=`${s.toGo>=0?'':'+'}${Math.abs(s.toGo).toFixed(s.toGo<20?1:0)} m`;q('sub').textContent=`${((c.limitMs!-s.elapsedMs)/1000).toFixed(1)} s left · ${formatValue({...c,kind:'trap'},s.speed,u)}`}
 }
 private finish(s:JudgeState){
  const c=this.challenge,u=speedUnits();let html='';
  if(s.phase==='done'&&s.value!==null){const rec=recordChallenge(c,s.value,this.vehicle),best=challengeBest(c.id,this.vehicle),m:Medal|null=s.medal;gameCue(rec.best&&rec.previous?'gx.record':m?'gx.slam':'gx.lap');
   html=`<span class="gx-chal-kicker">${KIND_LABEL[c.kind]} · ${esc(c.title)}</span><div class="gx-chal-medal" data-medal="${m??'none'}"><i></i><b>${m?MEDAL_NAMES[m].toUpperCase():'NO MEDAL'}</b></div><strong>${formatValue(c,s.value,u)}</strong>${c.kind==='cargo'?`<p class="gx-chal-cargo">${s.secured?'Load secured by your storage bags':`${(c.crates??4)-s.spills}/${c.crates??4} crates delivered${s.spills?` · +${s.spills*2} s spilled`:' · clean delivery'}`}</p>`:''}<p>${rec.best?(rec.previous?'NEW PERSONAL BEST':'FIRST RESULT RECORDED'):`Best ${best?formatValue(c,best.value,u):'—'}`}${!m?` · Bronze needs ${formatValue(c,c.targets.bronze,u)}`:m!=='slingmods'?` · Next: ${MEDAL_NAMES[MEDALS[MEDALS.indexOf(m)-1]]} ${formatValue(c,c.targets[MEDALS[MEDALS.indexOf(m)-1]],u)}`:''}</p>`}
  else{gameCue('gx.back');html=`<span class="gx-chal-kicker">${KIND_LABEL[c.kind]} · ${esc(c.title)}</span><div class="gx-chal-medal" data-medal="fail"><i></i><b>FAILED</b></div><strong>${esc(s.reason)}</strong><p>Retry from the start line.</p>`}
  this.result.innerHTML=`${html}<div class="gx-chal-actions"><button data-chal="retry" class="is-primary">Retry</button><button data-chal="next">Next challenge</button><button data-chal="menu">All challenges</button></div>`;
  // Let the car settle on screen for a beat before the card lands.
  setTimeout(()=>{if(this.last!=='done'&&this.last!=='failed')return;this.result.hidden=false;this.shown=true;document.body.dataset.gxModal='1';setPrompts([{key:'confirm',label:'Retry'},{key:'back',label:'All challenges'}]);this.result.querySelector<HTMLElement>('[data-chal=retry]')?.focus({preventScroll:true})},s.phase==='done'?900:500);
 }
 /** A crate slides off the back and tumbles to the road; it stays there until the retry. */
 private dropCrate(t:VehicleTelemetry){const q=new THREE.Quaternion(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w),back=new THREE.Vector3(0,.95,1.5).applyQuaternion(q),m=new THREE.Mesh(this.crateGeo,this.crateMat);m.castShadow=true;m.position.set(t.position.x+back.x,t.position.y+back.y,t.position.z+back.z);this.scene.add(m);
  const side=new THREE.Vector3(Math.random()<.5?-1:1,0,0).applyQuaternion(q);this.crates.push({mesh:m,v:new THREE.Vector3(t.velocity.x*.55+side.x*2.2,1.6,t.velocity.z*.55+side.z*2.2),spin:new THREE.Vector3(Math.random()*6-3,Math.random()*6-3,Math.random()*6-3),t:0,floor:t.position.y-.35})}
 private crateClock=performance.now();
 private animateCrates(){const now=performance.now(),dt=Math.min(.05,(now-this.crateClock)/1000);this.crateClock=now;for(const c of this.crates){if(c.t>3)continue;c.t+=dt;c.v.y-=9.81*dt;c.mesh.position.addScaledVector(c.v,dt);if(c.mesh.position.y<c.floor+.19){c.mesh.position.y=c.floor+.19;c.v.y=Math.abs(c.v.y)*.3;c.v.x*=.7;c.v.z*=.7;c.spin.multiplyScalar(.6)}c.mesh.rotation.x+=c.spin.x*dt;c.mesh.rotation.y+=c.spin.y*dt;c.mesh.rotation.z+=c.spin.z*dt}}
 private clearCrates(){for(const c of this.crates)c.mesh.removeFromParent();this.crates=[];this.spilled=0}
 /** Controller support for the result card (A retry, Y next, B back). */
 private padPrior=new Set<string>();
 pad(pads:readonly (Gamepad|null)[]){const now=new Set<string>();for(const p of pads){if(!p?.connected)continue;for(const i of [0,1,3])if((p.buttons[i]?.value??0)>.5)now.add(`${p.index}:${i}`)}
  // Edge-triggered, so the button held through the finish (or the retry itself) never fires twice.
  const fresh=[...now].filter(k=>!this.padPrior.has(k)).map(k=>k.split(':')[1]);this.padPrior=now;if(!this.shown)return;if(fresh.includes('0'))this.command('retry');else if(fresh.includes('3'))this.command('next');else if(fresh.includes('1'))this.command('menu')}
 dispose(){this.clearCrates();this.crateGeo.dispose();this.crateMat.dispose();removeEventListener('keydown',this.onKey,true);this.hud.remove();this.result.remove();this.markers.removeFromParent();this.markers.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose()}});if(this.shown)this.hideResult()}
}
