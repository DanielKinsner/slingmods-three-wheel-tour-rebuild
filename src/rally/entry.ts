import {freshRykerRecipe,validateRecipe,recipeFragment,type BuildRecipe} from '../signature/config';
/** Rally is a standalone event, never a saved road destination or career attempt. */
export function rallyRecipe(recipe:BuildRecipe|null):BuildRecipe{return recipe?.vehicleId==='can-am-ryker-900'?validateRecipe(recipe):freshRykerRecipe();}
export function rallyHref(recipe:BuildRecipe,practice=false){return `?scene=rally&visual=ryker&mode=${practice?'test':'race'}&play=preview${recipeFragment(rallyRecipe(recipe))}`;}
