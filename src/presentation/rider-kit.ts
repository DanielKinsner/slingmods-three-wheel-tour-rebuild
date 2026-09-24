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
