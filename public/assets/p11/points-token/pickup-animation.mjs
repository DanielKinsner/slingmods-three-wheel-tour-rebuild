import * as THREE from 'three';
/** Runtime pickup companion to GLB Idle_spin_bob/Orbit clips. Call update(dt).
 * The owner supplies the scene and token object; this does not change scoring.
 */
export function animatePickup(scene,token){
 const originalScale=token.scale.clone(),position=token.getWorldPosition(new THREE.Vector3());
 const geometry=new THREE.TetrahedronGeometry(.035,0),material=new THREE.MeshBasicMaterial({color:0xe0202a,transparent:true,depthWrite:false});
 const shards=new THREE.InstancedMesh(geometry,material,12);shards.position.copy(position);scene.add(shards);const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),axis=new THREE.Vector3(0,1,0);let elapsed=0,disposed=false;
 return {update(dt){
  if(disposed)return true;if(!Number.isFinite(dt)||dt<0)throw new Error('dt must be finite and nonnegative');elapsed+=dt;
  token.scale.copy(originalScale).multiplyScalar(1+Math.min(elapsed/.08,1)*.35);token.visible=elapsed<.09;
  const t=Math.max(0,elapsed-.04);material.color.setHex(elapsed<.08?0xffffff:0xe0202a);material.opacity=Math.max(0,1-t/.42);
  for(let i=0;i<12;i++){const a=i*2.399963,r=t*(1.8+(i%3)*.3),p=new THREE.Vector3(Math.cos(a)*r,t*(1+(i%4)*.3)-t*t*3,Math.sin(a)*r);q.setFromAxisAngle(axis,t*(i+4));matrix.compose(p,q,new THREE.Vector3().setScalar(Math.max(0,1-t/.46)));shards.setMatrixAt(i,matrix);}shards.instanceMatrix.needsUpdate=true;
  if(elapsed>.5){this.dispose();return true;}return false;
 },dispose(){if(disposed)return;disposed=true;shards.removeFromParent();geometry.dispose();material.dispose();token.scale.copy(originalScale);token.visible=false;}};
}
