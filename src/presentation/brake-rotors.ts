import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
/**
 * The 2026 Slingshot's rotors are 460/164-vertex dishes: faceted, flat grey, no hat, no drilling. Each one is rebuilt in
 * place, fitted to the original mesh (same node, so it still spins and steers with its wheel): a two-piece rotor with a
 * machined friction ring (drilled holes, curved slots, turning marks) and a dark anodised hat toward the hub.
 * Presentation only; the original's radius, axis and axial position are measured from its own vertices. Ring and hat
 * share one geometry and material (the hat samples a dark strip of the texture), so the draw count is unchanged.
 */
const ROTOR=/Brembo_399mm_Rotor|RoughAluminum_BrakeDisk/;
let faceTexture:THREE.Texture|null|undefined;const HAT_ROW=136;
function ringTexture(){
 if(faceTexture!==undefined)return faceTexture;
 if(typeof document==='undefined')return faceTexture=null;
 // u = angle around the rotor, v = along the lathe profile (outer edge -> inner edge of the friction face).
 const c=document.createElement('canvas');c.width=2048;c.height=HAT_ROW+8;const g=c.getContext('2d')!;
 g.fillStyle='#c7cacd';g.fillRect(0,0,2048,128);g.fillStyle='#2b2e33';g.fillRect(0,128,2048,HAT_ROW+8-128);   // hat strip
 for(let y=0;y<128;y+=2){g.fillStyle=`rgba(${y%6?255:40},${y%6?255:40},${y%6?255:40},${.05+.05*Math.random()})`;g.fillRect(0,y,2048,1)}   // turning marks
 g.fillStyle='#16181b';
 for(let i=0;i<36;i++)for(const [row,shift] of [[34,0],[64,.5],[94,0]] as const){const x=(i+shift+(row===64?0:.25))/36*2048;g.beginPath();g.ellipse(x,row,7.2,6,0,0,Math.PI*2);g.fill()}   // cross-drilling
 g.strokeStyle='#2a2d31';g.lineWidth=3;for(let i=0;i<12;i++){const x=(i+.75)/12*2048;g.beginPath();g.moveTo(x,18);g.quadraticCurveTo(x+34,64,x+10,110);g.stroke()}    // curved slots
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.RepeatWrapping;t.anisotropy=8;return faceTexture=t;
}
function lathe(profile:[number,number][],segments=96){return new THREE.LatheGeometry(profile.map(([r,a])=>new THREE.Vector2(r,a)),segments)}
export function upgradeBrakeRotors(car:THREE.Object3D){
 const found:THREE.Mesh[]=[];car.traverse(o=>{if(o instanceof THREE.Mesh&&!Array.isArray(o.material)&&ROTOR.test(o.material.name)&&!o.userData.rotorUpgraded)found.push(o)});
 if(!found.length)return 0;
 const map=ringTexture(),material=new THREE.MeshStandardMaterial({name:'rotor_machined_two_piece',color:map?0xffffff:0x9ea2a6,map,metalness:1,roughness:.36});
 for(const mesh of found){
  const pos=mesh.geometry.getAttribute('position') as THREE.BufferAttribute,box=new THREE.Box3().setFromBufferAttribute(pos),size=box.getSize(new THREE.Vector3()),centre=box.getCenter(new THREE.Vector3());
  const axis=size.x<size.y&&size.x<size.z?0:size.y<size.z?1:2,R=Math.max(...[0,1,2].filter(i=>i!==axis).map(i=>size.getComponent(i)))/2;
  // axial planes of the friction ring (outer vertices) and of the hat (inner vertices), in the mesh's own space
  let ringA=0,ringN=0,hubA=0,hubN=0;const p=new THREE.Vector3();
  for(let i=0;i<pos.count;i++){p.fromBufferAttribute(pos,i);const d=p.clone().sub(centre);const a=d.getComponent(axis);d.setComponent(axis,0);const r=d.length();if(r>R*.85){ringA+=a;ringN++}else if(r<R*.45){hubA+=a;hubN++}}
  const ring=ringN?ringA/ringN:0,hub=hubN?hubA/hubN:ring+Math.sign(size.getComponent(axis))*size.getComponent(axis)*.4;
  const t=Math.min(.028,Math.max(.012,size.getComponent(axis)*.55)),Ri=R*.6,dir=Math.sign(hub-ring)||1,hubR=R*.5;
  const face=lathe([[R,-t/2],[R+.0015,-t/2+.002],[R+.0015,t/2-.002],[R,t/2],[Ri,t/2],[Ri,-t/2],[R,-t/2]]);
  {const fp=face.getAttribute('position') as THREE.BufferAttribute,uv=face.getAttribute('uv') as THREE.BufferAttribute;for(let i=0;i<fp.count;i++)uv.setY(i,1-THREE.MathUtils.clamp((R-Math.hypot(fp.getX(i),fp.getZ(i)))/(R-Ri),0,1)*128/(HAT_ROW+8))}   // v = radius across the friction face
  const bell=lathe([[hubR,dir*t*.2],[hubR,dir*(Math.abs(hub-ring)+.004)],[R*.14,dir*(Math.abs(hub-ring)+.004)],[R*.14,dir*(Math.abs(hub-ring)-.002)],[hubR-.006,dir*(Math.abs(hub-ring)-.002)],[hubR-.006,dir*t*.2]],64);
  // Lathe revolves about +Y: rotate onto the measured axis and move onto the measured ring plane.
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3().setComponent(axis,1)),m=new THREE.Matrix4().compose(centre.clone().setComponent(axis,centre.getComponent(axis)+ring),q,new THREE.Vector3(1,1,1));
  {const uv=bell.getAttribute('uv') as THREE.BufferAttribute;for(let i=0;i<uv.count;i++)uv.setY(i,1-(HAT_ROW+4)/(HAT_ROW+8))}   // hat: the dark strip
  for(const g of [face,bell])g.applyMatrix4(m);
  const merged=mergeGeometries([face,bell]);face.dispose();bell.dispose();if(!merged)continue;
  mesh.geometry.dispose();mesh.geometry=merged;mesh.material=material;mesh.receiveShadow=true;mesh.userData.rotorUpgraded=true;
  mesh.userData.rotorFit={centre:centre.toArray(),axis,R,t,ring,dir};
 }
 upgradeFrontCalipers(car);
 return found.length;
}
/**
 * The front calipers were lumpy low-poly blobs. Each shares its rotor's node transform (same local frame), so a new body is
 * swept around the measured rotor: a curved caliper straddling the friction ring with squircle ends and two piston bosses on
 * the outboard face, spanning the original's angle and width. Geometry swap only: same mesh, same (tuned) red material.
 */
