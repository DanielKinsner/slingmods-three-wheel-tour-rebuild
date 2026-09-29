import type {CrewRace} from '../competition/race';
import type {VehicleTelemetry} from '../simulation';
import {projectRoad} from '../course/environment';
import {RALLY_ROUTE,RALLY_SECTORS} from './route';
import {RallyScore,readRallyRecord,saveRallyRecord} from './score';
import {raceTime} from '../harbor-ui';
import {gameCue} from '../game/audio-bus';
import './rally.css';

export class RallyRun {
  readonly score=new RallyScore();private hud=document.createElement('aside');private recorded=false;private saved=false;private improved=false;private lastMenu:Element|null=null;
  constructor(private parent:HTMLElement,private build:string,private practice:boolean){
    document.body.classList.add('rally-mode');this.hud.className='rally-hud';this.hud.innerHTML='<small>REDSTONE / RYKER RALLY</small><strong data-rally="sector"></strong><span data-rally="note"></span><div><b data-rally="score">0</b><small>DRIFT SCORE</small><em data-rally="chain">Link the corners</em></div>';parent.append(this.hud);
    const timer=parent.querySelector('.race-timing > span'),lap=parent.querySelector('.race-laps > span');if(timer)timer.textContent='STAGE TIME';if(lap)lap.textContent='STAGE';
  }
  reset(){this.score.reset();this.recorded=false;this.saved=false;this.improved=false;this.lastMenu=null;}
  tick(t:VehicleTelemetry,s:ReturnType<CrewRace['snapshot']>,dt:number){this.score.tick(t,s,dt);}
  frame(t:VehicleTelemetry,s:ReturnType<CrewRace['snapshot']>){
    const progress=projectRoad(RALLY_ROUTE,t.position.x,t.position.z).progress/RALLY_ROUTE.length,sector=[...RALLY_SECTORS].reverse().find(x=>progress>=x.at)??RALLY_SECTORS[0];
    this.set('sector',sector.name);this.set('note',sector.note);this.set('score',Math.round(this.score.score).toLocaleString('en-US'));this.set('chain',this.score.active?`${this.score.chain.toFixed(1)}s linked slide`:'Space / controller X · rotate, then release');this.hud.classList.toggle('is-sliding',this.score.active);this.hud.hidden=s.paused||s.phase==='ready'||!!s.playerResult;
    const result=s.playerResult;
    if(result&&!this.recorded){this.recorded=true;if(result.valid&&!this.practice){const before=readRallyRecord(this.build);this.saved=saveRallyRecord(this.build,result.timeMs!,this.score.score);this.improved=this.saved&&(!before||result.timeMs!<before.timeMs||Math.round(this.score.score)>before.drift);if(this.improved)gameCue('gx.record');}}
    const menu=this.parent.querySelector('#race-menu'),heading=menu?.querySelector('h1');if(!menu||!heading||heading===this.lastMenu)return;this.lastMenu=heading;
    const label=menu.querySelector('.race-label');if(label)label.textContent='RYKER EXCLUSIVE / REDSTONE RALLY';
    const button=menu.querySelector('#start-crew');if(button&&!s.paused)button.textContent=result?'Run it again':this.practice?'Explore the stage':'Start Rally';
    if(s.paused)return;
    if(result){heading.textContent=result.valid?'Stage complete':'Stage incomplete';const p=menu.querySelector('h1 + p');if(p){p.replaceChildren();const clock=document.createElement('strong');clock.className='result-time';clock.textContent=result.valid?raceTime(result.timeMs!):'Run not recorded';const detail=document.createElement('small');detail.textContent=result.valid?`${Math.round(this.score.score).toLocaleString('en-US')} drift points · ${this.score.slideSeconds.toFixed(1)}s sliding · best chain ${this.score.bestChain.toFixed(1)}s. ${this.improved?'New personal best saved.':this.saved?'Run saved to your local records.':'Record could not be saved on this device.'}`:result.invalidReason??'Complete every checkpoint in order.';p.append(clock,detail);}}
    else {heading.textContent=this.practice?'Redstone / Recce':'Redstone Rally';const p=menu.querySelector('h1 + p');if(p)p.textContent=`${(RALLY_ROUTE.length/1000).toFixed(2)} km of dirt, quarry hairpins and forest esses. Brake before the flags. Hold Space / controller X to rotate; release and countersteer on exit. ${this.practice?'Explore freely.':'One timed lap. Stay between the course flags; link slides for a separate drift score.'}`;
      const best=readRallyRecord(this.build);if(best){const record=document.createElement('p');record.className='rally-record';record.textContent=`PERSONAL BEST  ${raceTime(best.timeMs)}  /  ${best.drift.toLocaleString('en-US')} drift points`;p?.after(record);}}
  }
  private set(key:string,text:string){const e=this.hud.querySelector(`[data-rally="${key}"]`);if(e&&e.textContent!==text)e.textContent=text;}
  inspect(){return {practice:this.practice,score:Math.round(this.score.score),slideSeconds:this.score.slideSeconds,chain:this.score.chain,recorded:this.recorded,saved:this.saved,improved:this.improved,best:readRallyRecord(this.build)};}
  dispose(){this.hud.remove();document.body.classList.remove('rally-mode');}
}
