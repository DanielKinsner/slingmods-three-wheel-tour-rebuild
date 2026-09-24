import * as THREE from 'three';
import {loadKTX2} from './ktx2';import {ROAD_DECAL_URLS} from './p11-assets';
import {sampleRoad,type CourseRoute} from '../course/environment';
import {routeCurvature,brakingPoints} from './trackside';

/**
 * P11 road decals laid over a flat route as two merged, alpha-blended meshes (matte rubber, then everything else: two draw calls): racing-line rubber, expansion
 * seams, tar snakes, patches, cracks, oil, worn lane paint and braking/launch marks. Things that run ALONG the road are
 * what streak under the car and sell speed, so those dominate. Deterministic from the seed; visual only.
 */
interface Tile {id:string;uvRectBottomLeft:[number,number,number,number];realWorldSizeMetres:[number,number]}
export interface RoadDecalPlan {halfWidth:number;y:number;seed?:number;lanePaint?:{edge:number;centreDash:[number,number]}|null;gridStation?:number;/** Wet road: marks and paint turn glossy with the asphalt around them. */wet?:boolean}
export interface RoadDecalQuad {tile:string;x:number;z:number;yaw:number;width:number;length:number;alpha:number;layer:number}

/** Where a car on the limit runs: wide on entry, inside at the apex, wide on exit. Signed lateral offset in metres. */
export function racingLineOffset(route:CourseRoute,halfWidth:number){
 const {step,values}=routeCurvature(route),n=values.length,bend=(i:number)=>Math.tanh(values[((i%n)+n)%n]*110),reach=Math.round(40/step),limit=halfWidth-1.9;
 // Positive curvature turns toward +offset in this route convention, so the apex sits on the same sign as the bend.
 // On a straight the line is already set up for the next bend: outside of it, growing as the corner approaches, so the
 // rubber lives in one lane rather than on the centre dashes.
 const ahead=(i:number)=>{for(let k=1;k*step<700;k++){const b=bend(i+k);if(Math.abs(b)>.5)return -Math.sign(b)*(.35+.4*Math.max(0,1-k*step/260))}return .35};
 const raw=values.map((_,i)=>{const cornering=Math.min(1,Math.abs(bend(i))+Math.abs(bend(i+reach))+Math.abs(bend(i-reach)));return THREE.MathUtils.clamp((1.5*bend(i)-.75*bend(i+reach)-.75*bend(i-reach))*limit*cornering+ahead(i)*limit*(1-cornering),-limit,limit)});
 const smooth=raw.map((_,i)=>[-4,-3,-2,-1,0,1,2,3,4].reduce((s,k)=>s+raw[(i+k+n)%n],0)/9);
 return{at:(station:number)=>{const f=((station%route.length)+route.length)%route.length/step,i=Math.floor(f)%n,t=f-Math.floor(f);return smooth[i]+(smooth[(i+1)%n]-smooth[i])*t},load:(station:number)=>Math.min(1,Math.abs(values[Math.floor(((station%route.length)+route.length)%route.length/step)%n])*90)};
}
export function planRoadDecals(route:CourseRoute,plan:RoadDecalPlan):RoadDecalQuad[]{
 let seed=plan.seed??1107;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296},pick=(n:number)=>1+Math.floor(rand()*n),quads:RoadDecalQuad[]=[],line=racingLineOffset(route,plan.halfWidth),brakes=brakingPoints(route);
 const put=(tile:string,station:number,offset:number,width:number,length:number,alpha:number,layer:number,twist=0)=>{const s=sampleRoad(route,station);quads.push({tile,x:s.x-s.dz*offset,z:s.z+s.dx*offset,yaw:Math.atan2(s.dx,s.dz)+twist,width,length,alpha,layer})};
 const braking=(station:number)=>brakes.some(b=>{const d=((b-station)%route.length+route.length)%route.length;return d<170});
 // 1. Rubbered-in line: continuous 8 m tiles, heaviest through corners and braking zones, faint on the straights.
 for(let s=0;s<route.length;s+=8)put('racing-line',s+4,line.at(s+4),3,8.06,.28+.5*Math.max(line.load(s+4),braking(s)?.7:0),0);
 // 2. Transverse expansion seams at a fixed cadence: the metronome under the car.
 for(let s=12;s<route.length;s+=24){const kind='expansion-'+pick(4);for(let x=-plan.halfWidth+1.5;x<plan.halfWidth;x+=3)put(kind,s,x,3.02,.09,.85,1)}
 // 3. Patches, cracks and tar snakes, scattered but mostly aligned with travel.
 for(let s=30;s<route.length;s+=95+rand()*60)put('repair-'+pick(4),s,(rand()*2-1)*(plan.halfWidth-2),2.4+rand(),1.8+rand(),.9,2,rand()*.5-.25);
 for(let s=20;s<route.length;s+=38+rand()*30)put('crack-chip-'+pick(6),s,(rand()*2-1)*(plan.halfWidth-1.2),1.5,3,.8,3,rand()<.5?0:Math.PI);
 for(let s=6;s<route.length;s+=11+rand()*12){const x=(rand()*2-1)*(plan.halfWidth-.8);put('tar-snake-'+pick(6),s,x,.34,2.6+rand()*1.6,.92,4,rand()*.5-.25);if(rand()<.45)put('tar-snake-'+pick(6),s+2.4,x+rand()*.6-.3,.3,2.2+rand(),.9,4,rand()*.4-.2)}
 for(let s=50;s<route.length;s+=140+rand()*120)put(rand()<.5?'oil-stain':'oil-streak',s,line.at(s)+rand()*2-1,.9,1.2,.7,5,rand()*.6-.3);
 // 4. Worn paint replaces the flat white markings.
 if(plan.lanePaint){for(let s=0;s<route.length;s+=3)for(const side of[-1,1])put('white-solid',s+1.5,side*plan.lanePaint.edge,.15,3.03,.95,6);const [dash,pitch]=plan.lanePaint.centreDash;for(let s=12;s<route.length;s+=pitch)for(let k=0;k<dash;k+=3)put('white-solid',s+k+1.5-dash/2,0,.14,3.02,.92,6)}
 // 5. Braking-zone lock-ups, and launch marks on the grid (the single-rear burnout is this machine's signature).
 for(const b of brakes)for(let k=0;k<7;k++){const s=b-150+rand()*150;put(rand()<.6?'skid-lockup':'skid-narrow',s,line.at(s)+rand()*2.4-1.2,1.5,9+rand()*9,.35+rand()*.3,7)}
 if(plan.gridStation!==undefined){put('single-rear-burnout',plan.gridStation+2.2,0,2.8,3.2,.8,7);put('paired-launch',plan.gridStation+5.5,0,1.5,7,.55,7);put('single-rear-burnout',plan.gridStation-5.8,-3,2.8,3.2,.5,7)}
 return quads.sort((a,b)=>a.layer-b.layer);
}
export async function loadRoadDecals(renderer:THREE.WebGLRenderer,route:CourseRoute,plan:RoadDecalPlan){
 const [map,normalMap,orm,atlas]=await Promise.all([loadKTX2(renderer,ROAD_DECAL_URLS[0],{srgb:true,repeat:false,anisotropy:16}),loadKTX2(renderer,ROAD_DECAL_URLS[1],{repeat:false,anisotropy:16}),loadKTX2(renderer,ROAD_DECAL_URLS[2],{repeat:false,anisotropy:16}),fetch(ROAD_DECAL_URLS[3]).then(r=>{if(!r.ok)throw Error('Road decal atlas unavailable');return r.json() as Promise<{tiles:Tile[]}>})]);
 const tiles=new Map(atlas.tiles.map(t=>[t.id,t])),quads=planRoadDecals(route,plan).filter(q=>tiles.has(q.tile)),n=quads.length;
 const build=(list:RoadDecalQuad[])=>{
  const count=list.length,position=new Float32Array(count*12),normal=new Float32Array(count*12),uv=new Float32Array(count*8),color=new Float32Array(count*16),index=new Uint32Array(count*6);
  list.forEach((q,i)=>{
   const paint=q.tile.startsWith('white-')?.78:1;   // road paint reflects ~70-80%; at full white the headlights clipped lines to glowing bars
   const tx=Math.sin(q.yaw),tz=Math.cos(q.yaw),nx=-tz,nz=tx,hw=q.width/2,hl=q.length/2,y=plan.y+q.layer*.0012,[u0,v0,w,h]=tiles.get(q.tile)!.uvRectBottomLeft;
   // Compressed textures are not flipped on upload: image-top is v=0, so the atlas' bottom-left rectangles are mirrored in v.
   const corners=[[-1,-1,u0,1-v0],[1,-1,u0+w,1-v0],[1,1,u0+w,1-v0-h],[-1,1,u0,1-v0-h]];
   corners.forEach(([a,b,u,v],k)=>{position.set([q.x+nx*hw*a+tx*hl*b,y,q.z+nz*hw*a+tz*hl*b],i*12+k*3);normal.set([0,1,0],i*12+k*3);uv.set([u,v],i*8+k*2);color.set([paint,paint,paint,q.alpha],i*16+k*4)});
   index.set([i*4,i*4+1,i*4+2,i*4,i*4+2,i*4+3],i*6);
  });
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(position,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normal,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setAttribute('color',new THREE.BufferAttribute(color,4));geometry.setIndex(new THREE.BufferAttribute(index,1));geometry.computeBoundingSphere();return geometry;
 };
 const shared={transparent:true,depthWrite:false,vertexColors:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:0,metalness:0};
 const material=new THREE.MeshStandardMaterial({name:'P11_road_decals',map,normalMap,normalScale:new THREE.Vector2(1,-1),roughnessMap:orm,roughness:plan.wet?.42:1,...shared});
 // Laid rubber is matte and nearly flat. With the atlas' glossy roughness it mirrored the sky and read as a PALE strip, so
 // the racing line gets its own material: same colour map, no gloss, a whisper of the normal.
 const rubber=new THREE.MeshStandardMaterial({name:'P11_road_rubber',map,normalMap,normalScale:new THREE.Vector2(.2,-.2),roughness:plan.wet?.5:.96,color:'#8d8d8d',...shared});
 const mesh=new THREE.Group();mesh.name='P11_road_decals';
 for(const[name,list,m,order]of[['rubber',quads.filter(q=>q.layer===0),rubber,1],['marks',quads.filter(q=>q.layer>0),material,2]]as const){const part=new THREE.Mesh(build(list),m);part.name='P11_road_'+name;part.receiveShadow=true;part.renderOrder=order;mesh.add(part)}
 const byTile:Record<string,number>={};for(const q of quads)byTile[q.tile.replace(/-\d+$/,'')]=(byTile[q.tile.replace(/-\d+$/,'')]??0)+1;
 return{mesh,inspect:()=>({quads:n,triangles:n*2,drawCalls:2,byKind:byTile}),dispose(){mesh.removeFromParent();for(const part of mesh.children as THREE.Mesh[])part.geometry.dispose();material.dispose();rubber.dispose();for(const t of[map,normalMap,orm])t.dispose()}};
}
