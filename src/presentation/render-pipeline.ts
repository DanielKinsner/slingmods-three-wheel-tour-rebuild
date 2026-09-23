import {CINEMA_UNIFORMS,CINEMA_DECLARATIONS,CINEMA_COMPOSITE,type CinemaLook} from './cinematics/lens';
import * as THREE from 'three';
import {GRAPHICS_PRESETS,DynamicResolution,type GraphicsQuality} from './graphics-settings';

/**
 * The game's post pipeline. Scene -> one multisampled half-float (HDR, linear) target -> bloom mip chain -> ONE composite
 * pass that adds bloom and the speed edge blur/vignette, then applies the same tone mapping and output colour the direct
 * path used. Later Phase 2 looks plug in here.
 *
 * Dynamic resolution never reallocates: the scene draws into the lower-left `scale` portion of a full-size target and
 * every reader multiplies its UVs by `scale`. If the GPU cannot provide the HDR target, drawing falls back to direct.
 */
const ZERO_HEAT=new THREE.Vector4();
const FULLSCREEN_VERTEX='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
export interface FrameLook {cinema?:CinemaLook;/** 0..1 speed edge blur (already 0 under reduced motion). */edgeBlur?:number;/** Localized exhaust refraction; zero under reduced motion. */heatHaze?:THREE.Vector4;effectTime?:number;focus?:THREE.Vector3;bloom?:{threshold:number;intensity:number};/** Scene-linear colour grade, applied before tone mapping. */grade?:{tint:[number,number,number];saturation:number;contrast:number}}
/** Daylight: only things brighter than sunlit white glow. After dark the whole scene is dimmer, so lamps need a lower bar. */
export const DEFAULT_BLOOM={threshold:1.35,intensity:.55},NIGHT_BLOOM={threshold:.8,intensity:.95},
/** Showroom: lamps are inspected from a metre away under bright studio light, so they get a halo, not a flare. */
SHOWROOM_BLOOM={threshold:2.4,intensity:.22};
export class RenderPipeline {
 quality:GraphicsQuality;readonly resolution=new DynamicResolution();
 private scene=new THREE.Scene();private camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);private quad:THREE.Mesh;private size=new THREE.Vector2();
 private cinemaTarget?:THREE.WebGLRenderTarget;private sceneTarget?:THREE.WebGLRenderTarget;private bloomTargets:THREE.WebGLRenderTarget[]=[];private black=new THREE.DataTexture(new Uint8Array([0,0,0,255]),1,1);
 private prefilter:THREE.ShaderMaterial;private down:THREE.ShaderMaterial;private up:THREE.ShaderMaterial;private composite:THREE.ShaderMaterial;private lastFrame=0;private unsupported=false;private listeners=new Set<(target:THREE.WebGLRenderTarget|null)=>void>();
 constructor(private renderer:THREE.WebGLRenderer,quality:GraphicsQuality){
  this.quality=quality;this.black.needsUpdate=true;
  const material=(fragmentShader:string,uniforms:Record<string,THREE.IUniform>,blending:THREE.Blending=THREE.NoBlending)=>new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,blending,vertexShader:FULLSCREEN_VERTEX,fragmentShader,uniforms});
  // Only what is genuinely brighter than a lit surface blooms: lamps, underglow, sun glints. A soft knee avoids popping.
  this.prefilter=material(`uniform sampler2D tSource;uniform vec2 uvScale;uniform float threshold;varying vec2 vUv;
void main(){vec3 c=min(texture2D(tSource,min(vUv,vec2(.999))*uvScale).rgb,vec3(64.));float l=max(c.r,max(c.g,c.b)),knee=threshold*.5,soft=clamp(l-threshold+knee,0.,2.*knee);soft=soft*soft/(4.*knee+1e-4);gl_FragColor=vec4(c*max(soft,l-threshold)/max(l,1e-4),1.);}`,{tSource:{value:null},uvScale:{value:new THREE.Vector2(1,1)},threshold:{value:DEFAULT_BLOOM.threshold}});
  this.down=material(`uniform sampler2D tSource;uniform vec2 texel;varying vec2 vUv;
void main(){vec3 c=texture2D(tSource,vUv).rgb*4.;c+=texture2D(tSource,vUv+texel*vec2(-1.,-1.)).rgb+texture2D(tSource,vUv+texel*vec2(1.,-1.)).rgb+texture2D(tSource,vUv+texel*vec2(-1.,1.)).rgb+texture2D(tSource,vUv+texel*vec2(1.,1.)).rgb;gl_FragColor=vec4(c/8.,1.);}`,{tSource:{value:null},texel:{value:new THREE.Vector2()}});
  this.up=material(`uniform sampler2D tSource;uniform vec2 texel;varying vec2 vUv;
void main(){vec3 c=texture2D(tSource,vUv).rgb*4.;c+=(texture2D(tSource,vUv+texel*vec2(-1.,0.)).rgb+texture2D(tSource,vUv+texel*vec2(1.,0.)).rgb+texture2D(tSource,vUv+texel*vec2(0.,-1.)).rgb+texture2D(tSource,vUv+texel*vec2(0.,1.)).rgb)*2.;c+=texture2D(tSource,vUv+texel*vec2(-1.,-1.)).rgb+texture2D(tSource,vUv+texel*vec2(1.,-1.)).rgb+texture2D(tSource,vUv+texel*vec2(-1.,1.)).rgb+texture2D(tSource,vUv+texel*vec2(1.,1.)).rgb;gl_FragColor=vec4(c/16.,1.);}`,{tSource:{value:null},texel:{value:new THREE.Vector2()}},THREE.AdditiveBlending);
  this.composite=new THREE.ShaderMaterial({name:'RenderPipelineComposite',depthTest:false,depthWrite:false,vertexShader:FULLSCREEN_VERTEX,uniforms:{...CINEMA_UNIFORMS(),tScene:{value:null},tBloom:{value:this.black},uvScale:{value:new THREE.Vector2(1,1)},bloomIntensity:{value:0},strength:{value:0},centre:{value:new THREE.Vector2(.5,.5)},aspect:{value:1},gradeTint:{value:new THREE.Vector3(1,1,1)},gradeSaturation:{value:1},gradeContrast:{value:1},heatHaze:{value:new THREE.Vector4()},effectTime:{value:0}},
   fragmentShader:`uniform vec4 heatHaze;uniform float effectTime;uniform sampler2D tScene;uniform sampler2D tBloom;uniform vec2 uvScale;uniform float bloomIntensity;uniform float strength;uniform vec2 centre;uniform float aspect;uniform vec3 gradeTint;uniform float gradeSaturation;uniform float gradeContrast;varying vec2 vUv;
${CINEMA_DECLARATIONS}
vec3 scene(vec2 uv){return texture2D(tScene,clamp(uv,vec2(0.),vec2(.9995))*uvScale).rgb;}
void main(){
 vec2 away=vUv-centre;float radius=length(away*vec2(aspect,1.));
 // Speed blur: nothing near the car or the vanishing point is touched; it grows toward the frame edge.
 float amount=strength*smoothstep(.30,.95,radius);vec2 sampleUv=vUv;
 if(heatHaze.w>.001){vec2 h=(vUv-heatHaze.xy)*vec2(aspect,1.)/max(.001,heatHaze.z);float mask=max(0.,1.-dot(h,h));sampleUv.x+=sin(h.y*19.-effectTime*8.)*mask*mask*heatHaze.w*.0012;}
 vec3 colour=scene(sampleUv);
 if(amount>.002){vec3 sum=colour;for(int i=1;i<10;i++)sum+=scene(vUv-away*amount*.095*float(i)/9.);colour=sum/10.;}
 ${CINEMA_COMPOSITE}
 colour+=texture2D(tBloom,vUv).rgb*bloomIntensity;
 colour*=1.-strength*.30*smoothstep(.55,1.15,radius);
 // Look grade in scene-linear light: tint, saturation about luminance, contrast pivoting on 18% grey.
 colour*=gradeTint;float luma=dot(colour,vec3(.2126,.7152,.0722));colour=max(mix(vec3(luma),colour,gradeSaturation),0.);colour=.18*pow(colour/.18,vec3(gradeContrast));
 gl_FragColor=vec4(colour,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`});
  this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.composite);this.quad.frustumCulled=false;this.scene.add(this.quad);this.rebuild();
 }
 /** The target the main view draws into (null only on the direct fallback). Mirrors and other nested passes need to know it. */
 get viewTarget(){return this.sceneTarget??null}
 onViewTarget(listener:(target:THREE.WebGLRenderTarget|null)=>void){this.listeners.add(listener);listener(this.viewTarget);return()=>this.listeners.delete(listener)}
 setQuality(quality:GraphicsQuality){if(quality===this.quality)return;this.quality=quality;this.rebuild()}
 /** Call after renderer size or pixel ratio changes. */
 resize(){this.rebuild()}
 private rebuild(){
  const preset=GRAPHICS_PRESETS[this.quality];this.cinemaTarget?.dispose();this.cinemaTarget=undefined;this.sceneTarget?.dispose();this.bloomTargets.forEach(t=>t.dispose());this.bloomTargets=[];this.sceneTarget=undefined;this.resolution.scale=1;
  if(preset.post&&!this.unsupported)try{
   this.renderer.getDrawingBufferSize(this.size);const w=Math.max(2,this.size.x),h=Math.max(2,this.size.y);
   this.sceneTarget=new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,samples:preset.samples,depthBuffer:true,stencilBuffer:false});this.sceneTarget.texture.name='pipeline-scene';
   for(let i=0;i<preset.bloomLevels;i++){const t=new THREE.WebGLRenderTarget(Math.max(2,w>>(i+1)),Math.max(2,h>>(i+1)),{type:THREE.HalfFloatType,depthBuffer:false,stencilBuffer:false});t.texture.name='pipeline-bloom-'+i;this.bloomTargets.push(t)}
  }catch(error){console.warn('Post pipeline unavailable; drawing directly.',error);this.unsupported=true;this.sceneTarget?.dispose();this.sceneTarget=undefined;this.bloomTargets.forEach(t=>t.dispose());this.bloomTargets=[]}
  for(const listener of this.listeners)listener(this.viewTarget);
 }
 private pass(material:THREE.ShaderMaterial,target:THREE.WebGLRenderTarget|null,clear:boolean){const renderer=this.renderer,auto=renderer.autoClear;this.quad.material=material;renderer.autoClear=clear;renderer.setRenderTarget(target);renderer.render(this.scene,this.camera);renderer.autoClear=auto}
 render(scene:THREE.Scene,camera:THREE.PerspectiveCamera,look:FrameLook={},now=performance.now()){
  const renderer=this.renderer,preset=GRAPHICS_PRESETS[this.quality];
  if(look.cinema?.amount&&this.sceneTarget&&!this.cinemaTarget){const {width:w,height:h}=this.sceneTarget;this.cinemaTarget=new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,samples:preset.samples,depthBuffer:true,stencilBuffer:false});this.cinemaTarget.depthTexture=new THREE.DepthTexture(w,h);this.cinemaTarget.depthTexture.type=THREE.UnsignedIntType;this.cinemaTarget.texture.name='cinematic-scene'}
  const target=look.cinema?.amount?this.cinemaTarget??this.sceneTarget:this.sceneTarget;
  const scale=this.resolution.update(this.lastFrame?now-this.lastFrame:0,preset.dynamicResolution);this.lastFrame=now;
  if(!target){renderer.setRenderTarget(null);renderer.render(scene,camera);return}
  const w=Math.max(2,Math.round(target.width*scale)),h=Math.max(2,Math.round(target.height*scale));target.viewport.set(0,0,w,h);target.scissor.set(0,0,w,h);target.scissorTest=scale<1;
  renderer.setRenderTarget(target);renderer.render(scene,camera);
  const uv=this.composite.uniforms,uvScale=(uv.uvScale.value as THREE.Vector2).set(w/target.width,h/target.height),bloom=look.bloom??DEFAULT_BLOOM;
  if(this.bloomTargets.length&&bloom.intensity>0){
   const chain=this.bloomTargets;this.prefilter.uniforms.tSource.value=target.texture;(this.prefilter.uniforms.uvScale.value as THREE.Vector2).copy(uvScale);this.prefilter.uniforms.threshold.value=bloom.threshold;this.pass(this.prefilter,chain[0],true);
   for(let i=1;i<chain.length;i++){this.down.uniforms.tSource.value=chain[i-1].texture;(this.down.uniforms.texel.value as THREE.Vector2).set(1/chain[i-1].width,1/chain[i-1].height);this.pass(this.down,chain[i],true)}
   // Walk back up, adding each blurrier level into the sharper one: a wide, smooth glow for the price of a few small passes.
   for(let i=chain.length-1;i>0;i--){this.up.uniforms.tSource.value=chain[i].texture;(this.up.uniforms.texel.value as THREE.Vector2).set(1/chain[i].width,1/chain[i].height);this.pass(this.up,chain[i-1],false)}
   uv.tBloom.value=chain[0].texture;uv.bloomIntensity.value=bloom.intensity;
  }else{uv.tBloom.value=this.black;uv.bloomIntensity.value=0}
  const film=look.cinema;(uv.cinema.value as THREE.Vector4).set(film?.amount??0,film?.focus??5,film?.aperture??0,film?.time??0);uv.cinemaDepth.value=target.depthTexture??this.black;uv.cinemaDepthMode.value=renderer.capabilities.reversedDepthBuffer?1:renderer.capabilities.logarithmicDepthBuffer?2:0;(uv.cinemaRange.value as THREE.Vector2).set(camera.near,camera.far);(uv.cinemaTexel.value as THREE.Vector2).set(1/w,1/h);
  const grade=look.grade;(uv.gradeTint.value as THREE.Vector3).set(grade?.tint[0]??1,grade?.tint[1]??1,grade?.tint[2]??1);uv.gradeSaturation.value=grade?.saturation??1;uv.gradeContrast.value=grade?.contrast??1;
  (uv.heatHaze.value as THREE.Vector4).copy(look.heatHaze??ZERO_HEAT);uv.effectTime.value=look.effectTime??0;
  uv.tScene.value=target.texture;uv.strength.value=THREE.MathUtils.clamp(look.edgeBlur??0,0,1);uv.aspect.value=camera.aspect;
  // Blur streams away from where the car is heading, kept near the middle of the frame.
  if(look.focus){const ndc=look.focus.clone().project(camera);(uv.centre.value as THREE.Vector2).set(THREE.MathUtils.clamp(ndc.x*.5+.5,.35,.65),THREE.MathUtils.clamp(ndc.y*.5+.5,.4,.62))}
  this.pass(this.composite,null,true);
 }
 inspect(){return{quality:this.quality,post:!!this.sceneTarget,samples:this.sceneTarget?.samples??0,bloomLevels:this.bloomTargets.length,resolutionScale:this.resolution.scale,targetFrameMs:+this.resolution.targetMs.toFixed(2),size:this.sceneTarget?[this.sceneTarget.width,this.sceneTarget.height]:null}}
 dispose(){this.cinemaTarget?.dispose();this.sceneTarget?.dispose();this.bloomTargets.forEach(t=>t.dispose());this.black.dispose();for(const m of[this.prefilter,this.down,this.up,this.composite])m.dispose();this.quad.geometry.dispose();this.listeners.clear()}
}
