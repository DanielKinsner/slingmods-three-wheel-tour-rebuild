import {RykerWorkshop} from './ryker-workshop';
import {setCareerSource} from '../game/options';
import {announceAchievements} from '../game/toast';
import './garage.css';
import '../game/menu.css';
import {ChapterUI} from '../career/chapter-ui';
import {BuildUI} from '../career/build-ui';
import {careerClient,type CareerClient} from '../career/client';
import {mountHarborEntry} from '../harbor-entry';
import {gameHeader} from '../signature/header';
import {tourProgress} from '../game/progress';
import {setPrompts} from '../game/shell';
import {nextCareerStep,careerStepHref,careerRecipe} from '../career-experience/model';
import {FINISHES,driveTuneLabel,recipeFragment} from '../signature/config';
import {VEHICLE_MODEL_LABEL} from '../presentation/vehicle-asset';
import type {SignatureState} from '../signature/ui';
import type {SafeRegion} from '../presentation/safe-camera';
import type {DeviceSample} from '../driving/input';
import type {Appearance} from '../career/catalog';
import type {CueId} from '../audio/interface';
export {careerClient};
/** What the career garage asks of the shared showroom stage. Presentation only; every purchase goes through the career client. */
export interface GarageStage {
 view(name:string):void;
 saveCamera():unknown;restoreCamera(snapshot:unknown):void;
 lighting(look:'studio'|'lights'):void;driver(visible:boolean):void;
 appearance(equipped:boolean,appearance:Appearance):void;suspension(equipped:boolean):void;
 cue(id:CueId,key?:string):void;layout():void;
}
const esc=(v:unknown)=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/**
 * Career mode for the one showroom: Chapter 01, the earned-build workshop and the shakedown card on the same room,
 * vehicle presentation and camera controller as the free showroom. Mode changes labels, permissions and transactions only.
 */
