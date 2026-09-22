import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {loadKTX2} from '../presentation/ktx2';
import {disposeGraph} from '../presentation/scene-lifetime';
import type {GraphicsQuality} from '../presentation/graphics-settings';
import {FOREST_SPECIES,TREE_ROOT,GROUND_ROOT,forestAssetURLs,forestGLTFURL} from './forest-assets';
import {forestFloorPlan,forestLOD,FOREST_BUDGET,type ForestPlacement} from './forest-layout';

/** P11 COLOR_0 contains bend/flutter weights, never foliage albedo. Depth uses the same bend. */
export function forestWind(material:THREE.Material,time:{value:number},strength:{value:number},sun:THREE.Vector3,leaf=false,night=false){
 (material as THREE.MeshStandardMaterial).vertexColors=false;
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{forestTime:time,forestWind:strength,forestSun:{value:sun}});
  shader.vertexShader='attribute vec3 color;uniform float forestTime;uniform float forestWind;uniform vec3 forestSun;varying float forestBack;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float phase=0.;
   #ifdef USE_INSTANCING
   phase=instanceMatrix[3].x*.11+instanceMatrix[3].z*.07;
   #endif
   transformed.x+=forestWind*(color.r*color.r*sin(forestTime+phase+position.y*.13)+color.g*.16*sin(forestTime*2.3+phase)+color.b*.025*sin(forestTime*7.+position.x*5.));
   transformed.z+=forestWind*color.g*.16*cos(forestTime*1.7+phase);
   vec3 forestNormal=normal;
   #ifdef USE_INSTANCING
   forestNormal=mat3(instanceMatrix)*forestNormal;
   #endif
   forestBack=max(0.,dot(-normalize(mat3(modelMatrix)*forestNormal),forestSun))*color.b;
  `);
  if(leaf){shader.fragmentShader='varying float forestBack;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`outgoingLight+=diffuseColor.rgb*vec3(1.,.86,.55)*forestBack*${night?'.04':'.42'};\n#include <opaque_fragment>`)}
 };
 material.customProgramCacheKey=()=>`ridge-wind-v1-${leaf}-${night}`;
}
export function forestCardGeometry(variant:number){
 const tile=[0,1,9][variant],g=new THREE.PlaneGeometry(variant===2?1.7:1.25,variant===2?1.25:1.1);if(variant===2)g.rotateX(-Math.PI/2);else g.translate(0,.55,0);
 const uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,(tile%4+uv.getX(i))/4,(Math.floor(tile/4)+1-uv.getY(i))/3);
 const positions=g.getAttribute('position'),weight=new Float32Array(positions.count*3);
 for(let i=0;i<positions.count;i++){const h=variant===2?0:Math.max(0,positions.getY(i));weight[i*3]=h;weight[i*3+1]=h*.3;weight[i*3+2]=variant===2?0:1}
 g.setAttribute('color',new THREE.BufferAttribute(weight,3));return g;
}
type Batch={mesh:THREE.InstancedMesh;kind:'tree'|'cover'|'rock'|'air';variant:number;lod:number};
/** Global compact instance batches cap draw calls independently of tree count. */
export async function loadRidgeForest(renderer:THREE.WebGLRenderer,trees:ForestPlacement[],sun:THREE.Vector3,night:boolean){
 const manager=new THREE.LoadingManager();manager.setURLModifier(forestGLTFURL);
 const loader=new GLTFLoader(manager),urls=forestAssetURLs(),assets=new Map<string,any>(),instances=new Set<THREE.InstancedMesh>(),geometry=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 let abandoned=false,timer:ReturnType<typeof setTimeout>;
 const pending=Promise.allSettled(urls.map(async url=>{
  const value=url.endsWith('.glb')?await loader.loadAsync(url):url.endsWith('.ktx2')?await loadKTX2(renderer,url,{srgb:url.includes('baseColor'),repeat:!url.includes('imposter')&&!url.includes('cards')&&!url.includes('leaves'),anisotropy:4}):await fetch(url).then(r=>{if(!r.ok)throw Error('Forest metadata unavailable');return r.json()});
  if(abandoned){if(value instanceof THREE.Texture)value.dispose();else if(value?.scene)disposeGraph(value.scene);throw Error('Late optional forest load discarded')}
  assets.set(url,value);if(value instanceof THREE.Texture)textures.add(value);return value;
 }));
 const loaded=await Promise.race([pending,new Promise<PromiseSettledResult<unknown>[]>(resolve=>{timer=setTimeout(()=>{abandoned=true;resolve([{status:'rejected',reason:Error('Optional forest load timed out')}])},30000)})]);clearTimeout(timer!);
 const release=()=>{instances.forEach(m=>m.dispose());geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());for(const v of assets.values())if(v?.scene)disposeGraph(v.scene)};
 const failure=loaded.find(r=>r.status==='rejected');if(failure?.status==='rejected'){release();throw failure.reason}
 const group=new THREE.Group();group.name='P11_Ridge_forest';const batches:Batch[]=[],time={value:0},wind={value:.18},matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3(),lastCamera=new THREE.Vector3(Infinity,Infinity,Infinity);
 const plan=forestFloorPlan();let lastQuality:GraphicsQuality|undefined,active=[0,0,0,0],disposed=false;
 const tex=(root:string,name:string)=>assets.get(root+name+'.ktx2') as THREE.Texture;
 function batch(g:THREE.BufferGeometry,m:THREE.Material,capacity:number,kind:Batch['kind'],variant:number,lod=0,depth?:THREE.Material){
  geometry.add(g);materials.add(m);if(depth)materials.add(depth);
  const mesh=new THREE.InstancedMesh(g,m,capacity);instances.add(mesh);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.count=0;mesh.frustumCulled=false;mesh.name=`forest-${kind}-${variant}-${lod}`;mesh.userData.prewarmLOD=true;mesh.receiveShadow=true;mesh.castShadow=kind==='tree'&&lod<2||kind==='rock';if(depth)mesh.customDepthMaterial=depth;group.add(mesh);batches.push({mesh,kind,variant,lod});return mesh;
 }
 try{
  for(let species=0;species<FOREST_SPECIES.length;species++){
   const name=FOREST_SPECIES[species],bark=new THREE.MeshStandardMaterial({map:tex(TREE_ROOT,name+'-bark-baseColor'),normalMap:tex(TREE_ROOT,name+'-bark-normal'),normalScale:new THREE.Vector2(.65,-.65),roughness:.95,metalness:0});
   const leaves=new THREE.MeshStandardMaterial({map:tex(TREE_ROOT,name+'-leaves-baseColor'),alphaTest:.48,side:THREE.DoubleSide,roughness:.85,metalness:0});
   forestWind(bark,time,wind,sun);forestWind(leaves,time,wind,sun,true,night);
   const barkDepth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}),leafDepth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:leaves.map,alphaTest:.48,side:THREE.DoubleSide});forestWind(barkDepth,time,wind,sun);forestWind(leafDepth,time,wind,sun);
   for(let lod=0;lod<3;lod++){
    const model=assets.get(TREE_ROOT+name+'-lod'+lod+'.glb');model.scene.updateMatrixWorld(true);
    model.scene.traverse((o:THREE.Object3D)=>{if(!(o instanceof THREE.Mesh))return;const leaf=(o.material as THREE.Material).name.includes('leaf'),g=o.geometry.clone().applyMatrix4(o.matrixWorld);batch(g,leaf?leaves:bark,trees.length,'tree',species,lod,leaf?leafDepth:barkDepth)});
   }
   const meta=assets.get(TREE_ROOT+name+'-imposter.json'),g=new THREE.PlaneGeometry(meta.worldWidthMetres,meta.worldWidthMetres);g.translate(meta.center[0],meta.center[1],0);
   const m=new THREE.MeshBasicMaterial({map:tex(TREE_ROOT,name+'-imposter-baseColor'),alphaTest:.4,side:THREE.DoubleSide,color:night?0x748095:0xb5b5a0});
   // The authored atlas has four columns, two rows, indexed by local camera azimuth.
   m.onBeforeCompile=shader=>{shader.vertexShader='varying vec2 forestCell;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    vec3 center=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;vec3 view=normalize(vec3(cameraPosition.x-center.x,0.,cameraPosition.z-center.z));
    float yaw=atan(instanceMatrix[2].x,instanceMatrix[2].z);float angle=mod(atan(view.x,view.z)-yaw+6.2831853,6.2831853);float frame=mod(floor(angle/0.78539816+.5),8.);forestCell=vec2(mod(frame,4.),floor(frame/4.));
    vec3 right=vec3(view.z,0.,-view.x);vec3 localRight=transpose(mat3(instanceMatrix))*right/length(instanceMatrix[0].xyz);transformed=localRight*position.x+vec3(0.,position.y,0.);
   `);shader.fragmentShader='varying vec2 forestCell;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`vec2 atlasUv=(forestCell+vec2(clamp(vMapUv.x,.002,.998),clamp(1.-vMapUv.y,.002,.998)))/vec2(4.,2.);diffuseColor*=texture2D(map,atlasUv);`)};m.customProgramCacheKey=()=> 'ridge-imposter-v1';batch(g,m,trees.length,'tree',species,3);
  }
  // Shared forest floor: geometry/support vertices remain exact. Only surface shading changes.
  const ground=new THREE.MeshStandardMaterial({map:tex(GROUND_ROOT,'shaded-soil-baseColor'),normalMap:tex(GROUND_ROOT,'leaf-litter-normal'),normalScale:new THREE.Vector2(.35,-.35),roughness:1});materials.add(ground);
  ground.onBeforeCompile=shader=>{
   shader.uniforms.forestLitter={value:tex(GROUND_ROOT,'leaf-litter-baseColor')};shader.uniforms.forestGravel={value:tex(GROUND_ROOT,'gravel-shoulder-baseColor')};
   shader.vertexShader='varying vec3 forestWorld;varying float forestOffset;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    forestWorld=(modelMatrix*vec4(transformed,1.)).xyz;forestOffset=abs(uv.x*5.);vNormalMapUv=forestWorld.xz*.25;`);
   shader.fragmentShader='varying vec3 forestWorld;varying float forestOffset;uniform sampler2D forestLitter;uniform sampler2D forestGravel;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`vec2 fuv=forestWorld.xz*.25;float litter=.45+.25*sin(forestWorld.x*.41)*cos(forestWorld.z*.35);vec3 floorColor=mix(texture2D(map,fuv).rgb,texture2D(forestLitter,fuv).rgb,litter);diffuseColor.rgb*=mix(texture2D(forestGravel,fuv).rgb,floorColor,smoothstep(7.,14.,forestOffset));`);
  };ground.customProgramCacheKey=()=> 'ridge-floor-v1';
  const cards=tex(GROUND_ROOT,'cards-baseColor');
  for(let variant=0;variant<3;variant++){
   const g=forestCardGeometry(variant);
   const mat=new THREE.MeshStandardMaterial({map:cards,alphaTest:.55,side:THREE.DoubleSide,roughness:1,color:0xb5b6a3});forestWind(mat,time,wind,sun,true,night);batch(g,mat,plan.cover.length,'cover',variant);
  }
  const rockMaterial=new THREE.MeshStandardMaterial({map:tex(GROUND_ROOT,'rocks-baseColor'),normalMap:tex(GROUND_ROOT,'rocks-normal'),normalScale:new THREE.Vector2(.5,-.5),roughness:.95});
  for(let i=0;i<2;i++){const model=assets.get(GROUND_ROOT+'rock-'+i+'-lod1.glb');model.scene.updateMatrixWorld(true);model.scene.traverse((o:THREE.Object3D)=>{if(o instanceof THREE.Mesh)batch(o.geometry.clone().applyMatrix4(o.matrixWorld),rockMaterial,plan.rocks.length,'rock',i)})}
  // Sparse depth-tested shafts and low hollow mist; no fullscreen pass or camera shake.
  const airMaterial=new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{sun:{value:sun},night:{value:night?1:0}}]),vertexShader:`attribute float airKind;varying vec2 vUv;varying float kind;uniform vec3 sun;
   #include <fog_pars_vertex>
   void main(){kind=airKind;vUv=uv;vec3 center=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;vec3 axis=kind>.5?sun:vec3(0.,1.,0.);vec3 right=normalize(cross(axis,cameraPosition-center));vec3 world=center+right*position.x*(kind>.5?3.:34.)+axis*position.y*(kind>.5?25.:2.5);vec4 mvPosition=viewMatrix*vec4(world,1.);gl_Position=projectionMatrix*mvPosition;
   #include <fog_vertex>
   }`,fragmentShader:`varying vec2 vUv;varying float kind;uniform float night;
   #include <fog_pars_fragment>
   void main(){float a=pow(max(0.,1.-abs(vUv.x-.5)*2.),3.)*sin(vUv.y*3.14159);a*=kind>.5?.028*(1.-night):.038;gl_FragColor=vec4(mix(vec3(.60,.66,.68),vec3(.94,.82,.59),kind),a);
   #include <fog_fragment>
   }`,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const ag=new THREE.PlaneGeometry(1,1);ag.setAttribute('airKind',new THREE.InstancedBufferAttribute(new Float32Array(plan.air.map(p=>p.variant)),1));const air=batch(ag,airMaterial,plan.air.length,'air',0);air.castShadow=false;
  function fill(mesh:THREE.InstancedMesh,p:ForestPlacement){position.set(p.x,p.y,p.z);q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,p.yaw);scale.setScalar(p.scale);matrix.compose(position,q,scale);mesh.setMatrixAt(mesh.count++,matrix)}
  return{group,ground,update(camera:THREE.Vector3,seconds:number,quality:GraphicsQuality,reduced:boolean){
   wind.value=reduced?0:.18;time.value=seconds;
   if(camera.distanceToSquared(lastCamera)<9&&lastQuality===quality)return;lastCamera.copy(camera);lastQuality=quality;active=[0,0,0,0];for(const b of batches)b.mesh.count=0;
   const budget=FOREST_BUDGET[quality];
   for(const p of trees){const d=Math.hypot(p.x-camera.x,p.z-camera.z),lod=forestLOD(d,quality);if(lod<0)continue;active[lod]++;for(const b of batches)if(b.kind==='tree'&&b.variant===p.variant%2&&b.lod===lod)fill(b.mesh,p)}
   for(const p of plan.cover)if(Math.hypot(p.x-camera.x,p.z-camera.z)<budget.cover)for(const b of batches)if(b.kind==='cover'&&b.variant===p.variant)fill(b.mesh,p);
   for(const p of plan.rocks)if(Math.hypot(p.x-camera.x,p.z-camera.z)<budget.cover+25)for(const b of batches)if(b.kind==='rock'&&b.variant===p.variant)fill(b.mesh,p);
   // Preserve airKind instance order even for culled entries (zero opacity through visibility is shared).
   for(const p of plan.air)fill(air,p);air.visible=budget.shafts;
   for(const b of batches){b.mesh.instanceMatrix.needsUpdate=true;if(b.kind!=='air')b.mesh.visible=b.mesh.count>0}
  },inspect:()=>({version:'ridge-forest-p11-v1',species:FOREST_SPECIES,trees:trees.length,activeLOD:active,quality:lastQuality,wind:wind.value,time:time.value,groundCover:plan.cover.length,rocks:plan.rocks.length,batches:batches.length,visibleBatches:batches.filter(b=>b.mesh.visible).length,activeTriangles:batches.reduce((n,b)=>n+(b.mesh.visible?b.mesh.count*(b.mesh.geometry.index?.count??b.mesh.geometry.getAttribute('position').count)/3:0),0),shafts:air.visible&&!night,hollowMist:air.visible,assets:urls.length}),dispose(){if(disposed)return;disposed=true;group.removeFromParent();release()}};
 }catch(error){release();throw error}
}
