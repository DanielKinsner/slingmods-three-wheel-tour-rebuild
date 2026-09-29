import * as THREE from 'three';
import {WetReflection,type PlanarReflectionSurface} from './wet-reflection';
import {SHOWROOM_ROOM} from './showroom-camera';
import {SHOWROOM_FRONT_WALL_Z} from './showroom-front-wall';

/**
 * Showroom finish over the owner-referenced shop (same room, floor pattern, lift and bay door): a finished ceiling
 * with a linear LED light frame in place of the bare softbox panels that floated in the open top, downlights that pool
 * on the vehicle so the room falls off around it, and a clear epoxy coat on the checker floor that mirrors the vehicle
 * and the light frame (the race's planar wet-road pass, High/Ultra only). Showroom-only; no racing material shares it.
 */
export const SHOWROOM_PREMIUM={
 ceiling:{y:SHOWROOM_ROOM.wallTop,color:0x15181c},
 /** The light frame keeps the replaced softboxes' footprint over the vehicle. */
 frame:{x:[-3,3],z:[-1.9,1.1],y:SHOWROOM_ROOM.wallTop-.1,bar:.075},
 downlights:[[-1.35,-1.4],[1.35,-1.4],[-1.35,.6],[1.35,.6]] as const,
 looks:{studio:{led:5.5,pool:22,coat:1,sign:.85},tour:{led:5.5,pool:22,coat:1,sign:.85},lights:{led:.28,pool:1.2,coat:.8,sign:.35}},
 floorMaterials:/^(Refined_vented_(charcoal|gray|red)|studio_charcoal_tile)$/,
} as const;
export type PremiumLook=keyof typeof SHOWROOM_PREMIUM.looks;

interface CoatUniforms extends PlanarReflectionSurface {strength:THREE.IUniform<number>;texel:THREE.IUniform<THREE.Vector2>}
const COAT=`{
		// Clear epoxy: a faint sheen face-on, stronger toward grazing; the planar pass adds the vehicle and light frame.
		float coatGrazing=pow(1.-saturate(dot(normalize(vViewPosition),normal)),3.),coatShine=coatStrength*mix(.08,.62,coatGrazing);
		if(coatPlanar>.5){
			vec4 coatClip=coatMatrix*vec4(vCoatWorld,1.);vec2 coatUv=coatClip.xy/coatClip.w+normal.xy*.006;vec4 mirrored=vec4(0.);
			for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++)mirrored+=texture2D(coatReflection,clamp(coatUv+vec2(float(i),float(j))*coatTexel*1.6,vec2(.002),vec2(.998)));
			mirrored/=9.;outgoingLight=outgoingLight*(1.-mirrored.a*coatShine*.7)+mirrored.rgb*coatShine;
		}
	}
	#include <opaque_fragment>`;

/** Chains onto the shared surface-finish hook (world-metre detail normals) instead of replacing it. */
function coat(material:THREE.MeshStandardMaterial,u:CoatUniforms){
 if(material.userData.showroomCoat)return;material.userData.showroomCoat=true;
 const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey;
 material.onBeforeCompile=(shader,renderer)=>{previous.call(material,shader,renderer);
  Object.assign(shader.uniforms,{coatReflection:u.reflection,coatMatrix:u.reflectionMatrix,coatPlanar:u.planar,coatStrength:u.strength,coatTexel:u.texel});
  shader.vertexShader='varying vec3 vCoatWorld;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n\tvCoatWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader='varying vec3 vCoatWorld;uniform sampler2D coatReflection;uniform mat4 coatMatrix;uniform float coatPlanar;uniform float coatStrength;uniform vec2 coatTexel;\n'+shader.fragmentShader
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n\troughnessFactor*=mix(1.,.82,coatStrength);').replace('#include <map_fragment>','#include <map_fragment>\n\tdiffuseColor.rgb*=mix(1.,.72,coatStrength);').replace('#include <opaque_fragment>',COAT);
 };
 material.customProgramCacheKey=()=>previousKey.call(material)+'|showroom-epoxy-coat';material.needsUpdate=true;
 return ()=>{material.onBeforeCompile=previous;material.customProgramCacheKey=previousKey;delete material.userData.showroomCoat;material.needsUpdate=true};
}

