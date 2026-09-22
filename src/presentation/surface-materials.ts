import * as THREE from 'three';
import {loadKTX2} from './ktx2';
import {SURFACE_SETS,type SurfaceKind} from './surface-assets';

type Rule={kind:SurfaceKind;detailOnly:boolean;tint:boolean};
const kinds:Record<string,SurfaceKind>={
 Quality_Painted_White:'concrete',Quality_Slingmods_Red:'concrete',Quality_Aluminum:'metal',Quality_Powdercoat:'metal',Waterfront_Marine_Paint:'metal',Harbor_Road_Paint:'concrete',
 Quality_Mineral_Stucco:'concrete',Quality_Cast_Concrete:'concrete',Quality_Quay_Concrete:'concrete',Harbor_Concrete:'concrete',Quality_Showroom_Epoxy:'concrete',Quality_Dock_Timber:'wood',Quality_Maintained_Turf:'grass',Quality_Planted_Ground:'grass',
 Ridge_warm_timber:'wood',Ridge_anthracite_metal:'metal',Ridge_layered_stone:'stone',
 rollup_galvanized_gray:'metal',studio_handle_brushed:'metal',studio_cabinet_door:'metal',studio_graphite_cabinet:'metal',studio_grid_black:'metal',studio_slingmods_red:'concrete',studio_charcoal_tile:'concrete',studio_warm_white:'concrete',studio_warm_wood:'wood',utility_safety_yellow:'concrete',utility_rubber:'concrete',
 Refined_vented_charcoal:'concrete',Refined_vented_gray:'concrete',Refined_vented_red:'concrete',
};
/** Explicit scenery/room materials only: never vehicle paint, logos, glass, emissives, water or foliage shaders. */
export function surfaceRule(material:THREE.Material,meshName:string):Rule|undefined{
 if(!(material instanceof THREE.MeshStandardMaterial)||material.transparent||material.alphaTest>0||material.emissiveIntensity>0&&material.emissive.getHex()!==0||material.onBeforeCompile!==THREE.Material.prototype.onBeforeCompile)return;
 let kind=kinds[material.name];
 if(!kind){if(/^Express_(runoff|curb|edge|center_dashes)$/.test(meshName)||/^Ridge_(edge_|center_dashes)/.test(meshName))kind='concrete';else if(/^(Express_rails_exact_collision_boxes|Ridge_rails_EXACT_collision_boxes|Ridge_signpost)$/.test(meshName))kind='metal';else if(meshName==='Express_land'||/^Ridge_(gravel_|physical_terrain_|scenic_land)/.test(meshName))kind='grass'}
 if(!kind)return;
 return{kind,detailOnly:!!(material.map&&material.normalMap&&material.roughnessMap),tint:kind==='metal'||kind==='concrete'};
}

