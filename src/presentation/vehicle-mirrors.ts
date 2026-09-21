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
 /** The target the MAIN view renders to: null for the screen, or the post-processing scene target. */
 viewTarget:THREE.WebGLRenderTarget|null=null;
 readonly group=new THREE.Group();private mirrors:Reflector[]=[];private planes:THREE.Plane[]=[];private updates=[0,0];private rendering=false;
 // One shared material list per scene, reused by both faces every frame. See invalidate().
 private clipScene?:THREE.Scene;private clipList:{material:THREE.Material;original:THREE.Plane[]|null;clipped:THREE.Plane[][]}[]=[];private clipAge=0;private wasVisible=[false,false];private eye=new THREE.Vector3();private point=new THREE.Vector3();
 private clipEntry(material:THREE.Material){const original=material.clippingPlanes;return{material,original,clipped:this.planes.map(plane=>[...(original??[]),plane])}}
 private collect(scene:THREE.Scene){const seen=new Set<THREE.Material>();this.clipList=[];scene.traverse(o=>{if(o instanceof THREE.Mesh)for(const material of Array.isArray(o.material)?o.material:[o.material])if(!seen.has(material)){seen.add(material);this.clipList.push(this.clipEntry(material))}});this.clipScene=scene;this.clipAge=0}
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
    if(this.rendering||renderer.getRenderTarget()!==this.viewTarget)return;
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
    this.rendering=true;this.mirrors.forEach((m,i)=>this.wasVisible[i]=m.visible);const glassVisible=glass.visible,localClipping=renderer.localClippingEnabled,shadow=renderer.shadowMap.autoUpdate,xr=renderer.xr.enabled;
    // Materials are listed once, then re-listed about every two seconds as a bound on anything added without invalidate().
    if(this.clipScene!==scene||++this.clipAge>240)this.collect(scene as THREE.Scene);
    for(const entry of this.clipList){if(entry.material.clippingPlanes!==entry.original)Object.assign(entry,this.clipEntry(entry.material));entry.material.clippingPlanes=entry.clipped[slot]}
    try{glass.visible=false;this.mirrors.forEach(m=>m.visible=false);renderer.localClippingEnabled=true;renderer.shadowMap.autoUpdate=false;renderer.xr.enabled=false;renderer.setRenderTarget(mirror.getRenderTarget());renderer.render(scene,reflectedCamera);this.updates[slot]++}
    finally{renderer.setRenderTarget(this.viewTarget);for(const entry of this.clipList)entry.material.clippingPlanes=entry.original;renderer.localClippingEnabled=localClipping;renderer.shadowMap.autoUpdate=shadow;renderer.xr.enabled=xr;glass.visible=glassVisible;this.mirrors.forEach((m,i)=>m.visible=this.wasVisible[i]);this.rendering=false}
   };
   this.mirrors.push(mirror);this.planes.push(plane);this.group.add(mirror);
  }
  // Keep live targets outside the asset tree cloned for rivals and dash thumbnails.
  root.add(this.group);
 }
 /** Forget the cached material list after a product, finish or scenery change. */
 invalidate(){this.clipScene=undefined}
 /**
  * Keep a face live only where it can be read: caller allows it (near/cockpit views) and it spans
  * about 40 px of the viewport. Otherwise the supplied glass underneath shows and no pass runs.
  */
 update(camera:THREE.PerspectiveCamera,viewportHeight:number,enabled=true){
  const scale=viewportHeight/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)),eye=camera.getWorldPosition(this.eye);
  for(const mirror of this.mirrors){const sphere=mirror.geometry.boundingSphere,distance=mirror.getWorldPosition(this.point).distanceTo(eye),pixels=enabled&&sphere?2*sphere.radius*mirror.matrixWorld.getMaxScaleOnAxis()*scale/Math.max(distance,.01):0;mirror.visible=pixels>=(mirror.visible?34:40)}
 }
 inspect(){return{count:this.mirrors.length,resolution:[768,512],updates:[...this.updates],live:this.mirrors.map(m=>m.visible),cachedMaterials:this.clipList.length,mirrors:this.mirrors.map(m=>({name:m.name,position:m.getWorldPosition(new THREE.Vector3()).toArray()}))}}
 dispose(){this.group.removeFromParent();for(const mirror of this.mirrors){mirror.dispose();mirror.geometry.dispose()}this.mirrors=[];this.clipList=[];this.clipScene=undefined}
}
