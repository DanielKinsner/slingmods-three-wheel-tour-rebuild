import type {Texture} from 'three';

/** Decode each URL once, but give every material its own sampler/UV state and disposal lifetime. */
export class TextureSourceCache<T extends Texture> {
 private entries = new Map<string, Promise<T>>();
 private closed = false;
 private requests = 0;
 private reused = 0;
 constructor(private readonly decode: (url: string) => Promise<T>) {}

 async load(url: string): Promise<T> {
  if (this.closed) throw Error('Texture cache disposed');
  this.requests++;
  let entry = this.entries.get(url);
  if (entry) this.reused++;
  else {
   entry = this.decode(url).then(texture => {
    if (this.closed) { texture.dispose(); throw Error('Texture arrived after cache disposal'); }
    return texture;
   }).catch(error => {
    // A failed optional load must be retryable. Never evict a newer request for the same URL.
    if (this.entries.get(url) === entry) this.entries.delete(url);
    throw error;
   });
   this.entries.set(url, entry);
  }
  const source = await entry;
  if (this.closed) throw Error('Texture cache disposed');
  // Three shares the immutable image/mips through Source. Compatible samplers also share the GPU upload.
  // repeat, offset, colour space and wrap mode belong to the clone, never to the cached template.
  return source.clone() as T;
 }

 inspect() { return {urls: this.entries.size, requests: this.requests, reused: this.reused}; }
 dispose() {
  if (this.closed) return;
  this.closed = true;
  for (const entry of this.entries.values()) void entry.then(texture => texture.dispose(), () => {});
  this.entries.clear();
 }
}
