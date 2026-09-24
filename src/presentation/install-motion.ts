import * as THREE from 'three';
/**
 * Showroom part install moment. Whatever a preview change newly draws on the car (a hidden part shown, or an accessory
 * attached) flies in from just outside the car, seats with a small overshoot, and on landing throws a short burst of
 * sparks and fires `onLand` (the install sound and stamp). Lights skip the flight and ignite instead: a quick flicker,
 * then a glow that settles to normal (`update` returns that gain; 1 = normal).
 *
 * Vehicle agnostic: it compares what is drawn before and after the recipe is applied, so the Slingshot, Ryker and Spyder
 * presenters need no hooks. Parts are moved through their own local position and put back exactly on landing, or at once
 * by `finish()` (a new change, leaving the showroom).
 */
export const FLY_MS=420;
const SPARKS=44,SPARK_LIFE=.55,FLARE_S=.75,OUTWARD=.34,LIFT=.14,DROP=.3;
const easeOutBack=(t:number)=>{const s=1.25,u=t-1;return 1+(s+1)*u*u*u+s*u*u};
/** Everything drawn under `root` right now (hidden subtrees excluded). Take it before applying a change. */
export function drawnSet(root:THREE.Object3D){const s=new Set<THREE.Object3D>();root.traverseVisible(o=>{s.add(o)});return s}
/** Topmost newly drawn node of every mesh that was not drawn in `before`. `exclude` (the rider) is ignored. */
export function arrivals(root:THREE.Object3D,before:Set<THREE.Object3D>,exclude?:THREE.Object3D){
 const out=new Set<THREE.Object3D>();
 root.traverseVisible(o=>{
  if(!(o as THREE.Mesh).isMesh||before.has(o))return;
  for(let p:THREE.Object3D|null=o;p;p=p.parent)if(p===exclude)return;
  let top=o;while(top.parent&&top.parent!==root&&!before.has(top.parent))top=top.parent;out.add(top);
 });
 return [...out];
}
function sparkTexture(){
 const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d')!,r=g.createRadialGradient(16,16,0,16,16,16);
 r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,220,160,.9)');r.addColorStop(1,'rgba(255,140,40,0)');g.fillStyle=r;g.fillRect(0,0,32,32);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
