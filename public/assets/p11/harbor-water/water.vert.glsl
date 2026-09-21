uniform float time;
varying vec3 vWorld;
varying vec4 vClip;
void main() {
  vec3 p=position;
  vec4 world=modelMatrix*vec4(p,1.0);
  world.y+=0.035*sin(dot(world.xz,vec2(1.5,0.4))+time*0.8)
          +0.021*sin(dot(world.xz,vec2(-0.7,1.3))+time*0.57);
  vWorld=world.xyz;
  vClip=projectionMatrix*viewMatrix*world;
  gl_Position=vClip;
}
