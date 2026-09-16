import {routeLength, sampleRoad, projectRoad, createCourseEnvironment, type CourseRoute, type EnvironmentDefinition} from '../course/environment';

/** Original fictional circuit. Metres, Y up, [x,z] plan. No surveyed/public-road data. */
const controls = [
 [[0,0],[0,-180],[0,-400],[0,-600]],
 [[0,-600],[0,-700],[42,-766],[132,-800]],
 [[132,-800],[210,-830],[274,-811],[346,-822]],
 [[346,-822],[434,-837],[498,-823],[554,-753]],
 [[554,-753],[610,-683],[642,-609],[632,-522]],
 [[632,-522],[622,-436],[560,-384],[559,-306]],
 [[559,-306],[558,-228],[619,-188],[629,-110]],
 [[629,-110],[639,-32],[607,48],[550,108]],
 [[550,108],[493,168],[430,187],[356,182]],
 [[356,182],[282,177],[254,221],[181,210]],
 [[181,210],[109,199],[54,164],[24,110]],
 [[24,110],[0,67],[0,37],[0,0]],
] as const;
const points:number[][]=[];
for(const [a,b,c,d]of controls)for(let j=0;j<48;j++){const t=j/48,u=1-t;points.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]])}
const rawLength=points.reduce((s,a,i)=>s+Math.hypot(a[0]-points[(i+1)%points.length][0],a[1]-points[(i+1)%points.length][1]),0),scale=3200/rawLength;
for(const p of points){p[0]*=scale;p[1]*=scale}
/** Integrated raised-cosine grade: continuous slope, flat pit/crest, maximum 6.72%. */
function ramp(s:number,start:number,end:number){const blend=150,d=end-start,t=Math.max(0,Math.min(d,s-start));if(t<blend)return(t/2-blend*Math.sin(Math.PI*t/blend)/(2*Math.PI))/(d-blend);if(t>d-blend){const r=d-t;return 1-(r/2-blend*Math.sin(Math.PI*r/blend)/(2*Math.PI))/(d-blend)}return(t-blend/2)/(d-blend)}
export function ridgeElevation(station:number){const s=((station%3200)+3200)%3200;return 84*(ramp(s,100,1500)-ramp(s,1700,3100))}
let along=0;const elevations=points.map((p,i)=>{if(i)along+=Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1]);return ridgeElevation(along)});
const route:CourseRoute={id:'smoky-ridge',version:'ridge-layout-v1',name:'Smoky Ridge',width:12,runoff:3,length:0,centerline:points,elevations,start:{x:0,y:.025,z:0,yaw:0},checkpoints:[],colliders:[],ground:{center:[350,-150,-350],size:[2600,.1,2800]},lamps:[]};
route.length=routeLength(route);
const stations:number[]=[];along=0;for(let i=0;i<points.length;i++){stations.push(along);const a=points[i],b=points[(i+1)%points.length];along+=Math.hypot(b[0]-a[0],b[1]-a[1])}
export const RIDGE_ROUTE=route;
export const RIDGE_STATIONS=stations;
export const RIDGE_DISTRICTS=[{id:'paddock',name:'Workshop paddock',from:0,to:380},{id:'woods',name:'Wooded climb',from:380,to:1400},{id:'overlook',name:'Rock-cut and overlook',from:1400,to:2130},{id:'descent',name:'Open descent',from:2130,to:3200}] as const;
export function ridgeDistrict(station:number){return RIDGE_DISTRICTS.find(d=>station>=d.from&&station<d.to)??RIDGE_DISTRICTS[0]}
/** Shoulder height and terrain are authored from the same cross-section, never a floor. */
export function ridgeCrossHeight(station:number,offset:number){const base=sampleRoad(route,station).y??ridgeElevation(station),d=Math.abs(offset);if(d<=9)return base-(Math.max(0,d-6)*.025);const fade=Math.min(1,(d-9)/35),bank=Math.sin(station/3200*Math.PI*4)*.55+(offset>0?.45:-.45);return base-.075+fade*(d-9)*bank*.47+Math.sin(station*.035)*fade*1.3}
export function ridgePoint(station:number,offset=0){const p=sampleRoad(route,station);return{x:p.x-p.dz*offset,y:ridgeCrossHeight(station,offset),z:p.z+p.dx*offset,dx:p.dx,dz:p.dz}}
export type RidgeMeshData={vertices:number[];indices:number[];uv:number[]};
/** Tangent cross sections form the single authoritative road/support topology. */
export function ridgeRibbon(inner:number,outer:number,height=0):RidgeMeshData{const vertices:number[]=[],indices:number[]=[],uv:number[]=[];if(inner>outer)[inner,outer]=[outer,inner];for(let i=0;i<=points.length;i++){const j=i%points.length,a=points[j],prev=points[(j-1+points.length)%points.length],next=points[(j+1)%points.length],n=Math.hypot(next[0]-prev[0],next[1]-prev[1]),dx=(next[0]-prev[0])/n,dz=(next[1]-prev[1])/n,s=i===points.length?3200:stations[j];for(const offset of[inner,outer]){vertices.push(a[0]-dz*offset,ridgeCrossHeight(s,offset)+height,a[1]+dx*offset);uv.push(offset/5,s/5)}if(i<points.length){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2)}}return{vertices,indices,uv}}
function joinedRoad(){const a=ridgeRibbon(-6,0),b=ridgeRibbon(0,6),n=a.vertices.length/3;return {vertices:[...a.vertices,...b.vertices],indices:[...a.indices,...b.indices.map(i=>i+n)],uv:[...a.uv,...b.uv]}}
export const RIDGE_SURFACES={road:joinedRoad(),leftShoulder:ridgeRibbon(-9,-6),rightShoulder:ridgeRibbon(6,9),terrain:[[-60,-35],[-35,-18],[-18,-9],[9,18],[18,35],[35,60]].map(([a,b])=>ridgeRibbon(a,b))};
export const RIDGE_SUPPORT_MESHES=[RIDGE_SURFACES.road,RIDGE_SURFACES.leftShoulder,RIDGE_SURFACES.rightShoulder,...RIDGE_SURFACES.terrain];
route.supportMeshes=RIDGE_SUPPORT_MESHES;
route.heightAt=(x:number,z:number)=>{const p=projectRoad(route,x,z),side=(x-p.x)*-p.dz+(z-p.z)*p.dx;return ridgeCrossHeight(p.progress,side)};
for(let i=0;i<24;i++){const distance=i*route.length/24;route.checkpoints.push({...sampleRoad(route,distance),id:`ridge-gate-${i}`,halfWidth:9,distance})}
// Oriented box rails and presentation consume identical boxes. Short segments follow grades.
for(let s=450;s<3140;s+=6){if(s>1790&&s<1885)continue;const a=sampleRoad(route,s),b=sampleRoad(route,s+6);for(const side of[-1,1]){if(side===1&&s<1400)continue;const p=ridgePoint(s+3,side*10.4);route.colliders.push({id:`ridge-rail-${s}-${side}`,center:[p.x,p.y+.62,p.z],size:[.26,.28,6.5],yaw:Math.atan2(b.x-a.x,b.z-a.z),pitch:-Math.atan(((b.y??0)-(a.y??0))/6)})}}
export const RIDGE_DESIGN={id:route.version,lengthMetres:route.length,elevationMin:0,elevationMax:84,elevationRangeMetres:84,maxGrade:.0672,widthMetres:12,runoffMetres:3,straightMetres:600*scale,cornerGroups:11,stationConvention:'Planar metres for projection, laps and gates; Y from the same sampled cross-sections. 3D arc length is reported separately.',brakingZones:[{from:2350,to:2540,description:'Downhill linked return bends; 200/150/100/50 m boards'}],districts:RIDGE_DISTRICTS,source:'src/ridge/route.ts; original cubic plan and integrated cosine grade; no surveyed route',terrainSupport:'One non-coincident physical road/shoulder/terrain ribbon to 60m on either side; farther scenic ridges visual only, no support floor'};
export function createRidgeEnvironment():EnvironmentDefinition {return {...createCourseEnvironment(route),supportMeshes:RIDGE_SUPPORT_MESHES,heightAt(x:number,z:number){const p=projectRoad(route,x,z),side=(x-p.x)*-p.dz+(z-p.z)*p.dx;return ridgeCrossHeight(p.progress,side)}}}
