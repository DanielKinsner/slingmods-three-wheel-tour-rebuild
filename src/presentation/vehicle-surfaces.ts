import * as THREE from 'three';
/**
 * Physically based finish for every vehicle's own materials (Slingshot, Ryker, Spyder, rivals, showroom).
 * - Corrects values that read as dead or plastic: near-black "metals" become dielectric coatings (a 1%-albedo
 *   metal reflects less than plastic), chrome/aluminium get real metal reflectance.
 * - Paint and gloss panels get a lacquer clear coat; metallic paint gets flake sparkle under it.
 * - Micro-surface maps (scripts/build-vehicle-surface-maps.py) are projected triplanar in each part's own metres,
 *   so they need no UVs and stay attached to spinning wheels. Detail fades out with distance.
 * Lamps, lenses, glass, mirrors, displays, decals and recesses are never touched: other presenters own them.
 * The upgraded materials survive clone() (rivals, paint finishes), so every copy keeps its surface.
 */
export type SurfaceKind = 'paint' | 'decal' | 'coated' | 'gloss-panel' | 'metal' | 'chrome' | 'plastic' | 'rubber' | 'leather';
type MapName = 'flake' | 'peel' | 'stipple' | 'leather' | 'rubber' | 'metal';
type Detail = {map: MapName; tile: number; strength: number; rough: number; fade: [number, number]};
export type SurfaceSpec = {kind: SurfaceKind; detail?: Detail; coat?: {roughness: number; weight: number; peel?: Detail}};
export const VEHICLE_SURFACE_MAPS: Record<MapName, string> = Object.fromEntries((['flake', 'peel', 'stipple', 'leather', 'rubber', 'metal'] as MapName[]).map(n => [n, `/assets/vehicle-surfaces/${n}.webp`])) as Record<MapName, string>;
const VERSION = 'vehicle-surface-v1';

// Tile sizes are metres per map repeat; strengths are tangent-plane slopes at full detail.
const PEEL: Detail = {map: 'peel', tile: .22, strength: .55, rough: 0, fade: [1.5, 18]};
const SPECS: Record<SurfaceKind, SurfaceSpec> = {
 paint: {kind: 'paint', detail: {map: 'flake', tile: .1, strength: .09, rough: .12, fade: [.3, 2.5]}, coat: {roughness: .04, weight: 1, peel: PEEL}},
 decal: {kind: 'decal', coat: {roughness: .05, weight: .9, peel: PEEL}},
 'gloss-panel': {kind: 'gloss-panel', coat: {roughness: .05, weight: .85, peel: PEEL}},
 coated: {kind: 'coated', detail: {map: 'stipple', tile: .035, strength: .18, rough: .25, fade: [.5, 7]}},
 metal: {kind: 'metal', detail: {map: 'metal', tile: .07, strength: .22, rough: .6, fade: [.5, 9]}},
 chrome: {kind: 'chrome'},
 plastic: {kind: 'plastic', detail: {map: 'stipple', tile: .05, strength: .5, rough: .45, fade: [.4, 8]}},
 rubber: {kind: 'rubber', detail: {map: 'rubber', tile: .09, strength: .55, rough: .4, fade: [.5, 12]}},
 leather: {kind: 'leather', detail: {map: 'leather', tile: .06, strength: .65, rough: .45, fade: [.4, 6]}},
};

