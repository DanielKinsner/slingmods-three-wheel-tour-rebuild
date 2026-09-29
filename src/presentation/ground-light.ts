import * as THREE from 'three';
/**
 * Ground light (graphics pass 1, handoff/GRAPHICS-AUDIT.md). Ground and road materials only; no draw calls.
 *
 * - Headlight pools. The stock beams sit ~0.5 m up and meet the road at 1-3 degrees, so the physical spot lights add
 *   almost nothing to a matte road (measured +9% at Ridge blue hour). The pool lights the ground inside each beam.
 * - Baked scenery shade. One top-down texture, baked once at load: tree/rock sun shadows (R) and contact occlusion (G).
 *   Sun shade applies only outside the chase shadow map (it fades out inside), so tree shadows no longer appear ~25 m
 *   ahead of the car; contact occlusion applies everywhere, grounding trunks and rocks the real map never darkened.
 */
export type GroundCaster={x:number;z:number;/** Crown (or rock) vertical extent above the ground, metres. */low:number;high:number;radius:number;/** Sun shadow density 0-1. */opacity:number;/** Contact occlusion density 0-1 and radius. */contact:number;contactRadius:number};
export type GroundLamp={position:THREE.Vector3;direction:THREE.Vector3};
export type ChaseFrame={focus:THREE.Vector3;right:THREE.Vector3;up:THREE.Vector3;half:number};
export const MAX_POOLS=8;
const VERSION='ground-light-v1';

/** Where a caster's crown shadow lands (sun = unit vector towards the sun). Pure; unit tested. */
export function casterShadow(c:GroundCaster,sun:THREE.Vector3){
 const horizontal=Math.hypot(sun.x,sun.z),cot=horizontal/Math.max(.05,sun.y),dx=horizontal>1e-6?-sun.x/horizontal:1,dz=horizontal>1e-6?-sun.z/horizontal:0;
 const mid=(c.low+c.high)/2,half=(c.high-c.low)/2;
 return{x:c.x+dx*mid*cot,z:c.z+dz*mid*cot,major:Math.hypot(c.radius,half*cot),minor:c.radius,angle:Math.atan2(dz,dx),trunkX:c.x+dx*c.low*cot,trunkZ:c.z+dz*c.low*cot};
}

/** Square bake rectangle around every caster, with margin for shadows that fall outward. */
export function bakeRect(casters:readonly GroundCaster[],margin=80):[number,number,number]{
 let x0=Infinity,z0=Infinity,x1=-Infinity,z1=-Infinity;for(const c of casters){x0=Math.min(x0,c.x);z0=Math.min(z0,c.z);x1=Math.max(x1,c.x);z1=Math.max(z1,c.z)}
 if(!casters.length)return[0,0,1];const size=Math.max(x1-x0,z1-z0)+margin*2;return[(x0+x1)/2-size/2,(z0+z1)/2-size/2,size];
}

const FRAGMENT_HEAD=`varying vec3 glWorld;
uniform sampler2D glBake;uniform vec4 glBakeRect;uniform vec2 glBakeWeight;
uniform vec3 glNearFocus;uniform vec3 glNearRight;uniform vec3 glNearUp;uniform float glNearHalf;
uniform vec3 glPoolPos[${MAX_POOLS}];uniform vec3 glPoolDir[${MAX_POOLS}];uniform vec3 glPoolColor;uniform int glPoolCount;
vec2 glShade(){
 if(glBakeWeight.x+glBakeWeight.y<=0.)return vec2(1.);
 vec2 uv=(glWorld.xz-glBakeRect.xy)/glBakeRect.zw;if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))return vec2(1.);
 vec2 b=texture2D(glBake,uv).rg;vec3 d=glWorld-glNearFocus;float edge=max(abs(dot(d,glNearRight)),abs(dot(d,glNearUp)));
 float far=glNearHalf>0.?smoothstep(glNearHalf-7.,glNearHalf-1.,edge):1.;
 return vec2(mix(1.,b.r,glBakeWeight.x*far),mix(1.,b.g,glBakeWeight.y));
}
vec3 glPools(){
 vec3 sum=vec3(0.);
 for(int i=0;i<${MAX_POOLS};i++){if(i>=glPoolCount)break;vec3 v=glWorld-glPoolPos[i];float l=max(length(v),.001);sum+=vec3(smoothstep(.86,.975,dot(v/l,glPoolDir[i]))/(1.+(l*l)/256.));}
 return sum*glPoolColor;
}
`;