type Piece={node:THREE.Object3D;home:THREE.Vector3;lift:THREE.Vector3};
export class InstallMotion {
 private pieces:Piece[]=[];private start=0;private onLand?:()=>void;private sparkOnLand=false;private flareOnLand=false;
 private sparks?:THREE.Points;private velocity=new Float32Array(SPARKS*3);private sparkAt=-1;private flareAt=-1;private last=0;private eye=new THREE.Vector3();private carCentre=new THREE.Vector3();
 private played=0;
 constructor(private scene:THREE.Scene){}
 /** Start the moment for the parts that appeared since `before`. Returns false (and does nothing) when nothing new is
  *  drawn; the caller then plays its sound straight away. */
 play(root:THREE.Object3D,before:Set<THREE.Object3D>,options:{now:number;camera:THREE.Camera;lights:boolean;exclude?:THREE.Object3D;onLand?:()=>void}){
  this.finish(options.now);
  const nodes=arrivals(root,before,options.exclude);if(!nodes.length)return false;
  root.updateWorldMatrix(true,true);
  const part=new THREE.Box3();for(const n of nodes)part.expandByObject(n);if(part.isEmpty())return false;
  const car=new THREE.Box3().setFromObject(root),centre=part.getCenter(new THREE.Vector3()),carCentre=car.getCenter(new THREE.Vector3());
  this.onLand=options.onLand;this.played++;this.names=nodes.slice(0,12).map(n=>n.name||n.type);
  if(options.lights){this.land(options.now,false,true);return true}
  // Out from the car's centre and up a little; a whole-body part (centre on the car's centre) drops from above.
  const out=centre.clone().sub(carCentre).setY(0),offset=out.length()>.15?out.normalize().multiplyScalar(OUTWARD).setY(LIFT):new THREE.Vector3(0,DROP,0);
  options.camera.getWorldPosition(this.eye);this.carCentre.copy(carCentre);
  for(const node of nodes){
   const parent=node.parent!,a=node.getWorldPosition(new THREE.Vector3()),b=a.clone().add(offset);parent.worldToLocal(a);parent.worldToLocal(b);
   const piece={node,home:node.position.clone(),lift:b.sub(a)};node.position.add(piece.lift);this.pieces.push(piece);
  }
  this.start=options.now;this.sparkOnLand=true;this.flareOnLand=false;return true;
 }
 /** Advance; returns the light gain for the ignition flare (1 when idle). */
 update(now:number){
  if(this.pieces.length){
   const t=Math.min(1,(now-this.start)/FLY_MS),k=1-easeOutBack(t);
   for(const p of this.pieces)p.node.position.copy(p.home).addScaledVector(p.lift,k);
   if(t>=1)this.land(now,this.sparkOnLand,this.flareOnLand);
  }
  const dt=Math.min(.05,Math.max(0,(now-this.last)/1000));this.last=now;
  if(this.sparks?.visible){
   const age=(now-this.sparkAt)/1000;
   if(age>=SPARK_LIFE)this.sparks.visible=false;
   else{
    const position=this.sparks.geometry.getAttribute('position') as THREE.BufferAttribute,colour=this.sparks.geometry.getAttribute('color') as THREE.BufferAttribute,fade=Math.pow(1-age/SPARK_LIFE,1.6);
    for(let i=0;i<SPARKS;i++){const v=i*3;this.velocity[v+1]-=5.5*dt;for(let j=0;j<3;j++){this.velocity[v+j]*=1-2.2*dt;position.array[v+j]+=this.velocity[v+j]*dt}colour.setXYZ(i,fade*1.6,fade*(.55+.45*fade),fade*fade*.5)}
    position.needsUpdate=colour.needsUpdate=true;
   }
  }
  if(this.flareAt<0)return 1;
  const u=(now-this.flareAt)/1000;if(u>=FLARE_S){this.flareAt=-1;return 1}
  // Ignition: dark, flash, dip, then a bright glow that eases back to normal.
  return u<.05?.12:u<.1?2.1:u<.16?.35:1+1.5*Math.exp(-(u-.16)*6);
 }
 /** Put everything home now and fire any pending landing (sound/stamp), e.g. when another change arrives. */
 finish(now=performance.now()){if(this.pieces.length)this.land(now,false,false);this.flareAt=-1}
 get busy(){return this.pieces.length>0}
 private names:string[]=[];
 inspect(){return {played:this.played,parts:this.names,flying:this.pieces.length,sparks:!!this.sparks?.visible,flare:this.flareAt>=0}}
 dispose(){this.finish();if(this.sparks){this.sparks.geometry.dispose();const m=this.sparks.material as THREE.PointsMaterial;m.map?.dispose();m.dispose();this.sparks.removeFromParent()}}
 private land(now:number,sparks:boolean,flare:boolean){
  for(const p of this.pieces)p.node.position.copy(p.home);
  if(sparks)this.burst(now);this.pieces=[];if(flare)this.flareAt=now;
  const done=this.onLand;this.onLand=undefined;done?.();
 }
 private burst(now:number){
  if(!this.sparks){
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(SPARKS*3),3));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(SPARKS*3),3));
   this.sparks=new THREE.Points(g,new THREE.PointsMaterial({name:'install_sparks',size:.07,map:sparkTexture(),vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
   this.sparks.name='install_sparks';this.sparks.frustumCulled=false;this.sparks.renderOrder=10;this.scene.add(this.sparks);
  }
  // Sparks leave from the seated components themselves (each spring, pipe, panel), on the side facing the viewer,
  // heading away from the car's centre.
  const sources:THREE.Box3[]=[];for(const p of this.pieces){p.node.updateWorldMatrix(true,true);p.node.traverseVisible(o=>{if((o as THREE.Mesh).isMesh){const box=new THREE.Box3().setFromObject(o);if(!box.isEmpty())sources.push(box)}})}
  const stride=Math.max(1,Math.floor(sources.length/12)),picked=sources.filter((_,i)=>i%stride===0).slice(0,12);
  const position=this.sparks.geometry.getAttribute('position') as THREE.BufferAttribute,from=new THREE.Vector3(),centre=new THREE.Vector3(),out=new THREE.Vector3(),dir=new THREE.Vector3();
  for(let i=0;i<SPARKS;i++){
   const box=picked[i%picked.length];if(box){box.getCenter(centre);box.clampPoint(this.eye,from).lerp(centre,.35)}else from.copy(this.carCentre);
   position.setXYZ(i,from.x,from.y,from.z);out.copy(from).sub(this.carCentre).setY(0);if(out.lengthSq()<1e-4)out.set(0,0,0);else out.normalize();
   dir.set(Math.random()*2-1,Math.random()*.9+.2,Math.random()*2-1).normalize().addScaledVector(out,.8).normalize().multiplyScalar(1.4+Math.random()*2.2);
   dir.toArray(this.velocity,i*3);
  }
  position.needsUpdate=true;this.sparkAt=this.last=now;this.sparks.visible=true;
 }
}
