import * as THREE from 'three';
/**
 * The game's first post pass: the scene renders to one multisampled half-float target, then a single full-screen
 * shader adds a radial edge blur and light vignette scaled by speed, and applies the same tone mapping and output
 * colour conversion the direct path used. Strength 0 is a plain copy. It is not created at all for reduced motion or
 * low quality, where the renderer draws straight to the screen as before.
 */
export class SpeedPost {
 readonly target:THREE.WebGLRenderTarget;private scene=new THREE.Scene();private camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);private material:THREE.ShaderMaterial;private quad:THREE.Mesh;private size=new THREE.Vector2();
 constructor(private renderer:THREE.WebGLRenderer){
  renderer.getDrawingBufferSize(this.size);this.target=new THREE.WebGLRenderTarget(this.size.x,this.size.y,{type:THREE.HalfFloatType,samples:4,depthBuffer:true,stencilBuffer:false});this.target.texture.name='speed-post-scene';
  this.material=new THREE.ShaderMaterial({name:'SpeedPost',depthTest:false,depthWrite:false,uniforms:{tScene:{value:this.target.texture},strength:{value:0},centre:{value:new THREE.Vector2(.5,.5)},aspect:{value:1}},
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
   fragmentShader:`uniform sampler2D tScene;uniform float strength;uniform vec2 centre;uniform float aspect;varying vec2 vUv;
void main(){
 vec2 away=vUv-centre;float radius=length(away*vec2(aspect,1.));
 // Nothing near the car or the vanishing point is touched; the blur grows toward the frame edge.
 float amount=strength*smoothstep(.30,.95,radius);vec3 colour=texture2D(tScene,vUv).rgb;
 if(amount>.002){vec3 sum=colour;for(int i=1;i<10;i++)sum+=texture2D(tScene,vUv-away*amount*.095*float(i)/9.).rgb;colour=sum/10.;}
 colour*=1.-strength*.30*smoothstep(.55,1.15,radius);
 gl_FragColor=vec4(colour,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`});
  this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.material);this.quad.frustumCulled=false;this.scene.add(this.quad);
 }
 /** Follows renderer size and pixel ratio. */
 resize(){this.renderer.getDrawingBufferSize(this.size);this.target.setSize(this.size.x,this.size.y)}
 render(scene:THREE.Scene,camera:THREE.PerspectiveCamera,strength:number,focus?:THREE.Vector3){
  const renderer=this.renderer,u=this.material.uniforms;u.strength.value=THREE.MathUtils.clamp(strength,0,1);u.aspect.value=camera.aspect;
  // Blur streams away from where the car is heading, kept near the middle of the frame.
  if(focus){const ndc=focus.clone().project(camera);(u.centre.value as THREE.Vector2).set(THREE.MathUtils.clamp(ndc.x*.5+.5,.35,.65),THREE.MathUtils.clamp(ndc.y*.5+.5,.4,.62))}
  renderer.setRenderTarget(this.target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(this.scene,this.camera);
 }
 inspect(){return{size:this.size.toArray(),samples:this.target.samples,strength:this.material.uniforms.strength.value as number}}
 dispose(){this.target.dispose();this.material.dispose();this.quad.geometry.dispose()}
}
