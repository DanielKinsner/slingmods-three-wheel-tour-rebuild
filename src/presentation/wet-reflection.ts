import * as THREE from 'three';
import type {WetRoadUniforms} from './race-asphalt';

/**
 * Planar reflection for a wet, flat road (High/Ultra). One extra half-resolution pass per frame, from the main camera
 * mirrored about the road plane, that draws ONLY what reads in a puddle: the cars, their underglow and lamps, trackside
 * lights. Those objects are tagged onto their own render layer; the road, ground, water and buildings are not, so the
 * mirrored camera (which sits underground) is never blocked and no clipping is needed. The sky is left out on purpose:
 * the road material already mirrors the sky probe, and the image's alpha lets reflected objects cover that glint.
 *
 * It is a top-level render before the frame, like the vehicle mirrors, so it shares the main pass' lights state.
 */
export const WET_REFLECTION_LAYER=1;
/** Share of the full drawing buffer. Puddles show a normal-perturbed, soft image; at .5 this pass cost ~65% of the main
 *  view's pixels (the main view itself runs at dynamic resolution) and was the heavy half of High's alternating frames. */
export const REFLECTION_SCALE=.35;
export class WetReflection {
 readonly target:THREE.WebGLRenderTarget;private virtual=new THREE.PerspectiveCamera();private position=new THREE.Vector3();private forward=new THREE.Vector3();private up=new THREE.Vector3();private look=new THREE.Vector3();private size=new THREE.Vector2();private clear=new THREE.Color();private tagged:THREE.Object3D[]=[];private untagged:THREE.Object3D[]=[];private age=1e9;passes=0;
 private readonly bias=new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
 constructor(private renderer:THREE.WebGLRenderer,readonly planeY:number,private surfaces:WetRoadUniforms[],readonly scale=REFLECTION_SCALE){
  renderer.getDrawingBufferSize(this.size);this.target=new THREE.WebGLRenderTarget(Math.max(2,Math.round(this.size.x*scale)),Math.max(2,Math.round(this.size.y*scale)),{type:THREE.HalfFloatType,depthBuffer:true,stencilBuffer:false});this.target.texture.name='wet-road-reflection';
  this.virtual.layers.set(WET_REFLECTION_LAYER);for(const surface of surfaces){surface.reflection.value=this.target.texture;surface.planar.value=1}
 }
 /** Roots whose whole subtree should appear in puddles. `except` roots (e.g. the live mirror faces) are kept out. */
 reflect(roots:THREE.Object3D[],except:THREE.Object3D[]=[]){this.tagged=roots;this.untagged=except;this.age=1e9}
 resize(){this.renderer.getDrawingBufferSize(this.size);this.target.setSize(Math.max(2,Math.round(this.size.x*this.scale)),Math.max(2,Math.round(this.size.y*this.scale)))}
 private tag(scene:THREE.Scene){
  // Re-tagged about every two seconds so parts fitted later (products, rivals) join without any caller bookkeeping. Lights
  // are tested against camera layers too, so every light joins the layer or the reflected cars would be unlit.
  for(const root of this.tagged)root.traverse(o=>{if(o.userData.reflectionExclude)o.layers.disable(WET_REFLECTION_LAYER);else o.layers.enable(WET_REFLECTION_LAYER)});for(const root of this.untagged)root.traverse(o=>o.layers.disable(WET_REFLECTION_LAYER));scene.traverse(o=>{if((o as THREE.Light).isLight)o.layers.enable(WET_REFLECTION_LAYER)});this.age=0;
 }
 render(scene:THREE.Scene,camera:THREE.PerspectiveCamera){
  const renderer=this.renderer;if(++this.age>120)this.tag(scene);
  camera.updateMatrixWorld();const e=camera.matrixWorld.elements,h=this.planeY;
  // Mirror the camera about y=h: position, view direction and up all flip in y. lookAt() then builds a proper rotation,
  // and projecting a WORLD point on the road through this camera lands on its reflection (the standard planar mirror).
  this.position.setFromMatrixPosition(camera.matrixWorld);this.position.y=2*h-this.position.y;this.forward.set(-e[8],e[9],-e[10]);this.up.set(e[4],-e[5],e[6]);
  const v=this.virtual;v.fov=camera.fov;v.aspect=camera.aspect;v.near=camera.near;v.far=Math.min(camera.far,420);v.position.copy(this.position);v.up.copy(this.up);v.lookAt(this.look.copy(this.position).add(this.forward));v.updateProjectionMatrix();v.updateMatrixWorld();
  for(const surface of this.surfaces)surface.reflectionMatrix.value.copy(this.bias).multiply(v.projectionMatrix).multiply(v.matrixWorldInverse);
  const returnTo=renderer.getRenderTarget(),background=scene.background,shadows=renderer.shadowMap.autoUpdate,alpha=renderer.getClearAlpha();renderer.getClearColor(this.clear);
  try{scene.background=null;renderer.shadowMap.autoUpdate=false;renderer.setClearColor(0x000000,0);renderer.setRenderTarget(this.target);renderer.render(scene,v);this.passes++}
  finally{scene.background=background;renderer.shadowMap.autoUpdate=shadows;renderer.setClearColor(this.clear,alpha);renderer.setRenderTarget(returnTo)}
 }
 inspect(){return{planeY:this.planeY,size:[this.target.width,this.target.height],passes:this.passes,surfaces:this.surfaces.length,layer:WET_REFLECTION_LAYER}}
 dispose(){for(const surface of this.surfaces){surface.planar.value=0;surface.reflection.value=null}this.target.dispose()}
}
