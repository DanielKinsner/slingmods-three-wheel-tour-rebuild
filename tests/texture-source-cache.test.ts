import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {TextureSourceCache} from '../src/presentation/texture-source-cache';

test('concurrent texture users decode once and share mip data, with independent UV/sampler state', async () => {
 let calls = 0;
 const original = new THREE.CompressedTexture([{data: new Uint8Array(16), width: 4, height: 4}], 4, 4);
 const cache = new TextureSourceCache(async () => {calls++; return original;});
 const [road, wall] = await Promise.all([cache.load('scan.ktx2'), cache.load('scan.ktx2')]);
 assert.equal(calls, 1); assert.notEqual(road, wall); assert.equal(road.source, wall.source);
 assert.equal(road.mipmaps[0].data, wall.mipmaps[0].data);
 road.repeat.set(12, 3); road.colorSpace = THREE.SRGBColorSpace; road.wrapS = THREE.RepeatWrapping;
 assert.deepEqual(wall.repeat.toArray(), [1, 1]); assert.equal(wall.colorSpace, THREE.NoColorSpace);
 assert.equal(wall.wrapS, THREE.ClampToEdgeWrapping);
 let wallDisposed = 0; wall.addEventListener('dispose', () => wallDisposed++);
 road.dispose(); assert.equal(wallDisposed, 0, 'another scene still owns its texture');
 const later = await cache.load('scan.ktx2'); assert.equal(later.source, wall.source); assert.equal(calls, 1);
 await cache.load('scan.half.ktx2'); assert.equal(calls, 2, 'quality variants have independent data');
 assert.deepEqual(cache.inspect(), {urls: 2, requests: 4, reused: 2});
 cache.dispose(); assert.equal(wallDisposed, 0, 'caller disposes live textures'); wall.dispose(); later.dispose();
});

test('a failed decode is retryable and concurrent callers see the same failure', async () => {
 let calls = 0;
 const cache = new TextureSourceCache(async () => {if (++calls === 1) throw Error('offline'); return new THREE.Texture();});
 const failed = await Promise.allSettled([cache.load('a'), cache.load('a')]);
 assert.ok(failed.every(x => x.status === 'rejected')); assert.equal(calls, 1);
 (await cache.load('a')).dispose(); assert.equal(calls, 2); cache.dispose();
});

test('disposal releases a late decode once and prevents abandoned loads from escaping', async () => {
 let resolve!: (t: THREE.Texture) => void;
 const cache = new TextureSourceCache(() => new Promise<THREE.Texture>(r => resolve = r));
 const load = cache.load('late'); const rejected = assert.rejects(load, /after cache disposal/);
 cache.dispose(); cache.dispose();
 let disposed = 0; const texture = new THREE.Texture(); texture.addEventListener('dispose', () => disposed++);
 resolve(texture); await rejected; assert.equal(disposed, 1);
 await assert.rejects(cache.load('new'), /disposed/);
});
