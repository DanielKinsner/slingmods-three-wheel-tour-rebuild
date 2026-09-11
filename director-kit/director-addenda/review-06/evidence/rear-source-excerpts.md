## src/presentation/hero.ts (submitted Review06)

```text
1: import * as THREE from 'three';
2: import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
3: import {DriverPresenter,type DriverAttachment} from './driver';
4: import {assetStatistics} from './statistics';
5: import {configureShadows} from './shadows';
6: import type {VehicleTelemetry} from '../simulation';
7: /** Existing exported hero and rig, same wheel/caliper/steering bindings as the retained pad. */
8: export async function loadDrivingHero(loader:GLTFLoader){
9:  const [asset,person,attachment]=await Promise.all([loader.loadAsync('/assets/vehicles/slingshot-p03a2.glb'),loader.loadAsync('/assets/drivers/test-driver.glb'),fetch('/assets/drivers/test-driver-attachment.json').then(r=>r.json() as Promise<DriverAttachment>)]);
10:  const root=new THREE.Group();root.add(asset.scene);configureShadows(root,new THREE.Group(),'repaired',false);root.add(person.scene);
11:  const axisX=new THREE.Vector3(1,0,0),axisY=new THREE.Vector3(0,1,0),axisZ=new THREE.Vector3(0,0,1),q=new THREE.Quaternion();
12:  const bindings=['front_left','front_right','rear'].map(id=>{const steer=asset.scene.getObjectByName(id+'_steer'),spin=asset.scene.getObjectByName(id+'_spin'),node=steer??spin;return{steer,spin,node,basePos:node?.position.clone(),baseSteer:steer?.quaternion.clone(),baseSpin:spin?.quaternion.clone()}});
13:  const caliper=asset.scene.getObjectByName('suspension_rear__Brake_Caliper'),caliperBase=caliper?.position.clone(),wheel=asset.scene.getObjectByName('steering_control')!,wheelBase=wheel.quaternion.clone();
14:  const driver=new DriverPresenter(person.scene,root,wheel,attachment);
15:  return{root,asset:asset.scene,driver,attachment,statistics:{car:assetStatistics(asset.scene),driver:assetStatistics(person.scene)},pose(t:VehicleTelemetry,dt:number,cockpit:boolean,reset=false){
16:  root.position.set(t.position.x,t.position.y,t.position.z);root.quaternion.set(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w);
17:  t.wheels.forEach((w,i)=>{const b=bindings[i];if(b.node&&b.basePos){b.node.position.copy(b.basePos);b.node.position.y=w.localCenter.y}if(b.steer&&b.baseSteer)b.steer.quaternion.copy(b.baseSteer).multiply(q.setFromAxisAngle(axisY,w.steer));if(b.spin&&b.baseSpin)b.spin.quaternion.copy(b.baseSpin).multiply(q.setFromAxisAngle(axisX,-w.spin))});
18:  if(caliper&&caliperBase&&bindings[2].basePos){caliper.position.copy(caliperBase);caliper.position.y+=t.wheels[2].localCenter.y-bindings[2].basePos.y}
19:  wheel.quaternion.copy(wheelBase).multiply(q.setFromAxisAngle(axisZ,t.steer*10));driver.update(t,dt,cockpit,reset);
20:  }};
21: }
```

## src/workbench.ts (submitted Review06)

```text
80: const diagnostics=document.createElement('button');diagnostics.className='diagnostics-toggle';diagnostics.textContent='Diagnostics';diagnostics.addEventListener('click',()=>document.body.classList.toggle('debug-overlay'));document.querySelector('#app')!.append(diagnostics);
81: const axisX=new THREE.Vector3(1,0,0),axisY=new THREE.Vector3(0,1,0),q=new THREE.Quaternion(),cameraRay=new THREE.Raycaster();
82: function pose(t:any){
83:  if(!t)return;vehicle.position.set(t.position.x,t.position.y,t.position.z);vehicle.quaternion.set(t.quaternion.x,t.quaternion.y,t.quaternion.z,t.quaternion.w);
84:  t.wheels.forEach((w:any,i:number)=>{const b=bindings[i];if(!b)return;if(b.positionNode&&b.basePos){b.positionNode.position.copy(b.basePos);b.positionNode.position.y=w.localCenter.y}if(b.steer&&b.baseSteer)b.steer.quaternion.copy(b.baseSteer).multiply(q.setFromAxisAngle(axisY,w.steer));if(b.spin&&b.baseSpin)b.spin.quaternion.copy(b.baseSpin).multiply(q.setFromAxisAngle(axisX,-w.spin))});
85:  // The caliper follows rear suspension travel without inheriting wheel spin. P01 has no such island.
86:  if(rearCaliper&&rearCaliperBase&&bindings[2].basePos){rearCaliper.position.copy(rearCaliperBase);rearCaliper.position.y+=t.wheels[2].localCenter.y-bindings[2].basePos.y}
87:  if(steeringControl&&steeringBase)steeringControl.quaternion.copy(steeringBase).multiply(q.setFromAxisAngle(steeringAxis,t.steer*10));const root=vehicle.position;sun.position.set(root.x+8,root.y+14,root.z+5);sun.target.position.copy(root);
88: }
89: function cameraChase(dt:number,snap=false){
90:  chase.update(vehicle.position,vehicle.quaternion,current?.speed??0,dt,cameraMode,lookBack,snap,(target,desired)=>{const ray=desired.clone().sub(target);cameraRay.set(target,ray.clone().normalize());cameraRay.far=ray.length();return cameraRay.intersectObject(pad.scene,true)[0]?.distance});
```

