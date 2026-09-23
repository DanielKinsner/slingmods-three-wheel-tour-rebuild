import * as THREE from 'three';
import {RenderPipeline} from '../presentation/render-pipeline';
import type {GraphicsQuality} from '../presentation/graphics-settings';

/** Preserve composition, cap export at 4K/8.3 MP and obey the GPU's render-target limit. */
export function photoDimensions(width:number,height:number,maxSize=4096){
 const aspect=width/height;
 const scale=Math.min(3840/width,2160/height,maxSize/width,maxSize/height);
 return {width:Math.max(2,Math.round(width*scale)),height:Math.max(2,Math.round(height*scale)),aspect};
}

/** A one-shot full-resolution render. No simulation step, quality preference change or persistent large targets. */
export function capturePhoto(renderer:THREE.WebGLRenderer,quality:GraphicsQuality,draw:(pipeline:RenderPipeline)=>void){
 const size=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio(),target=renderer.getRenderTarget();
 const canvas=renderer.domElement,gl=renderer.getContext();
 const dimensions=photoDimensions(size.x,size.y,Math.min(renderer.capabilities.maxTextureSize,gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)));
 let pipeline:RenderPipeline|undefined;
 try {
  renderer.setPixelRatio(1);renderer.setSize(dimensions.width,dimensions.height,false);
  pipeline=new RenderPipeline(renderer,quality);draw(pipeline);
  // toBlob snapshots the bitmap at invocation; restore the interactive renderer before yielding to another frame.
  return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Photo encoding failed')),'image/png'));
 } finally {
  pipeline?.dispose();renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);renderer.setRenderTarget(target);
 }
}
