import {migrateCareer,type Career} from './store';
import {profileFrom,transferTarget,type Profile} from '../demo/profile';
/**
 * One-shot same-origin scene handoff for a career that cannot be stored durably (denied storage, explicit temporary play).
 * It is tab memory (window.name), consumed on arrival, never a URL parameter and never sent to the product site.
 * Legacy untagged envelopes are career-only; a demo always requires an explicit demo tag.
 */
export const TRANSFER_PREFIX='twt-career-transfer:';
/** Every same-tab page that can hold or relay a temporary career. The free showroom only reads and relays it. */
export const TRANSFER_SCENES=['bay','pad','vehicle','harbor','crew','career','express','ridge','signature'] as const;
/** The page main.ts actually opens for a URL: no scene means the showroom unless the query asks for the career garage or a test fixture. */
export function sceneOf(url:URL){const scene=url.searchParams.get('scene');if(scene)return scene;return url.searchParams.get('play')==='career'||url.searchParams.has('test')?'bay':'signature'}
/** Arrival: returns the carried career when this page is its exact intended target, otherwise undefined. Always consumes the envelope. */
export function readTransfer(profile:Profile,visitor:boolean):Career|undefined{
 try{if(!window.name.startsWith(TRANSFER_PREFIX))return;const transfer=JSON.parse(window.name.slice(TRANSFER_PREFIX.length));window.name=typeof transfer.previousName==='string'?transfer.previousName:'';
  if((transfer.profile===profile||profile==='career'&&transfer.profile===undefined)&&transfer.origin===location.origin&&transfer.target===transferTarget(new URL(location.href),visitor)&&[1,2,3,4].includes(transfer.state?.version))return migrateCareer(transfer.state);
 }catch{window.name=''}
}
/** Departure: carry this tab's non-durable career to one allowlisted same-origin page of the same profile. */
export function writeTransfer(url:string,profile:Profile,state:Career,visitor:boolean){
 const target=new URL(url,location.href);if(target.origin!==location.origin||profileFrom(target.search)!==profile||!(TRANSFER_SCENES as readonly string[]).includes(sceneOf(target)))return false;
 window.name=TRANSFER_PREFIX+JSON.stringify({profile,origin:location.origin,target:transferTarget(target,visitor),previousName:window.name,state});return true;
}
