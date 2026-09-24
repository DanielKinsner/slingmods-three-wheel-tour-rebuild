import * as THREE from 'three';
import {SHOWROOM_ROOM,SHOWROOM_SAFE_VOLUME} from './showroom-camera';
/**
 * The shipped showroom set is open toward -z: its floor stops at z = -5 m and the side walls at -4 m, so every rear or
 * low orbit looked into a flat void. This closes that end BEHIND the camera's safe volume (min z = -5.5 m), so no framing,
 * containment or the side-door departure path changes: a charcoal apron, side-wall returns and a finished end wall with
 * the room's wainscot, red accent line and SlingMods sign. Everything reuses the room's own materials (no new textures).
 */
export const SHOWROOM_FRONT_WALL_Z=-6.3;
export function closeShowroomFront(room:THREE.Object3D){
 const find=(name:string)=>{let found:THREE.Material|undefined;room.traverse(o=>{if(!found&&o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.name===name)found=m});return found};
 const white=find('studio_warm_white'),slab=find('studio_charcoal_tile'),red=find('studio_slingmods_red'),logo=find('SlingMods_authorized_logo'),graphite=find('studio_graphite_cabinet');
 if(!white||!slab)return undefined;
 if(SHOWROOM_FRONT_WALL_Z>=SHOWROOM_SAFE_VOLUME.min.z-.5)throw Error('Front wall must stay behind the camera volume');
 const group=new THREE.Group();group.name='showroom_front_closure';
 const add=(name:string,material:THREE.Material,size:[number,number,number],at:[number,number,number])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.name=name;m.position.set(...at);m.receiveShadow=true;group.add(m);return m};
 const z0=SHOWROOM_FRONT_WALL_Z,top=SHOWROOM_ROOM.wallTop,outer=6.09,inner=SHOWROOM_ROOM.sideWall;
 // floor apron from the tile edge back to the wall, flush with the slab under the vented tiles
 add('front_apron',slab,[outer*2,.05,SHOWROOM_ROOM.floorEdge-z0+.05],[0,-.035,(SHOWROOM_ROOM.floorEdge+z0)/2]);
 // side-wall returns: the authored side walls stop at z = -4 m
 for(const s of [-1,1])add('front_side_return',white,[outer-inner,top,-4-z0+.02],[s*(outer+inner)/2,top/2,(-4+z0)/2]);
 add('front_end_wall',white,[outer*2,top,.18],[0,top/2,z0-.09]);
 // wainscot, red accent line and the sign, all on the room-facing side of the end wall
 add('front_wainscot',graphite??slab,[inner*2,1.05,.04],[0,.525,z0+.02]);
 if(red)add('front_accent_line',red,[inner*2,.06,.05],[0,1.08,z0+.025]);
 if(logo){const plane=new THREE.PlaneGeometry(3.4,3.4*86/360),uv=plane.attributes.uv as THREE.BufferAttribute;for(let i=0;i<uv.count;i++)uv.setY(i,1-uv.getY(i));// glTF textures are not Y-flipped
  const sign=new THREE.Mesh(plane,logo);sign.name='front_slingmods_sign';sign.position.set(0,2.45,z0+.012);group.add(sign)}
 room.add(group);return group;
}
