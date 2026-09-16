import {CURRENT_HANDLING_PROFILE} from '../simulation/profile';
import {SIGNATURE_ACCENTS} from '../presentation/signature-palette';
import {COLORS,defaultAppearance,type Appearance} from '../career/catalog';
import {streetSetup,validSetup,type SuspensionSetup} from '../career/suspension';
import {PRODUCTS,productById,fits,type ProductId} from './catalog';
export type FinishId='blue-orange'|'black-red'|'white-graphite'|'graphite-red';
export const FINISHES:readonly {id:FinishId;name:string;color:string;accent:string}[]=[{id:'blue-orange',name:'Radar blue / orange',color:'#176aac',accent:SIGNATURE_ACCENTS['blue-orange']},{id:'black-red',name:'Gloss black / red',color:'#151719',accent:SIGNATURE_ACCENTS['black-red']},{id:'white-graphite',name:'Pearl white / graphite',color:'#e8e8e1',accent:SIGNATURE_ACCENTS['white-graphite']},{id:'graphite-red',name:'Satin graphite / red',color:'#56595e',accent:SIGNATURE_ACCENTS['graphite-red']}];
export interface BuildRecipe {version:1;vehicleId:'slingshot-r-2024';finish:FinishId;products:Partial<Record<ProductId,string>>;lights:Appearance;suspension:SuspensionSetup;handlingProfile:'slingmods-sport-v1'|'slingmods-sport-v2'|'slingmods-sport-v3'}
export const freshRecipe=():BuildRecipe=>({version:1,vehicleId:'slingshot-r-2024',finish:'blue-orange',products:{},lights:defaultAppearance(),suspension:streetSetup(),handlingProfile:CURRENT_HANDLING_PROFILE});
export function validateRecipe(raw:unknown):BuildRecipe {
 const r=raw as BuildRecipe;
 if(!r||r.version!==1||r.vehicleId!=='slingshot-r-2024'||!['slingmods-sport-v1','slingmods-sport-v2','slingmods-sport-v3'].includes(r.handlingProfile)||!FINISHES.some(f=>f.id===r.finish)||!validSetup(r.suspension)||!r.products||typeof r.products!=='object'||Array.isArray(r.products)||!r.lights||!Object.hasOwn(COLORS,r.lights.color)||typeof r.lights.enabled!=='boolean'||!Number.isFinite(r.lights.brightness)||r.lights.brightness<.15||r.lights.brightness>.85)throw Error('This build recipe needs recovery; saved data is unchanged.');
 for(const [id,option]of Object.entries(r.products)){const p=productById(id);if(!p||!p.options.some(o=>o.id===option)||!fits(p,r).ok)throw Error('Build contains an unsupported product, option or fitment.');}
 return structuredClone(r);
}
export const driveTuneLabel=(id:BuildRecipe['handlingProfile'])=>id===CURRENT_HANDLING_PROFILE?'Sport v3 · current':id==='slingmods-sport-v2'?'Sport v2 · historical':'Sport v1 · historical';
/** Product-only comparison: never changes the chosen driving equations. */
export function stockRecipe(recipe:BuildRecipe):BuildRecipe{return {...validateRecipe(recipe),products:{},suspension:streetSetup()}}
export function currentDrivingCopy(recipe:BuildRecipe):BuildRecipe{return {...validateRecipe(recipe),handlingProfile:CURRENT_HANDLING_PROFILE}}
function preset(finish:FinishId,ids:ProductId[],color:Appearance['color']='red'):BuildRecipe{const r=freshRecipe();r.finish=finish;r.lights.color=color;for(const id of ids)r.products[id]=productById(id)!.option;return r}
export const PRESETS=[{id:'night-show',name:'Night Show',recipe:preset('black-red',['SM-133','SM-26801'],'red')},{id:'harbor-sport',name:'Harbor Sport',recipe:preset('graphite-red',['SM-3223','SM-7720','SM-26801'])},{id:'weekend-tour',name:'Weekend Tour',recipe:preset('white-graphite',['SM-3223','SM-28919'])}];
export const BUILD_KEY='slingmods-signature-builds-v1',DRAFT_KEY='slingmods-signature-draft-v1',DRIVE_KEY='slingmods-signature-drive-v1';
export interface SavedRecipe {id:string;name:string;recipe:BuildRecipe}
export interface DriveSnapshot {version:1;scope:'preview';recipe:BuildRecipe;route:'express'|'harbor';mode:'test'|'race';returnTo:string}
export function buildSummary(r:BuildRecipe){return ['SlingMods: Three-Wheel Tour — Game build',FINISHES.find(f=>f.id===r.finish)!.name,'2024 Slingshot R · '+r.handlingProfile,...PRODUCTS.filter(p=>r.products[p.id]).map(p=>`${p.brand} ${p.name} / ${p.options.find(o=>o.id===r.products[p.id])!.label}\n${p.shopUrl}`),'Free game preview. No retail bundle, purchase or performance claim.'].join('\n\n')}
/** Explicit showroom scope. Career IndexedDB and its keys are never opened here. */
export class BuildRepository {
 constructor(private durable:Pick<Storage,'getItem'|'setItem'>,private session:Pick<Storage,'getItem'|'setItem'>){}
 recipes():SavedRecipe[]{const raw=this.durable.getItem(BUILD_KEY);if(!raw)return [];const list=JSON.parse(raw);if(!Array.isArray(list)||list.length>24)throw Error('Saved builds need recovery; original data is retained.');return list.map(v=>{if(typeof v.id!=='string'||typeof v.name!=='string'||v.name.length>48)throw Error('Saved build name is invalid.');return{id:v.id,name:v.name,recipe:validateRecipe(v.recipe)}})}
 save(name:string,recipe:BuildRecipe){name=name.trim().slice(0,48);if(!name)throw Error('Give your build a name.');const list=this.recipes(),existing=list.find(r=>r.name===name),entry={id:existing?.id??crypto.randomUUID(),name,recipe:validateRecipe(recipe)},next=list.filter(r=>r.id!==entry.id);if(next.length>=24)throw Error('24 saved builds reached. Reuse an existing name to replace that recipe.');next.push(entry);this.durable.setItem(BUILD_KEY,JSON.stringify(next));return entry}
 /** Preserve an unsaved reference too; adding a current copy never replaces a named recipe. */
 useCurrentDriving(recipe:BuildRecipe){const original=validateRecipe(recipe),next=currentDrivingCopy(original);if(original.handlingProfile===CURRENT_HANDLING_PROFILE)return next;const list=this.recipes();if(!list.some(r=>JSON.stringify(r.recipe)===JSON.stringify(original))){if(list.length>=24)throw Error('Keep room for the historical build before making an updated copy.');const name='Historical '+original.handlingProfile.replace('slingmods-sport-','')+' '+crypto.randomUUID().slice(0,8);this.save(name,original)}this.setDraft(next);return next}
 draft(){const raw=this.session.getItem(DRAFT_KEY);return raw?validateRecipe(JSON.parse(raw)):freshRecipe()}
 setDraft(recipe:BuildRecipe){this.session.setItem(DRAFT_KEY,JSON.stringify(validateRecipe(recipe)))}
 beginDrive(recipe:BuildRecipe,route:DriveSnapshot['route'],mode:DriveSnapshot['mode']){const snapshot:DriveSnapshot={version:1,scope:'preview',recipe:validateRecipe(recipe),route,mode,returnTo:'?scene=signature&screen=build'};this.session.setItem(DRIVE_KEY,JSON.stringify(snapshot));return snapshot}
 drive(route:DriveSnapshot['route']='express',mode:DriveSnapshot['mode']='test'):DriveSnapshot{const raw=this.session.getItem(DRIVE_KEY);if(!raw)return previewSnapshot(freshRecipe(),route,mode);const s=JSON.parse(raw);if(s.version!==1||s.scope!=='preview'||!['express','harbor'].includes(s.route)||!['test','race'].includes(s.mode)||s.returnTo!=='?scene=signature&screen=build')throw Error('Preview drive snapshot is invalid. Return to the showroom.');return {...s,recipe:validateRecipe(s.recipe)}}
}
const temporary=new Map<string,string>();
export function buildRepository(){const fallback={getItem:(k:string)=>temporary.get(k)??null,setItem:(k:string,v:string)=>{temporary.set(k,v)}};let durable:Pick<Storage,'getItem'|'setItem'>=fallback,session:Pick<Storage,'getItem'|'setItem'>=fallback,temporaryMode=false;try{durable=localStorage;durable.getItem(BUILD_KEY)}catch{durable=fallback;temporaryMode=true}try{const candidate=sessionStorage,key='slingmods-signature-probe-'+crypto.randomUUID();candidate.setItem(key,'1');candidate.removeItem(key);session=candidate}catch{temporaryMode=true}return {store:new BuildRepository(durable,session),temporary:temporaryMode}}
/** URL fragment stays local to this browser: it is not sent to the server or retail links. */
export function recipeFragment(recipe:BuildRecipe){return '#build='+encodeURIComponent(JSON.stringify(validateRecipe(recipe)))}
export function fragmentRecipe(hash:string){const raw=new URLSearchParams(hash.replace(/^#/, '')).get('build');return raw?validateRecipe(JSON.parse(raw)):null}
export function previewSnapshot(recipe:BuildRecipe,route:'express'|'harbor',mode:'test'|'race'):DriveSnapshot{return {version:1,scope:'preview',recipe:validateRecipe(recipe),route,mode,returnTo:'?scene=signature&screen=build'}}
