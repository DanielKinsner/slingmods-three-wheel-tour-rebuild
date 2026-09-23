import halves from '../../public/assets/game-feel/texture-halves.json';
import {loadGraphicsQuality} from '../presentation/graphics-settings';
/**
 * Texture detail. Full uses the approved 4K KTX2 maps; Balanced swaps them for the half-resolution variants made by
 * dropping only the top mip level (scripts/game-feel/ktx2-half.py), cutting a race's texture download by roughly 3/4.
 * Auto picks Balanced for Low/Medium graphics, low-memory devices or data-saver connections.
 */
export type TextureDetail='auto'|'full'|'balanced';
const KEY='slingmods-gx-texture-detail',SET=new Set<string>(halves.files);
export function textureDetail():TextureDetail{try{const v=localStorage.getItem(KEY);return v==='full'||v==='balanced'?v:'auto'}catch{return 'auto'}}
export function setTextureDetail(v:TextureDetail){try{localStorage.setItem(KEY,v)}catch{/* session default */}}
export function useHalfTextures(){const v=textureDetail();if(v!=='auto')return v==='balanced';const q=loadGraphicsQuality(),nav=typeof navigator==='undefined'?undefined:navigator as Navigator&{deviceMemory?:number;connection?:{saveData?:boolean;effectiveType?:string}};return q==='low'||q==='medium'||(nav?.deviceMemory??8)<=4||!!nav?.connection?.saveData||/2g|3g/.test(nav?.connection?.effectiveType??'')}
/** Same-origin KTX2 URL to load for this device. */
export function ktx2Url(url:string){if(!SET.has(url)||!useHalfTextures())return url;return url.replace(/\.ktx2$/,'.half.ktx2')}
