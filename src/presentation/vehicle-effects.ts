import {isRyker} from './ryker';
import {visualWheel,rykerWheels} from './ryker-contacts';
import * as THREE from 'three';
import {perfLegacy} from './perf-switches';
import type {VehicleTelemetry} from '../simulation';
import {GRAPHICS_PRESETS,type GraphicsQuality} from './graphics-settings';
import {loadKTX2} from './ktx2';
import {EFFECT_SPRITES,effectAssetURLs} from './effect-assets';
import {VehicleEffectState,tireActivity,skidActivity} from './vehicle-effect-state';

const UP=new THREE.Vector3(0,1,0),ONE=new THREE.Vector3(1,1,1),RING_Q=new THREE.Quaternion().setFromAxisAngle(UP,Math.PI/2);
const PARTICLE_ATTRIBUTES=['position','aBirth','aLife','aSize'] as const;
const VERTEX=`attribute float aBirth;attribute float aLife;attribute float aSize;uniform float time;uniform float pixels;varying float age;varying float life;
void main(){age=max(0.,time-aBirth);life=aLife;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=(age<aLife&&aLife>0.)?clamp(aSize*pixels/max(1.,-p.z),1.,220.):0.;}`;
const FRAGMENT=`uniform sampler2D atlas;uniform float ready;uniform float frames;uniform float fps;uniform float kind;uniform vec3 tint;uniform float opacity;varying float age;varying float life;
void main(){if(age>=life||life<=0.)discard;vec2 uv=vec2(gl_PointCoord.x,1.-gl_PointCoord.y);float frame=min(frames-1.,floor(age*fps));vec2 cell=vec2(mod(frame,8.),floor(frame/8.));vec4 s=ready>.5?texture2D(atlas,(cell+clamp(uv,vec2(.002),vec2(.998)))/8.):vec4(1.,1.,1.,pow(max(0.,1.-length(uv-.5)*2.),2.));
// The authored spray atlas supplies breakup inside a soft mist envelope. Its
// radial spikes must not read as bright snowflakes behind the tires.
if(kind==3.){vec2 p=uv-.5;float mist=pow(max(0.,1.-length(p*vec2(1.3,1.))*2.),3.);float drop=exp(-p.x*p.x*1600.-p.y*p.y*70.);s=vec4(vec3(.85),(.28*mist+.18*drop)*(.65+.35*s.a));}
float fade=smoothstep(0.,.08,age)*(1.-smoothstep(life*.55,life,age));gl_FragColor=vec4(s.rgb*tint,s.a*fade*opacity);if(gl_FragColor.a<.008)discard;
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;

/** Fixed-size GPU sprite batch, shared by every car. No particle objects are created while driving. */
class ParticlePool {
 readonly points:THREE.Points;private geometry=new THREE.BufferGeometry();private material:THREE.ShaderMaterial;
 private position:Float32Array;private velocity:Float32Array;private birth:Float32Array;private life:Float32Array;private size:Float32Array;private cursor=0;emitted=0;
 constructor(readonly kind:number,readonly capacity=160){
  this.position=new Float32Array(capacity*3);this.velocity=new Float32Array(capacity*3);this.birth=new Float32Array(capacity);this.life=new Float32Array(capacity);this.size=new Float32Array(capacity);
  for(const [name,array,itemSize]of [['position',this.position,3],['aBirth',this.birth,1],['aLife',this.life,1],['aSize',this.size,1]] as const)this.geometry.setAttribute(name,new THREE.BufferAttribute(array,itemSize).setUsage(THREE.DynamicDrawUsage));
  const tint=['#b1b7bc','#ae9271','#b88443','#b5d4e5','#ffbe65','#ffbe70'][kind];
  this.material=new THREE.ShaderMaterial({name:'RoadEffect-'+EFFECT_SPRITES[kind],vertexShader:VERTEX,fragmentShader:FRAGMENT,uniforms:{time:{value:0},pixels:{value:900},atlas:{value:null},ready:{value:0},frames:{value:kind===5?16:64},fps:{value:kind===5?40:30},kind:{value:kind},tint:{value:new THREE.Color(tint)},opacity:{value:kind===3?.48:kind>=4?1:.55}},transparent:true,depthWrite:false,blending:kind>=4?THREE.AdditiveBlending:THREE.NormalBlending});
  this.points=new THREE.Points(this.geometry,this.material);this.points.name='pooled-'+EFFECT_SPRITES[kind];this.points.frustumCulled=false;this.points.visible=false;this.points.renderOrder=3;
 }
 texture(t:THREE.Texture){this.material.uniforms.atlas.value=t;this.material.uniforms.ready.value=1}
 emit(p:THREE.Vector3,v:THREE.Vector3,time:number,size:number,life:number){
  const i=this.cursor++%this.capacity,j=i*3,scatter=this.kind===5?0:.22;this.position[j]=p.x;this.position[j+1]=p.y;this.position[j+2]=p.z;this.velocity[j]=v.x+Math.sin(this.emitted*2.39)*scatter;this.velocity[j+1]=v.y;this.velocity[j+2]=v.z+Math.cos(this.emitted*1.73)*scatter;this.birth[i]=time;this.life[i]=life;this.size[i]=size;this.emitted++;
 }
 update(time:number,dt:number,pixels:number,enabled:boolean){
  let active=0;for(let i=0;i<this.capacity;i++){if(this.life[i]<=0||time-this.birth[i]>=this.life[i])continue;active++;const j=i*3;this.position[j]+=this.velocity[j]*dt;this.position[j+1]+=this.velocity[j+1]*dt;this.position[j+2]+=this.velocity[j+2]*dt;this.velocity[j+1]+=dt*(this.kind===4?-6:this.kind===2?-1.4:this.kind===3?-1.2:.15)}
  this.points.visible=enabled&&active>0;this.material.uniforms.time.value=time;this.material.uniforms.pixels.value=pixels;
  for(const name of PARTICLE_ATTRIBUTES)this.geometry.getAttribute(name).needsUpdate=true;
 }
 clear(){this.life.fill(0);this.points.visible=false}
 dispose(){this.points.removeFromParent();this.geometry.dispose();this.material.dispose()}
}

/** One persistent session decal buffer. Overwrites the oldest segment at the bounded capacity. */
export class SkidBuffer {
 readonly mesh:THREE.Mesh;private geometry=new THREE.BufferGeometry();private positions:Float32Array;private cursor=0;count=0;
 constructor(readonly capacity=3072){
  this.positions=new Float32Array(capacity*18);this.geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3).setUsage(THREE.DynamicDrawUsage));
  this.mesh=new THREE.Mesh(this.geometry,new THREE.MeshBasicMaterial({color:0x101014,transparent:true,opacity:.26,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:!perfLegacy('transparency'),polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));this.mesh.name='session-skid-marks';this.mesh.frustumCulled=false;this.geometry.setDrawRange(0,0);
 }
 add(a:THREE.Vector3,b:THREE.Vector3,width:number){
  const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d<.08||d>2.5)return false;
  const sx=dz/d*width/2,sz=-dx/d*width/2,i=(this.cursor++%this.capacity)*18,p=this.positions;
  p[i]=a.x-sx;p[i+1]=a.y+.012;p[i+2]=a.z-sz;p[i+3]=a.x+sx;p[i+4]=a.y+.012;p[i+5]=a.z+sz;p[i+6]=b.x+sx;p[i+7]=b.y+.012;p[i+8]=b.z+sz;
  p[i+9]=a.x-sx;p[i+10]=a.y+.012;p[i+11]=a.z-sz;p[i+12]=b.x+sx;p[i+13]=b.y+.012;p[i+14]=b.z+sz;p[i+15]=b.x-sx;p[i+16]=b.y+.012;p[i+17]=b.z-sz;
  this.count=Math.min(this.capacity,this.count+1);this.geometry.setDrawRange(0,this.count*6);this.geometry.getAttribute('position').needsUpdate=true;return true;
 }
 dispose(){this.mesh.removeFromParent();this.geometry.dispose();(this.mesh.material as THREE.Material).dispose()}
}

export interface EffectCar {id:string;root:THREE.Object3D;exhaust:boolean}
export type ContactReader=(id:string,point:THREE.Vector3)=>boolean;
/** All road modes share this telemetry-only presentation. Simulation time freezes effects on pause. */
export class VehicleEffects {
 readonly group=new THREE.Group();readonly heatHaze=new THREE.Vector4();readonly skids=new SkidBuffer();
 private pools=EFFECT_SPRITES.map((_,i)=>new ParticlePool(i));private textures:THREE.Texture[]=[];private disposed=false;
 private cars:{spec:EffectCar;ryker:boolean;state:VehicleEffectState;lastTime:number;lastSpeed:number;anchors:THREE.Vector3[];marking:boolean[];budget:Float32Array;contactBudget:number;outlets:THREE.Vector3[]}[];
 private q=new THREE.Quaternion();private steering=new THREE.Quaternion();private p=new THREE.Vector3();private v=new THREE.Vector3();private point=new THREE.Vector3();private matrix=new THREE.Matrix4();private time=0;
 private glow:THREE.InstancedMesh;private cones:THREE.InstancedMesh;private heat:THREE.InstancedBufferAttribute;private loaded=0;private skipped=0;private quality:GraphicsQuality='high';private reduced=false;
 constructor(scene:THREE.Scene,cars:EffectCar[],private readContact:ContactReader=()=>false,readonly enabled=true){
  this.group.name='vehicle-world-effects';scene.add(this.group);for(const pool of this.pools)this.group.add(pool.points);this.group.add(this.skids.mesh);
  // Authored outlet centers: build-p08b-art.py. The mounted product's transform
  // carries the donor-specific offset, so emissions follow the fitted geometry.
  this.cars=cars.map(spec=>{const product=spec.root.getObjectByName('product_SM-7720');spec.root.updateWorldMatrix(true,true);const outlets=isRyker(spec.root)?[new THREE.Vector3(.143,.247,.585)]:[new THREE.Vector3(-.46,.66,1.42),new THREE.Vector3(.46,.66,1.42)];if(product)for(const p of outlets)spec.root.worldToLocal(product.localToWorld(p));return{spec,ryker:isRyker(spec.root),state:new VehicleEffectState(),lastTime:-1,lastSpeed:0,anchors:[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()],marking:[false,false,false],budget:new Float32Array(3),contactBudget:0,outlets}});
  const g=new THREE.RingGeometry(.085,.158,24);this.heat=new THREE.InstancedBufferAttribute(new Float32Array(cars.length*3),1);g.setAttribute('heat',this.heat);
  this.glow=new THREE.InstancedMesh(g,new THREE.ShaderMaterial({vertexShader:'attribute float heat;varying float h;void main(){h=heat;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',fragmentShader:'varying float h;void main(){if(h<.01)discard;gl_FragColor=vec4(vec3(3.,.18,.015)*h,h*.5);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}),cars.length*3);this.glow.name='pooled-hot-brake-discs';this.glow.frustumCulled=false;this.group.add(this.glow);
  const cone=new THREE.ConeGeometry(1.2,9,16,1,true);cone.translate(0,-4.5,0);cone.rotateX(Math.PI/2);
  this.cones=new THREE.InstancedMesh(cone,new THREE.ShaderMaterial({vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;void main(){float d=clamp(-p.z/9.,0.,1.);float a=.012*smoothstep(0.,.12,d)*(1.-d)*(1.-d);gl_FragColor=vec4(.68,.79,1.,a);}',transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}),cars.length*2);this.cones.name='pooled-headlight-fog';this.cones.frustumCulled=false;this.group.add(this.cones);
 }
 async loadTextures(renderer:THREE.WebGLRenderer){if(!this.enabled)return;await Promise.all(effectAssetURLs().map(async(url,i)=>{try{const t=await loadKTX2(renderer,url,{srgb:true,repeat:false,anisotropy:1});if(this.disposed){t.dispose();return}t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;this.textures.push(t);this.pools[i].texture(t);this.loaded++}catch{this.skipped++}}))}
 /** Compile all pooled materials behind the existing loading veil, before their first burst. */
 prepare(){if(!this.enabled)return;this.group.visible=true;for(const pool of this.pools)pool.points.visible=true;this.glow.visible=true;this.cones.visible=true}
 update(field:Record<string,VehicleTelemetry>,camera:THREE.PerspectiveCamera,pixels:number,quality:GraphicsQuality,wet:boolean,lamps:boolean,reduced:boolean,reset=false){
  this.quality=quality;this.reduced=reduced;const preset=GRAPHICS_PRESETS[quality],density=this.enabled?preset.vehicleEffects:0;this.group.visible=density>0;this.heatHaze.set(0,0,0,0);if(!this.enabled)return;
  let advance=0,glowing=false;
  for(let ci=0;ci<this.cars.length;ci++){
   const c=this.cars[ci],t=field[c.spec.id];if(!t)continue;const restart=reset||c.lastTime<0||t.time<c.lastTime,dt=restart?0:Math.max(0,Math.min(.1,t.time-c.lastTime));c.lastTime=t.time;advance=Math.max(advance,dt);
   if(restart){c.state.reset(t);c.marking.fill(false);c.budget.fill(0);c.contactBudget=0}
   c.state.update(t,dt,c.spec.exhaust&&!c.ryker,reduced);this.q.set(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w);
   const ryker=c.ryker,rival=c.spec.id!=='player',rate=density*(rival?.28:1),speed=Math.abs(t.speed);
   for(let wi=0;wi<3;wi++){
    const w=t.wheels[wi];if(!w)continue;
    visualWheel(this.p,wi,w.localCenter,ryker);this.p.y-=ryker?rykerWheels[wi].radius:(wi===2?.3455:.32985);this.p.applyQuaternion(this.q).add(t.position);
    const activity=tireActivity(w,t.speed,wet),kind=w.surface!=='asphalt'?1:wet?3:0;
    if(dt>0&&rate>0&&activity>0){c.budget[wi]+=dt*activity*rate*(kind===3?28:9);if(c.budget[wi]>=1){c.budget[wi]--;this.v.set(t.velocity.x*.08,.35+speed*.025,t.velocity.z*.08);this.point.copy(this.p);this.point.y+=.04;this.pools[kind].emit(this.point,this.v,this.time,kind===3?.8+speed*.03:1.4,kind===3?.8:1.9);if(kind===1&&w.surface==='grass'&&quality!=='low')this.pools[2].emit(this.point,this.v,this.time,.28,1.2)}}else if(!activity)c.budget[wi]=0;
    const skid=density>0&&skidActivity(w,t.speed,wet)>.22;
    if(dt>0&&skid){if(c.marking[wi]){const distance=c.anchors[wi].distanceTo(this.p);if(this.skids.add(c.anchors[wi],this.p,ryker?(wi===2?.168:.135):(wi===2?.27:.19))||distance>2.5)c.anchors[wi].copy(this.p)}else c.anchors[wi].copy(this.p)}c.marking[wi]=skid&&dt>0;
    const heat=lamps?Math.max(0,c.state.heat-.24)*1.25:0;this.heat.setX(ci*3+wi,heat);glowing||=heat>.01;
    visualWheel(this.point,wi,w.localCenter,ryker);this.point.x+=(wi===0?1:-1)*(ryker?.035:.09);this.point.applyQuaternion(this.q).add(t.position);this.steering.setFromAxisAngle(UP,w.steer).premultiply(this.q).multiply(RING_Q);this.matrix.compose(this.point,this.steering,ONE);this.glow.setMatrixAt(ci*3+wi,this.matrix);
   }
   const impact=!restart&&c.lastSpeed-speed>3;c.lastSpeed=speed;
   if(dt>0&&rate>0&&(speed>3||impact)){c.contactBudget+=dt;if(c.contactBudget>.075||impact){c.contactBudget=0;if(this.readContact(c.spec.id,this.point)){this.v.set(-t.velocity.x*.08,.7,-t.velocity.z*.08);this.pools[4].emit(this.point,this.v,this.time,.6,.45)}}}
   if(c.state.flame&&rate>0)for(const outlet of c.outlets){this.point.copy(outlet).applyQuaternion(this.q).add(t.position);this.v.set(0,.03,.7).applyQuaternion(this.q);this.pools[5].emit(this.point,this.v,this.time,.35,.4)}
   for(let side=0;side<2;side++){this.point.set((side?1:-1)*(ryker?.10:.58),ryker?.7:.55,ryker?-.65:-1.6).applyQuaternion(this.q).add(t.position);this.matrix.compose(this.point,this.q,ONE);this.cones.setMatrixAt(ci*2+side,this.matrix)}
   if(!rival&&c.spec.exhaust&&!reduced&&preset.exhaustShimmer&&density>0&&t.rpm>2200){this.point.copy(c.outlets[0]);if(!ryker)this.point.x=0;this.point.y+=.12;this.point.z+=.35;this.point.applyQuaternion(this.q).add(t.position);this.p.copy(this.point).project(camera);if(this.p.z>0&&this.p.z<1){const size=.7/Math.max(2,camera.position.distanceTo(this.point));this.heatHaze.set(this.p.x*.5+.5,this.p.y*.5+.5,size,Math.min(1,(t.rpm-2200)/4000))}}
  }
  if(reset)for(const pool of this.pools)pool.clear();this.time+=advance;
  for(const pool of this.pools)pool.update(this.time,advance,pixels,density>0);
  this.glow.visible=density>0&&glowing;this.cones.visible=density>0&&lamps&&preset.headlightFog;this.glow.instanceMatrix.needsUpdate=true;this.cones.instanceMatrix.needsUpdate=true;this.heat.needsUpdate=true;
 }
 inspect(){return{enabled:this.enabled,quality:this.quality,reducedMotion:this.reduced,loadedTextures:this.loaded,skippedTextures:this.skipped,skidSegments:this.skids.count,skidCapacity:this.skids.capacity,particles:this.pools.map((p,i)=>({kind:EFFECT_SPRITES[i],emitted:p.emitted,visible:p.points.visible,capacity:p.capacity})),brakeHeat:this.cars.map(c=>({id:c.spec.id,heat:c.state.heat})),headlightFog:this.cones.visible,heatHaze:this.heatHaze.w,drawCallCeiling:9}}
 dispose(){this.disposed=true;for(const p of this.pools)p.dispose();this.skids.dispose();this.textures.forEach(t=>t.dispose());for(const m of [this.glow,this.cones]){m.geometry.dispose();(m.material as THREE.Material).dispose()}this.group.removeFromParent()}
}
