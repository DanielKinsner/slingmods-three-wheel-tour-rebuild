import type {CareerClient} from '../career/client';
import type {BuildHooks} from '../career/build-ui';
import {BuildMenuInput} from '../career/menu';
import {COLORS} from '../career/catalog';
import {FINISHES,recipeFragment} from '../signature/config';
import {RYKER_PRODUCTS,type RykerPart} from '../signature/ryker-catalog';
import {RYKER_CREDITS,careerRecipe} from '../career-experience/model';
import type {DeviceSample} from '../driving/input';
import '../career/build.css';
/** The earned Ryker workshop uses the same serialized career transaction path as other purchases. */
export class RykerWorkshop {
 readonly root=document.createElement('section');private opened=false;private pending=false;private status='';private unsubscribe:()=>void;private menu:BuildMenuInput;
 constructor(private client:CareerClient,private hooks:BuildHooks){
  this.root.id='build-panel';this.root.className='ryker-workshop';this.root.hidden=true;this.root.setAttribute('aria-label','Ryker career workshop');document.querySelector('#app')!.append(this.root);this.menu=new BuildMenuInput(this.root,()=>this.close());this.unsubscribe=client.subscribe(()=>this.update());
  this.root.addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;void this.act(b.dataset.action!,b.dataset.value)});this.update();
 }
 private async act(action:string,value?:string){if(this.pending||this.client.stale)return;if(action==='close'){this.close();return}if(action==='inspect'){this.hooks.inspectPart?.(value!);return}const s=this.client.state,r=careerRecipe(s);this.pending=true;this.update();try{
  if(action==='buy')await this.client.execute({type:'chapter-ryker-purchase',id:crypto.randomUUID(),part:value as RykerPart});
  else if(action==='equip')await this.client.execute({type:'chapter-ryker-equip',part:value as RykerPart,equipped:!r.ryker?.[value as RykerPart]});
  else if(action==='finish')await this.client.execute({type:'chapter-ryker-style',finish:value as typeof r.finish});
  else if(action==='color')await this.client.execute({type:'chapter-ryker-style',lights:{...r.lights,color:value as typeof r.lights.color,enabled:true}});
  this.status='Saved to your career';this.hooks.cue?.(action==='buy'?'build.save':'ui.detent');
 }catch(e){this.status=(e as Error).message}finally{this.pending=false;this.update()}}
 update(){const s=this.client.state,r=careerRecipe(s),owned=s.ownBuild.ryker?.owned??[];const disabled=this.pending||this.client.stale?'disabled':'';
  this.root.innerHTML=`<div class="build-heading"><span>YOUR RYKER / CAREER WORKSHOP</span><button data-action="close" ${disabled}>Done</button></div><h2>Make it yours.</h2><div class="wallet"><strong>${s.credits}</strong> <span>game credits</span></div><p class="ryker-workshop-intro">900 ACE · CVT · rear-wheel drive<br>Stock is ready for every chapter.</p><div class="ryker-career-paints" aria-label="Career paint">${FINISHES.map(f=>`<button data-action="finish" data-value="${f.id}" aria-pressed="${r.finish===f.id}" style="--paint:${f.id==='blue-orange'?'#ef2e1b':f.color}" ${disabled}>${f.id==='blue-orange'?'Adrenaline Red':f.name.split(' / ')[0]}</button>`).join('')}</div><div class="ryker-career-parts">${RYKER_PRODUCTS.map(p=>{const has=owned.includes(p.id),on=!!r.ryker?.[p.id];return `<article class="product-card"><span class="part-number">${p.brand} / ${p.sku}</span><h3>${p.name}</h3><p>${p.option}</p><small>${has?on?'Installed · owned':'Removed · still owned':`${RYKER_CREDITS[p.id]} game credits`}</small><button data-action="${has?'equip':'buy'}" data-value="${p.id}" ${disabled||(!has&&s.credits<RYKER_CREDITS[p.id]?'disabled':'')}>${has?on?'Remove':'Install':`Buy & install · ${RYKER_CREDITS[p.id]}`}</button><button data-action="inspect" data-value="${p.id}" ${disabled}>Inspect fitting area</button><details><summary>Fitment & details</summary><p>${p.fit}</p><p>${p.description}</p><a href="${p.url}" target="_blank" rel="noopener noreferrer">View product ↗</a></details></article>`}).join('')}</div>${owned.includes('underglow')?`<div class="ryker-career-colors">${Object.keys(COLORS).map(c=>`<button data-action="color" data-value="${c}" ${disabled}>${c}</button>`).join('')}</div>`:''}<p role="status">${this.status}</p><a href="?scene=signature&screen=build&visual=ryker&from=bay${recipeFragment(r)}">Try any part in free preview ↗</a><p><small>Preview parts never become career purchases. All credits are earned in game.</small></p>`;
 }
 open(){this.opened=true;this.root.hidden=false;document.body.classList.add('build-open');this.hooks.open(true);this.menu.reset();this.update()}
 close(){if(this.pending)return;this.opened=false;this.root.hidden=true;document.body.classList.remove('build-open');this.hooks.open(false)}
 frame(sample:DeviceSample){if(this.opened)this.menu.frame(sample)}
 inspect(){return {open:this.opened,pending:this.pending,career:this.client.state,durable:this.client.durable,vehicle:'can-am-ryker-900'}}
 dispose(){this.unsubscribe();this.root.remove()}
}
