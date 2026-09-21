import * as THREE from 'three';
/** GLSL harbor water for a subdivided XZ surface.
 * sceneDepth: opaque-scene depth texture from the same camera/viewport, before water.
 * environmentCube: CubeTexture (a PMREM CubeUV texture is a different sampler).
 * Perspective, conventional non-reversed depth. Rebind sceneDepth after resize.
 */
export async function createHarborWater({sceneDepth,environmentCube,camera,baseURL=new URL('./',import.meta.url),sunDirection=new THREE.Vector3(.8,.14,-.58),sunColor=new THREE.Color(1,.75,.46),sunIntensity=3}={}){
 if(!sceneDepth||!environmentCube||!camera?.isPerspectiveCamera)throw new Error('Opaque depth, cubemap and perspective camera required');
 const loader=new THREE.TextureLoader(),textures=[];
 const read=async name=>{const r=await fetch(new URL(name,baseURL));if(!r.ok)throw new Error('Water shader load failed: '+name);return r.text();};
 const pending=[loader.loadAsync(new URL('swell-normal.png',baseURL).href),loader.loadAsync(new URL('chop-normal.png',baseURL).href),loader.loadAsync(new URL('foam.png',baseURL).href),loader.loadAsync(new URL('depth-color-lut.png',baseURL).href),read('water.vert.glsl'),read('water.frag.glsl')];
 const results=await Promise.allSettled(pending);for(const r of results)if(r.status==='fulfilled'&&r.value?.isTexture)textures.push(r.value);
 const failed=results.find(r=>r.status==='rejected');if(failed){textures.forEach(t=>t.dispose());throw failed.reason;}
 const [swell,chop,foam,lut,vertexShader,fragmentShader]=results.map(r=>r.value);
 for(const t of[swell,chop,foam]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.NoColorSpace;}
 lut.colorSpace=THREE.SRGBColorSpace;lut.generateMipmaps=false;lut.minFilter=lut.magFilter=THREE.LinearFilter;
 const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms:{swellNormal:{value:swell},chopNormal:{value:chop},foamMap:{value:foam},depthLut:{value:lut},sceneDepth:{value:sceneDepth},envMap:{value:environmentCube},time:{value:0},cameraNear:{value:camera.near},cameraFar:{value:camera.far},sunDirection:{value:sunDirection.clone().normalize()},sunColor:{value:sunColor.clone()},sunIntensity:{value:sunIntensity},nightMix:{value:0},nightLightPosition:{value:Array.from({length:4},()=>new THREE.Vector3())},nightLightColor:{value:Array.from({length:4},()=>new THREE.Color(0,0,0))}}});
 return{material,update(seconds){material.uniforms.time.value=seconds;material.uniforms.cameraNear.value=camera.near;material.uniforms.cameraFar.value=camera.far;},dispose(){material.dispose();textures.forEach(t=>t.dispose());}};
}