const SKIP_ROLES = new Set(['headlamp', 'brake', 'running-brake', 'clear-cover', 'passive-reflector', 'display', 'mirror']);
const capColor = (c: THREE.Color, max: number) => c.setRGB(Math.min(c.r, max), Math.min(c.g, max), Math.min(c.b, max));
const nearBlack = (c: THREE.Color) => Math.max(c.r, c.g, c.b) < .05;
const luminance = (c: THREE.Color) => .2126 * c.r + .7152 * c.g + .0722 * c.b;
/** Role first (semantic Slingshot/Ryker/Spyder bindings), then the material's own name and physical values. */
export function surfaceKind(m: THREE.MeshStandardMaterial): SurfaceKind | undefined {
 const role = m.userData.vehicleRole as string | undefined, name = m.name;
 if (SKIP_ROLES.has(role ?? '') || m.transparent || m.opacity < 1 || m.alphaTest > 0 || m.emissiveMap || m.emissiveIntensity > 0 && m.emissive.getHex() !== 0) return;
 if (/mirror|glass|lens|lamp|light|LCD|display|gage|gauge|decal_|DECAL|MASK|logo|badge|plate|reflector|recess|stitch|Camera|_\d___Default|^_\d+$|^ccc$/i.test(name) && role !== 'decal') return;
 if (role === 'decal') return 'decal';
 // Brake calipers carry a paint code but are small coated castings, not lacquered body panels.
 if (/caliper/i.test(name)) return 'coated';
 if (role === 'paint' || role === 'accent' || /\bPC_\d+|^paint_/i.test(name)) return 'paint';
 if (/chrome|polished_stainless/i.test(name)) return 'chrome';
 if (/rubber|tire|tyre/i.test(name) || role === 'rubber') return 'rubber';
 if (/leather|seat/i.test(name)) return 'leather';
 if (/Gloss_Plastic|red_plastic/i.test(name)) return 'gloss-panel';
 if (/powdercoat|SatinBlack|MetalBlack|ChassisMetal|black_metal|Engine|SteelDark|brembo/i.test(name)) return 'coated';
 if (/alumin|machin|silver|^rim$|Steel|CastMetal|Titanium|shaft|brass|bronze|weld|heat_tint|^break$/i.test(name)) return 'metal';
 if (role === 'metal') return m.metalness > .5 && luminance(m.color) < .1 && !m.map ? 'coated' : 'metal';
 if (/plastic|polymer|BodyPlastic|Plastic/i.test(name) || role === 'interior' && m.metalness < .3) return 'plastic';
 return;
}

/** Physical values per kind; colour identity is kept (paint, brass, red powder coat, textured parts). */
function tune(m: THREE.MeshStandardMaterial, kind: SurfaceKind) {
 const L = luminance(m.color);
 switch (kind) {
  case 'coated': // Paint/powder coat over metal is a dielectric. Near-black parts keep a real 2-3% albedo.
   m.metalness = 0; if (!m.map && nearBlack(m.color)) m.color.setScalar(.022);
   m.roughness = /Gloss/i.test(m.name) ? .2 : /Matte/i.test(m.name) ? .55 : THREE.MathUtils.clamp(m.roughness + .08, .32, .5); break;
  case 'metal':
   m.metalness = 1;
   // Machined/bright aluminium reflects ~70-90%; cast and titanium-grey parts sit lower.
   if (!m.map && /alumin|machin|silver|^rim$/i.test(m.name)) capColor(m.color.multiplyScalar(Math.max(1, .72 / Math.max(L, .01))), .92);
   else if (!m.map && /CastMetal|Titanium/i.test(m.name)) capColor(m.color.multiplyScalar(Math.max(1, .45 / Math.max(L, .01))), .8);
   else if (!m.map && /Steel|shaft/i.test(m.name) && L < .35) m.color.setScalar(.48);
   m.roughness = THREE.MathUtils.clamp(m.roughness, .28, .5); break;
  case 'chrome': m.metalness = 1; m.roughness = .05; if (L < .55) m.color.setScalar(.62); break;
  case 'plastic': m.metalness = 0; if (!m.map && nearBlack(m.color)) m.color.setScalar(.028); m.roughness = /Smooth/i.test(m.name) ? .42 : Math.max(m.roughness, .56); break;
  case 'gloss-panel': m.metalness = 0; if (!m.map && nearBlack(m.color)) m.color.setScalar(.016); m.roughness = .22; break;
  case 'rubber': m.metalness = 0; if (!m.map) m.color.setScalar(.032); m.roughness = Math.max(m.roughness, .86); break;
  case 'leather': m.metalness = 0; m.roughness = THREE.MathUtils.clamp(m.roughness, .55, .7); break;
  case 'paint': m.metalness = Math.min(Math.max(m.metalness, .15), .45); break;
  case 'decal': break;
 }
}

