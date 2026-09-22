import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {loadKTX2} from './ktx2';import {HARBOR_WATER_URLS} from './p11-assets';

const CACHE_KEY='p11-harbor-water-v2';
/** The harbor basin: a vertical quay wall on the east side and a sloping bank on the west. Art depth proxy, not bathymetry. */
export const HARBOR_BASIN={quayX:-28,bankX:-95.5,bankSlope:.45,quayDepth:3,maxDepth:12} as const;
export const MAX_WATER_LAMPS=12;
/**
 * Harbor water on the standard material, so it takes the active look's sun, sky probe, fog and tonemapping for free:
 * - swell (16 m tile) and chop (2 m tile, two directions) normal maps from the P11 pack, scrolling at three speeds;
 * - depth colour along the basin (turquoise at the west bank, blue-green at the quay), shoreline foam that laps;
 * - Fresnel is the material's own (F0 .02 = water), sun glitter from the chop normal, lamp reflections as vertical
 *   streaks when the look has the lamps on;
 * - a 3.5 cm vertex swell on High/Ultra, off under reduced motion.
 * No render target, no extra pass, no extra light. If the P11 textures never arrive the authored normal map is used.
 */
/** `lamps`: anything that should streak in the water at night: road lamps (sodium by default) and lit windows across the basin. */
export interface HarborWaterOptions {renderer?:THREE.WebGLRenderer;lamps?:{position:number[];color?:number[]}[];lampsOn?:boolean;swell?:boolean;motion?:boolean}
const GLSL_COMMON=`
varying vec3 vHarborWaterPosition;
uniform float harborWaterTime;
uniform vec3 harborWaterShallow;
uniform vec3 harborWaterMid;
uniform vec3 harborWaterDeep;
uniform float harborWaterSwell;
uniform float harborWaterNight;
uniform int harborLampCount;
uniform vec3 harborLampPosition[${MAX_WATER_LAMPS}];
uniform vec3 harborLampColor[${MAX_WATER_LAMPS}];
#ifdef HARBOR_WATER_P11
uniform sampler2D harborSwellMap;
uniform sampler2D harborChopMap;
uniform sampler2D harborFoamMap;
#endif
// Distances into the basin from each shore, in metres: x is the quay wall, y the west bank.
vec2 harborShore(vec2 xz){return vec2(${HARBOR_BASIN.quayX.toFixed(1)}-xz.x,xz.x-(${HARBOR_BASIN.bankX.toFixed(1)}));}
float harborDepth(vec2 shore){return min(${HARBOR_BASIN.maxDepth.toFixed(1)},min(max(shore.y,0.0)*${HARBOR_BASIN.bankSlope.toFixed(2)},${HARBOR_BASIN.quayDepth.toFixed(1)}+max(shore.x,0.0)*1.5));}
`;
const GLSL_VERTEX_SWELL=`#include <begin_vertex>
 {
  vec4 hwWorld=vec4(transformed,1.0);
  #ifdef USE_INSTANCING
   hwWorld=instanceMatrix*hwWorld;
  #endif
  hwWorld=modelMatrix*hwWorld;
  vec2 hwShore=harborShore(hwWorld.xz);float hwFade=smoothstep(0.0,3.0,min(hwShore.x,hwShore.y));
  // Two long crossing swells; fades out at both shores so it never lifts through the beach or the quay coping.
  transformed.y+=harborWaterSwell*hwFade*(sin(dot(hwWorld.xz,vec2(1.5,.4))+harborWaterTime*.8)+.6*sin(dot(hwWorld.xz,vec2(-.7,1.3))+harborWaterTime*.57));
 }`;
