"""Original compact harbor PBR images; no downloaded texture content."""
import bpy,numpy as np,pathlib,json,hashlib

def author_materials(P,mats):
 out=P/'public/assets/harbor/textures';out.mkdir(parents=True,exist_ok=True);N=1024;y,x=np.mgrid[0:N,0:N];rng=np.random.default_rng(406);noise=rng.random((N,N)).astype(np.float32);grain=(noise-.5);manifest=[];sets={}
 for family in ['asphalt','concrete','harbor']:
  bc=np.zeros((N,N,4),np.float32);bc[:,:,3]=1;rough=np.ones((N,N),np.float32)*.82;metal=np.zeros_like(rough);nx=grain*.13;ny=np.roll(grain,1,axis=1)*.13
  if family=='asphalt':
   coarse=(np.sin(x*.037)+np.cos(y*.031)+np.sin((x+y)*.019))*.009;v=.205+grain*.075+coarse;aggregate=noise>.967;v[aggregate]+=.045;bc[:,:,:3]=np.stack((v*.96,v*.99,v*1.02),axis=-1);rough=.89+grain*.08;nx=grain*.21;ny=np.roll(grain,1,axis=1)*.21
  elif family=='concrete':
   cloud=(np.sin(x*.019)*np.sin(y*.021)+np.cos(x*.047+y*.039))*.013;v=.59+grain*.055+cloud;seam=(x<3)|(y<3);v[seam]*=.75;bc[:,:,:3]=np.stack((v*1.02,v,v*.955),axis=-1);rough=.84+grain*.06;nx=grain*.075;ny=np.roll(grain,1,axis=0)*.075
  else:
   # Four-by-two padded material tiles: wall, roof, red, timber, foliage, water, ground, glass.
   colors=[(.59,.62,.61),(.23,.27,.29),(.43,.105,.085),(.43,.30,.19),(.20,.32,.135),(.10,.27,.29),(.27,.32,.19),(.12,.23,.28)]
   for j,color in enumerate(colors):
    tx=j%4;ty=j//4;mask=(x>=tx*256)&(x<(tx+1)*256)&(y>=ty*512)&(y<(ty+1)*512);xx=x[mask]%256;yy=y[mask]%512;g=grain[mask];variation=g*.025
    if j in [0,1,2]:variation+=.027*np.sin(xx*math_tau/24);rough[mask]=.68 if j==0 else .49;metal[mask]=.05 if j==0 else .55;nx[mask]=.075*np.cos(xx*math_tau/24);ny[mask]=g*.015
    elif j==3:variation+=.05*np.sin(yy*.042+np.sin(xx*.04)*2)+.022*np.sin(yy*.2);rough[mask]=.84;nx[mask]=.02*np.sin(yy*.16);ny[mask]=.075*np.cos(yy*.16)
    elif j==4:variation+=.025*np.sin(yy*.07);rough[mask]=.91;nx[mask]=.015*np.sin(xx*.15);ny[mask]=.03*np.sin(yy*.15)
    elif j==5:variation+=.015*np.sin(xx*.07+np.sin(yy*.033));rough[mask]=.28;metal[mask]=.20;nx[mask]=.12*np.cos(xx*.07+np.sin(yy*.033));ny[mask]=.09*np.sin(yy*.062+np.cos(xx*.028))
    elif j==6:variation+=.02*np.sin(xx*.11)*np.sin(yy*.06);rough[mask]=.96;nx[mask]=g*.12;ny[mask]=np.sin(xx)*.03
    else:variation*=.05;rough[mask]=.24;metal[mask]=.2;nx[mask]=0;ny[mask]=0
    bc[mask,:3]=np.array(color)+variation[:,None]
  normal=np.stack((nx*.5+.5,ny*.5+.5,np.sqrt(np.maximum(0,1-nx*nx-ny*ny))*.5+.5,np.ones_like(nx)),axis=-1);orm=np.stack((np.ones_like(rough),rough,metal,np.ones_like(rough)),axis=-1);ims={}
  for role,arr,space in [('basecolor',bc,'sRGB'),('normal',normal,'Non-Color'),('orm',orm,'Non-Color')]:
   im=bpy.data.images.new(f'Harbor_{family}_{role}',width=N,height=N,alpha=True);im.colorspace_settings.name=space;im.pixels.foreach_set(np.clip(arr,0,1).astype(np.float32).ravel());im.filepath_raw=str(out/f'{family}_{role}.png');im.file_format='PNG';im.save();im.pack();ims[role]=im;p=pathlib.Path(im.filepath_raw);manifest.append(dict(path=str(p.relative_to(P)),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),size=[N,N],colorSpace=space))
  sets[family]=ims
 for name,(mat,family) in mats.items():
  nt=mat.node_tree;bs=nt.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(1,1,1,1);bs.inputs['Roughness'].default_value=1;bs.inputs['Metallic'].default_value=1;nodes={}
  for k,im in sets[family].items():node=nt.nodes.new('ShaderNodeTexImage');node.image=im;node.interpolation='Linear';nodes[k]=node
  nt.links.new(nodes['basecolor'].outputs['Color'],bs.inputs['Base Color']);sep=nt.nodes.new('ShaderNodeSeparateColor');nt.links.new(nodes['orm'].outputs['Color'],sep.inputs['Color']);nt.links.new(sep.outputs['Green'],bs.inputs['Roughness']);nt.links.new(sep.outputs['Blue'],bs.inputs['Metallic']);nm=nt.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.7;nt.links.new(nodes['normal'].outputs['Color'],nm.inputs['Color']);nt.links.new(nm.outputs['Normal'],bs.inputs['Normal'])
 report=dict(provenance='Original deterministic numpy procedural maps authored and packed by Blender; no external imagery',files=manifest,uniqueImageCount=9,decodedRGBA8BaseBytes=9*N*N*4,decodedRGBA8WithMipsBytes=9*N*N*4*4//3,limits=['Unique-image estimate; runtime shared texture-object allocation measured separately','No wet-road shader or day/night friction change'])
 (P/'director-kit/production/evidence/P04A/artist/texture-manifest.json').write_text(json.dumps(report,indent=2))
math_tau=6.283185307179586
