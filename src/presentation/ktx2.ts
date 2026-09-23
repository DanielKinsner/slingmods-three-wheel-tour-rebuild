import * as THREE from 'three';
import {ktx2Url} from '../game/texture-detail';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {TextureSourceCache} from './texture-source-cache';
/** One Basis transcoder per renderer. GPU-compressed 4K maps cost about a quarter of the video memory of decoded PNGs. */
const loaders=new WeakMap<THREE.WebGLRenderer,KTX2Loader>();
const sources=new WeakMap<THREE.WebGLRenderer,TextureSourceCache<THREE.CompressedTexture>>();
export function ktx2Loader(renderer:THREE.WebGLRenderer){let loader=loaders.get(renderer);if(!loader){loader=new KTX2Loader().setTranscoderPath('/assets/basis/').detectSupport(renderer);loaders.set(renderer,loader)}return loader}
export function disposeKTX2(renderer:THREE.WebGLRenderer){sources.get(renderer)?.dispose();sources.delete(renderer);loaders.get(renderer)?.dispose();loaders.delete(renderer)}
export function inspectKTX2Cache(renderer:THREE.WebGLRenderer){return sources.get(renderer)?.inspect()??{urls:0,requests:0,reused:0}}
/**
 * Compressed textures cannot be flipped on upload, so image-top sits at v=0 (the glTF convention).
 * Meshes without tangents therefore need normalScale.y negated, exactly as GLTFLoader does.
 */
export async function loadKTX2(renderer:THREE.WebGLRenderer,url:string,{srgb=false,repeat=true,anisotropy=8}:{srgb?:boolean;repeat?:boolean;anisotropy?:number}={}){
 let cache=sources.get(renderer);if(!cache){const loader=ktx2Loader(renderer);cache=new TextureSourceCache(url=>loader.loadAsync(url));sources.set(renderer,cache)}
 const texture=await cache.load(ktx2Url(url));texture.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;if(repeat)texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=Math.min(anisotropy,renderer.capabilities.getMaxAnisotropy());return texture;
}