## scripts/vehicle_p03a_build.py (submitted Review06)

```text
146:  patch('inner_wheelhouse_'+label,[[(s*.59,.64,.255),(s*.60,.64,.48),(s*.625,.64,.662)],[(s*.60,.98,.438),(s*.58,.98,.57),(s*.62,.98,.676)],[(s*.53,1.52,.598),(s*.52,1.52,.62),(s*.56,1.52,.64)]],black,steps=25,cross=12,th=.018,flip=s<0,ruled=True)
147:  # Rear undertray bulges around wheel well, closes at inner wall and terminates in a real bottom return.
148:  rows=[]
149:  for z,y,outer,inner in [(.235,-1.036,.49,.205),(.34,-1.13,.655,.215),(.57,-1.20,.683,.215),(.80,-1.27,.639,.198),(.862,-1.277,.57,.18)]:
150:   rows.append([(s*inner,y+.035,z),(s*(inner+.055),y-.006,z),(s*(outer-.04),y-.020,z),(s*outer,y+.025,z),(s*(outer-.018),y+.085,z)])
151:  patch('rear_undertray_curved_'+label,rows,black,steps=40,cross=12,th=.026,flip=s>0)
152:  # Front painted cheek sweeps in section between inboard intake and outboard lamp socket.
153:  rows=[]
154:  for z,xi,xo,y in [(.205,.615,.90,2.036),(.245,.494,.87,2.051),(.315,.445,.647,2.060),(.433,.367,.557,2.073),(.532,.295,.52,2.071)]:
155:   rows.append([(s*xi,y,z),(s*lerp(xi,xo,.32),y+.008,z+.004),(s*lerp(xi,xo,.75),y+.004,z+.012),(s*xo,y-.018,z+.016)])
156:  patch('front_fascia_cheek_'+label,rows,paint,steps=38,cross=10,th=.025,flip=s>0)
157: # Full cockpit bulkhead and a continuous dash top, with separate passenger storage surface.
158: box('cockpit_firewall',(0,.44,.39),(1.25,.095,.47),black,cockpit,.025)
159: box('rear_firewall',(0,-1.105,.60),(.48,.13,.54),black,body,.028)
160: rows=[]
161: for x,z in [(-.665,.677),(-.48,.736),(-.28,.723),(-.16,.753),(0,.781),(.17,.753),(.36,.724),(.54,.704),(.665,.663)]:
162:  rows.append([(x,.20,z-.085),(x,.23,z-.021),(x,.285,z),(x,.395,z-.012),(x,.410,z-.055)])
163: dash=patch('dashboard_continuous',rows,black,cockpit,steps=82,cross=20,th=.025,flip=True)
164: bpy.context.view_layer.update()
165: dash_eval=dash.evaluated_get(bpy.context.evaluated_depsgraph_get())
```

## scripts/vehicle_build.py (submitted Review06)

```text
177: panel('rear_deck',[(-.65,-1.23,.895),(.65,-1.23,.895),(.65,-.93,.87),(-.65,-.93,.87)],dark)
178: panel('center_tail_fin',[(-.02,-.68,.84),(0,-.85,1.135),(.02,-1.24,.91),(-.02,-1.24,.91)],dark,th=.038)
179: rear=empty('suspension_rear',root)
180: box('single_sided_swingarm',(.235,-.98,.29),(.13,.77,.13),alloy,rear,.035)
181: rod('rear_axle',(0,-1.3335,.3455),(.32,-1.3335,.3455),.045,alloy,rear)
182: path('drive_belt',[(.26,-1.3335+math.sin(a)*.224,.3455+math.cos(a)*.224) for a in [i*math.tau/64 for i in range(65)]],.016,dark,rear)
183: rod('rear_shock',(.28,-1.02,.36),(.28,-1.20,.79),.035,dark,rear)
184: path('rear_coil',[(.28+.052*math.cos(i/96*math.tau*7),-1.02-.18*i/96+.045*math.sin(i/96*math.tau*7),.36+.43*i/96) for i in range(97)],.008,alloy,rear)
185: for name,loc in {'mount_exhaust':(.45,-.75,.25),'mount_suspension_front_left':(-.48,1.31,.64),'mount_suspension_front_right':(.48,1.31,.64),'mount_suspension_rear':(.28,-1.20,.79),'mount_underglow_left':(-.67,-.1,.17),'mount_underglow_right':(.67,-.1,.17),'camera_cockpit':(-.36,-.57,1.12),'camera_nose':(0,1.82,.75),'rider_seat':(-.36,-.32,.38),'rider_hand_left':(-.49,.0,.71),'rider_hand_right':(-.23,.0,.71),'rider_foot_left':(-.49,.49,.22),'rider_foot_right':(-.28,.49,.22)}.items():empty(name,root,loc)
```