const GLSL_COLOR=`#include <color_fragment>
 vec2 hwShore=harborShore(vHarborWaterPosition.xz);float hwDepth=harborDepth(hwShore),hwShoreDist=min(max(hwShore.x,0.0),max(hwShore.y,0.0));
 vec3 hwBase=hwDepth<3.0?mix(harborWaterShallow,harborWaterMid,hwDepth/3.0):mix(harborWaterMid,harborWaterDeep,(hwDepth-3.0)/9.0);
 float hwFoamMask=1.0-smoothstep(.1,2.2,hwShoreDist);
 #ifdef HARBOR_WATER_P11
  vec2 hwFoamUv=vHarborWaterPosition.xz/4.5;
  float hwFoamTex=texture2D(harborFoamMap,hwFoamUv+harborWaterTime*vec2(.006,-.004)).r,hwFoamTex2=texture2D(harborFoamMap,hwFoamUv*1.7+vec2(.37,.11)-harborWaterTime*vec2(.003,.007)).r;
  // Waves lap the shore: the foam band brightens and recedes about once every eight seconds, out of phase along it.
  float hwLap=.55+.45*sin(harborWaterTime*.8-hwShoreDist*2.2+hwFoamTex2*4.0+vHarborWaterPosition.z*.05);
  harborFoam=hwFoamMask*smoothstep(.42,.9,hwFoamTex*hwLap*1.25+hwFoamMask*.12)*.85;
 #else
  harborFoam=hwFoamMask*(.35+.35*sin(harborWaterTime*.8-hwShoreDist*2.2+vHarborWaterPosition.z*.7));
 #endif
 diffuseColor.rgb*=mix(hwBase,vec3(.80,.85,.84),harborFoam);`;
const GLSL_NORMAL=`
 {
  vec2 hwSurface=vHarborWaterPosition.xz;
  mat2 hwRotA=mat2(.9211,.3894,-.3894,.9211);mat2 hwRotB=mat2(.5403,-.8415,.8415,.5403);
  #ifdef HARBOR_WATER_P11
   // Swell: one 16 m tile drifting with the wind. Chop: the 2 m tile twice, rotated, running against each other.
   vec2 hwSwell=texture2D(harborSwellMap,hwSurface/16.0+harborWaterTime*vec2(.004,.0015)).xy*2.0-1.0;
   vec2 hwChopA=texture2D(harborChopMap,hwRotA*hwSurface/2.0+harborWaterTime*vec2(-.021,.012)).xy*2.0-1.0;
   vec2 hwChopB=texture2D(harborChopMap,hwRotB*hwSurface/2.3+harborWaterTime*vec2(.017,-.026)).xy*2.0-1.0;
   // KTX2 cannot flip rows: image-top is v=0, so the map's green axis runs the other way (see ktx2.ts).
   hwSwell.y=-hwSwell.y;hwChopA.y=-hwChopA.y;hwChopB.y=-hwChopB.y;
   vec2 hwFine=transpose(hwRotA)*hwChopA*.5+transpose(hwRotB)*hwChopB*.5;
   vec2 hwSlope=hwSwell*.42+hwFine*.3;
  #else
   vec2 hwCoarse=texture2D(normalMap,hwRotA*hwSurface/vec2(6.0,3.5)+harborWaterTime*vec2(.008,.003)).xy*2.0-1.0;
   vec2 hwFineTex=texture2D(normalMap,hwRotB*hwSurface/vec2(1.3,.9)+harborWaterTime*vec2(-.011,.016)).xy*2.0-1.0;
   vec2 hwFine=transpose(hwRotB)*hwFineTex;
   vec2 hwSlope=transpose(hwRotA)*hwCoarse*.21+hwFine*.065;
  #endif
  // Foam sits on broken water: flatten the reflection there and let the roughness carry it.
  hwSlope*=1.0-harborFoam*.7;
  harborWorldNormal=normalize(vec3(-hwSlope.x,1.0,-hwSlope.y));
  harborGlitterNormal=normalize(vec3(-hwFine.x*1.6,1.0,-hwFine.y*1.6));
  normal=normalize(mat3(viewMatrix)*harborWorldNormal);
 }`;
