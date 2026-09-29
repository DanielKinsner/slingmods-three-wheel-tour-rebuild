import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
/**
 * Distance version of a rival. Up close a rival draws every part (about 80 draws after merge-rigid.ts); beyond ~20 m the
 * detail is invisible but the draw calls are not, and four cars were two-thirds of every frame's CPU submission (view,
 * sun shadow and wet-road reflection). Each rigid body (chassis, each wheel spin/steer node, links...) gets one merged
 * mesh whose colours are baked into vertices, all sharing one material: ~6-10 draws per rival.
 *
 * Parts that could not be baked faithfully stay full detail at every distance: multi-material, skinned, lamps (the
 * brake/tail glow must stay visible when chasing) and textures whose average colour cannot be read. Thin transparent
 * sheets (windscreen, lamp covers, mirror glass) are simply not drawn at that distance.
 * The proxy hangs off the same moving nodes, so wheels still spin and steer. Hysteresis avoids flicker at the boundary.
 */
export const PROXY_NEAR_METRES=18,PROXY_FAR_METRES=22;
/** The player's car as a shadow/reflection stand-in lives only on this layer (plus the wet-reflection layer): the sun's
 *  shadow camera and the puddle camera see it, the main view never does. */
export const STAND_IN_LAYER=6;
/**
 * three.js decides what enters a shadow map by testing each object's layers against the MAIN camera (WebGLShadowMap
 * renderObject), not the shadow camera; enabling the layer on the shadow camera does nothing. So the stand-ins never
 * reached the sun's shadow map and the cars cast almost no shadow. Two empty markers bracket the scene's shadow
 * traversal: the first switches the stand-in layer on for the main camera, the last switches it off again. The main
 * view's draw list is already built by then (it is projected before shadows), so the stand-ins still never draw there.
 * Each marker is one invisible, empty draw. Returns a disposer.
 */
export function standInShadowSwitch(scene:THREE.Scene){
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,0,0,0,0,0],3));
 const material=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false,depthTest:false});
 const marker=(on:boolean)=>{const m=new THREE.Mesh(geometry,material);m.name=on?'stand_in_shadow_on':'stand_in_shadow_off';m.castShadow=true;m.frustumCulled=false;m.renderOrder=-1e9;
  m.onBeforeShadow=(_r,_o,camera)=>{if(on)camera.layers.enable(STAND_IN_LAYER);else camera.layers.disable(STAND_IN_LAYER)};return m};
 const first=marker(true),last=marker(false);scene.add(first,last);scene.children.splice(scene.children.indexOf(first),1);scene.children.unshift(first);
 // Anything added to the scene later lands after `last`; keep `last` at the end before every shadow pass.
 const keepLast=()=>{const i=scene.children.indexOf(last);if(i!==scene.children.length-1){scene.children.splice(i,1);scene.children.push(last)}};
 first.onBeforeRender=keepLast;const previous=scene.onBeforeRender;scene.onBeforeRender=(...args)=>{keepLast();previous.apply(scene,args)};
 return ()=>{scene.onBeforeRender=previous;first.removeFromParent();last.removeFromParent();geometry.dispose();material.dispose()};
}
const shownIn=(o:THREE.Object3D,root:THREE.Object3D)=>{for(let p:THREE.Object3D|null=o;p;p=p.parent){if(!p.visible)return false;if(p===root)return true}return true};
const sampled=new WeakMap<THREE.Texture,THREE.Color|null>();
function averageColour(texture:THREE.Texture):THREE.Color|null{
 if(sampled.has(texture))return sampled.get(texture)!;
 let result:THREE.Color|null=null;const image=texture.image as CanvasImageSource&{width?:number;height?:number}|undefined;
 try{if(image&&typeof document!=='undefined'&&!(texture as THREE.CompressedTexture).isCompressedTexture&&(image as {width?:number}).width){
  const c=document.createElement('canvas');c.width=c.height=8;const g=c.getContext('2d',{willReadFrequently:true})!;g.drawImage(image,0,0,8,8);const d=g.getImageData(0,0,8,8).data;
  let r=0,gr=0,b=0,n=0;for(let i=0;i<d.length;i+=4)if(d[i+3]>8){r+=d[i];gr+=d[i+1];b+=d[i+2];n++}
  if(n)result=new THREE.Color().setRGB(r/n/255,gr/n/255,b/n/255,THREE.SRGBColorSpace);
 }}catch{result=null}
 sampled.set(texture,result);return result;
}
function bakedColour(material:THREE.Material):THREE.Color|null{
 if(!(material instanceof THREE.MeshStandardMaterial))return null;
 const colour=material.color.clone();if(material.map){const avg=averageColour(material.map);if(!avg)return null;colour.multiply(avg)}
 return colour;
}
let sharedMaterial:THREE.MeshStandardMaterial|undefined;
/** Double-sided on purpose. Car bodies are thin one-sided shells: a front-side material only draws back faces into the
 *  sun's shadow map and only undersides into the puddle camera, so the stand-ins cast and reflected just their closed
 *  parts (a ring of tyre) instead of the car. */
