import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** These values are showroom-only. No racing renderer/material shares this rig. */
export const STUDIO_LOOKS = {
  studio: { exposure: .91, environment: .95, hemisphere: .55, key: 1.4, fill: .76, rim: 1.15, background: '#30373c', wallWash: 22 },
  tour: { exposure: .91, environment: .95, hemisphere: .55, key: 1.4, fill: .76, rim: 1.15, background: '#30373c', wallWash: 22 },
  lights: { exposure: .84, environment: .20, hemisphere: .23, key: .42, fill: .19, rim: .34, background: '#161d26', wallWash: 5 },
} as const;
export type StudioLook = keyof typeof STUDIO_LOOKS;
export const TOUR_WALL = {
  sourceMesh: 'studio_left_wall', center: [-5.855, 2.1, 1.2], normal: [1, 0, 0],
  width: 8.7, height: 2.9, text: 'BUILT TO BE YOURS.', subtitle: 'Coast to ridge. Build to drive.',
  camera: [4.6, 2.45, -4.3], target: [-1.0, 1.25, .7],
  plateUrl: '/assets/p10b/tour-wall-plate.png', detailUrl: '/assets/p10b/tour-wall-details.glb',
} as const;

/** Bake to PMREM once on entry. Cards are reflections, never another car/room. */
export function createStudioReflectionEnvironment() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(.075, .085, .10);
  const shell = new THREE.Mesh(new THREE.BoxGeometry(24, 16, 26), new THREE.MeshBasicMaterial({ color: new THREE.Color(.065, .075, .085), side: THREE.BackSide }));
  shell.position.y = 4; scene.add(shell);
  const card = (name: string, position: number[], size: [number, number], strength: number, target: number[]) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...size), new THREE.MeshBasicMaterial({ color: new THREE.Color(strength, strength, strength), side: THREE.DoubleSide }));
    mesh.name = name; mesh.position.fromArray(position); mesh.lookAt(new THREE.Vector3().fromArray(target)); scene.add(mesh);
  };
  card('long neutral hood softbox', [-2.3, 5.8, -1.7], [2.1, 7.5], 4.2, [0, .7, 0]);
  card('passenger shoulder strip', [3.2, 4.0, .9], [1.1, 6.5], 2.6, [0, .7, 0]);
  card('front low fill card', [0, 2.2, -6.5], [7.5, 1.4], .85, [0, .7, 0]);
  card('rear separation card', [0, 3.6, 6], [6.0, 1.1], 1.75, [0, .8, 0]);
  card('driver tire fill', [-5, 1.5, 0], [4, 1.1], .65, [0, .5, 0]);
  return scene;
}

/** A single static occlusion draw below the preserved cabinet/lift footprints.
 * This is an authored contact cue, not a claim of measured real-world lighting. */
export function createStudioContactOcclusion() {
  const size = 64, pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const edge = Math.max(Math.abs((x + .5) / size * 2 - 1), Math.abs((y + .5) / size * 2 - 1));
    pixels[(y * size + x) * 4 + 3] = Math.round(90 * Math.pow(Math.max(0, 1 - edge * edge), 1.5));
  }
  const texture = new THREE.DataTexture(pixels, size, size); texture.needsUpdate = true; texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearFilter;
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const boxes = [[0, 6.48, 10.9, 1.5], [3.36, 3.48, .8, .8], [5.62, 3.48, .8, .8], [3.36, 6.45, .8, .8], [5.62, 6.45, .8, .8]];
  for (const [x, z, w, d] of boxes) {
    const start = positions.length / 3;
    positions.push(x-w/2,.022,z-d/2,x-w/2,.022,z+d/2,x+w/2,.022,z+d/2,x+w/2,.022,z-d/2);
    uvs.push(0,0,0,1,1,1,1,0); indices.push(start,start+1,start+2,start,start+2,start+3);
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, toneMapped: false }));
  mesh.name = 'showroom_baked_contact_cues'; return mesh;
}

/** Optional art fails independently. Both successes and partial failures own disposal. */
export async function loadTourWall(loader = new GLTFLoader()) {
  const group = new THREE.Group(); group.name = 'P10B_Tour_Wall';
  const textureLoader = new THREE.TextureLoader();
  const results = await Promise.allSettled([textureLoader.loadAsync(TOUR_WALL.plateUrl), loader.loadAsync(TOUR_WALL.detailUrl)]);
  const tex = results[0].status === 'fulfilled' ? results[0].value : null;
  if (tex) { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; }
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(TOUR_WALL.width, TOUR_WALL.height), new THREE.MeshStandardMaterial({ map: tex, color: tex ? 0xffffff : 0x242b30, roughness: .93, metalness: 0, envMapIntensity: .2 }));
  plate.name = 'matte_coast_to_ridge_print'; plate.position.fromArray(TOUR_WALL.center); plate.rotation.y = Math.PI / 2; plate.receiveShadow = true; group.add(plate);
  if (results[1].status === 'fulfilled') group.add(results[1].value.scene);
  const wash = new THREE.SpotLight(0xffebd4, STUDIO_LOOKS.studio.wallWash, 7, Math.PI * .47, 1, 2);
  wash.name = 'Tour Wall warm practical wash'; wash.position.set(-4.7, 3.9, 1.2); wash.target.position.set(-5.855, 2.0, 1.2); group.add(wash, wash.target);
  group.userData.p10b = { placement: TOUR_WALL, plateLoaded: !!tex, detailLoaded: results[1].status === 'fulfilled', fallback: !tex || results[1].status !== 'fulfilled', noEmissionOnPrint: true };
  let disposed = false;
  return { group, setLook(look: StudioLook) { wash.intensity = STUDIO_LOOKS[look].wallWash; }, inspect() { return { ...group.userData.p10b, disposed }; }, dispose() {
    if (disposed) return; disposed = true; group.removeFromParent();
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
    group.traverse(o => { if (o instanceof THREE.Mesh) { geometries.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : [o.material]) { materials.add(m); for (const value of Object.values(m)) if (value instanceof THREE.Texture) textures.add(value); } } });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); wash.dispose();
  } };
}
