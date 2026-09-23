import type {BuildRecipe} from '../signature/config';
import type {CueId} from './interface';
export const PART_CUE:Record<string,CueId>={'SM-133':'part.lights.attach','SM-3223':'part.shocks.attach','SM-7720':'part.exhaust.attach','SM-26801':'part.aero.attach','SM-28919':'part.storage.attach'};
/** A single cue for a successful validated transaction; caller owns persistence/apply. */
export function buildCue(before:BuildRecipe,after:BuildRecipe,preset=false):CueId|undefined{
 if(JSON.stringify(before)===JSON.stringify(after))return;
 if(preset)return 'build.preset';
 const rykerMap={underglow:'part.lights.attach',shocks:'part.shocks.attach',exhaust:'part.exhaust.attach',body:'part.aero.attach'} as const;
 const rykerAdded=(Object.keys(rykerMap) as (keyof typeof rykerMap)[]).filter(k=>after.ryker?.[k]&&!before.ryker?.[k]);
 if(rykerAdded.length>1)return 'build.preset';if(rykerAdded.length)return rykerMap[rykerAdded[0]];
 if((Object.keys(rykerMap) as (keyof typeof rykerMap)[]).some(k=>before.ryker?.[k]&&!after.ryker?.[k]))return 'part.remove';
 const added=Object.keys(after.products).filter(id=>!before.products[id as keyof typeof before.products]);
 if(added.length>1)return 'build.preset';
 if(added.length)return PART_CUE[added[0]];
 if(Object.keys(before.products).some(id=>!after.products[id as keyof typeof after.products]))return 'part.remove';
 if(before.finish!==after.finish)return 'finish.apply';
 return 'ui.detent';
}
/** Observes real phase edges; pause, repaint, failed finishes and late sound unlock do not replay. */
export class RaceCues {
 private prior='';private gate='';private attempt='';
 update(s:{phase:string;paused:boolean;countdown:number;playerResult?:{valid:boolean;status?:string}|null;result?:{valid?:boolean}|null;attemptId?:string;standings?:{id:string;lap:number;nextGate:number;valid:boolean}[]},play:(id:CueId)=>unknown){
  if(s.paused)return;const player=s.standings?.find(x=>x.id==='player'),gate=player?`${player.lap}:${player.nextGate}`:'';
  if((s.attemptId??'')!==this.attempt){this.attempt=s.attemptId??'';this.gate=gate;this.prior=''}
  if(s.phase==='running'&&player?.valid&&this.gate&&gate!==this.gate)play('race.checkpoint');this.gate=gate;
  const key=s.phase==='countdown'?'count-'+Math.ceil(s.countdown):s.phase;
  if(s.paused||key===this.prior)return;
  const previous=this.prior;this.prior=key;
  if(key.startsWith('count-'))play('race.count');
  else if(s.phase==='running'&&previous.startsWith('count-'))play('race.start');
  else if(s.phase==='finished'){if(s.playerResult?.valid||s.result?.valid)play('race.finish');else if(['invalid','dnf','unfinished'].includes(s.playerResult?.status??''))play('race.invalid')}
 }
}
