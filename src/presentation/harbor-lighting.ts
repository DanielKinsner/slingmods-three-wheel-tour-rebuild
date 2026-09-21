import {VehicleOptics} from './vehicle-materials';
import * as THREE from 'three';
import type {Look} from './time-of-day';
export type LightPreset='day'|'night';
export type HarborLightingRoute={lamps:{position:number[];target:number[]}[]};
/** Two stock beams, one bounded shadow map, and at most four nearby nonshadow harbor practicals. */
export function harborLighting(scene:THREE.Scene,car:THREE.Object3D,route:HarborLightingRoute,preset:LightPreset,quality:'standard'|'low',look?:Look){
 const night=preset==='night',sky=new THREE.Color(night?'#3e4857':'#b9cbd6');scene.fog=new THREE.Fog(sky,night?240:400,night?900:1400);
 const sunDirection=new THREE.Vector3().fromArray(scene.userData.outdoorSunDirection??[-22,42,-28]).normalize();
 const fill=new THREE.HemisphereLight(night?0x9bacbf:0xd8e7f4,night?0x262b32:0x8e8474,night?.38:.30);scene.add(fill);
 const sun=new THREE.DirectionalLight(night?0xa4b9d7:0xffefdc,night?.38:2.05);sun.castShadow=true;sun.shadow.mapSize.set(quality==='low'?512:1024,quality==='low'?512:1024);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:.1,far:110});sun.shadow.normalBias=.025;scene.add(sun,sun.target);
 const lens=car.getObjectByName('lights_head__Optical_Lens'),bounds=lens?new THREE.Box3().setFromObject(lens):new THREE.Box3(new THREE.Vector3(-.7,.45,-1.9),new THREE.Vector3(.7,.55,-1.8));const middle=bounds.getCenter(new THREE.Vector3());
 const beams=[bounds.min.x+.025,bounds.max.x-.025].map(x=>{const light=new THREE.SpotLight(0xe9f3ff,night?180:0,85,.34,.7,2);light.position.set(x,middle.y,bounds.min.z-.04);light.target.position.set(x*.7,-1.0,-32);car.add(light,light.target);return light});
 // A time-of-day look re-colours the validated rig; the rig's structure, shadow budget and lamp pooling are unchanged.
 if(look?.sun){sun.color.set(look.sun.color);sun.intensity=look.sun.intensity}if(look?.hemisphere){fill.color.set(look.hemisphere.sky);fill.groundColor.set(look.hemisphere.ground);fill.intensity=look.hemisphere.intensity}if(look?.fog)scene.fog=new THREE.Fog(look.fog.color,look.fog.near,look.fog.far);
 const optics=new VehicleOptics(car,night);
 const practicals=Array.from({length:quality==='low'?2:4},()=>{const l=new THREE.SpotLight(0xffe4c4,night?1000:0,48,1.10,.92,2);scene.add(l,l.target);return l});
 let practicalIndices:number[]=[];
 return{budget:{preset,quality,shadowMaps:1,shadowResolution:quality==='low'?512:1024,stockBeams:2,pooledPracticals:practicals.length},update(position:THREE.Vector3,brake:number){
 sun.position.copy(position).addScaledVector(sunDirection,60);sun.target.position.copy(position);optics.update(brake);
 if(night){const near=route.lamps.map((l,i)=>({i,d:Math.hypot(l.position[0]-position.x,l.position[2]-position.z)})).sort((a,b)=>a.d-b.d).slice(0,practicals.length);practicalIndices=near.map(x=>x.i);practicals.forEach((l,i)=>{const sample=near[i];l.visible=true;if(!sample)l.intensity=0;if(sample){const fade=THREE.MathUtils.smoothstep(sample.d,quality==='low'?12:24,quality==='low'?29:55);l.intensity=1000*(1-fade);l.position.fromArray(route.lamps[sample.i].position);l.target.position.fromArray(route.lamps[sample.i].target)}})}
 },inspect:()=>({outdoor:scene.userData.outdoorEnvironment??null,sunDirection:sunDirection.toArray(),directIntensity:sun.intensity,hemisphereIntensity:fill.intensity,headlightPositions:beams.map(b=>b.getWorldPosition(new THREE.Vector3()).toArray()),beamIntensities:beams.map(b=>b.intensity),brakeEmission:optics.inspect().brakeEmission,practicalIndices,residentPracticals:practicals.length,emittingPracticals:practicals.filter(l=>l.intensity>0).length}),dispose(){[sun,fill,...beams,...practicals].forEach(l=>{l.removeFromParent();l.dispose()});sun.target.removeFromParent();[...beams,...practicals].forEach(l=>l.target.removeFromParent());optics.dispose()}};
}
