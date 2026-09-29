import * as THREE from 'three';
/**
 * Drift sparks (Phase 4B): a stream off the rear tyre while an arcade drift charges, coloured by tier
 * (white -> orange -> SlingMods red), plus a short burst when the boost fires. One draw, additive.
 * Graphics pass 3: each spark is a short streak along its velocity (motion blur), not a 5.5 cm point, so the tier
 * colour reads at chase distance. It stays in the scene with nothing to draw so its shader compiles behind the
 * loading veil, not mid-race.
 */
const CAPACITY=220,LIFE=.38;
export const DRIFT_TIER_COLORS=['#ffffff','#ffffff','#ff9a2e','#ff3b2f'] as const;
const VERTEX=`attribute vec3 iPos;attribute vec3 iVel;attribute vec3 iColor;varying vec2 vUv;varying vec3 vColor;
void main(){
 if(iColor.r+iColor.g+iColor.b<=0.){gl_Position=vec4(2.,2.,2.,1.);return;}
 vec4 c=viewMatrix*vec4(iPos,1.);vec3 vel=mat3(viewMatrix)*iVel;float speed=length(vel);
 vec3 a=speed>.05?vel/speed:vec3(0.,1.,0.);vec3 w=cross(a,normalize(-c.xyz));w=length(w)>1e-3?normalize(w):vec3(1.,0.,0.);
 gl_Position=projectionMatrix*vec4(c.xyz+a*position.x*(.04+speed*.03)+w*position.y*.018,1.);vUv=position.xy;vColor=iColor;
}`;
const FRAGMENT=`varying vec2 vUv;varying vec3 vColor;
void main(){float a=exp(-vUv.y*vUv.y*5.)*(1.-smoothstep(.55,1.,abs(vUv.x)));if(a<.01)discard;gl_FragColor=vec4(vColor*a,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export class DriftSparks {
 readonly points:THREE.Mesh;private geometry=new THREE.InstancedBufferGeometry();private position=new Float32Array(CAPACITY*3);private colour=new Float32Array(CAPACITY*3);private velocity=new Float32Array(CAPACITY*3);private tint=new Float32Array(CAPACITY*3);private born=new Float32Array(CAPACITY).fill(-9);private next=0;private time=0;private carry=0;private c=new THREE.Color();
 constructor(scene:THREE.Scene){
  const g=this.geometry;g.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));g.setIndex([0,1,2,0,2,3]);
  g.setAttribute('iPos',new THREE.InstancedBufferAttribute(this.position,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('iVel',new THREE.InstancedBufferAttribute(this.velocity,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('iColor',new THREE.InstancedBufferAttribute(this.colour,3).setUsage(THREE.DynamicDrawUsage));g.instanceCount=0;
  this.points=new THREE.Mesh(g,new THREE.ShaderMaterial({name:'drift_sparks',vertexShader:VERTEX,fragmentShader:FRAGMENT,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
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
  const g=this.geometry;for(const name of['iPos','iVel','iColor'])(g.getAttribute(name) as THREE.InstancedBufferAttribute).needsUpdate=true;g.instanceCount=alive?CAPACITY:0;
 }
 /** Boost fired: one bright burst in the tier colour. */
 burst(at:THREE.Vector3,velocity:THREE.Vector3,tier:number){for(let i=0;i<36;i++)this.emit(at,velocity,tier,3.2)}
 clear(){this.born.fill(-9);this.colour.fill(0);this.geometry.instanceCount=0}
 dispose(){this.points.removeFromParent();this.geometry.dispose();(this.points.material as THREE.Material).dispose()}
}
