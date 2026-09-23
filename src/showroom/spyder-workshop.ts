import type {CareerClient} from '../career/client';
import type {BuildHooks} from '../career/build-ui';
import {BuildMenuInput} from '../career/menu';
import {COLORS} from '../career/catalog';
import {FINISHES,recipeFragment} from '../signature/config';
import {SPYDER_PRODUCTS,SPYDER_FIT,type SpyderPart} from '../signature/spyder-catalog';
import {spyderControls,changeSpyder} from '../signature/spyder-controls';
import {careerRecipe} from '../career-experience/model';
import type {DeviceSample} from '../driving/input';
export class SpyderWorkshop {
 readonly root=document.createElement('section');private opened=false;private pending=false;private status='';private unsubscribe:()=>void;private menu:BuildMenuInput;
 constructor(private client:CareerClient,private hooks:BuildHooks){this.root.id='build-panel';this.root.className='ryker-workshop';this.root.hidden=true;this.root.setAttribute('aria-label','Spyder career workshop');document.querySelector('#app')!.append(this.root);this.menu=new BuildMenuInput(this.root,()=>this.close());this.unsubscribe=client.subscribe(()=>this.update());this.root.addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLButtonElement>('button');if(b&&!b.disabled)void this.act(b.dataset.action!,b.dataset.value)});this.update()}
 private async act(action:string,value=''){if(this.pending||this.client.stale)return;if(action==='close'){this.close();return}if(action==='inspect'){this.hooks.inspectPart?.(value);return}const r=careerRecipe(this.client.state);this.pending=true;this.update();try{
 if(action==='buy')await this.client.execute({type:'chapter-spyder-purchase',id:crypto.randomUUID(),part:value as SpyderPart});
 else if(action==='equip')await this.client.execute({type:'chapter-spyder-equip',part:value as SpyderPart,equipped:!r.spyder?.parts[value as SpyderPart]});
 else if(action==='finish')await this.client.execute({type:'chapter-spyder-style',finish:value as typeof r.finish});
 else if(action==='color')await this.client.execute({type:'chapter-spyder-style',lights:{...r.lights,color:value as typeof r.lights.color,enabled:true}});
 else if(action==='lights')await this.client.execute({type:'chapter-spyder-style',lights:{...r.lights,enabled:!r.lights.enabled}});
 else if(action.startsWith('spyder-'))await this.client.execute({type:'chapter-spyder-style',settings:changeSpyder(r.spyder!,action,value)});
 this.status='Saved to your career';this.hooks.cue?.(action==='buy'?'build.save':'ui.detent');
 }catch(e){this.status=(e as Error).message}finally{this.pending=false;this.update()}}
 update(){const s=this.client.state,r=careerRecipe(s),owned=s.ownBuild.spyder?.owned??[],disabled=this.pending||this.client.stale?'disabled':'';this.root.innerHTML=`<div class="build-heading"><span>YOUR SPYDER / CAREER WORKSHOP</span><button data-action="close" ${disabled}>Done</button></div><h2>Make it yours.</h2><div class="wallet"><strong>${s.credits}</strong><span>game credits</span></div><p class="ryker-workshop-intro">1330 inline-three · 6-speed / reverse<br>Auto-shift game assist · stock is ready to ride</p><div class="ryker-career-paints">${FINISHES.map(f=>`<button data-action="finish" data-value="${f.id}" aria-pressed="${r.finish===f.id}" ${disabled}>${f.id==='blue-orange'?'Custom orange / white':f.name}</button>`).join('')}</div><div class="ryker-career-parts">${SPYDER_PRODUCTS.map(p=>{const has=owned.includes(p.id),on=!!r.spyder?.parts[p.id];return `<article class="product-card"><span class="part-number">${p.brand} / ${p.sku}</span><h3>${p.name}</h3><p>${p.option}</p><button data-action="${has?'equip':'buy'}" data-value="${p.id}" ${disabled||(!has&&s.credits<p.credits?'disabled':'')}>${has?on?'Remove':'Install':`Buy & install · ${p.credits} CR`}</button><button data-action="inspect" data-value="${p.id}">Inspect mount</button>${on?spyderControls(p.id,r.spyder!):''}<details><summary>Fitment & details</summary><p>${SPYDER_FIT}</p><p>${p.description}</p><a href="${p.url}" target="_blank" rel="noopener noreferrer">View product ↗</a></details></article>`}).join('')}</div>${owned.includes('underglow')||owned.includes('wheels')?`<div class="ryker-career-colors">${Object.keys(COLORS).map(c=>`<button data-action="color" data-value="${c}" ${disabled}>${c}</button>`).join('')}<button data-action="lights">${r.lights.enabled?'Lights off':'Lights on'}</button></div>`:''}<p role="status">${this.status}</p><a href="?scene=signature&screen=build&visual=spyder&from=bay${recipeFragment(r)}">Try any part in free preview ↗</a>`;if(disabled)for(const b of this.root.querySelectorAll('button'))b.disabled=true}
 open(){this.opened=true;this.root.hidden=false;document.body.classList.add('build-open');this.hooks.open(true);this.menu.reset();this.update()}
 close(){if(this.pending)return;this.opened=false;this.root.hidden=true;document.body.classList.remove('build-open');this.hooks.open(false)}
 frame(sample:DeviceSample){if(this.opened)this.menu.frame(sample)}
 inspect(){return {open:this.opened,pending:this.pending,career:this.client.state,durable:this.client.durable,vehicle:'can-am-spyder-f3'}}
 dispose(){this.unsubscribe();this.root.remove()}
}