type Maps = Partial<Record<MapName, THREE.Texture>>;
const fetchMaps = new Map<string, Promise<Maps>>();
/** Shared, cached per page. A failed or slow map only loses its detail; the physical corrections still apply. */
export function loadVehicleSurfaceMaps(timeoutMs = 15000): Promise<Maps> {
 const key = 'maps';
 let job = fetchMaps.get(key);
 if (!job) {
  job = Promise.all(Object.entries(VEHICLE_SURFACE_MAPS).map(async ([name, url]) => {
   try {
    const texture = await Promise.race([new THREE.TextureLoader().loadAsync(url), new Promise<never>((_, reject) => setTimeout(() => reject(Error('timeout')), timeoutMs))]);
    texture.name = url; texture.colorSpace = THREE.NoColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.anisotropy = 8;
    return [name, texture] as const;
   } catch { return [name, undefined] as const; }
  })).then(entries => Object.fromEntries(entries.filter(([, t]) => t)) as Maps);
  fetchMaps.set(key, job);
 }
 return job;
}

const VERTEX = `vVsdPos=position*vec3(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz),length(modelMatrix[2].xyz));vVsdNormal=normal;`;
const FUNCTIONS = `uniform mat3 normalMatrix;varying vec3 vVsdPos;varying vec3 vVsdNormal;
vec3 vsdDetail(sampler2D map,vec3 p,vec3 n,float scale,float strength,out float rough){
 vec3 w=pow(abs(n),vec3(4.));w/=w.x+w.y+w.z;
 vec3 tx=texture2D(map,p.zy*scale).xyz,ty=texture2D(map,p.xz*scale).xyz,tz=texture2D(map,p.xy*scale).xyz;
 vec2 dx=(tx.xy*2.-1.)*strength,dy=(ty.xy*2.-1.)*strength,dz=(tz.xy*2.-1.)*strength;
 rough=tx.z*w.x+ty.z*w.y+tz.z*w.z;
 return normalize(n+w.x*vec3(0.,dx.y,dx.x)+w.y*vec3(dy.x,0.,dy.y)+w.z*vec3(dz.x,dz.y,0.));
}
`;
function inject(shader: Parameters<THREE.Material['onBeforeCompile']>[0], spec: SurfaceSpec, maps: Maps) {
 const detail = spec.detail && maps[spec.detail.map] ? spec.detail : undefined, peel = spec.coat?.peel && maps[spec.coat.peel.map] ? spec.coat.peel : undefined;
 if (!detail && !peel) return;
 shader.vertexShader = 'varying vec3 vVsdPos;varying vec3 vVsdNormal;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VERTEX);
 let body = 'vec3 vsdN0=normalize(vVsdNormal);float vsdDistance=length(vViewPosition);';
 if (detail) {
  Object.assign(shader.uniforms, {vsdMap: {value: maps[detail.map]}, vsdParams: {value: new THREE.Vector4(1 / detail.tile, detail.strength, detail.rough, 0)}, vsdFade: {value: new THREE.Vector2(...detail.fade)}});
  body += `{float k=1.-smoothstep(vsdFade.x,vsdFade.y,vsdDistance),r;vec3 d=vsdDetail(vsdMap,vVsdPos,vsdN0,vsdParams.x,vsdParams.y*k,r);
   normal=normalize(normal+faceDirection*(normalMatrix*(d-vsdN0)));roughnessFactor=clamp(roughnessFactor*(1.+(r-.5)*2.*vsdParams.z*k),.02,1.);}`;
 }
 let fragment = shader.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + body);
 const uniforms = (detail ? 'uniform sampler2D vsdMap;uniform vec4 vsdParams;uniform vec2 vsdFade;' : '') + (peel ? 'uniform sampler2D vsdCoatMap;uniform vec4 vsdCoatParams;uniform vec2 vsdCoatFade;' : '');
 if (peel) {
  Object.assign(shader.uniforms, {vsdCoatMap: {value: maps[peel.map]}, vsdCoatParams: {value: new THREE.Vector4(1 / peel.tile, peel.strength, 0, 0)}, vsdCoatFade: {value: new THREE.Vector2(...peel.fade)}});
  // Orange peel lives in the lacquer, not the base coat: it ripples reflections without touching the colour layer.
  fragment = fragment.replace('#include <clearcoat_normal_fragment_maps>', `#include <clearcoat_normal_fragment_maps>
  #ifdef USE_CLEARCOAT
  {float r;vec3 d=vsdDetail(vsdCoatMap,vVsdPos,vsdN0,vsdCoatParams.x,vsdCoatParams.y*(1.-smoothstep(vsdCoatFade.x,vsdCoatFade.y,vsdDistance)),r);clearcoatNormal=normalize(clearcoatNormal+faceDirection*(normalMatrix*(d-vsdN0)));}
  #endif`);
 }
 shader.fragmentShader = uniforms + FUNCTIONS + fragment;
}