const GLSL_LIGHT=`
 {
  vec3 hwView=normalize(cameraPosition-vHarborWaterPosition);
  #if NUM_DIR_LIGHTS > 0
   // Sun glitter: a very tight lobe on the chop only, so it sparkles instead of smearing.
   vec3 hwSunView=normalize(directionalLights[0].direction);vec3 hwGlitterView=normalize(mat3(viewMatrix)*harborGlitterNormal);
   float hwGlitter=pow(saturate(dot(hwGlitterView,normalize(geometryViewDir+hwSunView))),380.0);
   outgoingLight+=directionalLights[0].color*hwGlitter*.9*(1.0-harborFoam);
  #endif
  if(harborWaterNight>0.0){
   // Lamp reflections as long vertical streaks: along the lamp's bearing a small tilt counts double, across it a tilt
   // barely counts, so the highlight stretches toward the viewer and stays narrow.
   vec2 hwSlope=-harborWorldNormal.xz/harborWorldNormal.y;
   for(int i=0;i<${MAX_WATER_LAMPS};i++){if(i>=harborLampCount)break;
    vec3 hwToLamp=harborLampPosition[i]-vHarborWaterPosition;float hwDist=length(hwToLamp);hwToLamp/=hwDist;
    vec2 hwBearing=normalize(hwToLamp.xz+vec2(1e-4,0.0));float hwAlong=dot(hwSlope,hwBearing);vec2 hwAcross=hwSlope-hwAlong*hwBearing;
    vec2 hwStreak=hwBearing*hwAlong*3.0+hwAcross*.16;vec3 hwN=normalize(vec3(-hwStreak.x,1.0,-hwStreak.y));
    float hwSpec=pow(saturate(dot(hwN,normalize(hwView+hwToLamp))),70.0)*saturate(hwToLamp.y*6.0);
    outgoingLight+=harborLampColor[i]*hwSpec*harborWaterNight*(1.0-harborFoam)*3.0/(1.0+hwDist*.02);
   }
  }
 }
 #include <opaque_fragment>`;
/** Depth of the art basin at x, in metres: the same proxy the shader uses. */
export function basinDepth(x:number){const quay=HARBOR_BASIN.quayX-x,bank=x-HARBOR_BASIN.bankX;return Math.min(HARBOR_BASIN.maxDepth,Math.max(bank,0)*HARBOR_BASIN.bankSlope,HARBOR_BASIN.quayDepth+Math.max(quay,0)*1.5)}
/**
 * Boats afloat (instance y below 0.5 m; cradled skiffs sit at 1 m) heave 3 cm, roll 0.9 deg and pitch 0.6 deg on
 * three unrelated periods, phased by where they are moored, written straight into the instance matrices.
 */
