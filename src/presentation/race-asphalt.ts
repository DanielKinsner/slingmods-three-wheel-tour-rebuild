import * as THREE from 'three';
import {loadKTX2} from './ktx2';import {RACE_ASPHALT_URLS} from './p11-assets';
/**
 * P11 race asphalt at true scale: the 4096 px set covers 4 m (5-15 mm aggregate), and a 0.5 m detail normal takes over
 * close to the camera so the surface still streaks at 1024 px/m under the car. Colour is the game-calibrated map
 * (scripts/p11/calibrate-asphalt-albedo.py); normal, roughness and occlusion are the untouched scan.
 */
const TILE=4,DETAIL_TILE=.5;
/** Metres covered by one UV unit, measured from the mesh itself so any authored road can take the material at true scale. */
export function metresPerUV(geometry:THREE.BufferGeometry){
 const p=geometry.getAttribute('position'),uv=geometry.getAttribute('uv'),index=geometry.getIndex();if(!p||!uv)return 1;
 let metres=0,units=0;const count=Math.min(index?index.count:p.count,600),at=(i:number)=>index?index.getX(i):i;
 for(let i=0;i+1<count;i+=3){const a=at(i),b=at(i+1);metres+=Math.hypot(p.getX(b)-p.getX(a),p.getY(b)-p.getY(a),p.getZ(b)-p.getZ(a));units+=Math.hypot(uv.getX(b)-uv.getX(a),uv.getY(b)-uv.getY(a))}
 return units>1e-9?metres/units:1;
}
export async function loadRaceAsphalt(renderer:THREE.WebGLRenderer,uvMetres:number,options:{vertexColors?:boolean}={}){
 const [map,normalMap,orm,detail]=await Promise.all([loadKTX2(renderer,RACE_ASPHALT_URLS[0],{srgb:true,anisotropy:16}),loadKTX2(renderer,RACE_ASPHALT_URLS[1],{anisotropy:16}),loadKTX2(renderer,RACE_ASPHALT_URLS[2],{anisotropy:16}),loadKTX2(renderer,RACE_ASPHALT_URLS[3],{anisotropy:16})]);
 for(const t of[map,normalMap,orm])t.repeat.setScalar(uvMetres/TILE);
 const material=new THREE.MeshStandardMaterial({name:'P11_race_asphalt',map,normalMap,normalScale:new THREE.Vector2(.9,-.9),roughnessMap:orm,aoMap:orm,aoMapIntensity:.6,roughness:1,metalness:0,vertexColors:!!options.vertexColors});
 const uniforms={detailNormalMap:{value:detail},detailRepeat:{value:TILE/DETAIL_TILE},detailStrength:{value:.55}};
 material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);
  shader.fragmentShader='uniform sampler2D detailNormalMap;uniform float detailRepeat;uniform float detailStrength;\n'+shader.fragmentShader.replace('vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;',
   `vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	// Fine aggregate only where the camera can resolve it; mip-mapping carries the rest.
	vec3 detailN = texture2D( detailNormalMap, vNormalMapUv * detailRepeat ).xyz * 2.0 - 1.0;
	mapN = normalize( vec3( mapN.xy + detailN.xy * detailStrength * ( 1.0 - smoothstep( 8.0, 38.0, length( vViewPosition ) ) ), mapN.z ) );`)};
 material.customProgramCacheKey=()=>'p11-race-asphalt-detail';
 return{material,inspect:()=>({tileMetres:TILE,detailTileMetres:DETAIL_TILE,uvMetres,repeat:map.repeat.x,pixelsPerMetre:4096/TILE,detailPixelsPerMetre:2048/DETAIL_TILE}),dispose(){material.dispose();for(const t of[map,normalMap,orm,detail])t.dispose()}};
}
