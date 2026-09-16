import * as THREE from 'three';

/** A deliberate reflection rig: neutral enclosure and two overhead softboxes. */
export function inspectionEnvironment(bay:boolean){
 const rig=new THREE.Scene();rig.background=new THREE.Color(bay?0x555a60:0x969ba1);
 const enclosure=new THREE.Mesh(new THREE.BoxGeometry(18,12,20),new THREE.MeshBasicMaterial({color:bay?0x52575b:0x92979a,side:THREE.BackSide}));
 enclosure.position.y=3;rig.add(enclosure);
 function panel(position:number[],size:[number,number],strength:number,target:number[]){
  const material=new THREE.MeshBasicMaterial({color:new THREE.Color().setRGB(strength,strength,strength),side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(...size),material);mesh.position.fromArray(position);mesh.lookAt(new THREE.Vector3().fromArray(target));rig.add(mesh);
 }
 panel([-2.5,5,0],[1.2,5],bay?3.5:1.9,[0,0,0]);
 panel([2.8,4,-1],[.9,4],bay?2.1:1.5,[0,.5,0]);
 panel([0,2,7],[5,2],bay?.65:1.1,[0,.6,0]);
 panel([-4,1.6,-1],[3,1.4],bay?1.1:1.8,[0,.5,0]);
 panel([4,1.6,-1],[3,1.4],bay?1.1:1.8,[0,.5,0]);
 return rig;
}

export function boundsCorners(bounds:THREE.Box3){
 const result:THREE.Vector3[]=[];
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])result.push(new THREE.Vector3(x,y,z));
 return result;
}

/** Solve the perspective inequalities for every box corner, leaving a screen-space margin. */
export function fitInspectionCamera(camera:THREE.PerspectiveCamera,bounds:THREE.Box3,direction:THREE.Vector3,margin=.80){
 const target=bounds.getCenter(new THREE.Vector3()),forward=direction.clone().normalize();
 const right=new THREE.Vector3().crossVectors(camera.up,forward).normalize(),up=new THREE.Vector3().crossVectors(forward,right).normalize();
 const tanY=Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*margin,tanX=tanY*camera.aspect;
 let distance=0;
 for(const corner of boundsCorners(bounds)){
  const v=corner.sub(target),towardCamera=v.dot(forward);
  distance=Math.max(distance,towardCamera+Math.abs(v.dot(right))/tanX,towardCamera+Math.abs(v.dot(up))/tanY,towardCamera+camera.near+.05);
 }
 camera.position.copy(target).addScaledVector(forward,distance);camera.lookAt(target);camera.updateMatrixWorld();camera.updateProjectionMatrix();return target;
}

export function projectedBounds(camera:THREE.PerspectiveCamera,bounds:THREE.Box3){
 camera.updateMatrixWorld();const points=boundsCorners(bounds).map(p=>p.project(camera));
 return {minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y)),allInFront:points.every(p=>p.z>-1&&p.z<1)};
}
