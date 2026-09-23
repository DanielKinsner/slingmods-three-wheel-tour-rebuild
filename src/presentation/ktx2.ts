import * as THREE from 'three';
import {ktx2Url} from '../game/texture-detail';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
/** One Basis transcoder per renderer. GPU-compressed 4K maps cost about a quarter of the video memory of decoded PNGs. */
const loaders=new WeakMap<THREE.WebGLRenderer,KTX2Loader>();
export function ktx2Loader(renderer:THREE.WebGLRenderer){let loader=loaders.get(renderer);if(!loader){loader=new KTX2Loader().setTranscoderPath('/assets/basis/').detectSupport(renderer);loaders.set(renderer,loader)}return loader}
export function disposeKTX2(renderer:THREE.WebGLRenderer){loaders.get(renderer)?.dispose();loaders.delete(renderer)}
/**
 * Compressed textures cannot be flipped on upload, so image-top sits at v=0 (the glTF convention).
 * Meshes without tangents therefore need normalScale.y negated, exactly as GLTFLoader does.
 */
export async function loadKTX2(renderer:THREE.WebGLRenderer,url:string,{srgb=false,repeat=true,anisotropy=8}:{srgb?:boolean;repeat?:boolean;anisotropy?:number}={}){
 const texture=await ktx2Loader(renderer).loadAsync(ktx2Url(url));texture.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;if(repeat)texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=Math.min(anisotropy,renderer.capabilities.getMaxAnisotropy());return texture;
}
