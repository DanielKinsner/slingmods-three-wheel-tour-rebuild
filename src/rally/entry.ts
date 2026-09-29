import {freshRykerRecipe,validateRecipe,recipeFragment,type BuildRecipe} from '../signature/config';
/** Rally is a standalone event, never a saved road destination or career attempt. */
export function rallyRecipe(recipe:BuildRecipe|null):BuildRecipe{return recipe?.vehicleId==='can-am-ryker-900'?validateRecipe(recipe):freshRykerRecipe();}
export function rallyHref(recipe:BuildRecipe,practice=false){return `?scene=rally&visual=ryker&mode=${practice?'test':'race'}&play=preview${recipeFragment(rallyRecipe(recipe))}`;}
/** Session-only: the showroom build a rally was entered from. A supplied Ryker is for the event, so leaving returns the player's own vehicle. */
const ORIGIN_KEY='slingmods-rally-origin',PICK_KEY='slingmods-events-destination';
type Session=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const session=():Session|undefined=>{try{return sessionStorage}catch{return undefined}};
export function rememberRallyOrigin(recipe:BuildRecipe,storage=session()){try{if(recipe.vehicleId==='can-am-ryker-900')storage?.removeItem(ORIGIN_KEY);else storage?.setItem(ORIGIN_KEY,recipeFragment(validateRecipe(recipe)));}catch{/* denied storage: return with the event Ryker */}}
export function rallyReturnFragment(fallback:string,storage=session()){try{return storage?.getItem(ORIGIN_KEY)??fallback;}catch{return fallback;}}
/** The event card chosen this session. Road cards restore from the saved drive; rally deliberately has no saved drive. */
export function rememberDestination(id:string,storage=session()){try{storage?.setItem(PICK_KEY,id);}catch{/* private mode */}}
export function rallyWasChosen(storage=session()){try{return storage?.getItem(PICK_KEY)==='rally';}catch{return false;}}
