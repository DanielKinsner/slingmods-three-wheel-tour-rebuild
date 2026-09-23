import {freshSpyderBuild,validSpyderBuild,SPYDER_PRODUCTS,type SpyderBuild} from './spyder-catalog';
import {validRykerBuild,RYKER_PRODUCTS,type RykerBuild} from './ryker-catalog';
import {VEHICLE_MODEL_LABEL,CURRENT_VEHICLE_CONTEXT} from '../presentation/vehicle-asset';
import {retailFitment} from './fitment';
import {CURRENT_HANDLING_PROFILE} from '../simulation/profile';
import {SIGNATURE_ACCENTS} from '../presentation/signature-palette';
import {COLORS,defaultAppearance,type Appearance} from '../career/catalog';
import {streetSetup,validSetup,type SuspensionSetup} from '../career/suspension';
import {PRODUCTS,productById,fits,type ProductId} from './catalog';
export type FinishId='blue-orange'|'black-red'|'white-graphite'|'graphite-red';
export const FINISHES:readonly {id:FinishId;name:string;color:string;accent:string}[]=[{id:'blue-orange',name:'Radar blue / orange',color:'#176aac',accent:SIGNATURE_ACCENTS['blue-orange']},{id:'black-red',name:'Gloss black / red',color:'#151719',accent:SIGNATURE_ACCENTS['black-red']},{id:'white-graphite',name:'Pearl white / graphite',color:'#e8e8e1',accent:SIGNATURE_ACCENTS['white-graphite']},{id:'graphite-red',name:'Satin graphite / red',color:'#56595e',accent:SIGNATURE_ACCENTS['graphite-red']}];
export interface BuildRecipe {spyder?:SpyderBuild;ryker?:RykerBuild;version:1|2|3;vehicleId:'slingshot-r-2024'|'can-am-ryker-900'|'can-am-spyder-f3';definitionId?:'ryker-900-v1'|'spyder-f3-v1';finish:FinishId;products:Partial<Record<ProductId,string>>;lights:Appearance;suspension:SuspensionSetup;handlingProfile:'slingmods-sport-v1'|'slingmods-sport-v2'|'slingmods-sport-v3'|'slingmods-sport-v4'|'slingmods-sport-v5'|'ryker-road-v1'|'spyder-f3-v1'}
export const freshRecipe=():BuildRecipe=>({version:1,vehicleId:'slingshot-r-2024',finish:'blue-orange',products:{},lights:defaultAppearance(),suspension:streetSetup(),handlingProfile:CURRENT_HANDLING_PROFILE});
export function validateRecipe(raw:unknown):BuildRecipe {
 const r=raw as BuildRecipe;
 if(!r||!((r.version===1&&r.handlingProfile!=='spyder-f3-v1'&&r.vehicleId==='slingshot-r-2024'&&r.handlingProfile!=='ryker-road-v1')||(r.version===2&&r.vehicleId==='can-am-ryker-900'&&r.definitionId==='ryker-900-v1'&&r.handlingProfile==='ryker-road-v1'&&Object.keys(r.products??{}).length===0)||(r.version===3&&r.vehicleId==='can-am-spyder-f3'&&r.definitionId==='spyder-f3-v1'&&r.handlingProfile==='spyder-f3-v1'&&Object.keys(r.products??{}).length===0&&validSpyderBuild(r.spyder)))||!['slingmods-sport-v1','slingmods-sport-v2','slingmods-sport-v3','slingmods-sport-v4','slingmods-sport-v5','ryker-road-v1','spyder-f3-v1'].includes(r.handlingProfile)||!FINISHES.some(f=>f.id===r.finish)||!validSetup(r.suspension)||!r.products||typeof r.products!=='object'||Array.isArray(r.products)||!r.lights||!Object.hasOwn(COLORS,r.lights.color)||typeof r.lights.enabled!=='boolean'||!Number.isFinite(r.lights.brightness)||r.lights.brightness<.15||r.lights.brightness>.85)throw Error('This build recipe needs recovery; saved data is unchanged.');
 for(const [id,option]of Object.entries(r.products)){const p=productById(id);if(!p||!p.options.some(o=>o.id===option)||!fits(p,r).ok)throw Error('Build contains an unsupported product, option or fitment.');}
 if(r.spyder!==undefined&&(r.vehicleId!=='can-am-spyder-f3'||!validSpyderBuild(r.spyder)))throw Error('Unsupported Spyder equipment');
 if(r.vehicleId==='can-am-spyder-f3'&&r.ryker!==undefined)throw Error('Ryker equipment cannot fit Spyder');
 if(r.ryker!==undefined&&!validRykerBuild(r.ryker))throw Error('Unsupported Ryker equipment.');
 return structuredClone(r);
}
export const freshSpyderRecipe=():BuildRecipe=>({...freshRecipe(),version:3,vehicleId:'can-am-spyder-f3',definitionId:'spyder-f3-v1',handlingProfile:'spyder-f3-v1',spyder:freshSpyderBuild()});
export const freshRykerRecipe=():BuildRecipe=>({...freshRecipe(),version:2,vehicleId:'can-am-ryker-900',definitionId:'ryker-900-v1',handlingProfile:'ryker-road-v1',ryker:{}});
/** Explicit migration only in the established Ryker namespace, never in old results. */
export function rykerRecipe(raw:BuildRecipe):BuildRecipe {const r=validateRecipe(raw);return validateRecipe({...r,version:2,vehicleId:'can-am-ryker-900',definitionId:'ryker-900-v1',handlingProfile:'ryker-road-v1',products:{},suspension:streetSetup(),ryker:r.ryker??{}})}
export const driveTuneLabel=(id:BuildRecipe['handlingProfile'])=>id==='spyder-f3-v1'?'Spyder F3 v1 · 6-speed · Auto shift assist':id==='ryker-road-v1'?'Ryker Road v1 · CVT':id===CURRENT_HANDLING_PROFILE?'Sport v5 · responsive':id==='slingmods-sport-v4'?'Sport v4 · forgiving reference':id==='slingmods-sport-v3'?'Sport v3 · historical':id==='slingmods-sport-v2'?'Sport v2 · historical':'Sport v1 · historical';
/** Product-only comparison: never changes the chosen driving equations. */
export function stockRecipe(recipe:BuildRecipe):BuildRecipe{return {...validateRecipe(recipe),products:{},...(recipe.spyder?{spyder:freshSpyderBuild()}:{}),...(recipe.ryker?{ryker:{}}:{}),suspension:streetSetup()}}
export function currentDrivingCopy(recipe:BuildRecipe):BuildRecipe{return {...validateRecipe(recipe),handlingProfile:recipe.vehicleId==='can-am-spyder-f3'?'spyder-f3-v1':recipe.vehicleId==='can-am-ryker-900'?'ryker-road-v1':CURRENT_HANDLING_PROFILE}}
function preset(finish:FinishId,ids:ProductId[],color:Appearance['color']='red'):BuildRecipe{const r=freshRecipe();r.finish=finish;r.lights.color=color;for(const id of ids)r.products[id]=productById(id)!.option;return r}
export const PRESETS=[{id:'night-show',name:'Night Show',recipe:preset('black-red',['SM-133','SM-26801'],'red')},{id:'harbor-sport',name:'Harbor Sport',recipe:preset('graphite-red',['SM-3223','SM-7720','SM-26801'])},{id:'weekend-tour',name:'Weekend Tour',recipe:preset('white-graphite',['SM-3223','SM-28919'])}];
export const BUILD_KEY='slingmods-signature-builds-v1',DRAFT_KEY='slingmods-signature-draft-v1',DRIVE_KEY='slingmods-signature-drive-v1';
export interface SavedRecipe {id:string;name:string;recipe:BuildRecipe}
export type DestinationId='express'|'harbor'|'ridge';
export type DestinationLighting='day'|'night';
export interface DriveSnapshot {version:1;scope:'preview';recipe:BuildRecipe;route:DestinationId;lighting?:DestinationLighting;mode:'test'|'race';returnTo:string}
export function buildSummary(r:BuildRecipe){
 if(r.vehicleId==='can-am-spyder-f3')return ['Can-Am Spyder F3 Custom — 2023 reference',...SPYDER_PRODUCTS.filter(p=>r.spyder?.parts[p.id]).map(p=>p.name+' / '+p.option+'\n'+p.url)].join('\n\n');
 if(r.vehicleId==='can-am-ryker-900')return ['Can-Am Ryker 900 — game preview',...RYKER_PRODUCTS.filter(p=>r.ryker?.[p.id]).map(p=>`${p.brand} ${p.name} (${p.sku})\n${p.fit}\n${p.url}`),'Reference-based game meshes. Verify your exact year/trim before purchasing.'].join('\n\n');
 const selected=PRODUCTS.filter(p=>r.products[p.id]),line=(p:typeof PRODUCTS[number])=>{const fit=retailFitment(p.id,CURRENT_VEHICLE_CONTEXT,r.products[p.id]);return `${p.brand} ${p.name} / ${p.options.find(o=>o.id===r.products[p.id])!.label}\n${fit.label}. ${fit.condition}\n${fit.linkLabel.replace(' ↗','')}: ${fit.source}`};
 return ['SlingMods: Three-Wheel Tour — Game build',FINISHES.find(f=>f.id===r.finish)!.name,VEHICLE_MODEL_LABEL+' · '+r.handlingProfile,'COMPATIBLE LISTINGS',...selected.filter(p=>retailFitment(p.id).compatible).map(line),'EXPERIMENTAL / REFERENCE ONLY',...selected.filter(p=>!retailFitment(p.id).compatible).map(line),'Free game preview. Listing support does not verify our modeled mounts. No retail bundle or purchase.'].join('\n\n');
}
/** Explicit showroom scope. Career IndexedDB and its keys are never opened here. */
export class BuildRepository {
 constructor(private durable:Pick<Storage,'getItem'|'setItem'>,private session:Pick<Storage,'getItem'|'setItem'>,private vehicle=CURRENT_VEHICLE_CONTEXT.visual==='spyder'?'spyder':CURRENT_VEHICLE_CONTEXT.visual==='ryker'?'ryker':'slingshot'){}
 private resolve(recipe:BuildRecipe){const r=validateRecipe(recipe);if(this.vehicle==='spyder'){if(r.vehicleId!=='can-am-spyder-f3')throw Error('Select the matching vehicle to load this build');return r}if(this.vehicle==='ryker')return rykerRecipe(r);if(r.vehicleId!=='slingshot-r-2024')throw Error('Switch to the Ryker to load this build.');return r}
 private fresh(){return this.vehicle==='spyder'?freshSpyderRecipe():this.vehicle==='ryker'?freshRykerRecipe():freshRecipe()}
 private key(key:string){return this.vehicle==='spyder'?key+'-spyder':this.vehicle==='ryker'?key+'-ryker':key}
 recipes():SavedRecipe[]{const raw=this.durable.getItem(this.key(BUILD_KEY));if(!raw)return [];const list=JSON.parse(raw);if(!Array.isArray(list)||list.length>24)throw Error('Saved builds need recovery; original data is retained.');return list.map(v=>{if(typeof v.id!=='string'||typeof v.name!=='string'||v.name.length>48)throw Error('Saved build name is invalid.');return{id:v.id,name:v.name,recipe:this.resolve(v.recipe)}})}
 save(name:string,recipe:BuildRecipe){name=name.trim().slice(0,48);if(!name)throw Error('Give your build a name.');const list=this.recipes(),existing=list.find(r=>r.name===name),entry={id:existing?.id??crypto.randomUUID(),name,recipe:this.resolve(recipe)},next=list.filter(r=>r.id!==entry.id);if(next.length>=24)throw Error('24 saved builds reached. Reuse an existing name to replace that recipe.');next.push(entry);this.durable.setItem(this.key(BUILD_KEY),JSON.stringify(next));return entry}
 /** Preserve an unsaved reference too; adding a current copy never replaces a named recipe. */
 useCurrentDriving(recipe:BuildRecipe){const original=validateRecipe(recipe),next=currentDrivingCopy(original);if(original.handlingProfile===CURRENT_HANDLING_PROFILE)return next;const list=this.recipes();if(!list.some(r=>JSON.stringify(r.recipe)===JSON.stringify(original))){if(list.length>=24)throw Error('Keep room for the historical build before making an updated copy.');const name='Historical '+original.handlingProfile.replace('slingmods-sport-','')+' '+crypto.randomUUID().slice(0,8);this.save(name,original)}this.setDraft(next);return next}
 draft(){const raw=this.session.getItem(this.key(DRAFT_KEY));return raw?this.resolve(JSON.parse(raw)):this.fresh()}
 setDraft(recipe:BuildRecipe){this.session.setItem(this.key(DRAFT_KEY),JSON.stringify(this.resolve(recipe)))}
 beginDrive(recipe:BuildRecipe,route:DriveSnapshot['route'],mode:DriveSnapshot['mode'],lighting:DestinationLighting='day'){const snapshot=previewSnapshot(this.resolve(recipe),route,mode,lighting);this.session.setItem(this.key(DRIVE_KEY),JSON.stringify(snapshot));return snapshot}
 drive(route:DriveSnapshot['route']='express',mode:DriveSnapshot['mode']='test'):DriveSnapshot{const raw=this.session.getItem(this.key(DRIVE_KEY));if(!raw)return previewSnapshot(this.fresh(),route,mode);const s=JSON.parse(raw);if(s.version!==1||s.scope!=='preview'||!['express','harbor','ridge'].includes(s.route)||(s.lighting!==undefined&&!['day','night'].includes(s.lighting))||!['test','race'].includes(s.mode)||s.returnTo!=='?scene=signature&screen=build')throw Error('Preview drive snapshot is invalid. Return to the showroom.');return freezeBuild({...s,recipe:currentDrivingCopy(this.resolve(s.recipe))})}
}
const temporary=new Map<string,string>();
export function buildRepository(){const fallback={getItem:(k:string)=>temporary.get(k)??null,setItem:(k:string,v:string)=>{temporary.set(k,v)}};let durable:Pick<Storage,'getItem'|'setItem'>=fallback,session:Pick<Storage,'getItem'|'setItem'>=fallback,temporaryMode=false;try{durable=localStorage;durable.getItem(BUILD_KEY)}catch{durable=fallback;temporaryMode=true}try{const candidate=sessionStorage,key='slingmods-signature-probe-'+crypto.randomUUID();candidate.setItem(key,'1');candidate.removeItem(key);session=candidate}catch{temporaryMode=true}return {store:new BuildRepository(durable,session),temporary:temporaryMode}}
/** URL fragment stays local to this browser: it is not sent to the server or retail links. */
export function recipeFragment(recipe:BuildRecipe){return '#build='+encodeURIComponent(JSON.stringify(validateRecipe(recipe)))}
export function fragmentRecipe(hash:string){const raw=new URLSearchParams(hash.replace(/^#/, '')).get('build');return raw?validateRecipe(JSON.parse(raw)):null}
export function previewSnapshot(recipe:BuildRecipe,route:DestinationId,mode:'test'|'race',lighting:DestinationLighting='day'):DriveSnapshot{if(!['express','harbor','ridge'].includes(route)||!['test','race'].includes(mode)||!['day','night'].includes(lighting))throw Error('Unsupported destination, mode or lighting');return freezeBuild({version:1,scope:'preview',recipe:currentDrivingCopy(recipe),route,mode,...(route==='ridge'?{lighting}:{}),returnTo:'?scene=signature&screen=build'})}

export function freezeBuild<T>(value:T):T {if(value&&typeof value==='object'){Object.values(value).forEach(freezeBuild);Object.freeze(value)}return value}
