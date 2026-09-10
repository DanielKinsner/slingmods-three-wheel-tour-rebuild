import RAPIER from '@dimforge/rapier3d-compat';
import {writeFileSync} from 'node:fs';
import layout from '../public/assets/slingshot-contact-layout.json';
await RAPIER.init();const world=new RAPIER.World({x:0,y:-9.81,z:0});world.timestep=1/60;
world.createCollider(RAPIER.ColliderDesc.cuboid(55,0.15,110).setTranslation(0,-0.15,0));
const body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setCanSleep(false).setTranslation(0,0.55,35).setAdditionalMassProperties(850,{x:0,y:0,z:0},{x:700,y:950,z:330},{x:0,y:0,z:0,w:1}));
world.createCollider(RAPIER.ColliderDesc.cuboid(.63,.16,1.45).setDensity(0),body);
const controller=world.createVehicleController(body);controller.indexUpAxis=1;controller.setIndexForwardAxis=2;
for(const wheel of layout.wheels){controller.addWheel({x:wheel.center[0],y:wheel.center[1]-.46+.18,z:wheel.center[2]},{x:0,y:-1,z:0},{x:-1,y:0,z:0},.24,wheel.radius)}
for(let i=0;i<3;i++){controller.setWheelSuspensionStiffness(i,35);controller.setWheelSuspensionCompression(i,3.8);controller.setWheelSuspensionRelaxation(i,4.5);controller.setWheelMaxSuspensionForce(i,18000);controller.setWheelMaxSuspensionTravel(i,.15);controller.setWheelFrictionSlip(i,1.05)}
world.step();const samples=[];
for(let tick=0;tick<600;tick++){
 controller.setWheelEngineForce(2,tick<180?0:-2200);controller.updateVehicle(1/60,undefined,undefined,c=>c.parent()?.handle!==body.handle);world.step();
 if(tick%60===59)samples.push({tick:tick+1,position:{...body.translation()},controllerPositiveZSpeed:controller.currentVehicleSpeed(),signedGameSpeed:-body.linvel().z,wheels:[0,1,2].map(i=>({contact:controller.wheelIsInContact(i),load:controller.wheelSuspensionForce(i),length:controller.wheelSuspensionLength(i)}))});
}
const report={package:'@dimforge/rapier3d-compat@0.20.0',provenance:'Actual isolated built-in-controller evaluation; no custom suspension/tire forces were applied in this world.',wheelCount:controller.numWheels(),samples,decision:'Production uses custom three-channel force model: explicit N/m suspension, combined-slip ellipse, surface/traction law and auditable per-wheel drive torque. Built-in supports3 wheels and runs, but its friction-slip/controller impulse behavior does not itself provide this authored tire law. No built-in vehicle controller exists in the production Simulation world.'};
writeFileSync('director-kit/production/evidence/G2/dynamics-controller-evaluation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));world.removeVehicleController(controller);world.free();