const FRONT_CALIPER=/BremboCaliper/;
function upgradeFrontCalipers(car:THREE.Object3D){
 const rotors:THREE.Mesh[]=[],calipers:THREE.Mesh[]=[];car.traverse(o=>{if(o instanceof THREE.Mesh&&!Array.isArray(o.material)){if(o.userData.rotorFit)rotors.push(o);else if(FRONT_CALIPER.test(o.material.name)&&!o.userData.caliperUpgraded)calipers.push(o)}});
 const same=(a:THREE.Object3D,b:THREE.Object3D)=>a.position.distanceTo(b.position)<1e-6&&Math.abs(a.quaternion.dot(b.quaternion))>1-1e-9&&a.scale.distanceTo(b.scale)<1e-6;
 for(const mesh of calipers){
  const rotor=rotors.find(r=>same(r,mesh));if(!rotor)continue;
  const fit=rotor.userData.rotorFit as {centre:number[];axis:number;R:number;t:number;ring:number;dir:number},centre=new THREE.Vector3().fromArray(fit.centre),A=fit.axis;
  const u=new THREE.Vector3().setComponent((A+1)%3,1),w=new THREE.Vector3().setComponent((A+2)%3,1),pos=mesh.geometry.getAttribute('position') as THREE.BufferAttribute,p=new THREE.Vector3();
  let sx=0,sy=0,a0=Infinity,a1=-Infinity;for(let i=0;i<pos.count;i++){p.fromBufferAttribute(pos,i).sub(centre);const ang=Math.atan2(p.dot(w),p.dot(u));sx+=Math.cos(ang);sy+=Math.sin(ang);a0=Math.min(a0,p.getComponent(A));a1=Math.max(a1,p.getComponent(A))}
  const mid=Math.atan2(sy,sx);let half=0;for(let i=0;i<pos.count;i++){p.fromBufferAttribute(pos,i).sub(centre);let d=Math.atan2(p.dot(w),p.dot(u))-mid;d=Math.atan2(Math.sin(d),Math.cos(d));half=Math.max(half,Math.abs(d))}
  half=THREE.MathUtils.clamp(half,.3,.85);
  const rin=fit.R*.7,rout=fit.R+.013,am=(a0+a1)/2,aw=Math.max(.05,(a1-a0)*.92),rm=(rin+rout)/2,rh=rout-rin;
  const at=(r:number,ang:number,a:number)=>centre.clone().addScaledVector(u,r*Math.cos(ang)).addScaledVector(w,r*Math.sin(ang)).setComponent(A,centre.getComponent(A)+a);
  const verts:number[]=[],index:number[]=[],uvs:number[]=[],profile:[number,number][]=[];const P=20;
  for(let k=0;k<P;k++){const q=k/P*Math.PI*2,c=Math.cos(q),s2=Math.sin(q);profile.push([Math.sign(c)*Math.abs(c)**.35,Math.sign(s2)*Math.abs(s2)**.35])}   // rounded-box section
  const N=28;for(let j=0;j<=N;j++){const x=j/N*2-1,e=(1-Math.abs(x)**6)**(1/6),ang=mid+x*half;profile.forEach(([pr,pa],k)=>{const v=at(rm+pr*rh/2*Math.max(e,.02),ang,am+pa*aw/2*Math.max(e,.02));verts.push(v.x,v.y,v.z);uvs.push(j/N*3,k/P)})}   // real UVs: the tuned material's detail normal map derives tangents from them
  for(let j=0;j<N;j++)for(let k=0;k<P;k++){const a=j*P+k,b=j*P+(k+1)%P;index.push(a,b,b+P,a,b+P,a+P)}
  const body=new THREE.BufferGeometry();body.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));body.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));body.setIndex(index);body.computeVertexNormals();
  const parts=[body];const out=fit.dir>0?a1:a0,sign=fit.dir>0?1:-1;
  for(const f of[-.42,.42]){const boss=lathe([[0,0],[.017,0],[.019,.002],[.019,.005],[.016,.007],[0,.007]],28),c=at(rm+rh*.05,mid+f*half,out-sign*.002);
   boss.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3().setComponent(A,sign)));boss.translate(c.x,c.y,c.z);parts.push(boss)}   // the lathe's own normals: recomputing them zeroes its pole vertices (NaN in the shader)
  const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());   // all indexed: smooth shared normalsif(!merged)continue;
  mesh.geometry.dispose();mesh.geometry=merged;mesh.userData.caliperUpgraded=true;
  const m=mesh.material as THREE.MeshStandardMaterial;m.roughness=Math.min(m.roughness,.3);m.metalness=0;
 }
}
