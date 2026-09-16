import fs from 'node:fs';
import {RIDGE_ROUTE,RIDGE_DESIGN,RIDGE_SURFACES,RIDGE_STATIONS} from '../src/ridge/route';
const out='assets/blender/ridge/ridge-authoritative-surfaces.json';
fs.mkdirSync('assets/blender/ridge',{recursive:true});
fs.writeFileSync(out,JSON.stringify({generator:'scripts/export-p10a-terrain.ts',basis:'metres Y up; convert to Blender [x,-z,y]',route:RIDGE_ROUTE,design:RIDGE_DESIGN,stations:RIDGE_STATIONS,surfaces:RIDGE_SURFACES}));
console.log(out);
