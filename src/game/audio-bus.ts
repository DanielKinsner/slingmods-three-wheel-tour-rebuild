import type {CueId} from '../audio/interface';
/**
 * One page-wide handle to the page's GameAudio, so the game shell (menus, transitions, HUD moments) can play cues
 * without each screen threading an audio reference through. GameAudio registers itself; before it exists, or before
 * sound is unlocked, cues are silently dropped exactly as GameAudio.cue already does.
 */
export interface AudioBus {cue(id:CueId,transactionKey?:string):boolean;unlock():Promise<void>}
let active:AudioBus|undefined;
export function registerGameAudio(bus:AudioBus){active=bus;armGestureUnlock()}
/**
 * Browsers keep audio suspended on every new page until a user gesture. When the player already turned sound on in
 * this tab, the first key or click on the new page resumes it, so they never meet "Enable sound" twice.
 */
let armed=false;
function armGestureUnlock(){
 if(armed||typeof addEventListener!=='function')return;let enabled=false;try{enabled=sessionStorage.getItem('slingmods-sound-activated')==='1'}catch{}
 if(!enabled)return;armed=true;
 const go=(e:Event)=>{if(!e.isTrusted)return;removeEventListener('keydown',go,true);removeEventListener('pointerdown',go,true);void active?.unlock()};
 addEventListener('keydown',go,true);addEventListener('pointerdown',go,true);
}
export function gameCue(id:CueId,transactionKey?:string){return active?.cue(id,transactionKey)??false}
export function unlockGameAudio(){return active?.unlock()??Promise.resolve()}
export function hasGameAudio(){return !!active}
