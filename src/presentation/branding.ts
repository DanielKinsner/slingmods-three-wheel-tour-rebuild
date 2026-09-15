import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
type Sign={id:string;scene:'bay'|'harbor';position:[number,number,number];yaw:number;width:number};
/** One shared Blender-authored logo plane, original artwork proportions and four bounded placements. */
export async function loadBranding(scene:'bay'|'harbor',loader=new GLTFLoader()){
 const [asset,layout]=await Promise.all([loader.loadAsync('/assets/brand/slingmods-sign.glb'),fetch('/assets/brand/sign-layout.json').then(r=>{if(!r.ok)throw Error('Brand placement asset unavailable');return r.json() as Promise<{placements:Sign[];aspectRatio:number;sourceImageSHA256:string}>})]);
 const root=new THREE.Group();root.name='SlingMods_Official_Artwork';
 for(const p of layout.placements.filter(p=>p.scene===scene)){
  const sign=asset.scene.clone(true);sign.name=p.id;sign.position.fromArray(p.position);sign.rotation.y=p.yaw;sign.scale.setScalar(p.width);
  sign.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=true}});root.add(sign);
 }
 root.userData.branding={sourceImageSHA256:layout.sourceImageSHA256,aspectRatio:layout.aspectRatio,placements:layout.placements.filter(p=>p.scene===scene),source:'assets/blender/showcase-quality/showcase-branding.blend',newLights:0,newColliders:0};
 return root;
}