/** World-metre projection survives merged modules and nonuniform instance scales without editing any geometry. */
export function prepareSurfaceMaterial(source:THREE.MeshStandardMaterial,rule:Rule,maps?:THREE.Texture[]){
 const material=source.clone(),tile=SURFACE_SETS[rule.kind].tile;
 if(!rule.detailOnly){
  if(!maps)throw Error('Matched surface maps required');
  material.map=maps[0];material.normalMap=maps[1];material.roughnessMap=maps[2];material.metalnessMap=null;material.aoMap=null;
  material.normalScale.set(rule.kind==='grass'?.55:rule.tint?.18:.5,rule.kind==='grass'?.55:rule.tint?-.18:-.5);
  // Preserve paint/metal identity, including the wet-look roughness already applied by the route.
  if(!rule.tint)material.color.set(0xffffff);
 }
 const detailStrength=rule.kind==='grass'?.12:rule.tint?.10:.18;
 material.userData.surfaceFinish={source:source.name||'route surface',kind:rule.kind,detailOnly:rule.detailOnly,tileMetres:rule.detailOnly?null:tile,detailRepeat:8,detailStrength};
 material.onBeforeCompile=shader=>{
  if(!rule.detailOnly){
   shader.vertexShader='#undef USE_TANGENT\n'+shader.vertexShader;shader.fragmentShader='#undef USE_TANGENT\n'+shader.fragmentShader;
   shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
    vec4 surfaceLocal=vec4(position,1.);vec3 surfaceNormal=normal;
    #ifdef USE_INSTANCING
    surfaceLocal=instanceMatrix*surfaceLocal;surfaceNormal=mat3(instanceMatrix)*surfaceNormal;
    #endif
    // Excluding object translation keeps the garage shutter texture attached as it opens.
    vec3 surfaceP=mat3(modelMatrix)*surfaceLocal.xyz;vec3 surfaceAxis=abs(normalize(mat3(modelMatrix)*surfaceNormal));
    vec2 surfaceUV=(surfaceAxis.y>=surfaceAxis.x&&surfaceAxis.y>=surfaceAxis.z?surfaceP.xz:surfaceAxis.x>=surfaceAxis.z?surfaceP.zy:surfaceP.xy)/${tile.toFixed(3)};
    vMapUv=surfaceUV;vNormalMapUv=surfaceUV;vRoughnessMapUv=surfaceUV;`);
   if(rule.tint)shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`vec3 surfaceGrain=texture2D(map,vMapUv).rgb;float surfaceVariation=clamp(dot(surfaceGrain,vec3(.2126,.7152,.0722))*2.,0.,1.);diffuseColor.rgb*=mix(.82,1.12,surfaceVariation);`);
  }
  // Expand this chunk explicitly: onBeforeCompile runs before Three resolves shader includes.
  const normalChunk=THREE.ShaderChunk.normal_fragment_maps.replace('mapN.xy *= normalScale;',`vec3 surfaceDetail=texture2D(normalMap,vNormalMapUv*8.).xyz*2.-1.;
   mapN.xy+=surfaceDetail.xy*${detailStrength.toFixed(3)}*(1.-smoothstep(6.,28.,length(vViewPosition)));
   mapN=normalize(mapN);mapN.xy *= normalScale;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',normalChunk);
 };
 material.customProgramCacheKey=()=>`surface-finish-v1-${rule.kind}-${rule.detailOnly}-${rule.tint}`;
 return material;
}

/** Optional, transactional scenery pass. Failed/timed-out sets leave their original materials intact. */
export async function loadSurfaceMaterials(renderer:THREE.WebGLRenderer,root:THREE.Object3D,enabled=true){
 const slots:{mesh:THREE.Mesh;original:THREE.Material|THREE.Material[];next:THREE.Material|THREE.Material[]}[]=[],materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>(),cache=new Map<string,THREE.MeshStandardMaterial>();
 const wanted=new Set<SurfaceKind>(),targets:{mesh:THREE.Mesh;rules:(Rule|undefined)[]}[]=[];
 if(enabled)root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const rules=(Array.isArray(o.material)?o.material:[o.material]).map(m=>surfaceRule(m,o.name));if(rules.some(Boolean)){targets.push({mesh:o,rules});rules.forEach(r=>{if(r&&!r.detailOnly)wanted.add(r.kind)})}});
 const maps=new Map<SurfaceKind,THREE.Texture[]>(),failed:string[]=[];
 await Promise.all([...wanted].map(async kind=>{
  const owned:THREE.Texture[]=[];let abandoned=false,timer:ReturnType<typeof setTimeout>;
  const jobs=SURFACE_SETS[kind].urls.map(async(url,i)=>{const texture=url.endsWith('.ktx2')?await loadKTX2(renderer,url,{srgb:i===0}):await new THREE.TextureLoader().loadAsync(url);if(abandoned){texture.dispose();throw Error('Late optional surface discarded')}texture.name=url;if(!url.endsWith('.ktx2')){texture.colorSpace=i===0?THREE.SRGBColorSpace:THREE.NoColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy())}owned.push(texture);return texture});
  const result=await Promise.race([Promise.allSettled(jobs),new Promise<PromiseSettledResult<THREE.Texture>[]>(resolve=>{timer=setTimeout(()=>{abandoned=true;resolve([{status:'rejected',reason:'timeout'}])},30000)})]);clearTimeout(timer!);
  if(result.some(r=>r.status==='rejected')){owned.forEach(t=>t.dispose());failed.push(kind);return}
  const set=result.map(r=>(r as PromiseFulfilledResult<THREE.Texture>).value);maps.set(kind,set);set.forEach(t=>textures.add(t));
 }));
 for(const {mesh,rules}of targets){const original=mesh.material,list=Array.isArray(original)?original:[original],next=list.map((m,i)=>{const rule=rules[i];if(!rule||!rule.detailOnly&&!maps.has(rule.kind))return m;const key=m.uuid+':'+JSON.stringify(rule);let replacement=cache.get(key);if(!replacement){replacement=prepareSurfaceMaterial(m as THREE.MeshStandardMaterial,rule,maps.get(rule.kind));cache.set(key,replacement);materials.add(replacement)}return replacement});if(next.some((m,i)=>m!==list[i]))slots.push({mesh,original,next:Array.isArray(original)?next:next[0]})}
 for(const slot of slots)slot.mesh.material=slot.next;
 let disposed=false;
 return{inspect:()=>({version:'surface-finish-v1',enabled,changedMeshes:slots.filter(s=>s.next!==s.original).length,materials:[...materials].map(m=>m.userData.surfaceFinish),loadedSets:[...maps.keys()],failedSets:failed,addedDrawCalls:0}),dispose(){if(disposed)return;disposed=true;for(const s of slots)s.mesh.material=s.original;materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}};
}
