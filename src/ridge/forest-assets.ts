/** Optional P11 dressing; the original Ridge remains playable when unavailable. */
import {sceneryGeometryURL} from '../presentation/p11-assets';
export const FOREST_SPECIES=['oak','sycamore'] as const;
export const TREE_ROOT='/assets/p11/ridge-trees/',GROUND_ROOT='/assets/p11/ground-cover/';
export function forestAssetURLs(){return [
 ...FOREST_SPECIES.flatMap(s=>[...[0,1,2].map(l=>sceneryGeometryURL(TREE_ROOT+s+'-lod'+l+'.glb')),...['bark-baseColor','bark-normal','leaves-baseColor','imposter-baseColor'].map(t=>TREE_ROOT+s+'-'+t+'.ktx2'),TREE_ROOT+s+'-imposter.json']),
 ...['cards-baseColor','leaf-litter-baseColor','leaf-litter-normal','shaded-soil-baseColor','gravel-shoulder-baseColor','rocks-baseColor','rocks-normal'].map(t=>GROUND_ROOT+t+'.ktx2'),
 ...[0,1].map(i=>sceneryGeometryURL(GROUND_ROOT+'rock-'+i+'-lod1.glb'))];}
