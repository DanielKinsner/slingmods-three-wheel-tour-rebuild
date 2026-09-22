import * as THREE from 'three';
/**
 * three.js draws a transparent DoubleSide material in two halves, back faces then front faces, as two different shader
 * programs (FLIP_SIDED, then plain), and flags the material as changed before each half. Every such part therefore
 * switches program twice and re-uploads all of its material and light uniforms twice, in every pass: in a four-car race
 * those ~100 decal and glass parts were a third of the frame's CPU.
 *
 * Here both halves use the plain (FrontSide) program. The FLIP_SIDED program differs from it only by negating the view
 * normal (plus the bitangent of meshes with stored tangents, which are left on three's path), so the back half is drawn
 * with the object's normal matrix negated, which yields exactly the same numbers (negation is exact), and with the
 * winding flipped exactly as three flips it for BackSide. Same draws, same order, same GL state, same pixels; the second
 * half reuses the program and material the first half just set up.
 */
const defaultHook=THREE.Material.prototype.onBeforeRender;
const halves=new WeakSet<THREE.Material>(),patched=new WeakSet<THREE.WebGLRenderer>();
let drawingBack=false;
/** three sets the winding in state.setMaterial for every draw; for a back half, flip it as it would for BackSide. */
function patch(renderer:THREE.WebGLRenderer){
 if(patched.has(renderer))return;patched.add(renderer);
 const state=renderer.state,setMaterial=state.setMaterial;
 state.setMaterial=(...args:Parameters<typeof setMaterial>)=>{setMaterial(...args);if(drawingBack&&halves.has(args[0]))state.setFlipSided(!args[1])};
}
function drawBackHalf(this:THREE.Material,renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera,geometry:THREE.BufferGeometry,object:THREE.Object3D,group:THREE.Group){
 if(!this.transparent||this.side!==THREE.FrontSide||!halves.has(this))return;
 patch(renderer);const normal=object.normalMatrix.elements;
 for(let i=0;i<9;i++)normal[i]=-normal[i];drawingBack=true;
 try{renderer.renderBufferDirect(camera,scene,geometry,this,object,group as unknown as Parameters<THREE.WebGLRenderer['renderBufferDirect']>[5])}
 finally{drawingBack=false;for(let i=0;i<9;i++)normal[i]=-normal[i]}
}
interface Held{shadowSide:THREE.Side|null}
export class TransparentHalves {
 private held=new Map<THREE.Material,Held>();
 /** Converts every eligible material under `roots` (idempotent). Returns how many materials are converted in total. */
 apply(roots:THREE.Object3D[]){
  const users=new Map<THREE.Material,THREE.Mesh[]>();
  for(const root of roots)root.traverse(o=>{const mesh=o as THREE.Mesh;if(!mesh.isMesh)return;for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material]){const list=users.get(m);if(list)list.push(mesh);else users.set(m,[mesh])}});
  for(const[m,meshes]of users)if(!this.held.has(m)&&eligible(m,meshes)){
   this.held.set(m,{shadowSide:m.shadowSide});halves.add(m);
   // A null shadow side on a DoubleSide material casts from both sides; keep that now that the material is FrontSide.
   m.shadowSide??=THREE.DoubleSide;m.side=THREE.FrontSide;m.needsUpdate=true;m.onBeforeRender=drawBackHalf;
  }
  return this.held.size;
 }
 /** Back to three's own two-program path (evidence A/B). */
 restore(){for(const[m,h]of this.held){halves.delete(m);m.onBeforeRender=defaultHook;m.side=THREE.DoubleSide;m.shadowSide=h.shadowSide;m.needsUpdate=true}this.held.clear()}
 inspect(){return{materials:this.held.size}}
}
// Stored tangents get a bitangent flip in FLIP_SIDED that a normal matrix cannot reproduce; transmission has its own
// renderer-owned back-face pass; a custom render hook belongs to someone else. All three keep three's path.
function eligible(m:THREE.Material,meshes:THREE.Mesh[]){return m.transparent&&m.side===THREE.DoubleSide&&!m.forceSinglePass&&m.onBeforeRender===defaultHook&&!((m as THREE.MeshPhysicalMaterial).transmission>0)&&meshes.every(mesh=>!mesh.geometry.attributes.tangent)}
