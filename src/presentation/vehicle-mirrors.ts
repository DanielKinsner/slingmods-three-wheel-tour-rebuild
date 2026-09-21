import * as THREE from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';

/** Split the supplied glass into two faces, retaining every native vertex. */
export function mirrorFaces(source:THREE.BufferGeometry){
 const positions=source.getAttribute('position'),normals=source.getAttribute('normal'),index=source.getIndex();
 if(!positions||!normals||!index)return [];
 return [-1,1].map(side=>{
  const ids=Array.from({length:positions.count},(_,i)=>i).filter(i=>positions.getX(i)*side>0);
  const center=new THREE.Vector3(),normal=new THREE.Vector3(),point=new THREE.Vector3();
  for(const i of ids){center.add(point.fromBufferAttribute(positions,i));normal.add(point.fromBufferAttribute(normals,i))}
  center.divideScalar(ids.length);normal.normalize();
  const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal),inverse=rotation.clone().invert();
  const vertices:number[]=[],triangles:number[]=[],remap=new Map(ids.map((id,i)=>[id,i]));
  for(const id of ids){point.fromBufferAttribute(positions,id).sub(center).applyQuaternion(inverse);vertices.push(point.x,point.y,point.z)}
  for(let i=0;i<index.count;i+=3){const triangle=[index.getX(i),index.getX(i+1),index.getX(i+2)];if(triangle.every(id=>remap.has(id)))triangles.push(...triangle.map(id=>remap.get(id)!))}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(triangles);geometry.computeVertexNormals();geometry.computeBoundingSphere();
  return {side,geometry,center,normal,rotation};
 });
}

/** Two bounded live planar reflections on the player's native glass only. */
export class VehicleMirrors {
 readonly group=new THREE.Group();private mirrors:Reflector[]=[];private updates=[0,0];private rendering=false;
 constructor(root:THREE.Object3D,car:THREE.Object3D){
  this.group.name='live_vehicle_mirrors';
  const glass=car.getObjectByName('Mirrors_1');if(!(glass instanceof THREE.Mesh))return;
  root.updateWorldMatrix(true,true);const sourceMatrix=root.matrixWorld.clone().invert().multiply(glass.matrixWorld);
  for(const face of mirrorFaces(glass.geometry)){
   const mirror=new Reflector(face.geometry,{textureWidth:768,textureHeight:512,multisample:0,clipBias:.001,color:new THREE.Color().setRGB(.5,.5,.5)});
   mirror.name=face.side<0?'mirror_right_live':'mirror_left_live';
   const transform=sourceMatrix.clone().multiply(new THREE.Matrix4().compose(face.center.clone().addScaledVector(face.normal,.0003),face.rotation,new THREE.Vector3(1,1,1)));
   transform.decompose(mirror.position,mirror.quaternion,mirror.scale);
   // Use world-space clipping instead of Reflector's conventional-depth oblique
   // projection. The road renderer uses reversed depth (or logarithmic fallback).
   const reflectedCamera=new THREE.PerspectiveCamera(),plane=new THREE.Plane(),view=new THREE.Vector3(),direction=new THREE.Vector3(),position=new THREE.Vector3(),normal=new THREE.Vector3(),up=new THREE.Vector3(),slot=this.mirrors.length;
   const shader=mirror.material as THREE.ShaderMaterial;
   mirror.onBeforeRender=(renderer,scene,camera)=>{
    // Never recurse through the other mirror, thumbnails, or other offscreen passes.
    if(this.rendering||renderer.getRenderTarget()!==null)return;
    normal.set(0,0,1).transformDirection(mirror.matrixWorld);
    // A small optical tilt aims the glass for the seated eye without changing
    // the supplied housing or face vertices. Keep it attached to vehicle roll.
    normal.addScaledVector(up.set(0,1,0).transformDirection(root.matrixWorld),.10).normalize();
    position.setFromMatrixPosition(mirror.matrixWorld);view.setFromMatrixPosition(camera.matrixWorld).sub(position);
    if(view.dot(normal)<0||!(camera instanceof THREE.PerspectiveCamera))return;
    reflectedCamera.copy(camera,false);reflectedCamera.position.copy(view.reflect(normal).add(position));camera.getWorldDirection(direction).reflect(normal);
    reflectedCamera.up.set(0,1,0).transformDirection(camera.matrixWorld).reflect(normal);reflectedCamera.lookAt(direction.add(reflectedCamera.position));reflectedCamera.updateMatrixWorld();
    (shader.uniforms.textureMatrix.value as THREE.Matrix4).set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(camera.projectionMatrix).multiply(reflectedCamera.matrixWorldInverse).multiply(mirror.matrixWorld);
    plane.setFromNormalAndCoplanarPoint(normal,position);
    this.rendering=true;const visibility=this.mirrors.map(m=>m.visible),glassVisible=glass.visible,localClipping=renderer.localClippingEnabled,shadow=renderer.shadowMap.autoUpdate,xr=renderer.xr.enabled;
    const clipping=new Map<THREE.Material,THREE.Plane[]|null>();scene.traverse(o=>{if(o instanceof THREE.Mesh)for(const material of Array.isArray(o.material)?o.material:[o.material])if(!clipping.has(material)){clipping.set(material,material.clippingPlanes);material.clippingPlanes=[...(material.clippingPlanes??[]),plane]}});
    try{glass.visible=false;this.mirrors.forEach(m=>m.visible=false);renderer.localClippingEnabled=true;renderer.shadowMap.autoUpdate=false;renderer.xr.enabled=false;renderer.setRenderTarget(mirror.getRenderTarget());renderer.render(scene,reflectedCamera);this.updates[slot]++}
    finally{renderer.setRenderTarget(null);for(const[material,planes]of clipping)material.clippingPlanes=planes;renderer.localClippingEnabled=localClipping;renderer.shadowMap.autoUpdate=shadow;renderer.xr.enabled=xr;glass.visible=glassVisible;this.mirrors.forEach((m,i)=>m.visible=visibility[i]);this.rendering=false}
   };
   this.mirrors.push(mirror);this.group.add(mirror);
  }
  // Keep live targets outside the asset tree cloned for rivals and dash thumbnails.
  root.add(this.group);
 }
 inspect(){return{count:this.mirrors.length,resolution:[768,512],updates:[...this.updates],mirrors:this.mirrors.map(m=>({name:m.name,position:m.getWorldPosition(new THREE.Vector3()).toArray()}))}}
 dispose(){this.group.removeFromParent();for(const mirror of this.mirrors){mirror.dispose();mirror.geometry.dispose()}this.mirrors=[]}
}
