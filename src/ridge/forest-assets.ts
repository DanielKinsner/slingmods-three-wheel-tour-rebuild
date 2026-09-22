/** Optional P11 dressing; the original Ridge remains playable when unavailable. */
export const FOREST_SPECIES=['oak','sycamore'] as const;
export const TREE_ROOT='/assets/p11/ridge-trees/',GROUND_ROOT='/assets/p11/ground-cover/';
/** The original GLBs name PNG masters. All forest materials are replaced with KTX2 below. */
export const forestGLTFURL=(url:string)=>/shared-textures\/[0-9a-f]{64}\.png$/.test(url)?'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=':url;
export function forestAssetURLs(){return [
 ...FOREST_SPECIES.flatMap(s=>[...[0,1,2].map(l=>TREE_ROOT+s+'-lod'+l+'.glb'),...['bark-baseColor','bark-normal','leaves-baseColor','imposter-baseColor'].map(t=>TREE_ROOT+s+'-'+t+'.ktx2'),TREE_ROOT+s+'-imposter.json']),
 ...['cards-baseColor','leaf-litter-baseColor','leaf-litter-normal','shaded-soil-baseColor','gravel-shoulder-baseColor','rocks-baseColor','rocks-normal'].map(t=>GROUND_ROOT+t+'.ktx2'),
 ...[0,1].map(i=>GROUND_ROOT+'rock-'+i+'-lod1.glb')];}
