import {mkdir,writeFile} from 'node:fs/promises';
import {RIDGE_ROUTE,RIDGE_DESIGN} from '../src/ridge/route';
import {routeGraphic} from '../src/signature/route-data';
// Tiny route-card data, not a world preload. Derived from the authoritative road.
await mkdir('public/assets/ridge',{recursive:true});
await writeFile('public/assets/ridge/preview.json',JSON.stringify({version:RIDGE_ROUTE.version,...routeGraphic(RIDGE_ROUTE),elevationMetres:RIDGE_DESIGN.elevationRangeMetres})+'\n');
