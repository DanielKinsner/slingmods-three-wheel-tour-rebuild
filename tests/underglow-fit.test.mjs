import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
// Regression: the underglow kit is CONFORMED to one car's underside by ray casting. The car was replaced by the 2026 model
// and the kit was not refitted, so its front strips hung in open air ahead of the nose ("the underglow is floating").
test('the 2026 underglow was fitted to exactly the vehicle file that ships',()=>{
 const a=JSON.parse(fs.readFileSync('public/assets/model02/tricled-sm133-2026.attachment.json','utf8'));
 assert.equal(a.fit.vehicle,'public/assets/model02/slingshot-2026.glb');assert.equal(a.fit.vehicleSha256,sha(a.fit.vehicle),'The 2026 car changed since the underglow was fitted: re-run scripts/product_sm133_fit_2026.py');
 assert.equal(a.fit.glbSha256,sha('public'+a.asset),'attachment and GLB come from the same fit run');
});
test('every strip hugs real bodywork: nothing in open air, nothing hanging more than 2.5 cm below the body',()=>{
 const a=JSON.parse(fs.readFileSync('public/assets/model02/tricled-sm133-2026.attachment.json','utf8'));assert.deepEqual(a.fit.strips.map(s=>s.strip).sort(),['left_front_lower','left_rail','right_front_lower','right_rail']);
 for(const s of a.fit.strips){assert.ok(s.keptPoints>=20,s.strip+' kept its length');assert.ok(s.maxGapToBodyworkM<=.025,`${s.strip}: ${s.maxGapToBodyworkM} m below the body`);assert.ok(s.maxGapToBodyworkM>=0,'never inside a panel')}
 for(const path of a.strips)for(const p of path.points){assert.ok(p[1]>.14&&p[1]<.22,'under the 2026 floor, clear of the road');assert.ok(Math.abs(p[0])<=.92&&p[2]>=-2.08&&p[2]<=.45,'inside the 2026 footprint')}
 for(const o of a.lightOrigins)assert.ok(o[1]>.12&&o[1]<.2);
});
test('the game loads the kit fitted to the car it is showing, and the hosted build ships it',()=>{
 const asset=fs.readFileSync('src/presentation/vehicle-asset.ts','utf8'),product=fs.readFileSync('src/presentation/product.ts','utf8'),allow=JSON.parse(fs.readFileSync('demo-assets.json','utf8')).assets;
 assert.ok(asset.includes("VEHICLE_VISUAL==='2026'?{glb:'/assets/model02/tricled-sm133-2026.glb'"));assert.ok(product.includes('loader.loadAsync(CURRENT_UNDERGLOW.glb)')&&!product.includes('tricled-sm133-base.glb'));
 for(const f of['assets/model02/tricled-sm133-2026.glb','assets/model02/tricled-sm133-2026.attachment.json'])assert.ok(allow.includes(f),f);
});
