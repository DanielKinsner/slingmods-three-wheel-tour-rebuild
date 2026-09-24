/** Prints the pose at a route station (for ?test=1&spawn=x,z,yaw). npx tsx scripts/game-feel/station-pose.ts express 1700 */
import fs from 'node:fs';import {sampleRoad} from '../../src/course/environment';import {EXPRESS_ROUTE} from '../../src/express/route';import {RIDGE_ROUTE} from '../../src/ridge/route';
const [id,st]=process.argv.slice(2),r=id==='ridge'?RIDGE_ROUTE:id==='harbor'?JSON.parse(fs.readFileSync('public/assets/harbor/route.json','utf8')):EXPRESS_ROUTE,p=sampleRoad(r,Number(st));
console.log(`${p.x.toFixed(1)},${p.z.toFixed(1)},${Math.atan2(-p.dx,-p.dz).toFixed(3)}`);
