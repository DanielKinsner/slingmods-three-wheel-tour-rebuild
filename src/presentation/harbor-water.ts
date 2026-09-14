import * as THREE from 'three';

const CACHE_KEY='p06b-harbor-water-worldshore-v1';
const common=`
varying vec3 vHarborWaterPosition;
uniform float harborWaterTime;
uniform vec3 harborWaterShallow;
uniform vec3 harborWaterDeep;
`;

/** Rendering-only water: two wind-ripple scales and an authored quay depth gradient.
 * Uses the existing normal texture and outdoor PMREM; no render target or extra pass. */
export function createHarborWater(materials:THREE.MeshStandardMaterial[]){
 const time={value:0};
 const shallow={value:new THREE.Color().setRGB(.024,.085,.073)},deep={value:new THREE.Color().setRGB(.009,.033,.045)};
 const originals=materials.map(material=>({material,color:material.color.clone(),metalness:material.metalness,roughness:material.roughness,envMapIntensity:material.envMapIntensity,onBeforeCompile:material.onBeforeCompile,customProgramCacheKey:material.customProgramCacheKey}));
 for(const item of originals){
  const material=item.material;
  if(!material.normalMap)throw new Error('Harbor water requires its authored normal map');
  material.color.setRGB(1,1,1);material.metalness=0;material.roughness=.17;material.envMapIntensity=1;
  material.onBeforeCompile=(shader,renderer)=>{
   item.onBeforeCompile.call(material,shader,renderer);
   if(!shader.vertexShader.includes('#include <worldpos_vertex>')||!shader.fragmentShader.includes('#include <normal_fragment_maps>'))throw new Error('Harbor water shader contract changed');
   shader.uniforms.harborWaterTime=time;shader.uniforms.harborWaterShallow=shallow;shader.uniforms.harborWaterDeep=deep;
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vHarborWaterPosition;').replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
    vec4 harborWaterWorld=vec4(transformed,1.0);
    #ifdef USE_BATCHING
     harborWaterWorld=batchingMatrix*harborWaterWorld;
    #endif
    #ifdef USE_INSTANCING
     harborWaterWorld=instanceMatrix*harborWaterWorld;
    #endif
    vHarborWaterPosition=(modelMatrix*harborWaterWorld).xyz;
   `);
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+common)
    .replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>
     // Air/water normal-incidence Fresnel reflectance for IOR approximately 1.333.
     material.specularColor=vec3(.02037);
     material.specularColorBlended=material.specularColor;
    `)
    .replace('#include <color_fragment>',`#include <color_fragment>
     // Known vertical quay is x=-28 m. This is an art depth proxy, not bathymetry.
     float harborShoreDistance=max(0.0,-28.0-vHarborWaterPosition.x);
     float harborDepth=smoothstep(1.5,65.0,harborShoreDistance);
     diffuseColor.rgb*=mix(harborWaterShallow,harborWaterDeep,harborDepth);
    `)
    .replace('#include <normal_fragment_maps>',`
     #ifdef USE_NORMALMAP_TANGENTSPACE
      // Two independent wind directions break the old aligned twelve-metre lattice.
      mat2 harborCoarseRotation=mat2(.9211,.3894,-.3894,.9211);
      mat2 harborFineRotation=mat2(.5403,-.8415,.8415,.5403);
      vec2 harborSurface=vHarborWaterPosition.xz;
      vec2 harborCoarseUv=harborCoarseRotation*harborSurface/vec2(6.0,3.5)+harborWaterTime*vec2(.008,.003);
      vec2 harborFineUv=harborFineRotation*harborSurface/vec2(1.3,.9)+harborWaterTime*vec2(-.011,.016);
      vec2 harborCoarse=texture2D(normalMap,harborCoarseUv).xy*2.0-1.0;
      vec2 harborFine=texture2D(normalMap,harborFineUv).xy*2.0-1.0;
      vec2 harborSlope=transpose(harborCoarseRotation)*harborCoarse*.21+transpose(harborFineRotation)*harborFine*.065;
      vec3 harborWorldNormal=normalize(vec3(-harborSlope.x,1.0,-harborSlope.y));
      normal=normalize(mat3(viewMatrix)*harborWorldNormal);
     #else
      #include <normal_fragment_maps>
     #endif
    `);
  };
  material.customProgramCacheKey=()=>CACHE_KEY;material.needsUpdate=true;
 }
 let disposed=false;
 return{
  update(seconds:number){time.value=Number.isFinite(seconds)?seconds:0},
  inspect:()=>({method:'Two rotated world-space wind-ripple normal samples, outdoor PMREM specular, fixed quay depth-color proxy',shoreX:-28,depthTransitionMetres:[1.5,65],coarseWaveTileMetres:[6,3.5],fineWaveTileMetres:[1.3,.9],roughness:.17,metalness:0,normalIncidenceReflectance:.02037,extraRenderPasses:0,extraLights:0,textureSamples:2,cacheKey:CACHE_KEY}),
  dispose(){if(disposed)return;disposed=true;for(const item of originals){const m=item.material;m.color.copy(item.color);m.metalness=item.metalness;m.roughness=item.roughness;m.envMapIntensity=item.envMapIntensity;m.onBeforeCompile=item.onBeforeCompile;m.customProgramCacheKey=item.customProgramCacheKey;m.needsUpdate=true}},
 };
}
