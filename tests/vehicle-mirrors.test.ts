import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import * as THREE from 'three';
import {mirrorFaces,VehicleMirrors} from '../src/presentation/vehicle-mirrors';
function nativeGlass(){
 const bytes=readFileSync('public/assets/model02/slingshot-2026.glb'),size=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+size).toString()),binary=28+size;
 const mesh=g.meshes.find((m:{name:string})=>m.name==='Mirrors_1'),p=mesh.primitives[0];
 const attribute=(id:number)=>{const a=g.accessors[id],v=g.bufferViews[a.bufferView],count=a.type==='VEC3'?3:1,offset=binary+(v.byteOffset??0)+(a.byteOffset??0);const array=a.componentType===5126?new Float32Array(bytes.buffer,bytes.byteOffset+offset,a.count*count):a.componentType===5123?new Uint16Array(bytes.buffer,bytes.byteOffset+offset,a.count):new Uint32Array(bytes.buffer,bytes.byteOffset+offset,a.count);return new THREE.BufferAttribute(array.slice(),count)};
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',attribute(p.attributes.POSITION));geometry.setAttribute('normal',attribute(p.attributes.NORMAL));geometry.setIndex(attribute(p.indices));return geometry;
}
test('live mirror faces retain all native glass vertices and triangles without modifying the source',()=>{
 const original=nativeGlass(),before=Array.from(original.getAttribute('position').array),faces=mirrorFaces(original);assert.equal(faces.length,2);
 assert.equal(faces.reduce((n,f)=>n+f.geometry.index!.count,0),original.index!.count);
 for(const face of faces){const points=face.geometry.getAttribute('position'),source=original.getAttribute('position'),ids=Array.from({length:source.count},(_,i)=>i).filter(i=>source.getX(i)*face.side>0);assert.equal(points.count,25);for(let i=0;i<points.count;i++){const restored=new THREE.Vector3().fromBufferAttribute(points,i).applyQuaternion(face.rotation).add(face.center);assert.ok(restored.distanceTo(new THREE.Vector3().fromBufferAttribute(source,ids[i]))<1e-6)}face.geometry.dispose()}
 assert.deepEqual(Array.from(original.getAttribute('position').array),before);original.dispose();
});
test('live mirror targets stay outside cloned vehicle assets and dispose with the scene',()=>{
 const root=new THREE.Group(),car=new THREE.Group(),glass=new THREE.Mesh(nativeGlass(),new THREE.MeshStandardMaterial());glass.name='Mirrors_1';car.add(glass);root.add(car);const mirrors=new VehicleMirrors(root,car);
 assert.equal(mirrors.inspect().count,2);assert.equal(car.clone(true).getObjectByName('live_vehicle_mirrors'),undefined);assert.equal(glass.visible,true);
 let disposed=0;for(const mirror of mirrors.group.children){const target=(mirror as any).getRenderTarget() as THREE.WebGLRenderTarget;target.addEventListener('dispose',()=>disposed++)}
 mirrors.dispose();assert.equal(disposed,2);assert.equal(root.getObjectByName('live_vehicle_mirrors'),undefined);assert.equal(glass.visible,true);glass.geometry.dispose();(glass.material as THREE.Material).dispose();
});
function mirrorRig(){
 const scene=new THREE.Scene(),root=new THREE.Group(),car=new THREE.Group(),glass=new THREE.Mesh(nativeGlass(),new THREE.MeshStandardMaterial());glass.name='Mirrors_1';car.add(glass);root.add(car);scene.add(root);
 const mirrors=new VehicleMirrors(root,car),faces=mirrors.group.children as THREE.Mesh[],camera=new THREE.PerspectiveCamera(55,16/9,.05,500);scene.updateMatrixWorld(true);
 // Stand behind the first face, along its own normal, looking at it.
 const place=(distance:number)=>{const at=faces[0].getWorldPosition(new THREE.Vector3()),normal=new THREE.Vector3(0,0,1).transformDirection(faces[0].matrixWorld);camera.position.copy(at).addScaledVector(normal,distance);camera.lookAt(at);camera.updateMatrixWorld(true)};
 return{scene,glass,mirrors,faces,camera,place,dispose(){mirrors.dispose();glass.geometry.dispose();(glass.material as THREE.Material).dispose()}};
}
test('a live mirror face only stays on where it is allowed and large enough to read',()=>{
 const rig=mirrorRig();rig.place(1);rig.mirrors.update(rig.camera,1440,true);assert.equal(rig.faces[0].visible,true,'close seated view is live');
 rig.mirrors.update(rig.camera,1440,false);assert.deepEqual(rig.mirrors.inspect().live,[false,false],'far view or showroom exterior never pays for a reflection');
 rig.place(60);rig.mirrors.update(rig.camera,1440,true);assert.equal(rig.faces[0].visible,false,'a face of a few pixels is skipped');
 rig.place(1);rig.mirrors.update(rig.camera,1440,true);assert.equal(rig.faces[0].visible,true);assert.equal(rig.glass.visible,true,'supplied glass is never hidden by the gate');rig.dispose();
});
test('mirror passes reuse one cached material list instead of walking the scene every frame',()=>{
 const rig=mirrorRig(),extra=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());rig.scene.add(extra);rig.place(1);
 let walks=0,passes=0;const traverse=rig.scene.traverse.bind(rig.scene);rig.scene.traverse=callback=>{walks++;traverse(callback)};
 const clippedDuringPass:number[]=[],realPlaneDuringPass:boolean[]=[],renderer={localClippingEnabled:false,shadowMap:{autoUpdate:true},xr:{enabled:false},getRenderTarget:()=>null,setRenderTarget(){},render(){passes++;const planes=extra.material.clippingPlanes??[];clippedDuringPass.push(planes.length);realPlaneDuringPass.push(planes.length===1&&planes[0].constant<1e6)}} as unknown as THREE.WebGLRenderer;
 const frame=()=>{for(const face of rig.faces)face.onBeforeRender(renderer,rig.scene,rig.camera,face.geometry,face.material as THREE.Material,null as never)};
 for(let i=0;i<30;i++)frame();
 assert.ok(passes>=30,'at least the facing mirror rendered each frame');assert.equal(walks,1,'scene walked once for '+passes+' passes');assert.ok(clippedDuringPass.every(n=>n===1),'every pass is clipped by exactly its own mirror plane');
 assert.ok(realPlaneDuringPass.every(Boolean),'during a pass the plane is the real glass plane');
 // The plane COUNT must never change between main view and mirror pass: changing it makes three.js re-resolve every
 // material's program each frame, and the garbage from that was the 30-80 ms hitching.
 const parked=extra.material.clippingPlanes!;assert.equal(parked.length,1,'same plane count outside the pass');assert.ok(parked[0].constant>=1e6&&parked[0].normal.y===1,'parked where it clips nothing');assert.equal(renderer.localClippingEnabled,true);const sameArray=parked;frame();assert.equal(extra.material.clippingPlanes,sameArray,'no per-frame array churn');
 const late=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());rig.scene.add(late);rig.mirrors.invalidate();frame();assert.equal(walks,2,'a build change re-lists materials once');assert.equal(late.material.clippingPlanes?.length,1,'new materials join with the same single plane');
 // With a post-processing pipeline the main view is an offscreen target: mirrors must follow it, and still ignore every other target.
 const main={}as THREE.WebGLRenderTarget,other={}as THREE.WebGLRenderTarget;let current:THREE.WebGLRenderTarget|null=main;const targets:(THREE.WebGLRenderTarget|null)[]=[];Object.assign(renderer,{getRenderTarget:()=>current,setRenderTarget:(t:THREE.WebGLRenderTarget|null)=>{targets.push(t)}});
 rig.mirrors.viewTarget=main;let before=passes;frame();assert.ok(passes>before,'renders when the main view target is current');assert.equal(targets.at(-1),main,'hands the main target back');current=other;before=passes;frame();assert.equal(passes,before,'never renders inside thumbnails or other offscreen passes');
 assert.ok(rig.mirrors.inspect().cachedMaterials>=3);rig.dispose();assert.equal(extra.material.clippingPlanes,null,'dispose hands every material back as it was');assert.equal(late.material.clippingPlanes,null);assert.equal(renderer.localClippingEnabled,false);for(const mesh of[extra,late]){mesh.geometry.dispose();mesh.material.dispose()}
});
test('chase view refreshes one mirror per frame, taking turns; cockpit refreshes both every frame',()=>{
 const rig=mirrorRig();rig.place(1);let passes=0;
 const renderer={localClippingEnabled:false,shadowMap:{autoUpdate:true},xr:{enabled:false},getRenderTarget:()=>null,setRenderTarget(){},render(){passes++}} as unknown as THREE.WebGLRenderer;
 // Stand where BOTH faces look at the camera: on the shared side of the two glass planes.
 const normal=new THREE.Vector3();for(const face of rig.faces)normal.add(new THREE.Vector3(0,0,1).transformDirection(face.matrixWorld));const middle=rig.faces[0].getWorldPosition(new THREE.Vector3()).add(rig.faces[1].getWorldPosition(new THREE.Vector3())).multiplyScalar(.5);rig.camera.position.copy(middle).addScaledVector(normal.normalize(),3);rig.camera.lookAt(middle);rig.camera.updateMatrixWorld(true);
 const frame=(alternate:boolean)=>{rig.mirrors.update(rig.camera,1440,true,alternate);for(const face of rig.faces)if(face.visible)face.onBeforeRender(renderer,rig.scene,rig.camera,face.geometry,face.material as THREE.Material,null as never)};
 for(let i=0;i<40;i++)frame(false);const everyFrame=passes;assert.equal(everyFrame,80,'both faces, every frame');const before=[...rig.mirrors.inspect().updates];
 for(let i=0;i<40;i++)frame(true);assert.equal(passes-everyFrame,40,'exactly one pass per frame');const after=rig.mirrors.inspect().updates;assert.deepEqual(after.map((n,i)=>n-before[i]),[20,20],'the faces share the work evenly');
 const fresh=mirrorRig();fresh.camera.position.copy(rig.camera.position);fresh.camera.quaternion.copy(rig.camera.quaternion);fresh.camera.updateMatrixWorld(true);passes=0;
 fresh.mirrors.update(fresh.camera,1440,true,true);for(const face of fresh.faces)face.onBeforeRender(renderer,fresh.scene,fresh.camera,face.geometry,face.material as THREE.Material,null as never);assert.equal(passes,2,'a face never shows an empty picture: both render once before taking turns');
 rig.dispose();fresh.dispose();
});
test('mirrors are drawn as their own step before the frame, never twice, and never when off screen',()=>{
 const rig=mirrorRig();let passes=0;const depths:number[]=[];let depth=0;
 const renderer={localClippingEnabled:false,shadowMap:{autoUpdate:true},xr:{enabled:false},getRenderTarget:()=>null,setRenderTarget(){},render(){passes++;depths.push(depth)}} as unknown as THREE.WebGLRenderer;
 const normal=new THREE.Vector3();for(const face of rig.faces)normal.add(new THREE.Vector3(0,0,1).transformDirection(face.matrixWorld));const middle=rig.faces[0].getWorldPosition(new THREE.Vector3()).add(rig.faces[1].getWorldPosition(new THREE.Vector3())).multiplyScalar(.5);
 rig.camera.position.copy(middle).addScaledVector(normal.normalize(),3);rig.camera.lookAt(middle);rig.camera.updateMatrixWorld(true);
 // One game frame: gate, explicit mirror step, then the main render (which fires onBeforeRender on visible faces, one level deeper).
 const gameFrame=()=>{rig.mirrors.update(rig.camera,1440,true);rig.mirrors.render(renderer,rig.scene,rig.camera);depth=1;for(const face of rig.faces)if(face.visible)face.onBeforeRender(renderer,rig.scene,rig.camera,face.geometry,face.material as THREE.Material,null as never);depth=0};
 for(let i=0;i<10;i++)gameFrame();assert.equal(passes,20,'two faces, once each per frame');assert.ok(depths.every(d=>d===0),'every reflection is a top-level render sharing the main lights state, never nested');
 // Turn the camera away: faces are still gated live by size, but nothing is drawn for glass that is out of frame.
 rig.camera.lookAt(rig.camera.position.clone().add(normal));rig.camera.updateMatrixWorld(true);passes=0;rig.mirrors.update(rig.camera,1440,true);rig.mirrors.render(renderer,rig.scene,rig.camera);assert.equal(passes,0);
 rig.dispose();
});
test('each reflection pass draws only the slice of the rear view its glass can show, and looks the picture up the same way',()=>{
 const rig=mirrorRig();rig.place(1.2);const seen:{projection:THREE.Matrix4;view:THREE.Matrix4}[]=[];
 const renderer={localClippingEnabled:false,shadowMap:{autoUpdate:true},xr:{enabled:false},getRenderTarget:()=>null,setRenderTarget(){},render(_:THREE.Scene,c:THREE.Camera){seen.push({projection:c.projectionMatrix.clone(),view:c.matrixWorldInverse.clone()})}} as unknown as THREE.WebGLRenderer;
 rig.mirrors.update(rig.camera,1440,true);rig.mirrors.render(renderer,rig.scene,rig.camera);assert.ok(seen.length>=1);assert.equal(rig.mirrors.inspect().cropped,seen.length);
 const face=rig.faces[0],pass=seen[0],zoomX=pass.projection.elements[0]/rig.camera.projectionMatrix.elements[0],zoomY=pass.projection.elements[5]/rig.camera.projectionMatrix.elements[5];
 assert.ok(zoomX>2&&zoomY>2,`the pass frustum is a fraction of the main view (zoom ${zoomX.toFixed(1)} x ${zoomY.toFixed(1)}), so the world outside the glass is culled`);
 const lookup=(face.material as THREE.ShaderMaterial).uniforms.textureMatrix.value as THREE.Matrix4,rendered=new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(pass.projection).multiply(pass.view).multiply(face.matrixWorld),points=face.geometry.getAttribute('position');
 for(let i=0;i<points.count;i++){const local=new THREE.Vector4(points.getX(i),points.getY(i),points.getZ(i),1),uv=local.clone().applyMatrix4(lookup),drawn=local.clone().applyMatrix4(rendered);
  assert.ok(uv.x/uv.w>=0&&uv.x/uv.w<=1&&uv.y/uv.w>=0&&uv.y/uv.w<=1,'every point of the glass samples inside the rendered slice');assert.ok(Math.abs(uv.x/uv.w-drawn.x/drawn.w)<1e-6&&Math.abs(uv.y/uv.w-drawn.y/drawn.w)<1e-6,'lookup and render use the same cropped projection')}
 rig.dispose();
});
