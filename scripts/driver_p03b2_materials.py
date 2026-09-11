"""Original compact driver atlas; run inside driver build after fit approval."""
import bpy, numpy as np, pathlib, hashlib, json

def finish_driver(P,meshes,materials):
 out=P/'public/assets/drivers/textures';out.mkdir(parents=True,exist_ok=True)
 N=1024;y,x=np.mgrid[0:N,0:N];u=x/(N-1);v=y/(N-1)
 rng=np.random.default_rng(32024);noise=rng.normal(0,1,(N,N)).astype(np.float32)
 weave=np.sin(x*np.pi/2)*np.sin(y*np.pi/2);twill=np.sin((x+y)*np.pi/5)
 bc=np.zeros((N,N,4),np.float32);bc[:,:,:3]=np.array([57,62,67])/255;bc[:,:,:3]*=(1+(.045*weave+.016*twill+.012*noise))[:,:,None];bc[:,:,3]=1
 rough=np.clip(.86+.035*weave+.012*noise,0,1);metal=np.zeros((N,N),np.float32)
 nx=.095*np.cos(x*np.pi/2)*np.sin(y*np.pi/2);ny=.095*np.sin(x*np.pi/2)*np.cos(y*np.pi/2)
 def tile(v0,v1,color,r,m=0,grain=.015,normal=.035):
  mask=(u>.77)&(v>=v0)&(v<=v1)
  bc[mask,:3]=(np.array(color)/255)*(1+grain*noise[mask,None]);rough[mask]=np.clip(r+grain*noise[mask],0,1);metal[mask]=m
  nx[mask]=normal*np.sin(x[mask]*2.2)*np.cos(y[mask]*1.7);ny[mask]=normal*np.cos(x[mask]*1.5)*np.sin(y[mask]*1.8)
 tile(0,.42,[29,32,35],.64,grain=.035,normal=.075)
 tile(.43,.67,[62,66,71],.30,grain=.003,normal=.001)
 tile(.68,.82,[13,18,24],.15,.20,grain=.001,normal=0)
 tile(.83,1,[121,28,37],.80,grain=.025,normal=.06)
 nz=np.sqrt(np.maximum(0,1-nx*nx-ny*ny));normal=np.stack((nx*.5+.5,ny*.5+.5,nz*.5+.5,np.ones_like(nx)),axis=-1)
 orm=np.stack((np.ones_like(rough),rough,metal,np.ones_like(rough)),axis=-1)
 images={}
 for name,arr,space in [('basecolor',bc,'sRGB'),('normal',normal,'Non-Color'),('orm',orm,'Non-Color')]:
  im=bpy.data.images.new('Driver_Atlas_'+name,width=N,height=N,alpha=True);im.colorspace_settings.name=space;im.pixels.foreach_set(np.clip(arr,0,1).astype(np.float32).ravel());im.filepath_raw=str(out/(name+'.png'));im.file_format='PNG';im.save();im.pack();images[name]=im
 for mat in materials:
  nt=mat.node_tree;bs=nt.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(1,1,1,1);bs.inputs['Roughness'].default_value=1;bs.inputs['Metallic'].default_value=1
  nodes={}
  for k,im in images.items():
   node=nt.nodes.new('ShaderNodeTexImage');node.image=im;node.interpolation='Linear';nodes[k]=node
  nt.links.new(nodes['basecolor'].outputs['Color'],bs.inputs['Base Color']);sep=nt.nodes.new('ShaderNodeSeparateColor');nt.links.new(nodes['orm'].outputs['Color'],sep.inputs['Color']);nt.links.new(sep.outputs['Green'],bs.inputs['Roughness']);nt.links.new(sep.outputs['Blue'],bs.inputs['Metallic'])
  nm=nt.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=1;nt.links.new(nodes['normal'].outputs['Color'],nm.inputs['Color']);nt.links.new(nm.outputs['Normal'],bs.inputs['Normal'])
  if mat.name=='Driver_Helmet':bs.inputs['Coat Weight'].default_value=.35;bs.inputs['Coat Roughness'].default_value=.21
 for ob in list(meshes):
  if ob.name not in bpy.data.objects:continue
  mat=ob.data.materials[0].name
  if ob.get('atlas_accent'):rect=(.79,.98,.85,.98)
  elif mat=='Driver_Textile':rect=(.015,.75,.015,.985)
  elif mat=='Driver_Leather':rect=(.79,.98,.015,.40)
  elif mat=='Driver_Helmet':rect=(.79,.98,.45,.65)
  else:rect=(.79,.98,.70,.80)
  a,b,c,d=rect
  for p in ob.data.polygons:
   # One restrained center stripe uses the same red tile and existing polygons.
   red=(mat=='Driver_Helmet' and abs(p.center.x+.36)<.012 and p.center.z>1.17)
   for li in p.loop_indices:
    uv=ob.data.uv_layers.active.data[li].uv
    if red:uv.x=.79+uv.x*.19;uv.y=.85+uv.y*.13
    else:uv.x=a+uv.x*(b-a);uv.y=c+uv.y*(d-c)
 report={'author':'Original deterministic procedural textile/leather/paint atlas authored locally in Blender; no external imagery','dimensions':[1024,1024],'images':{k:{'path':str(pathlib.Path(im.filepath_raw).relative_to(P)),'sha256':hashlib.sha256(pathlib.Path(im.filepath_raw).read_bytes()).hexdigest(),'bytes':pathlib.Path(im.filepath_raw).stat().st_size,'colorSpace':im.colorspace_settings.name}for k,im in images.items()},'decodedRGBA8BaseBytes':3*N*N*4,'decodedRGBA8WithMipsBytes':3*N*N*4*4//3,'limits':['Memory is unique image estimate; runtime texture objects may duplicate shared images','No external likeness, scan, OEM branding or fabric source','Fit geometry unchanged; seam piping uses already approved geometry']}
 (P/'director-kit/production/evidence/P03B2/artist/texture-manifest.json').write_text(json.dumps(report,indent=2))

