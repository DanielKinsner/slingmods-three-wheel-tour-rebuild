/** Prints the SlingMods Points layout per route (counts by value, total available). */
import fs from 'node:fs';import {placeTokens} from '../../src/game/points';import {EXPRESS_ROUTE} from '../../src/express/route';import {RIDGE_ROUTE} from '../../src/ridge/route';
const HARBOR=JSON.parse(fs.readFileSync('public/assets/harbor/route.json','utf8'));
for(const [n,r] of [['harbor',HARBOR],['express',EXPRESS_ROUTE],['ridge',RIDGE_ROUTE]] as const){const t=placeTokens(r),by:Record<number,number>={};for(const k of t)by[k.value]=(by[k.value]??0)+1;console.log(n.padEnd(8),'tokens',t.length,JSON.stringify(by),'face value',t.reduce((a,k)=>a+k.value,0))}
