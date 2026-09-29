import * as THREE from 'three';
/**
 * Wet tyre spray (graphics pass 2, handoff/GRAPHICS-AUDIT.md). Replaces the round point sprites, which could not stretch and
 * were tinted a fixed light blue, so spray read as glowing hover-thruster orbs on a dark wet road. Each particle is now a
 * quad along its own velocity (a streak that lengthens with speed and spreads with age), broken up by noise, and lit by
 * the scene's haze colour, and fades out close to the chase camera (it trails back towards it and would fill the lens).
 * Same fixed pool, one draw, same emit/update contract as the other road effects.
 */
const VERTEX=`attribute vec3 iPos;attribute vec3 iVel;attribute float iBirth;attribute float iLife;attribute float iSize;attribute float iSeed;
uniform float time;uniform float near;varying vec2 vUv;varying float vFade;varying float vSeed;
void main(){
 float age=time-iBirth;
 if(iLife<=0.||age<0.||age>=iLife){gl_Position=vec4(2.,2.,2.,1.);return;}
 float k=age/iLife;vec4 c=viewMatrix*vec4(iPos,1.);vec3 vel=mat3(viewMatrix)*iVel;float speed=length(iVel);
 vec3 a=speed>.5?normalize(vel):vec3(0.,1.,0.);vec3 w=cross(a,normalize(-c.xyz));w=length(w)>1e-3?normalize(w):vec3(1.,0.,0.);
 float len=iSize*(.6+.9*k)*(1.+min(speed,60.)*.02),wid=iSize*(.3+.5*k);
 gl_Position=projectionMatrix*vec4(c.xyz+a*position.x*len+w*position.y*wid,1.);
 vUv=position.xy;vFade=smoothstep(0.,.12,k)*(1.-smoothstep(.4,1.,k))*smoothstep(near,near*2.5,-c.z);vSeed=iSeed;
}`;
const FRAGMENT=`uniform vec3 light;uniform float opacity;varying vec2 vUv;varying float vFade;varying float vSeed;
float sprayHash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float sprayNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(sprayHash(i),sprayHash(i+vec2(1.,0.)),f.x),mix(sprayHash(i+vec2(0.,1.)),sprayHash(i+vec2(1.,1.)),f.x),f.y);}
void main(){
 float body=exp(-vUv.x*vUv.x*2.4-vUv.y*vUv.y*5.);
 float breakup=sprayNoise(vUv*vec2(2.5,6.)+vSeed*17.)*.6+sprayNoise(vUv*vec2(7.,14.)+vSeed*31.)*.4;
 float a=body*smoothstep(.25,.85,breakup)*vFade*opacity;if(a<.004)discard;
 gl_FragColor=vec4(light*(.75+.25*breakup),a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
const ATTRIBUTES=['iPos','iVel','iBirth','iLife','iSize','iSeed'] as const;
export class SprayPool {
 readonly points:THREE.Mesh;private geometry=new THREE.InstancedBufferGeometry();private material:THREE.ShaderMaterial;
 private position:Float32Array;private velocity:Float32Array;private birth:Float32Array;private life:Float32Array;private size:Float32Array;private seed:Float32Array;private cursor=0;emitted=0;
 constructor(readonly capacity=160){
  this.position=new Float32Array(capacity*3);this.velocity=new Float32Array(capacity*3);this.birth=new Float32Array(capacity);this.life=new Float32Array(capacity);this.size=new Float32Array(capacity);this.seed=new Float32Array(capacity);
  this.geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));this.geometry.setIndex([0,1,2,0,2,3]);
  for(const [name,array,itemSize]of [['iPos',this.position,3],['iVel',this.velocity,3],['iBirth',this.birth,1],['iLife',this.life,1],['iSize',this.size,1],['iSeed',this.seed,1]] as const)this.geometry.setAttribute(name,new THREE.InstancedBufferAttribute(array,itemSize).setUsage(THREE.DynamicDrawUsage));
  this.geometry.instanceCount=capacity;
  this.material=new THREE.ShaderMaterial({name:'RoadEffect-wet-spray',vertexShader:VERTEX,fragmentShader:FRAGMENT,uniforms:{time:{value:0},near:{value:3},light:{value:new THREE.Color(.3,.33,.36)},opacity:{value:.34}},transparent:true,depthWrite:false,side:THREE.DoubleSide});
  this.points=new THREE.Mesh(this.geometry,this.material);this.points.name='pooled-water-rooster-tail';this.points.frustumCulled=false;this.points.visible=false;this.points.renderOrder=3;
 }
 /** The authored splash atlas is not used: its radial spikes read as snowflakes. */
 texture(_t:THREE.Texture){}
 /** Spray is lit like the air around it: the route's haze colour, scaled. */
 setLight(color:THREE.Color,scale=.9){this.material.uniforms.light.value.copy(color).multiplyScalar(scale)}
 emit(p:THREE.Vector3,v:THREE.Vector3,time:number,size:number,life:number){
  const i=this.cursor++%this.capacity,j=i*3;this.position[j]=p.x;this.position[j+1]=p.y;this.position[j+2]=p.z;
  this.velocity[j]=v.x+Math.sin(this.emitted*2.39)*.22;this.velocity[j+1]=v.y;this.velocity[j+2]=v.z+Math.cos(this.emitted*1.73)*.22;
  this.birth[i]=time;this.life[i]=life;this.size[i]=size;this.seed[i]=(this.emitted*.618034)%1;this.emitted++;
 }
 update(time:number,dt:number,_pixels:number,enabled:boolean){
  let active=0;for(let i=0;i<this.capacity;i++){if(this.life[i]<=0||time-this.birth[i]>=this.life[i])continue;active++;const j=i*3;this.position[j]+=this.velocity[j]*dt;this.position[j+1]+=this.velocity[j+1]*dt;this.position[j+2]+=this.velocity[j+2]*dt;this.velocity[j+1]-=dt*1.2}
  this.points.visible=enabled&&active>0;this.material.uniforms.time.value=time;
  for(const name of ATTRIBUTES)(this.geometry.getAttribute(name) as THREE.InstancedBufferAttribute).needsUpdate=true;
 }
 clear(){this.life.fill(0);this.points.visible=false}
 dispose(){this.points.removeFromParent();this.geometry.dispose();this.material.dispose()}
}
