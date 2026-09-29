import * as THREE from 'three';
/**
 * Riding kit on the purchased biker, applied once per loaded rider (hero, rivals, showroom):
 * - bare skin hands become black leather gloves,
 * - the neck/face skin under the helmet becomes a black knit balaclava (the neck showed on the Spyder),
 * - the leather's fold relief (derived from its albedo at build time) is calmed so it reads as leather, not melted plastic.
 * Only the biker's own material names match; other riders are untouched. Idempotent.
 */
export function finishRiderKit(root:THREE.Object3D){
 const seen=new Set<THREE.Material>();
 root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
  if(seen.has(m)||!(m instanceof THREE.MeshStandardMaterial)||m.userData.riderKit)continue;seen.add(m);
  if(m.name==='Biker_Skin_Hands'){m.map?.dispose();m.map=null;m.color.setRGB(.018,.018,.02);m.roughness=.5;m.metalness=0}
  else if(m.name==='Biker_Skin_Head'){m.map?.dispose();m.map=null;m.normalMap?.dispose();m.normalMap=null;m.color.setRGB(.012,.012,.014);m.roughness=.88;m.metalness=0}
  else if(m.name==='Biker_Leather'){m.normalScale.multiplyScalar(.45);m.roughness=Math.max(m.roughness,.62)}
  else continue;
  m.userData.riderKit=true;m.needsUpdate=true;
 }});
}

/**
 * Races only (graphics pass 1): a Fresnel edge tinted by the route's haze, so the black-clad rider keeps a silhouette
 * against dark bodywork and dark ground in the chase camera. The showroom never calls this.
 */
export function raceRiderRim(roots:readonly THREE.Object3D[],haze:THREE.Color,strength:number){
 const tint=new THREE.Color().copy(haze).multiplyScalar(strength),seen=new Set<THREE.Material>();
 for(const root of roots)root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
  if(seen.has(m)||!(m instanceof THREE.MeshStandardMaterial)||!m.name.startsWith('Biker_')||m.userData.raceRim)continue;seen.add(m);m.userData.raceRim=true;
  const compile=m.onBeforeCompile,key=m.customProgramCacheKey.call(m);
  m.onBeforeCompile=(shader,renderer)=>{compile.call(m,shader,renderer);if(!shader.fragmentShader.includes('#include <opaque_fragment>'))return;shader.uniforms.raceRiderRim={value:tint};
   shader.fragmentShader='uniform vec3 raceRiderRim;\n'+shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight+=raceRiderRim*pow(1.-saturate(dot(normal,normalize(vViewPosition))),3.);\n#include <opaque_fragment>')};
  m.customProgramCacheKey=()=>key+'|race-rim-v1';m.needsUpdate=true;
 }});
}
