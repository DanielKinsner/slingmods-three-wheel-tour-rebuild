import {writeFileSync,mkdirSync} from 'node:fs';
import RAPIER from '@dimforge/rapier3d-compat';
import {Simulation} from '../src/simulation/index.ts';
import {scenarios} from '../src/simulation/scenarios.ts';
import layout from '../public/assets/slingshot-contact-layout.json';
const out='director-kit/production/evidence/G2/revision02';mkdirSync(out,{recursive:true});
const names=process.argv.slice(2);const variants=names.length?names:['baseline','offset-left','offset-right','guard-friction-zero','chassis-friction-zero','all-collision-friction-zero','guard-sensors','chassis-sensor'];
for(const variant of variants){
 const sim=await Simulation.create(),internals=sim as unknown as {world:RAPIER.World;body:RAPIER.RigidBody};const {world,body}=internals;
 const x=variant.endsWith('offset-left')?-40.1:variant.endsWith('offset-right')?-39.9:-40;sim.reset({x,z:58});
 if(variant==='ground-halfspace'){const ground=world.getCollider(0);ground.setShape(new RAPIER.HalfSpace({x:0,y:1,z:0}));ground.setTranslation({x:0,y:0,z:0})}
 if(variant==='ground-trimesh'){const ground=world.getCollider(0);ground.setShape(new RAPIER.TriMesh(new Float32Array([-350,0,-350,-350,0,350,350,0,350,350,0,-350]),new Uint32Array([0,1,2,0,2,3])));ground.setTranslation({x:0,y:0,z:0})}
 if(variant==='ground-small-box'){const ground=world.getCollider(0);ground.setShape(new RAPIER.Cuboid(12,.15,60));ground.setTranslation({x:-40,y:-.15,z:30})}
 if(variant==='guard-polyhedron')for(let i=1;i<body.numColliders();i++){const w=layout.wheels[i-1],points=[];for(const y of [-w.width/2,w.width/2])for(let j=0;j<16;j++){const a=j*Math.PI/8;points.push(Math.cos(a)*w.radius*.68,y,Math.sin(a)*w.radius*.68)}body.collider(i).setShape(RAPIER.ColliderDesc.convexHull(new Float32Array(points))!.shape)}
 for(let i=0;i<body.numColliders();i++){
  const collider=body.collider(i);
  if((variant==='guard-friction-zero'&&i>0)||(variant==='chassis-friction-zero'&&i===0)||variant==='all-collision-friction-zero'){collider.setFriction(0);collider.setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min)}
  if((variant==='guard-sensors'&&i>0)||(variant==='chassis-sensor'&&i===0))collider.setSensor(true);
 }
 const cast=world.castRayAndGetNormal.bind(world),apply=body.addForceAtPoint.bind(body);let rays:unknown[]=[],forces:unknown[]=[];
 world.castRayAndGetNormal=(...args)=>{const hit=cast(...args);rays.push({origin:args[0].origin,direction:args[0].dir,hit:hit?{normal:{...hit.normal},point:args[0].pointAt(hit.timeOfImpact),distance:hit.timeOfImpact,collider:hit.collider.handle}:null});return hit};
 body.addForceAtPoint=(force,point,wake)=>{forces.push({force:{...force},point:{...point}});apply(force,point,wake)};
 const frames=[];let maxYaw=0,maxError=0;const scenario=scenarios.find(s=>s.name==='incline-launch')!;
 for(let tick=0;tick<660;tick++){
  rays=[];forces=[];sim.step(scenario.control(tick/60,sim.telemetry()));const f=sim.telemetry();const q=f.quaternion,yaw=Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.y*q.y+q.x*q.x));maxYaw=Math.max(maxYaw,Math.abs(yaw));maxError=Math.max(maxError,Math.abs(f.position.x-x));
  if(tick>=320&&tick<390){
   const collisions:unknown[]=[];
   for(let i=0;i<body.numColliders();i++){
    const c=body.collider(i);
    world.contactPairsWith(c,other=>{
     world.contactPair(c,other,(m,flipped)=>{
      const contacts=[];
      for(let j=0;j<m.numContacts();j++)contacts.push({impulse:m.contactImpulse(j),tangentX:m.contactTangentImpulseX(j),tangentY:m.contactTangentImpulseY(j),distance:m.contactDist(j),local1:m.localContactPoint1(j),local2:m.localContactPoint2(j)});
      const solver=[];for(let j=0;j<m.numSolverContacts();j++)solver.push(m.solverContactPoint(j));
      collisions.push({ownCollider:i,other:other.handle,normal:{...m.normal()},flipped,contacts,solver});
     });
    });
   }
   frames.push({tick:tick+1,yaw,telemetry:f,rays,forces,collisions});
  }
 }
 const summary={variant,maxYawRadians:maxYaw,maxLateralError:maxError,final:sim.telemetry()};writeFileSync(`${out}/dynamics-ramp-${variant}.json`,JSON.stringify({summary,frames},null,2));console.log(JSON.stringify({variant,maxYawRadians:maxYaw,maxLateralError:maxError,finalPosition:summary.final.position}));sim.dispose();
}
