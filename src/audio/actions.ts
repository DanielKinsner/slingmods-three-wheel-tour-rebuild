import type {BuildRecipe} from '../signature/config';
import type {CueId} from './interface';
export const PART_CUE:Record<string,CueId>={'SM-133':'part.lights.attach','SM-3223':'part.shocks.attach','SM-7720':'part.exhaust.attach','SM-26801':'part.aero.attach','SM-28919':'part.storage.attach'};
/** A single cue for a successful validated transaction; caller owns persistence/apply. */
export function buildCue(before:BuildRecipe,after:BuildRecipe,preset=false):CueId|undefined{
 if(JSON.stringify(before)===JSON.stringify(after))return;
 if(preset)return 'build.preset';
 const added=Object.keys(after.products).filter(id=>!before.products[id as keyof typeof before.products]);
 if(added.length>1)return 'build.preset';
 if(added.length)return PART_CUE[added[0]];
 if(Object.keys(before.products).some(id=>!after.products[id as keyof typeof after.products]))return 'part.remove';
 if(before.finish!==after.finish)return 'finish.apply';
 return 'ui.detent';
}
/** Observes real phase edges; pause, repaint, failed finishes and late sound unlock do not replay. */
export class RaceCues {
 private prior='';
 update(s:{phase:string;paused:boolean;countdown:number;playerResult?:{valid:boolean}|null;result?:{valid?:boolean}|null},play:(id:CueId)=>unknown){
  const key=s.phase==='countdown'?'count-'+Math.ceil(s.countdown):s.phase;
  if(s.paused||key===this.prior)return;
  const previous=this.prior;this.prior=key;
  if(key.startsWith('count-'))play('race.count');
  else if(s.phase==='running'&&previous.startsWith('count-'))play('race.start');
  else if(s.phase==='finished'&&(s.playerResult?.valid||s.result?.valid))play('race.finish');
 }
}