function attach(m: THREE.MeshStandardMaterial, spec: SurfaceSpec, maps: Maps) {
 m.userData.vehicleSurface = {version: VERSION, kind: spec.kind, detail: spec.detail?.map ?? null, coat: !!spec.coat};
 m.onBeforeCompile = shader => inject(shader, spec, maps);
 const key = `${VERSION}:${spec.kind}:${!!(spec.detail && maps[spec.detail.map])}:${!!(spec.coat?.peel && maps[spec.coat.peel.map])}`;
 m.customProgramCacheKey = () => key;
 (m as SurfaceMaterial).surface = {spec, maps};
}
type SurfaceMaterial = THREE.MeshStandardMaterial & {surface?: {spec: SurfaceSpec; maps: Maps}};
/** clone() goes through copy(): carry the shader hook so rival and finish copies keep their surface. */
export class VehicleStandardMaterial extends THREE.MeshStandardMaterial {
 surface?: {spec: SurfaceSpec; maps: Maps};
 override copy(source: THREE.MeshStandardMaterial) {super.copy(source); const s = (source as SurfaceMaterial).surface; if (s) attach(this, s.spec, s.maps); return this;}
}
export class VehiclePhysicalMaterial extends THREE.MeshPhysicalMaterial {
 surface?: {spec: SurfaceSpec; maps: Maps};
 override copy(source: THREE.MeshPhysicalMaterial) {super.copy(source); const s = (source as SurfaceMaterial).surface; if (s) attach(this, s.spec, s.maps); return this;}
}

export function upgradeVehicleMaterial(source: THREE.MeshStandardMaterial, kind: SurfaceKind, maps: Maps) {
 const spec = SPECS[kind], physical = source instanceof THREE.MeshPhysicalMaterial || !!spec.coat;
 let m: THREE.MeshStandardMaterial;
 if (source instanceof THREE.MeshPhysicalMaterial) m = new VehiclePhysicalMaterial().copy(source);
 else if (physical) {m = new VehiclePhysicalMaterial(); THREE.MeshStandardMaterial.prototype.copy.call(m, source); m.defines = {STANDARD: '', PHYSICAL: ''};}
 else m = new VehicleStandardMaterial().copy(source);
 tune(m, kind);
 if (spec.coat) {const p = m as THREE.MeshPhysicalMaterial; p.clearcoat = spec.coat.weight; p.clearcoatRoughness = spec.coat.roughness;}
 attach(m, spec, maps);
 return m;
}

/** One pass per loaded vehicle scene, before rivals are cloned from it. Reversible; nothing on disk changes. */
export function finishVehicleSurfaces(car: THREE.Object3D, maps: Maps) {
 const replaced = new Map<THREE.Material, THREE.Material>(), slots: {mesh: THREE.Mesh; original: THREE.Material | THREE.Material[]}[] = [], counts: Partial<Record<SurfaceKind, number>> = {};
 car.traverse(o => {
  if (!(o instanceof THREE.Mesh)) return;
  const list = Array.isArray(o.material) ? o.material : [o.material];
  const next = list.map(m => {
   if (!(m instanceof THREE.MeshStandardMaterial) || (m as SurfaceMaterial).surface) return m;
   let r = replaced.get(m);
   if (!r) {const kind = surfaceKind(m); if (!kind) return m; r = upgradeVehicleMaterial(m, kind, maps); replaced.set(m, r); counts[kind] = (counts[kind] ?? 0) + 1;}
   return r;
  });
  if (next.some((m, i) => m !== list[i])) {slots.push({mesh: o, original: o.material}); o.material = Array.isArray(o.material) ? next : next[0];}
 });
 return {
  inspect: () => ({version: VERSION, materials: replaced.size, meshes: slots.length, kinds: counts, maps: Object.keys(maps)}),
  dispose() {for (const s of slots) s.mesh.material = s.original; replaced.forEach(m => m.dispose()); slots.length = 0; replaced.clear();},
 };
}
