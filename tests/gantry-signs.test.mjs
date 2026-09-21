import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const glb=path=>{const b=fs.readFileSync(path),n=b.readUInt32LE(12);return JSON.parse(b.subarray(20,20+n).toString())};
const ARTWORK=360/86;
test('ridge gantry logo is authored into a painted timber board with 12% clear margin',()=>{
 const sign=JSON.parse(fs.readFileSync('assets/source/ridge/gantry-sign.json','utf8')),[bw,bh]=sign.boardMetres,[lw,lh]=sign.logoMetres;
 assert.ok(Math.abs(lw/lh-ARTWORK)<1e-6,'artwork aspect preserved');assert.ok((bw-lw)/2/bw>=.12-1e-9&&(bh-lh)/2/bh>=.12-1e-9,'at least 12% clear on every side');
 assert.ok(Math.abs(sign.clearMetres[0]-(bw-lw)/2)<1e-9&&Math.abs(sign.clearMetres[1]-(bh-lh)/2)<1e-9,'centred');
 const g=glb('public/assets/ridge/ridge-kit.glb'),node=name=>g.nodes.find(n=>n.name===name);assert.ok(node('ridge_gantry_signboard'),'board is part of the kit source export');
 const face=g.meshes[node('ridge_gantry_sign_face').mesh].primitives[0],bounds=g.accessors[face.attributes.POSITION],material=g.materials[face.material];
 assert.ok(Math.abs(bounds.max[0]-bounds.min[0]-bw)<1e-3&&Math.abs(bounds.max[1]-bounds.min[1]-bh)<1e-3,'face matches the board the texture was fitted to');
 assert.equal(material.name,'Ridge_gantry_sign_paint');assert.ok(material.pbrMetallicRoughness.baseColorTexture,'logo is printed in the painted-plank colour map');assert.ok(material.pbrMetallicRoughness.metallicRoughnessTexture,'ink, paint and bare timber differ in roughness');
});
test('ridge no longer floats a runtime logo plane over the gantry',()=>{
 assert.doesNotMatch(fs.readFileSync('src/ridge/presentation.ts','utf8'),/logo\.scene|setScalar\(10\)/);assert.doesNotMatch(fs.readFileSync('src/ridge/assets.ts','utf8'),/slingmods-sign/);
});
test('express logo is fitted inside the gantry header face instead of a fixed 10 m width',()=>{
 const g=glb('public/assets/showcase-quality/kit.glb'),header=g.nodes.find(n=>n.name==='kit_gantry__Quality_Powdercoat'),b=g.accessors[g.meshes[header.mesh].primitives[0].attributes.POSITION];
 // The constants quoted in presentation.ts must stay true to the kit the runtime loads.
 assert.ok(Math.abs(b.max[1]-b.min[1]-.75)<1e-3&&Math.abs((b.max[1]+b.min[1])/2-4.6)<1e-3&&Math.abs(b.max[2]-.3)<1e-3);
 const source=fs.readFileSync('src/express/presentation.ts','utf8');assert.match(source,/sign\.scale\.setScalar\(\.75\*gantry\.scale\*\(1-2\*\.12\)\*360\/86\)/);assert.match(source,/sign\.position\.set\(gantry\.x,4\.6\*gantry\.scale,/);assert.doesNotMatch(source,/sign\.scale\.setScalar\(10\)/);
});
