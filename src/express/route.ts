import {routeLength,sampleRoad,createCourseEnvironment,type CourseRoute} from '../course/environment';
/** Editable authoring control points in metres. Existing Harbor is never read or modified. */
const points:number[][]=[];
function line(a:number[],b:number[],step=10){const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step);for(let i=0;i<n;i++)points.push([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n])}
function cubic(a:number[],b:number[],c:number[],d:number[],n=40){for(let i=0;i<n;i++){const t=i/n,u=1-t;points.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]])}}
line([0,0],[0,-800]);
cubic([0,-800],[0,-970],[-280,-970],[-280,-800],64);
line([-280,-800],[-280,-300]);
cubic([-280,-300],[-280,-210],[-215,-205],[-215,-110],36);
cubic([-215,-110],[-215,100],[0,140],[0,0],56);
const route:CourseRoute={id:'harbor-express',version:'express-layout-v1',name:'Harbor Express',width:15,runoff:3,length:0,centerline:points,start:{x:0,y:.025,z:8,yaw:0},checkpoints:[],colliders:[],ground:{center:[-80,-.15,-400],size:[1800,.3,1600]},lamps:[]};route.length=routeLength(route);
for(let i=0;i<16;i++){const distance=i*route.length/16;route.checkpoints.push({...sampleRoad(route,distance),id:'express-gate-'+i,halfWidth:route.width/2+route.runoff,distance})}
// Both visible rails and physical rails consume these same oriented boxes. Gaps are overlapped.
for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz);for(const side of[-1,1]){const distance=side*(route.width/2+route.runoff+.7);route.colliders.push({id:'express-rail-'+i+'-'+side,center:[(a[0]+b[0])/2-dz/length*distance,.45,(a[1]+b[1])/2+dx/length*distance],size:[.35,.9,length+1.2],yaw})}}
for(const distance of[0,100,220,360,510,670,800,1100,1450,1750,2050]){const p=sampleRoad(route,distance);route.lamps.push({position:[p.x-p.dz*10,7,p.z+p.dx*10],target:[p.x,.1,p.z]})}
export const EXPRESS_ROUTE=route;
export const EXPRESS_DESIGN={id:route.version,lengthMetres:route.length,mainStraightMetres:800,brakingZone:{startMetres:600,endMetres:800,lengthMetres:200},widthMetres:15,runoffMetres:3,groundBounds:route.ground,description:'Eight-hundred-metre quay straight, terminal sweeper, warehouse return, loading-yard transition and marina bend. Braking boards at 200/150/100/50m before terminal curve.',source:'src/express/route.ts; cubic control points and measured polyline, not old Harbor geometry'};
export const createExpressEnvironment=()=>createCourseEnvironment(EXPRESS_ROUTE);
