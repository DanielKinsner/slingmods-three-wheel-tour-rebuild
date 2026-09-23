import * as THREE from 'three';import {readFile,writeFile} from 'node:fs/promises';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {DriverPresenter} from '../../src/presentation/driver';
const bytes=await readFile('public/assets/drivers/tour-rider/tour-rider.glb'),n=bytes.readUInt32LE(12),j=JSON.parse(bytes.subarray(20,20+n).toString());delete j.images;delete j.textures;j.materials=[];for(const m of j.meshes)for(const p of m.primitives)delete p.material;
const str=JSON.stringify(j),padded=Buffer.from(str+' '.repeat((4-str.length%4)%4)),bin=bytes.subarray(20+n),out=Buffer.alloc(20+padded.length+bin.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(padded.length,12);out.writeUInt32LE(0x4e4f534a,16);padded.copy(out,20);bin.copy(out,20+padded.length);
const person=(await new GLTFLoader().parseAsync(out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength),'')).scene;
const config=JSON.parse(await readFile('public/assets/spyder/driver-attachment.json','utf8')),manifest=JSON.parse(await readFile('public/assets/spyder/manifest.json','utf8'));const root=new THREE.Group(),wheel=new THREE.Group();root.add(person,wheel);wheel.position.fromArray(manifest.barPivot);person.position.fromArray(config.rootOffset);const driver=new DriverPresenter(person,root,wheel,config),rows:any[]=[];
for(const lean of [-1,-.7,-.35,0,.3,.6])for(const extraLean of [-.4,0,.4])for(const twist of [-1,0,.65,1,1.5])for(const z of [.03,-.05,-.1,-.15]){
 config.handlebarPose={lean,extraLean,twist};person.position.z=z;let gap=0,foot=0;
 for(const steer of [-.6,0,.6]){wheel.rotation.y=steer;const report=driver.update({steer,speed:0,time:0,throttle:0,brake:0} as any,0,false,true);gap=Math.max(gap,...Object.values(report.arms).map((a:any)=>a.gap));foot=Math.max(foot,...Object.values(report.feet).map((a:any)=>a.gap))}
 rows.push({lean,extraLean,twist,z,gap,foot});
}
rows.sort((a,b)=>(a.gap+a.foot)-(b.gap+b.foot));await writeFile('assets/spyder/evidence/rider-fit-search.json',JSON.stringify(rows,null,2));console.log(rows.slice(0,20));
