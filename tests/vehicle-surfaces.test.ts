import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import * as THREE from 'three';
import {finishVehicleSurfaces, surfaceKind, upgradeVehicleMaterial, VEHICLE_SURFACE_MAPS, VehiclePhysicalMaterial} from '../src/presentation/vehicle-surfaces';

// Materials exactly as the shipped GLBs declare them (factors, names, roles); no textures needed to classify.
function materials(file: string) {
 const b = readFileSync(file), g = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString());
 return g.materials.map((m: any) => {
  const p = m.pbrMetallicRoughness ?? {}, s = new THREE.MeshStandardMaterial({name: m.name, metalness: p.metallicFactor ?? 1, roughness: p.roughnessFactor ?? 1});
  const c = p.baseColorFactor ?? [1, 1, 1, 1]; s.color.setRGB(c[0], c[1], c[2]); s.opacity = c[3]; s.transparent = m.alphaMode === 'BLEND';
  if (p.baseColorTexture) s.map = new THREE.Texture(); s.userData = m.extras ?? {};
  return s;
 }) as THREE.MeshStandardMaterial[];
}
const CARS = {slingshot: 'public/assets/model02/slingshot-2026.glb', ryker: 'public/assets/ryker/complete/ryker-900-complete.glb', spyder: 'public/assets/spyder/spyder-f3.glb'};

for (const [name, file] of Object.entries(CARS)) test(`${name}: optics are never touched and the big surfaces all get a physical finish`, () => {
 const list = materials(file);
 for (const m of list) if (['headlamp', 'brake', 'running-brake', 'clear-cover', 'passive-reflector', 'display', 'mirror'].includes(m.userData.vehicleRole) || m.transparent) assert.equal(surfaceKind(m), undefined, m.name);
 for (const m of list) if (/lens|lamp|glass|mirror/i.test(m.name)) assert.equal(surfaceKind(m), undefined, m.name);
 for (const m of list) if (m.userData.vehicleRole === 'paint') assert.equal(surfaceKind(m), 'paint', m.name);
 for (const m of list) if (/tire|rubber/i.test(m.name)) assert.equal(surfaceKind(m), 'rubber', m.name);
 // No surviving "black metal": a 1%-albedo metal is less reflective than plastic.
 for (const m of list) {const k = surfaceKind(m); if (!k) continue; const u = upgradeVehicleMaterial(m, k, {}); if (u.metalness > .5) assert.ok(Math.max(u.color.r, u.color.g, u.color.b) > .1, `${m.name} stays a dark metal`);}
});

test('painted calipers keep their colour; near-black coatings get a real albedo', () => {
 const red = new THREE.MeshStandardMaterial({name: 'mat_251589853_PC_292-SlingshotRed_BremboCaliper', color: new THREE.Color(.22, 0, 0), metalness: 0});
 assert.equal(surfaceKind(red), 'coated');
 assert.equal(upgradeVehicleMaterial(red, 'coated', {}).color.getHex(), red.color.getHex());
 const black = new THREE.MeshStandardMaterial({name: 'mat_1_MetalBlackGloss_Rear', color: new THREE.Color(.01, .01, .01), metalness: .75});
 const up = upgradeVehicleMaterial(black, surfaceKind(black)!, {});
 assert.equal(up.metalness, 0); assert.ok(up.color.r > .015);
});

test('upgraded surfaces survive clone(), so rivals and paint finishes keep them', () => {
 const map = new THREE.Texture(), paint = new THREE.MeshStandardMaterial({name: 'Ryker_Paint', color: 0xdd2211});paint.userData.vehicleRole = 'paint';
 const car = new THREE.Group(), mesh = new THREE.Mesh(new THREE.BoxGeometry(), paint); car.add(mesh);
 const finish = finishVehicleSurfaces(car, {flake: map, peel: map});
 const up = mesh.material as VehiclePhysicalMaterial, copy = up.clone();
 assert.ok(copy instanceof VehiclePhysicalMaterial); assert.equal(copy.clearcoat, 1);
 assert.equal(copy.customProgramCacheKey(), up.customProgramCacheKey()); assert.notEqual(copy.onBeforeCompile, THREE.Material.prototype.onBeforeCompile);
 assert.equal(copy.userData.vehicleRole, 'paint', 'role survives for rival repaint');
 const shader = {uniforms: {}, vertexShader: '#include <begin_vertex>', fragmentShader: '#include <normal_fragment_maps>\n#include <clearcoat_normal_fragment_maps>'} as any;
 copy.onBeforeCompile(shader, undefined as any);
 assert.match(shader.fragmentShader, /vsdDetail/); assert.equal((shader.uniforms as any).vsdMap.value, map);
 finish.dispose(); assert.equal(mesh.material, paint, 'dispose restores the original');
});

test('surface maps ship and stay small', () => {
 for (const url of Object.values(VEHICLE_SURFACE_MAPS)) assert.ok(statSync('public' + url).size < 260_000, url);
 const allow = JSON.parse(readFileSync('demo-assets.json', 'utf8')).assets as string[];
 for (const url of Object.values(VEHICLE_SURFACE_MAPS)) assert.ok(allow.includes(url.slice(1)), `${url} on the hosted allowlist`);
});

test('identical surface shaders share programs while retaining each material texture and physical parameters', () => {
 const plasticMap = new THREE.Texture(), rubberMap = new THREE.Texture();
 const a = upgradeVehicleMaterial(new THREE.MeshStandardMaterial(), 'plastic', {stipple: plasticMap});
 const b = upgradeVehicleMaterial(new THREE.MeshStandardMaterial(), 'rubber', {rubber: rubberMap});
 assert.equal(a.customProgramCacheKey(), b.customProgramCacheKey());
 const compile = (m: THREE.Material) => {const s = {uniforms: {}, vertexShader: '#include <begin_vertex>', fragmentShader: '#include <normal_fragment_maps>\n#include <clearcoat_normal_fragment_maps>'} as any; m.onBeforeCompile(s, undefined as any); return s;};
 const sa = compile(a), sb = compile(b);
 assert.equal(sa.fragmentShader, sb.fragmentShader);
 assert.equal(sa.uniforms.vsdMap.value, plasticMap); assert.equal(sb.uniforms.vsdMap.value, rubberMap);
 assert.notDeepEqual(sa.uniforms.vsdParams.value.toArray(), sb.uniforms.vsdParams.value.toArray());
 assert.notDeepEqual(sa.uniforms.vsdFade.value.toArray(), sb.uniforms.vsdFade.value.toArray());
 assert.match(sa.fragmentShader, /if\(k>0\.\)/, 'invisible micro detail performs no texture lookups');
 const paint = upgradeVehicleMaterial(new THREE.MeshStandardMaterial(), 'paint', {flake: plasticMap, peel: rubberMap});
 assert.notEqual(paint.customProgramCacheKey(), a.customProgramCacheKey(), 'coat detail needs its own GLSL');
});
