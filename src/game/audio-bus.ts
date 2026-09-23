import type {CueId} from '../audio/interface';
/**
 * One page-wide handle to the page's GameAudio, so the game shell (menus, transitions, HUD moments) can play cues
 * without each screen threading an audio reference through. GameAudio registers itself; before it exists, or before
 * sound is unlocked, cues are silently dropped exactly as GameAudio.cue already does.
 */
export interface AudioBus {cue(id:CueId,transactionKey?:string):boolean;unlock():Promise<void>}
let active:AudioBus|undefined;
export function registerGameAudio(bus:AudioBus){active=bus}
export function gameCue(id:CueId,transactionKey?:string){return active?.cue(id,transactionKey)??false}
export function unlockGameAudio(){return active?.unlock()??Promise.resolve()}
export function hasGameAudio(){return !!active}