export class GarageUI {
 readonly root=document.createElement('section');readonly chapter:ChapterUI;readonly build:BuildUI|RykerWorkshop;private entry:HTMLElement;private state!:SignatureState;private key='';private workshopCamera:unknown;
 constructor(private app:HTMLElement,private career:CareerClient,private stage:GarageStage){
  this.root.className='signature-ui garage-ui';this.root.id='garage-ui';this.root.setAttribute('aria-label','Career garage');this.root.dataset.screen='garage';app.append(this.root);
  this.entry=mountHarborEntry();this.entry.hidden=true;
  const Workshop=career.state.ownBuild.vehicle==='can-am-ryker-900'?RykerWorkshop:BuildUI;this.build=new Workshop(career,{inspectPart:part=>stage.view('ryker-'+part),cue:(id,key)=>stage.cue(id,key),suspension:equipped=>stage.suspension(equipped),
   inspectHardware:rear=>stage.view(rear===null?'workshop':rear?'SM-3223-rear':'SM-3223-front'),
   // Restore the exact prior view once the workshop layout is gone; fitting belongs to opening only.
   open:opened=>{this.chapter?.setVisible(!opened);this.entry.hidden=true;if(opened){this.workshopCamera=stage.saveCamera();stage.view('workshop')}else if(this.workshopCamera!==undefined){const saved=this.workshopCamera;this.workshopCamera=undefined;stage.restoreCamera(saved)}stage.layout()},
   previewNight:enabled=>stage.lighting(enabled?'lights':'studio'),appearance:(equipped,appearance)=>stage.appearance(equipped,appearance)});
  this.chapter=new ChapterUI(career,{build:()=>this.build.open(),shakedown:()=>{this.chapter.setVisible(false);this.entry.hidden=false;this.entry.querySelector<HTMLAnchorElement>('#start-shakedown')?.focus();stage.layout()},race:()=>career.navigate('?scene=crew'),duel:()=>career.navigate('?scene=crew&event=duel')});
  const back=document.createElement('button');back.textContent='Back to chapter';back.onclick=()=>{this.entry.hidden=true;this.chapter.setVisible(true);stage.layout()};this.entry.append(back);
  this.root.addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLElement>('[data-action]');if(!b||!this.root.contains(b))return;void this.act(b.dataset.action!,b.dataset.value)});
 }
 /** Called once the stage has its first framing: a deep-linked workshop saves a real view to return to. */
 ready(){const query=new URLSearchParams(location.search);if(query.get('shop')==='build'||query.get('view')==='build')this.build.open()}
 private freeShowroom(screen:'build'|'events'|'shop'){return `?scene=signature&screen=${screen}&from=bay${recipeFragment(careerRecipe(this.career.state))}`}
 private act(action:string,value?:string){
  if(action==='home'){this.stage.cue('ui.back');this.career.navigate(location.pathname);return}
  if(action==='build'||action==='quick-race'||action==='shop'){this.stage.cue('ui.nav');this.career.navigate(this.freeShowroom(action==='quick-race'?'events':action));return}
  if(action==='career'){const step=nextCareerStep(this.career.state);if(step.scene==='career'&&this.career.profile==='career'){this.career.navigate(careerStepHref(step));return}this.entry.hidden=true;if(this.build.inspect().open)this.build.close();this.chapter.setVisible(true);this.chapter.root.querySelector<HTMLButtonElement>('#continue-chapter')?.focus();this.stage.layout();return}
  if(action==='view'){this.stage.cue('ui.nav');this.stage.view(value??'hero');return}
  if(action==='lighting'){this.stage.lighting(value==='lights'?'lights':'studio');return}
  if(action==='driver'){this.stage.driver(value==='true');return}
 }
 update(state:SignatureState){this.state=state;const s=this.career.state,finish=FINISHES.find(f=>f.id===careerRecipe(s).finish)?.name??'',key=JSON.stringify([state.view,state.viewManual,state.lighting,state.driverVisible,s.ownBuild.finish,s.revision,this.career.durable,this.career.profile]);if(key===this.key)return;this.key=key;
  const pressed=(v:string)=>String((state.view??'hero')===v&&!state.viewManual),step=nextCareerStep(s);
  setPrompts([{key:'confirm',label:'Select'},{key:'back',label:'Back'},{key:'tabs',label:'Tabs'},{key:'orbit',label:'Orbit'}]);setCareerSource(()=>this.career.state);announceAchievements(s);
  this.root.innerHTML=`${gameHeader({current:'career',career:{label:'Career',detail:step.detail,returning:false,returnLabel:'',progress:tourProgress(s)}})}
  <div class="sig-view-tools garage-view-tools" aria-label="Garage view"><p class="garage-identity"><strong>${esc(VEHICLE_MODEL_LABEL)} · ${esc(finish)}</strong><small>Your earned career build · ${esc(driveTuneLabel(careerRecipe(s).handlingProfile))} · ${this.career.profile==='demo'?'Prepared demo profile':this.career.durable?'Saved on this browser':'Temporary career · this tab only'}</small></p><div class="sig-camera-rail">${[['hero','Full vehicle'],['front','Front'],['rear','Rear'],['interior','Interior'],['tour-wall','Tour Wall'],['route-relief','Route relief']].map(([v,l])=>`<button data-action="view" data-value="${v}" aria-pressed="${pressed(v)}">${l}</button>`).join('')}<button data-action="lighting" data-value="${state.lighting==='lights'?'studio':'lights'}" aria-pressed="${state.lighting==='lights'}">Lights</button><button data-action="driver" data-value="${!state.driverVisible}" aria-pressed="${!!state.driverVisible}">Driver</button></div></div>`;
 }
 frame(sample:DeviceSample){this.build.frame(sample);this.chapter.frame(sample)}
 /** Unobstructed canvas rectangle: right of whichever career panel is open, above the camera rail. */
 safeRegion():SafeRegion{const root=this.app.getBoundingClientRect();let left=16,top=96,right=root.width-24,bottom=root.height-32;for(const selector of ['#chapter-panel','#build-panel','#harbor-entry']){const node=document.querySelector<HTMLElement>(selector);if(!node||node.hidden||!node.getClientRects().length||getComputedStyle(node).display==='none')continue;const r=node.getBoundingClientRect();if(root.width>760)left=Math.max(left,r.right-root.left+24)}const rail=this.root.querySelector<HTMLElement>('.garage-view-tools .sig-camera-rail');if(rail)bottom=Math.min(bottom,rail.getBoundingClientRect().top-root.top-12);return {left,top,right:Math.max(left+160,right),bottom:Math.max(top+160,bottom)}}
 inspect(){return {mode:'career-garage',view:this.state?.view,viewManual:!!this.state?.viewManual,chapter:this.chapter.inspect(),build:this.build.inspect(),entryVisible:!this.entry.hidden}}
 dispose(){this.chapter.dispose();this.build.dispose();this.entry.remove();this.root.remove()}
}
