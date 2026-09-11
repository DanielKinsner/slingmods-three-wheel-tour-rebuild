import * as THREE from 'three';
export type LightPreset='day'|'night';
export type HarborLightingRoute={lamps:{position:number[];target:number[]}[]};
/** Two stock beams, one bounded shadow map, and at most four nearby nonshadow harbor practicals. */
export function harborLighting(scene:THREE.Scene,car:THREE.Object3D,route:HarborLightingRoute,preset:LightPreset,quality:'standard'|'low'){
 const night=preset==='night',sky=new THREE.Color(night?'#142639':'#bdcdd5');scene.background=sky;scene.fog=new THREE.Fog(sky,night?120:250,night?480:850);scene.environmentIntensity=night?.22:.55;
 const fill=new THREE.HemisphereLight(night?0x99c9ed:0xd9eaff,night?0x282e34:0x857969,night?.6:1.3);scene.add(fill);
 const sun=new THREE.DirectionalLight(night?0x94b9ef:0xffddb0,night?.65:3.0);sun.castShadow=true;sun.shadow.mapSize.set(quality==='low'?512:1024,quality==='low'?512:1024);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:.1,far:110});sun.shadow.normalBias=.025;scene.add(sun,sun.target);
 const lens=car.getObjectByName('lights_head__Optical_Lens'),bounds=lens?new THREE.Box3().setFromObject(lens):new THREE.Box3(new THREE.Vector3(-.7,.45,-1.9),new THREE.Vector3(.7,.55,-1.8));const middle=bounds.getCenter(new THREE.Vector3());
 const beams=[bounds.min.x+.025,bounds.max.x-.025].map(x=>{const light=new THREE.SpotLight(0xe9f3ff,night?1600:0,105,.38,.6,2);light.position.set(x,middle.y,bounds.min.z-.04);light.target.position.set(x*.7,-.35,-48);car.add(light,light.target);return light});
 const brakeMaterials:THREE.MeshStandardMaterial[]=[];
 car.traverse(o=>{if(!(o instanceof THREE.Mesh))return;if(o.name.startsWith('lights_head__Optical_Lens')||o.name.startsWith('lights_brake__Tail_Lens')){const mats=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const copy=m.clone() as THREE.MeshStandardMaterial;if(copy.emissive){if(o.name.startsWith('lights_head')){copy.emissive.set(0xdcefff);copy.emissiveIntensity=night?2.6:.1}else{copy.emissive.set(0xff1808);copy.emissiveIntensity=.15;brakeMaterials.push(copy)}}return copy});o.material=Array.isArray(o.material)?mats:mats[0]}});
 const practicals=Array.from({length:quality==='low'?2:4},()=>{const l=new THREE.SpotLight(0xffce91,night?2400:0,33,.85,.7,2);scene.add(l,l.target);return l});
 let practicalIndices:number[]=[];
 return{budget:{preset,quality,shadowMaps:1,shadowResolution:quality==='low'?512:1024,stockBeams:2,pooledPracticals:practicals.length},update(position:THREE.Vector3,brake:number){
 sun.position.copy(position).add(new THREE.Vector3(-22,42,-28));sun.target.position.copy(position);brakeMaterials.forEach(m=>m.emissiveIntensity=brake>.03?3.5:night?.55:.15);
 if(night){const near=route.lamps.map((l,i)=>({i,d:Math.hypot(l.position[0]-position.x,l.position[2]-position.z)})).sort((a,b)=>a.d-b.d).slice(0,practicals.length);practicalIndices=near.map(x=>x.i);practicals.forEach((l,i)=>{const sample=near[i];l.visible=!!sample&&sample.d<65;if(sample){l.position.fromArray(route.lamps[sample.i].position);l.target.position.fromArray(route.lamps[sample.i].target)}})}
 },inspect:()=>({headlightPositions:beams.map(b=>b.getWorldPosition(new THREE.Vector3()).toArray()),beamIntensities:beams.map(b=>b.intensity),brakeEmission:brakeMaterials.map(m=>m.emissiveIntensity),practicalIndices}),dispose(){[sun,fill,...beams,...practicals].forEach(l=>l.dispose())}};
}