function ceilingAndFrame(){
 const group=new THREE.Group();group.name='showroom_premium_ceiling';
 const {x,z,y,bar}=SHOWROOM_PREMIUM.frame,top=SHOWROOM_PREMIUM.ceiling.y,depth=7.14-SHOWROOM_FRONT_WALL_Z;
 const matte=new THREE.MeshStandardMaterial({name:'showroom_ceiling_matte',color:SHOWROOM_PREMIUM.ceiling.color,roughness:.86,metalness:0,envMapIntensity:.25});
 const ceiling=new THREE.Mesh(new THREE.BoxGeometry(12.3,.12,depth+.2),matte);
 ceiling.name='showroom_ceiling';ceiling.position.set(0,top+.06,SHOWROOM_FRONT_WALL_Z+depth/2);ceiling.receiveShadow=true;group.add(ceiling);
 const housing=new THREE.MeshStandardMaterial({name:'showroom_led_housing',color:0x0b0c0e,roughness:.4,metalness:.6,envMapIntensity:.4});
 const led=new THREE.MeshStandardMaterial({name:'showroom_led_diffuser',color:0x000000,emissive:0xfff6ea,emissiveIntensity:SHOWROOM_PREMIUM.looks.studio.led,roughness:.5});
 const run=(length:number,along:'x'|'z',at:[number,number])=>{
  const size:[number,number]=along==='x'?[length,bar]:[bar,length];
  const shell=new THREE.Mesh(new THREE.BoxGeometry(size[0]+.04,top-y,size[1]+.04),housing);shell.position.set(at[0],(top+y)/2,at[1]);
  const strip=new THREE.Mesh(new THREE.BoxGeometry(size[0],.012,size[1]),led);strip.position.set(at[0],y-.004,at[1]);strip.name='showroom_led_strip';
  group.add(shell,strip);
 };
 const cx=(x[0]+x[1])/2,cz=(z[0]+z[1])/2,w=x[1]-x[0],d=z[1]-z[0];
 run(w+bar,'x',[cx,z[0]]);run(w+bar,'x',[cx,z[1]]);run(d-bar,'z',[x[0],cz]);run(d-bar,'z',[x[1],cz]);
 // Two inner lines along the vehicle, like a showroom light cove.
 run(d-.6,'z',[cx-.9,cz]);run(d-.6,'z',[cx+.9,cz]);
 return {group,materials:[matte,housing,led],led};
}

