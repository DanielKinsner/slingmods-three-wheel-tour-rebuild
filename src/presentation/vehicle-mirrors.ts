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
 readonly group=new THREE.Group();private mirrors:Reflector[]=[];private updates=[0,0];private rendering=false;
 // Every scene material carries ONE permanent clipping plane, `clip`. Outside a mirror pass it is parked where it clips
 // nothing; during a pass it becomes that mirror's glass plane. The plane COUNT never changes, so the renderer keeps the
 // same shader for every material. (Adding and removing planes per pass made three.js re-resolve hundreds of programs a
 // frame; the garbage from that was the 30-80 ms hitching behind the old performance hold.) See invalidate().
 private readonly clip=new THREE.Plane(new THREE.Vector3(0,1,0),1e7);private localClipping?:{renderer:THREE.WebGLRenderer;previous:boolean};
 private clipScene?:THREE.Scene;private clipList:{material:THREE.Material;original:THREE.Plane[]|null;clipped:THREE.Plane[]}[]=[];private clipAge=0;private wasVisible=[false,false];private alternate=false;private frame=0;private explicitFrame=-1;private passes:((renderer:THREE.WebGLRenderer,scene:THREE.Object3D,camera:THREE.Camera,nested:boolean)=>void)[]=[];private faceProjection=new THREE.Matrix4();private cropMatrix=new THREE.Matrix4();private corner=new THREE.Vector4();private cropped=0;private frustum=new THREE.Frustum();private viewProjection=new THREE.Matrix4();private sphere=new THREE.Sphere();private eye=new THREE.Vector3();private point=new THREE.Vector3();
 private follow?:{glass:THREE.Object3D;root:THREE.Object3D;initialInverse:THREE.Matrix4};private followMatrix=new THREE.Matrix4();
 private release(){for(const entry of this.clipList)if(entry.material.clippingPlanes===entry.clipped)entry.material.clippingPlanes=entry.original;this.clipList=[]}
 private collect(scene:THREE.Scene){const known=new Map(this.clipList.map(e=>[e.material,e])),seen=new Set<THREE.Material>(),next:typeof this.clipList=[];scene.traverse(o=>{if(o instanceof THREE.Mesh)for(const material of Array.isArray(o.material)?o.material:[o.material]){if(seen.has(material))continue;seen.add(material);let entry=known.get(material);if(!entry||material.clippingPlanes!==entry.clipped){const original=entry&&material.clippingPlanes===entry.clipped?entry.original:material.clippingPlanes;entry={material,original,clipped:[...(original??[]),this.clip]};material.clippingPlanes=entry.clipped}known.delete(material);next.push(entry)}});for(const gone of known.values())if(gone.material.clippingPlanes===gone.clipped)gone.material.clippingPlanes=gone.original;this.clipList=next;this.clipScene=scene;this.clipAge=0}
 constructor(root:THREE.Object3D,car:THREE.Object3D){
  this.group.name='live_vehicle_mirrors';
  const glass=car.getObjectByName('Mirrors_1');if(!(glass instanceof THREE.Mesh))return;
  root.updateWorldMatrix(true,true);const sourceMatrix=root.matrixWorld.clone().invert().multiply(glass.matrixWorld);const opticalTilt=Number.isFinite(glass.userData.mirrorOpticalTilt)?THREE.MathUtils.clamp(glass.userData.mirrorOpticalTilt,0,.5):.10;
  if(glass.userData.followSteering===true){this.follow={glass,root,initialInverse:sourceMatrix.clone().invert()};this.group.matrixAutoUpdate=false}
  for(const face of mirrorFaces(glass.geometry)){
   const mirror=new Reflector(face.geometry,{textureWidth:768,textureHeight:512,multisample:0,clipBias:.001,color:new THREE.Color().setRGB(.5,.5,.5)});
   mirror.name=face.side<0?'mirror_right_live':'mirror_left_live';
   const transform=sourceMatrix.clone().multiply(new THREE.Matrix4().compose(face.center.clone().addScaledVector(face.normal,.0003),face.rotation,new THREE.Vector3(1,1,1)));
   transform.decompose(mirror.position,mirror.quaternion,mirror.scale);
   // Use world-space clipping instead of Reflector's conventional-depth oblique
   // projection. The road renderer uses reversed depth (or logarithmic fallback).
   const reflectedCamera=new THREE.PerspectiveCamera(),plane=new THREE.Plane(),view=new THREE.Vector3(),direction=new THREE.Vector3(),position=new THREE.Vector3(),normal=new THREE.Vector3(),up=new THREE.Vector3(),slot=this.mirrors.length;
   const shader=mirror.material as THREE.ShaderMaterial;
   const pass=(renderer:THREE.WebGLRenderer,scene:THREE.Object3D,camera:THREE.Camera,nested:boolean)=>{
    // Never recurse through the other mirror, thumbnails, or other offscreen passes.
    const returnTo=renderer.getRenderTarget();if(this.rendering||nested&&returnTo!==this.viewTarget)return;
    // Chase view: left and right faces take turns, one reflection pass per frame instead of two. A face of about 40 px
    // showing a picture one frame old is not visible; halving the passes is. A face that has never rendered goes first.
    if(this.alternate&&this.updates[slot]>0&&(this.frame+slot)%2)return;
    normal.set(0,0,1).transformDirection(mirror.matrixWorld);
    // A small optical tilt aims the glass for the seated eye without changing
    // the supplied housing or face vertices. Keep it attached to vehicle roll.
    normal.addScaledVector(up.set(0,1,0).transformDirection(root.matrixWorld),opticalTilt).normalize();
    position.setFromMatrixPosition(mirror.matrixWorld);view.setFromMatrixPosition(camera.matrixWorld).sub(position);
    if(view.dot(normal)<0||!(camera instanceof THREE.PerspectiveCamera))return;
    reflectedCamera.copy(camera,false);reflectedCamera.position.copy(view.reflect(normal).add(position));camera.getWorldDirection(direction).reflect(normal);
    reflectedCamera.up.set(0,1,0).transformDirection(camera.matrixWorld).reflect(normal);reflectedCamera.lookAt(direction.add(reflectedCamera.position));reflectedCamera.updateMatrixWorld();
    // The glass covers a few percent of the view, so draw only that slice of the rear scene: the frustum is cropped to the
    // face, which culls most of the world out of the pass and spends the whole texture on what the face can show.
    this.fit(reflectedCamera,mirror);
    (shader.uniforms.textureMatrix.value as THREE.Matrix4).set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(reflectedCamera.projectionMatrix).multiply(reflectedCamera.matrixWorldInverse).multiply(mirror.matrixWorld);
    plane.setFromNormalAndCoplanarPoint(normal,position);
    this.rendering=true;this.mirrors.forEach((m,i)=>this.wasVisible[i]=m.visible);const glassVisible=glass.visible,shadow=renderer.shadowMap.autoUpdate,xr=renderer.xr.enabled;
    // Materials are listed once, then re-listed about every two seconds as a bound on anything added without invalidate().
    if(this.clipScene!==scene||++this.clipAge>240)this.collect(scene as THREE.Scene);
    if(!this.localClipping){this.localClipping={renderer,previous:renderer.localClippingEnabled};renderer.localClippingEnabled=true}this.clip.copy(plane);
    try{glass.visible=false;this.mirrors.forEach(m=>m.visible=false);renderer.shadowMap.autoUpdate=false;renderer.xr.enabled=false;renderer.setRenderTarget(mirror.getRenderTarget());renderer.render(scene,reflectedCamera);this.updates[slot]++}
    finally{renderer.setRenderTarget(returnTo);this.clip.normal.set(0,1,0);this.clip.constant=1e7;renderer.shadowMap.autoUpdate=shadow;renderer.xr.enabled=xr;glass.visible=glassVisible;this.mirrors.forEach((m,i)=>m.visible=this.wasVisible[i]);this.rendering=false}
   };
   // Fallback for callers that never call render(): the reflection is drawn from inside the main render.
   mirror.onBeforeRender=(renderer,scene,camera)=>{if(this.explicitFrame!==this.frame)pass(renderer,scene,camera,true)};
   this.passes.push(pass);this.mirrors.push(mirror);this.group.add(mirror);
  }
  // Keep live targets outside the asset tree cloned for rivals and dash thumbnails.
  root.add(this.group);
 }
 /** Forget the cached material list after a product, finish or scenery change. */
 invalidate(){this.clipScene=undefined}
 /**
  * Keep a face live only where it can be read: caller allows it (near/cockpit views) and it spans
  * about 40 px of the viewport. Otherwise the supplied glass underneath shows and no pass runs.
  * Call once per frame. `alternate` (small exterior views) refreshes one face per frame, taking turns.
  */
 update(camera:THREE.PerspectiveCamera,viewportHeight:number,enabled=true,alternate=false){
  this.alternate=alternate;this.frame++;
  if(this.follow){const {glass,root,initialInverse}=this.follow;glass.updateWorldMatrix(true,false);this.group.matrix.copy(this.followMatrix.copy(root.matrixWorld).invert().multiply(glass.matrixWorld).multiply(initialInverse));this.group.matrixWorldNeedsUpdate=true;this.group.updateWorldMatrix(false,true)}
  const scale=viewportHeight/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)),eye=camera.getWorldPosition(this.eye);
  for(const mirror of this.mirrors){const sphere=mirror.geometry.boundingSphere,distance=mirror.getWorldPosition(this.point).distanceTo(eye),pixels=enabled&&sphere?2*sphere.radius*mirror.matrixWorld.getMaxScaleOnAxis()*scale/Math.max(distance,.01):0;mirror.visible=pixels>=(mirror.visible?34:40)}
 }
 /**
  * Draw the live faces as their own step BEFORE the main frame (call after update()). A reflection drawn from inside the
  * main render runs at a deeper render-call depth, where three.js keeps a separate lights state; every lit material then
  * has its program re-resolved on entering and leaving each mirror pass. Drawn here, both passes share one lights state.
  */
 render(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.PerspectiveCamera){
  this.explicitFrame=this.frame;if(!this.mirrors.some(m=>m.visible))return;
  camera.updateMatrixWorld();this.group.updateWorldMatrix(true,true);this.frustum.setFromProjectionMatrix(this.viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),camera.coordinateSystem,camera.reversedDepth);
  this.mirrors.forEach((mirror,slot)=>{const bounds=mirror.geometry.boundingSphere;if(!mirror.visible||!bounds||!this.frustum.intersectsSphere(this.sphere.copy(bounds).applyMatrix4(mirror.matrixWorld)))return;this.passes[slot](renderer,scene,camera,false)});
 }
 /**
  * Crops a reflected camera's projection to the screen rectangle of its mirror face (8% padding for filtering). The face
  * lies on the mirror plane, so it projects to the same place through the reflected camera as through the real one.
  * Left untouched when the face reaches behind the eye or already fills most of the view.
  */
 private fit(camera:THREE.PerspectiveCamera,mirror:THREE.Mesh){
  const box=mirror.geometry.boundingBox??(mirror.geometry.computeBoundingBox(),mirror.geometry.boundingBox!);let x0=1,x1=-1,y0=1,y1=-1;
  this.faceProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(mirror.matrixWorld);
  for(let i=0;i<8;i++){const p=this.corner.set(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z,1).applyMatrix4(this.faceProjection);if(p.w<1e-4)return false;x0=Math.min(x0,p.x/p.w);x1=Math.max(x1,p.x/p.w);y0=Math.min(y0,p.y/p.w);y1=Math.max(y1,p.y/p.w)}
  const padX=(x1-x0)*.08,padY=(y1-y0)*.08;x0=Math.max(-1,x0-padX);x1=Math.min(1,x1+padX);y0=Math.max(-1,y0-padY);y1=Math.min(1,y1+padY);
  const w=x1-x0,h=y1-y0;if(w<1e-3||h<1e-3||w*h>2.4)return false;
  camera.projectionMatrix.premultiply(this.cropMatrix.set(2/w,0,0,-(x0+x1)/w,0,2/h,0,-(y0+y1)/h,0,0,1,0,0,0,0,1));camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();this.cropped++;return true;
 }
 inspect(){return{cropped:this.cropped,count:this.mirrors.length,resolution:[768,512],updates:[...this.updates],live:this.mirrors.map(m=>m.visible),alternate:this.alternate,cachedMaterials:this.clipList.length,mirrors:this.mirrors.map(m=>({name:m.name,position:m.getWorldPosition(new THREE.Vector3()).toArray()}))}}
 dispose(){this.group.removeFromParent();for(const mirror of this.mirrors){mirror.dispose();mirror.geometry.dispose()}this.mirrors=[];this.passes=[];this.release();this.clipScene=undefined;if(this.localClipping){this.localClipping.renderer.localClippingEnabled=this.localClipping.previous;this.localClipping=undefined}}
}