export function createBoatBob(meshes:THREE.InstancedMesh[]){
 const boats=meshes.map(mesh=>{const base=Float32Array.from(mesh.instanceMatrix.array),afloat:number[]=[];for(let i=0;i<mesh.count;i++)if(base[i*16+13]<.5)afloat.push(i);return{mesh,base,afloat}}).filter(b=>b.afloat.length);
 const matrix=new THREE.Matrix4(),rest=new THREE.Matrix4(),euler=new THREE.Euler();
 return{count:boats.reduce((n,b)=>n+b.afloat.length,0),update(t:number){if(!Number.isFinite(t))return;for(const {mesh,base,afloat}of boats){for(const i of afloat){const phase=base[i*16+12]*.31+base[i*16+14]*.17;rest.fromArray(base,i*16);euler.set(.011*Math.sin(t*1.05+phase),0,.016*Math.sin(t*.72+phase*1.3));matrix.makeRotationFromEuler(euler);matrix.elements[13]=.03*Math.sin(t*.9+phase);mesh.setMatrixAt(i,rest.multiply(matrix))}mesh.instanceMatrix.needsUpdate=true}}};
}
const srgb=(r:number,g:number,b:number)=>new THREE.Color().setRGB(r/255,g/255,b/255,THREE.SRGBColorSpace);
/** A 2 m grid over the visible basin (for the vertex swell) with one flat sheet beyond it, replacing the authored 4-vertex quad. */
export function harborWaterGeometry(source:THREE.BufferGeometry){
 source.computeBoundingBox();const box=source.boundingBox!,y=box.min.y,east=box.max.x,west=box.min.x,north=box.min.z,south=box.max.z;
 const gridWest=Math.max(west,HARBOR_BASIN.bankX-6),gridNorth=Math.max(north,-480),gridSouth=Math.min(south,380);
 const sheet=(x0:number,x1:number,z0:number,z1:number,nx=1,nz=1)=>{const g=new THREE.PlaneGeometry(x1-x0,z1-z0,nx,nz);g.rotateX(-Math.PI/2);g.translate((x0+x1)/2,y,(z0+z1)/2);return g};
 const parts=[sheet(gridWest,east,gridNorth,gridSouth,Math.ceil((east-gridWest)/2),Math.ceil((gridSouth-gridNorth)/2))];
 if(gridWest>west)parts.push(sheet(west,gridWest,north,south));if(gridNorth>north)parts.push(sheet(gridWest,east,north,gridNorth));if(gridSouth<south)parts.push(sheet(gridWest,east,gridSouth,south));
 const merged=mergeGeometries(parts,false)!;parts.forEach(p=>p.dispose());merged.computeBoundingSphere();return merged;
}
export function createHarborWater(materials:THREE.MeshStandardMaterial[],options:HarborWaterOptions={}){
 const time={value:0},swellAmplitude={value:options.swell!==false&&options.motion!==false?.035:0},night={value:options.lampsOn?1:0},lampCount={value:0};
 const lampPositions={value:Array.from({length:MAX_WATER_LAMPS},()=>new THREE.Vector3())},lampColors={value:Array.from({length:MAX_WATER_LAMPS},()=>new THREE.Color())};
 // The P11 depth LUT (47,181,168 -> 15,90,102 -> 7,34,46) with the shallow end dimmed: at full strength it read as a neon stripe along the bank.
 const shallow={value:srgb(30,118,110)},mid={value:srgb(14,80,92)},deep={value:srgb(7,34,46)};
 const maps={swell:{value:null as THREE.Texture|null},chop:{value:null as THREE.Texture|null},foam:{value:null as THREE.Texture|null}};
 // Water-side lamps only; the eight nearest the camera are refreshed every few frames.
 const sodium=[1,.44,.09],lamps=(options.lamps??[]).filter(l=>l.position[0]<HARBOR_BASIN.quayX+45).map(l=>({p:new THREE.Vector3().fromArray(l.position),c:new THREE.Color().setRGB(...(l.color??sodium) as [number,number,number])}));let lampFrame=0;
 const originals=materials.map(material=>({material,color:material.color.clone(),metalness:material.metalness,roughness:material.roughness,envMapIntensity:material.envMapIntensity,onBeforeCompile:material.onBeforeCompile,customProgramCacheKey:material.customProgramCacheKey,defines:material.defines}));
 for(const item of originals){
  const material=item.material;
  if(!material.normalMap)throw new Error('Harbor water requires its authored normal map');
  material.color.setRGB(1,1,1);material.metalness=0;material.roughness=.14;material.envMapIntensity=1;material.defines={...material.defines};
  material.onBeforeCompile=(shader,renderer)=>{
   item.onBeforeCompile.call(material,shader,renderer);
   if(!shader.vertexShader.includes('#include <worldpos_vertex>')||!shader.fragmentShader.includes('#include <normal_fragment_maps>')||!shader.fragmentShader.includes('#include <opaque_fragment>'))throw new Error('Harbor water shader contract changed');
   Object.assign(shader.uniforms,{harborWaterTime:time,harborWaterShallow:shallow,harborWaterMid:mid,harborWaterDeep:deep,harborWaterSwell:swellAmplitude,harborWaterNight:night,harborLampCount:lampCount,harborLampPosition:lampPositions,harborLampColor:lampColors,harborSwellMap:maps.swell,harborChopMap:maps.chop,harborFoamMap:maps.foam});
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\n'+GLSL_COMMON).replace('#include <begin_vertex>',GLSL_VERTEX_SWELL).replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
    vec4 harborWaterWorld=vec4(transformed,1.0);
    #ifdef USE_BATCHING
     harborWaterWorld=batchingMatrix*harborWaterWorld;
    #endif
    #ifdef USE_INSTANCING
     harborWaterWorld=instanceMatrix*harborWaterWorld;
    #endif
    vHarborWaterPosition=(modelMatrix*harborWaterWorld).xyz;
   `);
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+GLSL_COMMON+'\nfloat harborFoam=0.0;vec3 harborWorldNormal=vec3(0.0,1.0,0.0);vec3 harborGlitterNormal=vec3(0.0,1.0,0.0);\n')
    .replace('#include <color_fragment>',GLSL_COLOR)
    .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor=mix(roughnessFactor,.85,harborFoam);')
    .replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>
     // Air/water normal-incidence Fresnel reflectance for IOR approximately 1.333; foam is matte.
     material.specularColor=vec3(.02037)*(1.0-harborFoam*.9);
     material.specularColorBlended=material.specularColor;
     // What the sky reflects, the water below cannot also show: the body colour gives way to the reflection at grazing angles.
     float hwNV=saturate(dot(normal,normalize(vViewPosition)));float hwFresnel=.02+.98*pow(1.0-hwNV,5.0);
     material.diffuseColor*=mix(1.0-hwFresnel*.85,1.0,harborFoam);
    `)
    .replace('#include <normal_fragment_maps>',GLSL_NORMAL)
    .replace('#include <opaque_fragment>',GLSL_LIGHT);
  };
  material.customProgramCacheKey=()=>CACHE_KEY+(material.defines?.HARBOR_WATER_P11?'-p11':'');material.needsUpdate=true;
 }
 let disposed=false,loaded=false;
 const textures=options.renderer?Promise.all([loadKTX2(options.renderer,HARBOR_WATER_URLS.swell,{anisotropy:8}),loadKTX2(options.renderer,HARBOR_WATER_URLS.chop,{anisotropy:8}),loadKTX2(options.renderer,HARBOR_WATER_URLS.foam,{anisotropy:4})]).then(([swell,chop,foam])=>{
  if(disposed){swell.dispose();chop.dispose();foam.dispose();return}
  maps.swell.value=swell;maps.chop.value=chop;maps.foam.value=foam;loaded=true;for(const item of originals){item.material.defines!.HARBOR_WATER_P11=1;item.material.needsUpdate=true}
 }).catch(error=>{console.warn('P11 harbor water maps unavailable; keeping the authored ripple.',error)}):Promise.resolve();
 return{
  ready:textures,
  update(seconds:number,cameraPosition?:THREE.Vector3){
   time.value=Number.isFinite(seconds)?seconds:0;
   if(cameraPosition&&lamps.length&&(lampFrame++%20===0)){// Half the slots go to lights across the basin (beyond the bank), half to this side, so the far windows that make
    // the long streaks are never crowded out by the row of road lamps beside the camera.
    const ranked=lamps.map(l=>({...l,d:l.p.distanceToSquared(cameraPosition)})).sort((a,b)=>a.d-b.d),far=ranked.filter(l=>l.p.x<HARBOR_BASIN.bankX),here=ranked.filter(l=>l.p.x>=HARBOR_BASIN.bankX),half=MAX_WATER_LAMPS/2;
    const chosen=[...far.slice(0,half),...here.slice(0,half)],rest=[...far.slice(half),...here.slice(half)].sort((a,b)=>a.d-b.d),near=[...chosen,...rest.slice(0,MAX_WATER_LAMPS-chosen.length)];lampCount.value=near.length;near.forEach((n,i)=>{lampPositions.value[i].copy(n.p);lampColors.value[i].copy(n.c)})}
  },
  inspect:()=>({method:'P11 swell+chop normal maps on the standard material, basin depth colour, lapping shoreline foam, sun glitter, lamp streaks, vertex swell',p11Maps:loaded,basin:HARBOR_BASIN,swellAmplitudeMetres:swellAmplitude.value,night:night.value,lamps:{waterSide:lamps.length,active:lampCount.value},roughness:.14,metalness:0,normalIncidenceReflectance:.02037,extraRenderPasses:0,extraLights:0,textureSamples:loaded?5:2,cacheKey:CACHE_KEY}),
  dispose(){if(disposed)return;disposed=true;for(const item of originals){const m=item.material;m.color.copy(item.color);m.metalness=item.metalness;m.roughness=item.roughness;m.envMapIntensity=item.envMapIntensity;m.onBeforeCompile=item.onBeforeCompile;m.customProgramCacheKey=item.customProgramCacheKey;m.defines=item.defines;m.needsUpdate=true}for(const t of Object.values(maps)){t.value?.dispose();t.value=null}},
 };
}