export function premiumShowroom(renderer:THREE.WebGLRenderer,room:THREE.Object3D,reflectionTier:number){
 const {group,materials,led}=ceilingAndFrame();
 // The ceiling's light frame replaces the floating softbox panels; their light is carried by the downlights below.
 const hidden:[THREE.Object3D,boolean][]=[];room.traverse(o=>{if(o instanceof THREE.Mesh&&!Array.isArray(o.material)&&o.material.name==='studio_softbox_diffuser'){hidden.push([o,o.visible]);o.visible=false}});
 const pools=SHOWROOM_PREMIUM.downlights.map(([px,pz],i)=>{const spot=new THREE.SpotLight(0xfff4e6,SHOWROOM_PREMIUM.looks.studio.pool,11,.62,.85,2);spot.name='showroom_downlight_'+i;spot.position.set(px,SHOWROOM_PREMIUM.frame.y-.05,pz);spot.target.position.set(px*.35,0,pz*.35+.1);group.add(spot,spot.target);return spot});
 // Epoxy coat on the floor materials currently bound (after the shared surface-finish swap).
 const uniforms:CoatUniforms={reflection:{value:null},reflectionMatrix:{value:new THREE.Matrix4()},planar:{value:0},strength:{value:SHOWROOM_PREMIUM.looks.studio.coat},texel:{value:new THREE.Vector2(1/1024,1/1024)}};
 const floors=new Set<THREE.MeshStandardMaterial>(),restoreCoats:(()=>void)[]=[];
 // Lift ramps and bright hardware: satin galvanized (roughness and colour; three.js overrides envMapIntensity with the scene's).
 const hardware:[THREE.MeshStandardMaterial,number,number][]=[];room.traverse(o=>{if(o instanceof THREE.Mesh&&!Array.isArray(o.material)&&o.material instanceof THREE.MeshStandardMaterial&&o.material.name==='studio_handle_brushed'&&!hardware.some(([m])=>m===o.material)){hardware.push([o.material,o.material.roughness,o.material.color.getHex()]);o.material.roughness=Math.max(o.material.roughness,.5);o.material.color.multiplyScalar(.6)}});
 const signs:THREE.MeshStandardMaterial[]=[],restoreSigns:(()=>void)[]=[];room.traverse(o=>{if(o instanceof THREE.Mesh&&!Array.isArray(o.material)&&o.material instanceof THREE.MeshStandardMaterial&&o.material.name==='SlingMods_authorized_logo'&&o.material.map&&!signs.includes(o.material)){const m=o.material,map=m.emissiveMap,color=m.emissive.clone(),intensity=m.emissiveIntensity;signs.push(m);restoreSigns.push(()=>{m.emissiveMap=map;m.emissive.copy(color);m.emissiveIntensity=intensity;m.needsUpdate=true});m.emissiveMap=m.map;m.emissive.set(0xffffff);m.emissiveIntensity=SHOWROOM_PREMIUM.looks.studio.sign;m.needsUpdate=true}});
 const bind=()=>room.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof THREE.MeshStandardMaterial&&SHOWROOM_PREMIUM.floorMaterials.test(m.name)&&!floors.has(m)){const restore=coat(m,uniforms);if(restore)restoreCoats.push(restore);floors.add(m)}});
 bind();
 let reflection=reflectionTier>0?new WetReflection(renderer,0,[uniforms],.5):undefined;
 let roots:THREE.Object3D[]=[],except:THREE.Object3D[]=[],tier=reflectionTier,frame=0;
 const syncTexel=()=>{if(reflection)uniforms.texel.value.set(1/reflection.target.width,1/reflection.target.height)};syncTexel();
 let look:PremiumLook='studio';
 return {
  group,
  /** Roots that appear in the floor: the vehicle (with fitted parts) and the light frame. The live mirror faces stay out. */
  reflect(next:THREE.Object3D[],excluded:THREE.Object3D[]=[]){roots=[...next,group];except=excluded;reflection?.reflect(roots,except);frame=0},
  setLook(next:PremiumLook){look=next;const l=SHOWROOM_PREMIUM.looks[next];led.emissiveIntensity=l.led;for(const m of signs)m.emissiveIntensity=l.sign;for(const s of pools)s.intensity=l.pool;uniforms.strength.value=l.coat},
  /** Top-level pass before the frame, like the vehicle mirrors. */
  render(scene:THREE.Scene,camera:THREE.PerspectiveCamera,nextTier=reflectionTier){
   if(nextTier!==tier){
    tier=nextTier;frame=0;
    if(tier>0){if(!reflection){reflection=new WetReflection(renderer,0,[uniforms],.5);reflection.reflect(roots,except)}else reflection.resize();syncTexel()}
    else{reflection?.dispose();reflection=undefined}
   }
   if(reflection&&frame++%Math.max(1,tier)===0)reflection.render(scene,camera);
  },
  resize(){reflection?.resize();syncTexel()},
  inspect(){return {version:'showroom-premium-v1',look,ceiling:true,softboxesHidden:hidden.length,downlights:pools.length,floorMaterials:[...floors].map(m=>m.name),backlitSigns:signs.length,planar:reflection?.inspect()??null}},
  dispose(){reflection?.dispose();for(const [o,visible] of hidden)o.visible=visible;restoreCoats.forEach(restore=>restore());restoreSigns.forEach(restore=>restore());for(const [m,rough,color] of hardware){m.roughness=rough;m.color.setHex(color)}group.removeFromParent();group.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose()});materials.forEach(m=>m.dispose());for(const s of pools)s.dispose()},
 };
}