export function proxyMaterial(){return sharedMaterial??=new THREE.MeshStandardMaterial({name:'rival_distance_proxy',vertexColors:true,roughness:.42,metalness:.15,side:THREE.DoubleSide,shadowSide:THREE.DoubleSide})}
export class VehicleProxy {
 private proxied:THREE.Mesh[]=[];private dropped:THREE.Mesh[]=[];private proxies:THREE.Mesh[]=[];private far=false;private warming=false;
 readonly report={proxied:0,dropped:0,kept:0,proxies:0};
 constructor(root:THREE.Object3D,isBody:(node:THREE.Object3D)=>boolean,keepFull:(mesh:THREE.Mesh)=>boolean){
  root.updateMatrixWorld(true);const groups=new Map<THREE.Object3D,{geometry:THREE.BufferGeometry;mesh:THREE.Mesh}[]>(),inverse=new THREE.Matrix4();
  root.traverse(o=>{
   if(!(o instanceof THREE.Mesh)||o instanceof THREE.SkinnedMesh||(o as THREE.InstancedMesh).isInstancedMesh||!shownIn(o,root))return;
   const material=o.material;if(keepFull(o)){this.report.kept++;return}
   if(!Array.isArray(material)&&(material.transparent||material.opacity<1)){this.dropped.push(o);return}
   if(Array.isArray(material)||material.alphaTest>0){this.report.kept++;return}
   const colour=bakedColour(material),position=o.geometry.getAttribute('position');if(!colour||!position){this.report.kept++;return}   // single material: draw groups (e.g. per box face) don't matter
   let body:THREE.Object3D=o.parent??root;while(body!==root&&!isBody(body)&&body.parent)body=body.parent;
   const g=new THREE.BufferGeometry();g.setAttribute('position',position.clone());const normal=o.geometry.getAttribute('normal');if(normal)g.setAttribute('normal',normal.clone());
   if(o.geometry.index)g.setIndex(o.geometry.index.clone());else g.setIndex([...Array(position.count).keys()]);
   g.applyMatrix4(inverse.copy(body.matrixWorld).invert().multiply(o.matrixWorld));if(!normal)g.computeVertexNormals();
   const c=new Float32Array(position.count*3);for(let i=0;i<position.count;i++)colour.toArray(c,i*3);g.setAttribute('color',new THREE.BufferAttribute(c,3));
   const list=groups.get(body)??[];list.push({geometry:g,mesh:o});groups.set(body,list);
  });
  for(const [body,parts] of groups){
   const merged=mergeGeometries(parts.map(p=>p.geometry));parts.forEach(p=>p.geometry.dispose());if(!merged){this.report.kept+=parts.length;continue}
   const proxy=new THREE.Mesh(merged,proxyMaterial());proxy.name='rival_distance_proxy';proxy.visible=false;proxy.castShadow=parts.some(p=>p.mesh.castShadow);proxy.receiveShadow=true;proxy.userData.distanceProxy=true;
   body.add(proxy);this.proxies.push(proxy);for(const p of parts)this.proxied.push(p.mesh);
  }
  this.report.proxied=this.proxied.length;this.report.dropped=this.dropped.length;this.report.proxies=this.proxies.length;
 }
 /** Call once per frame with the camera distance. Returns true while the distance version is showing. */
 update(distance:number){
  if(this.warming)return this.far;
  const far=this.far?distance>PROXY_NEAR_METRES:distance>PROXY_FAR_METRES;if(far===this.far)return far;this.far=far;
  for(const m of this.proxied)m.visible=!far;for(const m of this.dropped)m.visible=!far;
  if(this.shadowMask!==undefined){for(const p of this.proxies)p.layers.mask=far?this.shadowMask|1:this.shadowMask}   // always the shadow/puddle stand-in; the main view too when far
  else for(const p of this.proxies){p.visible=far;if(far&&this.proxied[0])p.layers.mask=this.proxied[0].layers.mask}   // reflection layer tagging follows the car
  return far;
 }
 /** Loading only: show the proxies alongside the full parts so their shader and shadow variants compile behind the
  *  loading veil (compileAsync only visits visible objects). Otherwise the first far rival stalled a race frame ~350 ms. */
 warm(on:boolean){this.warming=on;if(this.shadowMask===undefined)for(const p of this.proxies)p.visible=on||this.far;else for(const p of this.proxies)p.layers.mask=on||this.far?this.shadowMask|1:this.shadowMask}
 get active(){return this.far}
 private standingIn=false;private casters=new Map<THREE.Mesh,boolean>();private shadowMask:number|undefined;
 /** Rival: besides the distance swap in the main view, its sun shadow and puddle reflection always come from the proxy
  *  (layers in `layerMask`), near or far. Up close the full car is on screen but a merged stand-in casts for it; this is
  *  most of the cost at the race start, when all four cars are near each other. */
 shadowAndReflection(layerMask:number){
  this.shadowMask=layerMask;
  for(const p of this.proxies){p.visible=true;p.layers.mask=this.far?layerMask|1:layerMask}
  for(const m of this.proxied){this.casters.set(m,m.castShadow);m.castShadow=false;m.userData.reflectionExclude=true}
  for(const m of this.dropped)m.userData.reflectionExclude=true;
  return this;
 }
 /** Permanent stand-in (player car): the proxies draw only for the given layers (sun shadow + puddles) while every full
  *  part stays in the main view but stops casting shadows and stops appearing in puddles. Same shapes, ~15 draws not ~250. */
 standIn(layerMask:number){
  this.standingIn=true;this.warming=true;
  for(const p of this.proxies){p.visible=true;p.layers.mask=layerMask;p.frustumCulled=false}
  for(const m of this.proxied){this.casters.set(m,m.castShadow);m.castShadow=false;m.userData.reflectionExclude=true}
  for(const m of this.dropped)m.userData.reflectionExclude=true;
  return this;
 }
 dispose(){for(const [m,cast] of this.casters){m.castShadow=cast;delete m.userData.reflectionExclude}for(const m of this.dropped)delete m.userData.reflectionExclude;this.casters.clear();for(const p of this.proxies){p.geometry.dispose();p.removeFromParent()}for(const m of this.proxied)m.visible=true;for(const m of this.dropped)m.visible=true;this.proxies=[];this.proxied=[];this.dropped=[]}
}
