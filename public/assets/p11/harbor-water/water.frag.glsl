// Three.js ShaderMaterial, perspective camera, linear non-reversed depth.
// Render opaque geometry to sceneDepth before rendering water. Exclude water
// from that depth pass. envMap is an unfiltered cubemap; PMREM needs a different sampler.
uniform sampler2D swellNormal;
uniform sampler2D chopNormal;
uniform sampler2D foamMap;
uniform sampler2D depthLut;
uniform sampler2D sceneDepth;
uniform samplerCube envMap;
uniform float time;
uniform float cameraNear;
uniform float cameraFar;
uniform vec3 sunDirection;
uniform vec3 sunColor;
uniform float sunIntensity;
uniform float nightMix;
uniform vec3 nightLightPosition[4];
uniform vec3 nightLightColor[4];
varying vec3 vWorld;
varying vec4 vClip;
float linearDepth(float z){return cameraNear*cameraFar/(cameraFar-z*(cameraFar-cameraNear));}
void main(){
 vec3 a=texture2D(swellNormal,vWorld.xz/16.0+time*vec2(.003,.001)).xyz*2.0-1.0;
 vec3 b=texture2D(chopNormal,vWorld.xz/2.0+time*vec2(-.014,.008)).xyz*2.0-1.0;
 vec3 n=normalize(vec3(a.x+b.x,a.z*b.z,a.y+b.y));
 vec3 viewDir=normalize(cameraPosition-vWorld);
 vec2 screen=vClip.xy/vClip.w*.5+.5;
 float depth=max(0.0,linearDepth(texture2D(sceneDepth,screen).x)-linearDepth(gl_FragCoord.z));
 float lutU=depth<=3.0?depth/6.0:.5+(depth-3.0)/18.0;
 vec3 base=texture2D(depthLut,vec2(clamp(lutU,0.0,1.0),.5)).rgb;
 float fresnel=.02+.98*pow(1.0-max(dot(viewDir,n),0.0),5.0);
 vec3 reflection=textureCube(envMap,reflect(-viewDir,n)).rgb;
 vec3 halfDir=normalize(viewDir+normalize(sunDirection));
 float glitter=pow(max(dot(n,halfDir),0.0),340.0)*sunIntensity;
 float foam=(1.0-smoothstep(.08,.8,depth))*texture2D(foamMap,vWorld.xz*.4+time*.004).r;
 vec3 color=mix(base,reflection,fresnel)+sunColor*glitter;
 for(int i=0;i<4;i++){
  vec3 lightDir=normalize(nightLightPosition[i]-vWorld);
  vec3 h=normalize(viewDir+lightDir);
  float along=pow(max(dot(n,h),0.0),64.0);
  float horizontal=exp(-pow(dot(normalize(h.xz+vec2(.0001)),vec2(1.0,0.0)),2.0)*50.0);
  color+=nightLightColor[i]*along*horizontal*nightMix;
 }
 color=mix(color,vec3(.8,.89,.86),foam*.85);
 gl_FragColor=vec4(color,1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}