export class GroundLight {
 readonly uniforms={
  glBake:{value:null as THREE.Texture|null},glBakeRect:{value:new THREE.Vector4(0,0,1,1)},glBakeWeight:{value:new THREE.Vector2(0,0)},
  glNearFocus:{value:new THREE.Vector3()},glNearRight:{value:new THREE.Vector3(1,0,0)},glNearUp:{value:new THREE.Vector3(0,0,1)},glNearHalf:{value:0},
  glPoolPos:{value:Array.from({length:MAX_POOLS},()=>new THREE.Vector3())},glPoolDir:{value:Array.from({length:MAX_POOLS},()=>new THREE.Vector3(0,0,-1))},
  glPoolColor:{value:new THREE.Color(0,0,0)},glPoolCount:{value:0},
 };
 private originals=new Map<THREE.MeshStandardMaterial,{compile:THREE.Material['onBeforeCompile'];key:THREE.Material['customProgramCacheKey']}>();
 private texture?:THREE.CanvasTexture;private stats={casters:0,bakeMs:0,size:0,metresPerTexel:0};

 /** Chains onto each material's own shader edits (surface finish, forest floor, rally ruts). Standard materials only. */
 patch(...materials:readonly THREE.Material[]){
  for(const m of materials){
   if(!(m instanceof THREE.MeshStandardMaterial)||this.originals.has(m))continue;
   const compile=m.onBeforeCompile,key=m.customProgramCacheKey,previous=key.call(m);this.originals.set(m,{compile,key});
   m.onBeforeCompile=(shader,renderer)=>{compile.call(m,shader,renderer);
    // All three hooks or none: a half-applied patch would not compile.
    if(!shader.vertexShader.includes('#include <project_vertex>')||!['#include <lights_fragment_begin>','#include <aomap_fragment>'].every(k=>shader.fragmentShader.includes(k)))return;
    Object.assign(shader.uniforms,this.uniforms);
    shader.vertexShader='varying vec3 glWorld;\n'+shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
     #ifdef USE_INSTANCING
     glWorld=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;
     #else
     glWorld=(modelMatrix*vec4(transformed,1.)).xyz;
     #endif`);
    // Expanded here: onBeforeCompile runs before three resolves includes. Only the sun (the one directional light) is shaded.
    const lights=THREE.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight );\n\t\tdirectLight.color *= glShadeV.x;');
    shader.fragmentShader=FRAGMENT_HEAD+shader.fragmentShader.replace('#include <lights_fragment_begin>','vec2 glShadeV=glShade();\n'+lights).replace('#include <aomap_fragment>',`#include <aomap_fragment>
     reflectedLight.indirectDiffuse*=glShadeV.y;reflectedLight.indirectSpecular*=mix(1.,glShadeV.y,.6);
     reflectedLight.directDiffuse+=material.diffuseColor*glPools();`);
   };
   m.customProgramCacheKey=()=>previous+'|'+VERSION;m.needsUpdate=true;
  }
 }

 /** Bakes sun shadows and contact occlusion into one texture (browser only; runs behind the loading veil). */
 bake(casters:readonly GroundCaster[],sun:THREE.Vector3,rect=bakeRect(casters),size=2048,weights:{sun:number;contact:number}={sun:.9,contact:.6}){
  const started=performance.now(),[x0,z0,span]=rect,scale=size/span;
  const layer=()=>{const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d')!;g.fillStyle='#fff';g.fillRect(0,0,size,size);return{c,g}};
  const shade=layer(),contact=layer(),toX=(x:number)=>(x-x0)*scale,toY=(z:number)=>(z-z0)*scale;
  const blob=(g:CanvasRenderingContext2D,x:number,z:number,major:number,minor:number,angle:number,alpha:number)=>{
   if(alpha<=0||major*scale<.5)return;g.save();g.translate(toX(x),toY(z));g.rotate(angle);g.scale(Math.max(.5,major*scale),Math.max(.5,minor*scale));
   const r=g.createRadialGradient(0,0,0,0,0,1);r.addColorStop(0,`rgba(0,0,0,${alpha})`);r.addColorStop(.55,`rgba(0,0,0,${alpha*.92})`);r.addColorStop(1,'rgba(0,0,0,0)');
   g.fillStyle=r;g.beginPath();g.arc(0,0,1,0,Math.PI*2);g.fill();g.restore();
  };
  for(const c of casters){
   const s=casterShadow(c,sun);
   if(c.opacity>0){
    blob(shade.g,s.x,s.z,s.major,s.minor,s.angle,c.opacity);
    // Trunk: a thin line from the base to where the crown shadow starts.
    shade.g.strokeStyle=`rgba(0,0,0,${c.opacity*.5})`;shade.g.lineWidth=Math.max(1,c.radius*.12*scale);shade.g.beginPath();shade.g.moveTo(toX(c.x),toY(c.z));shade.g.lineTo(toX(s.trunkX),toY(s.trunkZ));shade.g.stroke();
   }
   blob(contact.g,c.x,c.z,c.contactRadius,c.contactRadius,0,c.contact);
   blob(contact.g,c.x,c.z,c.radius*1.05,c.radius*1.05,0,c.contact*.35);
  }
  const a=shade.g.getImageData(0,0,size,size),b=contact.g.getImageData(0,0,size,size),out=new ImageData(size,size);
  for(let i=0;i<out.data.length;i+=4){out.data[i]=a.data[i];out.data[i+1]=b.data[i];out.data[i+2]=255;out.data[i+3]=255}
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;canvas.getContext('2d')!.putImageData(out,0,0);
  this.texture?.dispose();const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.NoColorSpace;t.flipY=false;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=4;t.name=VERSION+'-bake';
  this.texture=t;this.uniforms.glBake.value=t;this.uniforms.glBakeRect.value.set(x0,z0,span,span);this.uniforms.glBakeWeight.value.set(weights.sun,weights.contact);
  this.stats={casters:casters.length,bakeMs:Math.round(performance.now()-started),size,metresPerTexel:+(span/size).toFixed(3)};
 }

 /** Headlight pools; strength 0 switches them off (day looks). */
 setPools(color:THREE.ColorRepresentation,strength:number){this.uniforms.glPoolColor.value.set(color).multiplyScalar(strength)}
 /** Per frame: the chase shadow's footprint and the lamps (world space). */
 update(chase:ChaseFrame|null,lamps:readonly GroundLamp[]){
  const u=this.uniforms;
  if(chase){u.glNearFocus.value.copy(chase.focus);u.glNearRight.value.copy(chase.right);u.glNearUp.value.copy(chase.up);u.glNearHalf.value=chase.half}
  const on=u.glPoolColor.value.r+u.glPoolColor.value.g+u.glPoolColor.value.b>0,count=on?Math.min(MAX_POOLS,lamps.length):0;
  for(let i=0;i<count;i++){u.glPoolPos.value[i].copy(lamps[i].position);u.glPoolDir.value[i].copy(lamps[i].direction)}u.glPoolCount.value=count;
 }
 inspect(){return{version:VERSION,materials:this.originals.size,bake:this.texture?this.stats:null,bakeWeight:this.uniforms.glBakeWeight.value.toArray(),pools:this.uniforms.glPoolCount.value,poolColor:this.uniforms.glPoolColor.value.toArray(),nearHalf:this.uniforms.glNearHalf.value}}
 dispose(){for(const[m,o]of this.originals){m.onBeforeCompile=o.compile;m.customProgramCacheKey=o.key;m.needsUpdate=true}this.originals.clear();this.texture?.dispose();this.texture=undefined;this.uniforms.glBake.value=null}
}
