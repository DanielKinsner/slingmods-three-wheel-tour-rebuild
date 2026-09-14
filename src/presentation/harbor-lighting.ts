import * as THREE from 'three';
export type LightPreset='day'|'night';
export type HarborLightingRoute={lamps:{position:number[];target:number[]}[]};
/** Two stock beams, one bounded shadow map, and at most four nearby nonshadow harbor practicals. */
export function harborLighting(scene:THREE.Scene,car:THREE.Object3D,route:HarborLightingRoute,preset:LightPreset,quality:'standard'|'low'){
 const night=preset==='night',sky=new THREE.Color(night?'#1b3048':'#b4cbd8');scene.background=sky;scene.fog=new THREE.Fog(sky,night?160:280,night?530:850);scene.environmentIntensity=night?.28:.45;
 const fill=new THREE.HemisphereLight(night?0x91b8d8:0xcce4f8,night?0x30353d:0x857565,night?.82:1.0);scene.add(fill);
 const sun=new THREE.DirectionalLight(night?0x94b9ef:0xffd3a0,night?.48:2.7);sun.castShadow=true;sun.shadow.mapSize.set(quality==='low'?512:1024,quality==='low'?512:1024);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:.1,far:110});sun.shadow.normalBias=.025;scene.add(sun,sun.target);
 const lens=car.getObjectByName('lights_head__Optical_Lens'),bounds=lens?new THREE.Box3().setFromObject(lens):new THREE.Box3(new THREE.Vector3(-.7,.45,-1.9),new THREE.Vector3(.7,.55,-1.8));const middle=bounds.getCenter(new THREE.Vector3());
 const beams=[bounds.min.x+.025,bounds.max.x-.025].map(x=>{const light=new THREE.SpotLight(0xe9f3ff,night?180:0,85,.34,.7,2);light.position.set(x,middle.y,bounds.min.z-.04);light.target.position.set(x*.7,-1.0,-32);car.add(light,light.target);return light});
 const brakeMaterials:THREE.MeshStandardMaterial[]=[];
 car.traverse(o=>{if(!(o instanceof THREE.Mesh))return;if(o.name.startsWith('lights_head__Optical_Lens')||o.name.startsWith('lights_brake__Tail_Lens')){const mats=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const copy=m.clone() as THREE.MeshStandardMaterial;if(copy.emissive){if(o.name.startsWith('lights_head')){copy.emissive.set(0xdcefff);copy.emissiveIntensity=night?2.6:.1}else{copy.emissive.set(0xff1808);copy.emissiveIntensity=.15;brakeMaterials.push(copy)}}return copy});o.material=Array.isArray(o.material)?mats:mats[0]}});
 const practicals=Array.from({length:quality==='low'?2:4},()=>{const l=new THREE.SpotLight(0xffce91,night?1900:0,48,1.10,.92,2);scene.add(l,l.target);return l});
 let practicalIndices:number[]=[];
 return{budget:{preset,quality,shadowMaps:1,shadowResolution:quality==='low'?512:1024,stockBeams:2,pooledPracticals:practicals.length},update(position:THREE.Vector3,brake:number){
 sun.position.copy(position).add(new THREE.Vector3(-22,42,-28));sun.target.position.copy(position);brakeMaterials.forEach(m=>m.emissiveIntensity=brake>.03?3.5:night?.55:.15);
 if(night){const near=route.lamps.map((l,i)=>({i,d:Math.hypot(l.position[0]-position.x,l.position[2]-position.z)})).sort((a,b)=>a.d-b.d).slice(0,practicals.length);practicalIndices=near.map(x=>x.i);practicals.forEach((l,i)=>{const sample=near[i];l.visible=true;if(!sample)l.intensity=0;if(sample){const fade=THREE.MathUtils.smoothstep(sample.d,quality==='low'?12:24,quality==='low'?29:55);l.intensity=1900*(1-fade);l.position.fromArray(route.lamps[sample.i].position);l.target.position.fromArray(route.lamps[sample.i].target)}})}
 },inspect:()=>({headlightPositions:beams.map(b=>b.getWorldPosition(new THREE.Vector3()).toArray()),beamIntensities:beams.map(b=>b.intensity),brakeEmission:brakeMaterials.map(m=>m.emissiveIntensity),practicalIndices,residentPracticals:practicals.length,emittingPracticals:practicals.filter(l=>l.intensity>0).length}),dispose(){[sun,fill,...beams,...practicals].forEach(l=>l.dispose())}};
}
