import * as THREE from 'three';
/** Keep cockpit near clipping while retaining sub-metre shore/terrain depth precision.
 * EXT_clip_control uses reversed depth; other WebGL2 implementations use log depth. */
export function createHarborRenderer(preserveDrawingBuffer=false,forceLogarithmic=false){
 const canvas=document.createElement('canvas');
 const context=canvas.getContext('webgl2',{alpha:false,depth:true,stencil:false,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer});
 if(!context)throw new Error('WebGL2 is required for the Harbor renderer');
 const reversed=!forceLogarithmic&&!!context.getExtension('EXT_clip_control');
 return new THREE.WebGLRenderer({canvas,context,antialias:true,preserveDrawingBuffer,reversedDepthBuffer:reversed,logarithmicDepthBuffer:!reversed});
}
export function harborDepth(renderer:THREE.WebGLRenderer){return{reversed:renderer.capabilities.reversedDepthBuffer,logarithmic:renderer.capabilities.logarithmicDepthBuffer,method:renderer.capabilities.reversedDepthBuffer?'EXT_clip_control reversed depth':'WebGL2 logarithmic depth fallback',cockpitNearMetres:.06};}
