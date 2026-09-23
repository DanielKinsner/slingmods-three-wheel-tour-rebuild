import * as THREE from 'three';
export interface CinemaLook {amount:number;focus:number;aperture:number;time:number}
/** Extends the existing composite, not another full-resolution render pass.
 * All extra texture reads sit inside a uniform branch that is off during driving. */
export const CINEMA_UNIFORMS = () => ({cinema:{value:new THREE.Vector4()},cinemaDepth:{value:null},cinemaDepthMode:{value:0},cinemaRange:{value:new THREE.Vector2(.06,2200)},cinemaTexel:{value:new THREE.Vector2(1/1920,1/1080)}});
export const CINEMA_DECLARATIONS = `
uniform vec4 cinema;
uniform sampler2D cinemaDepth;
uniform float cinemaDepthMode;
uniform vec2 cinemaRange;
uniform vec2 cinemaTexel;
float filmDepth(vec2 uv){float d=texture2D(cinemaDepth,clamp(uv,vec2(.001),vec2(.999))*uvScale).x;if(cinemaDepthMode>1.5)return exp2(d*log2(cinemaRange.y+1.))-1.;if(cinemaDepthMode>.5)d=1.-d;return cinemaRange.x*cinemaRange.y/(cinemaRange.y-d*(cinemaRange.y-cinemaRange.x));}
float filmHash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
`;
export const CINEMA_COMPOSITE = `
if(cinema.x>.001){
 float depth=filmDepth(vUv),coc=clamp(abs(depth-cinema.y)/max(depth,.1)*cinema.z,0.,1.);
 vec3 soft=colour;float total=1.;
 // Depth-aware disk: keep the foreground vehicle from bleeding into the sky.
 for(int i=0;i<12;i++){
  float a=float(i)*2.39996323;vec2 offset=vec2(cos(a),sin(a))*sqrt((float(i)+.5)/12.)*cinemaTexel*7.*coc;
  float d=filmDepth(vUv+offset);float w=smoothstep(.0,.6,d/max(depth,.001));
  soft+=scene(vUv+offset)*w;total+=w;
 }
 colour=mix(colour,soft/total,coc*.78);
 // Anamorphic halation comes only from highlights already isolated by bloom.
 vec3 streak=vec3(0.);
 for(int i=1;i<=6;i++){float f=float(i);vec2 d=vec2(f*f*.0016,0.);streak+=(texture2D(tBloom,clamp(vUv+d,0.,1.)).rgb+texture2D(tBloom,clamp(vUv-d,0.,1.)).rgb)/(f+2.);}
 colour+=streak*.12*cinema.x;
 float edge=smoothstep(.24,.85,length((vUv-.5)*vec2(1.,.8)));
 colour*=1.-edge*.27*cinema.x;
 float grain=(filmHash(floor(vUv/cinemaTexel)+floor(cinema.w*24.))-0.5)*.013;
 colour=max(vec3(0.),colour+grain*sqrt(max(colour,vec3(.002)))*cinema.x);
}
`;
