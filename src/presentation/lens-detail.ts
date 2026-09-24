import * as THREE from 'three';
/**
 * The Spyder's lenses rendered as flat colour patches: the amber reflectors ('orange_glass' samples a tiny patch of a 313 px
 * photo; 'orange_rear_glass' is untextured) and the tail light above the plate ('Spyder native tail lens', flat orange,
 * where the real F3 has a red lens). Each such mesh gets its own planar UVs across its face and a generated moulded reflector:
 * hexagonal cube-corner prisms with lit / mid / dark amber facets. Same mesh and draw; presentation only; idempotent.
 */
const LENSES:[RegExp,'amber'|'red'][]=[[/^orange(_rear)?_glass$/,'amber'],[/^Spyder native tail lens$/,'red']];
const PALETTES={amber:{base:'#96340a',edge:'#5a1800',facets:['#ffa83c','#d6620e','#762202']},red:{base:'#5a0604',edge:'#2a0000',facets:['#ff5a48','#b8120a','#4a0302']}};
const prisms:Partial<Record<'amber'|'red',THREE.Texture|null>>={};
function prismTexture(kind:'amber'|'red'){
 if(prisms[kind]!==undefined)return prisms[kind]!;if(typeof document==='undefined')return prisms[kind]=null;const pal=PALETTES[kind];
 const c=document.createElement('canvas');c.width=512;c.height=512;const g=c.getContext('2d')!;g.fillStyle=pal.base;g.fillRect(0,0,512,512);
 const r=16,dx=r*Math.sqrt(3),dy=r*1.5,facets=pal.facets;
 for(let row=0,y=-r;y<512+r;row++,y+=dy)for(let x=-dx+(row%2?dx/2:0);x<512+dx;x+=dx){
  const p=[...Array(6)].map((_,k)=>[x+r*Math.cos((90+60*k)*Math.PI/180),y-r*Math.sin((90+60*k)*Math.PI/180)]);
  facets.forEach((col,k)=>{g.fillStyle=col;g.beginPath();g.moveTo(x,y);for(const q of[p[2*k%6],p[(2*k+1)%6],p[(2*k+2)%6]])g.lineTo(q[0],q[1]);g.closePath();g.fill()});
  g.strokeStyle=pal.edge;g.lineWidth=1;g.beginPath();p.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();g.stroke()}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return prisms[kind]=t;
}
export function upgradeAmberLenses(car:THREE.Object3D){
 let count=0;const made=new Map<THREE.Material,THREE.MeshStandardMaterial>();
 car.traverse(o=>{if(!(o instanceof THREE.Mesh)||Array.isArray(o.material)||o.userData.lensDetail)return;const kind=LENSES.find(([re])=>re.test((o.material as THREE.Material).name))?.[1];if(!kind)return;
  const map=prismTexture(kind);if(!map)return;
  // Keep the original's name and userData (semantic lamp role), so the tail/brake glow still binds to it.
  const original=o.material as THREE.Material;let material=made.get(original);if(!material){material=new THREE.MeshStandardMaterial({name:original.name,map,roughness:.16,metalness:.05});material.userData={...original.userData};made.set(original,material)}
  const pos=o.geometry.getAttribute('position') as THREE.BufferAttribute,box=new THREE.Box3().setFromBufferAttribute(pos),s=box.getSize(new THREE.Vector3());
  const n=s.x<s.y&&s.x<s.z?0:s.y<s.z?1:2,[a,b]=[0,1,2].filter(i=>i!==n),repeat=.2;   // one 512 px tile per 20 cm: ~11 mm prisms, like a real reflector
  const uv=new Float32Array(pos.count*2);for(let i=0;i<pos.count;i++){uv[i*2]=(pos.getComponent(i,a)-box.min.getComponent(a))/repeat;uv[i*2+1]=(pos.getComponent(i,b)-box.min.getComponent(b))/repeat}
  const g=o.geometry.clone();g.setAttribute('uv',new THREE.BufferAttribute(uv,2));o.geometry=g;o.material=material;o.userData.lensDetail=true;count++});
 return count;
}
