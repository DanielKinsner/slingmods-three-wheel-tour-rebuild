import * as THREE from 'three';
import {loadKTX2} from './ktx2';import {RACE_ASPHALT_URLS,PUDDLE_MASK_URL} from './p11-assets';
/**
 * P11 race asphalt at true scale: the 4096 px set covers 4 m (5-15 mm aggregate), and a 0.5 m detail normal takes over
 * close to the camera so the surface still streaks at 1024 px/m under the car. Colour is the game-calibrated map
 * (scripts/p11/calibrate-asphalt-albedo.py); normal, roughness and occlusion are the untouched scan.
 */
const TILE=4,DETAIL_TILE=.5;
/**
 * Uniforms a wet road shares with whoever renders its reflections. `reflection` is a half-resolution image of the cars,
 * underglow and lamps mirrored about the road (wet-reflection.ts); with `planar` 0 the puddles mirror only the sky probe.
 */
export interface WetRoadUniforms {wetness:THREE.IUniform<number>;puddleMask:THREE.IUniform<THREE.Texture|null>;puddleTile:THREE.IUniform<number>;reflection:THREE.IUniform<THREE.Texture|null>;reflectionMatrix:THREE.IUniform<THREE.Matrix4>;planar:THREE.IUniform<number>}
/** Metres covered by one UV unit, measured from the mesh itself so any authored road can take the material at true scale. */
export function metresPerUV(geometry:THREE.BufferGeometry){
 const p=geometry.getAttribute('position'),uv=geometry.getAttribute('uv'),index=geometry.getIndex();if(!p||!uv)return 1;
 let metres=0,units=0;const count=Math.min(index?index.count:p.count,600),at=(i:number)=>index?index.getX(i):i;
 for(let i=0;i+1<count;i+=3){const a=at(i),b=at(i+1);metres+=Math.hypot(p.getX(b)-p.getX(a),p.getY(b)-p.getY(a),p.getZ(b)-p.getZ(a));units+=Math.hypot(uv.getX(b)-uv.getX(a),uv.getY(b)-uv.getY(a))}
 return units>1e-9?metres/units:1;
}
const DETAIL_NORMAL=`vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	// Fine aggregate only where the camera can resolve it; mip-mapping carries the rest.
	vec3 detailN = texture2D( detailNormalMap, vNormalMapUv * detailRepeat ).xyz * 2.0 - 1.0;
	mapN = normalize( vec3( mapN.xy + detailN.xy * detailStrength * ( 1.0 - smoothstep( 8.0, 38.0, length( vViewPosition ) ) ), mapN.z ) );`;
// Wet road, all in one material: the whole surface darkens and turns glossy; where the puddle field is high the water
// stands, goes mirror-smooth and flat, and (High/Ultra) shows the mirrored cars, underglow and lamps. Visual only.
const WET_FIELD=`#include <map_fragment>
	float wetField=texture2D(puddleMask,vWetWorld.xz/puddleTile).r*.75+texture2D(puddleMask,vWetWorld.zx/(puddleTile*.37)+.31).r*.25;
	float puddle=smoothstep(.50,.64,wetField)*wetness,damp=wetness*(.6+.4*smoothstep(.25,.6,wetField));
	diffuseColor.rgb*=mix(1.,.55,damp);`;
const WET_REFLECTION=`if(wetPlanar>.5){
		vec4 wetClip=wetReflectionMatrix*vec4(vWetWorld,1.);vec2 wetUv=wetClip.xy/wetClip.w+normal.xy*.012*(1.-puddle);
		vec4 mirrored=texture2D(wetReflection,clamp(wetUv,vec2(.002),vec2(.998)));
		float grazing=pow(1.-saturate(dot(normalize(vViewPosition),normal)),4.),shine=(puddle+damp*.22)*mix(.22,1.,grazing);
		// Reflected objects hide the sky glint behind them, then add their own light.
		outgoingLight=outgoingLight*(1.-mirrored.a*shine*.65)+mirrored.rgb*shine;
	}
	#include <opaque_fragment>`;
export async function loadRaceAsphalt(renderer:THREE.WebGLRenderer,uvMetres:number,options:{vertexColors?:boolean;wet?:boolean}={}){
 const [map,normalMap,orm,detail,puddles]=await Promise.all([loadKTX2(renderer,RACE_ASPHALT_URLS[0],{srgb:true,anisotropy:16}),loadKTX2(renderer,RACE_ASPHALT_URLS[1],{anisotropy:16}),loadKTX2(renderer,RACE_ASPHALT_URLS[2],{anisotropy:16}),loadKTX2(renderer,RACE_ASPHALT_URLS[3],{anisotropy:16}),options.wet?loadKTX2(renderer,PUDDLE_MASK_URL,{anisotropy:8}):null]);
 for(const t of[map,normalMap,orm])t.repeat.setScalar(uvMetres/TILE);
 const material=new THREE.MeshStandardMaterial({name:'P11_race_asphalt',map,normalMap,normalScale:new THREE.Vector2(.9,-.9),roughnessMap:orm,aoMap:orm,aoMapIntensity:.6,roughness:1,metalness:0,vertexColors:!!options.vertexColors});
 const wet:WetRoadUniforms={wetness:{value:options.wet?1:0},puddleMask:{value:puddles},puddleTile:{value:22},reflection:{value:null},reflectionMatrix:{value:new THREE.Matrix4()},planar:{value:0}};
 const uniforms={detailNormalMap:{value:detail},detailRepeat:{value:TILE/DETAIL_TILE},detailStrength:{value:.55},wetness:wet.wetness,puddleMask:wet.puddleMask,puddleTile:wet.puddleTile,wetReflection:wet.reflection,wetReflectionMatrix:wet.reflectionMatrix,wetPlanar:wet.planar};
 material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);
  let fragment=shader.fragmentShader.replace('vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;',DETAIL_NORMAL+(options.wet?'\n\tmapN = normalize( vec3( mapN.xy * ( 1.0 - puddle * .96 ), mapN.z ) ); // standing water is flat':''));
  if(options.wet){
   shader.vertexShader='varying vec3 vWetWorld;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n\tvWetWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
   fragment='varying vec3 vWetWorld;uniform float wetness;uniform sampler2D puddleMask;uniform float puddleTile;uniform sampler2D wetReflection;uniform mat4 wetReflectionMatrix;uniform float wetPlanar;\n'+fragment.replace('#include <map_fragment>',WET_FIELD).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n\troughnessFactor=mix(mix(roughnessFactor,.34,damp),.035,puddle);').replace('#include <opaque_fragment>',WET_REFLECTION);
  }
  shader.fragmentShader='uniform sampler2D detailNormalMap;uniform float detailRepeat;uniform float detailStrength;\n'+fragment};
 material.customProgramCacheKey=()=>'p11-race-asphalt-detail'+(options.wet?'-wet':'');
 return{material,wet:options.wet?wet:undefined,inspect:()=>({wet:!!options.wet,planarReflection:wet.planar.value>0,tileMetres:TILE,detailTileMetres:DETAIL_TILE,uvMetres,repeat:map.repeat.x,pixelsPerMetre:4096/TILE,detailPixelsPerMetre:2048/DETAIL_TILE}),dispose(){material.dispose();for(const t of[map,normalMap,orm,detail,puddles])t?.dispose()}};
}
