/** Use on each loaded tree material. COLOR_0 stores wind weights, not albedo tint.
 * Pass a shared {value: seconds} uniform; update it once per frame.
 */
export function enableTreeWind(material,timeUniform,{strength=.25,speed=1,translucency=.58,sunDirection=[.8,.14,-.58],sunColor=[1,.73,.43]}={}){
 material.vertexColors=false;
 material.onBeforeCompile=shader=>{
  shader.uniforms.p11Time=timeUniform;
  shader.uniforms.p11WindStrength={value:strength};
  shader.uniforms.p11WindSpeed={value:speed};
  shader.uniforms.p11Translucency={value:translucency};shader.uniforms.p11SunDirection={value:sunDirection};shader.uniforms.p11SunColor={value:sunColor};
  shader.vertexShader='attribute vec3 color;uniform float p11Time;uniform float p11WindStrength;uniform float p11WindSpeed;varying vec3 vP11Normal;varying float vP11Leaf;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float wt=p11Time*p11WindSpeed;
   transformed.x+=p11WindStrength*(color.r*color.r*sin(wt+position.y*.13)+color.g*.22*sin(wt*2.3+position.x*.8)+color.b*.045*sin(wt*9.0+position.z*5.0));
   transformed.z+=p11WindStrength*color.g*.18*cos(wt*1.7+position.y*.7);
   vP11Normal=normalize(mat3(modelMatrix)*normal);vP11Leaf=color.b;
  `);
  shader.fragmentShader='uniform float p11Translucency;uniform vec3 p11SunDirection;uniform vec3 p11SunColor;varying vec3 vP11Normal;varying float vP11Leaf;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`outgoingLight+=diffuseColor.rgb*p11SunColor*p11Translucency*vP11Leaf*max(0.0,dot(-normalize(vP11Normal),normalize(p11SunDirection)));
   #include <opaque_fragment>`);
 };
 material.customProgramCacheKey=()=> 'p11-tree-wind-1';material.needsUpdate=true;return material;
}
