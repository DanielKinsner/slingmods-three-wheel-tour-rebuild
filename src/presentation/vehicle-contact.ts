import * as THREE from 'three';
import layout from '../../public/assets/slingshot-contact-layout.json';

/** Soft authored contact cues for parked showroom/results presentation only.
 * Uses the retained three tire footprints. It is not a shadow simulation or physics input. */
export function vehicleContact(){
 const size=64,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const r=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2));
  data[(y*size+x)*4+3]=Math.round(210*Math.max(0,1-r)**1.4);
 }
 const texture=new THREE.DataTexture(data,size,size);texture.needsUpdate=true;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearFilter;
 const positions:number[]=[],uv:number[]=[],indices:number[]=[];
 const footprints=layout.wheels.map(w=>[w.center[0],w.center[2],w.width*3.6,w.radius*2.3]);
 footprints.push([0,-.1,1.3,2.7]);
 for(const[x,z,w,d]of footprints){const i=positions.length/3;positions.push(x-w/2,.025,z-d/2,x-w/2,.025,z+d/2,x+w/2,.025,z+d/2,x+w/2,.025,z-d/2);uv.push(0,0,0,1,1,1,1,0);indices.push(i,i+1,i+2,i,i+2,i+3)}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
 const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='presentation_tire_contact';mesh.userData.excludePresentationBounds=true;
 return {mesh,ground(root:THREE.Object3D,heightAt:(x:number,z:number)=>number){root.updateWorldMatrix(true,false);const a=geometry.getAttribute('position');for(let i=0;i<a.count;i++){const v=new THREE.Vector3(positions[i*3],0,positions[i*3+2]).applyMatrix4(root.matrixWorld);v.y=heightAt(v.x,v.z)+.025;root.worldToLocal(v);a.setXYZ(i,v.x,v.y,v.z)}a.needsUpdate=true;geometry.computeBoundingSphere()},dispose(){mesh.removeFromParent();geometry.dispose();material.dispose();texture.dispose()}};
}
