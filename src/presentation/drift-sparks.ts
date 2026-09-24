import * as THREE from 'three';
/**
 * Drift sparks (Phase 4B): a stream off the rear tyre while an arcade drift charges, coloured by tier
 * (white -> orange -> SlingMods red), plus a short burst when the boost fires. One draw, additive points.
 * It stays in the scene with nothing to draw so its shader compiles behind the loading veil, not mid-race.
 */
const CAPACITY=220,LIFE=.38;
export const DRIFT_TIER_COLORS=['#ffffff','#ffffff','#ff9a2e','#ff3b2f'] as const;
function texture(){const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d')!,r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.3,'rgba(255,255,255,.75)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
export class DriftSparks {
 readonly points:THREE.Points;private position=new Float32Array(CAPACITY*3);private colour=new Float32Array(CAPACITY*3);private velocity=new Float32Array(CAPACITY*3);private tint=new Float32Array(CAPACITY*3);private born=new Float32Array(CAPACITY).fill(-9);private next=0;private time=0;private carry=0;private c=new THREE.Color();
 constructor(scene:THREE.Scene){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.position,3));g.setAttribute('color',new THREE.BufferAttribute(this.colour,3));
  this.points=new THREE.Points(g,new THREE.PointsMaterial({name:'drift_sparks',size:.055,map:texture(),vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  this.points.name='drift_sparks';this.points.frustumCulled=false;this.points.renderOrder=9;scene.add(this.points);
 }
 private emit(at:THREE.Vector3,drift:THREE.Vector3,tier:number,spread:number){const i=this.next;this.next=(this.next+1)%CAPACITY;const k=i*3;at.toArray(this.position,k);
  this.velocity[k]=drift.x*.55+(Math.random()*2-1)*spread;this.velocity[k+1]=Math.random()*1.6+.4;this.velocity[k+2]=drift.z*.55+(Math.random()*2-1)*spread;
  this.c.set(DRIFT_TIER_COLORS[tier]).toArray(this.tint,k);this.born[i]=this.time}
 /** `rate` sparks per second from the rear contact while drifting (0 = none). */
 update(dt:number,at:THREE.Vector3|null,velocity:THREE.Vector3,tier:number,rate:number){
  this.time+=dt;if(at&&rate>0){this.carry+=rate*dt;while(this.carry>=1){this.carry--;this.emit(at,velocity,Math.max(1,tier),1.2)}}
  let alive=0;for(let i=0;i<CAPACITY;i++){const k=i*3,age=this.time-this.born[i];if(age>=LIFE){this.colour[k]=this.colour[k+1]=this.colour[k+2]=0;continue}alive++;
   this.velocity[k+1]-=6*dt;for(let j=0;j<3;j++)this.position[k+j]+=this.velocity[k+j]*dt;const f=1.8*(1-age/LIFE)**1.5;this.colour[k]=this.tint[k]*f;this.colour[k+1]=this.tint[k+1]*f;this.colour[k+2]=this.tint[k+2]*f}
  const g=this.points.geometry;(g.getAttribute('position') as THREE.BufferAttribute).needsUpdate=true;(g.getAttribute('color') as THREE.BufferAttribute).needsUpdate=true;g.setDrawRange(0,alive?CAPACITY:0);
 }
 /** Boost fired: one bright burst in the tier colour. */
 burst(at:THREE.Vector3,velocity:THREE.Vector3,tier:number){for(let i=0;i<36;i++)this.emit(at,velocity,tier,3.2)}
 clear(){this.born.fill(-9);this.colour.fill(0);this.points.geometry.setDrawRange(0,0)}
 dispose(){this.points.removeFromParent();this.points.geometry.dispose();const m=this.points.material as THREE.PointsMaterial;m.map?.dispose();m.dispose()}
}
