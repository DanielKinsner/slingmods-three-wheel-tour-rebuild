"""P04A2 surgical, idempotent palm/material pass from the preserved land-cut source.
Run Blender --background --python scripts/harbor_waterfront.py. Never rebuild route/land.
"""
import bpy,bmesh,math,json,hashlib,pathlib,struct,numpy as np
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P04A2';O=P/'public/assets/harbor';B=P/'assets/blender/harbor';E.mkdir(exist_ok=True,parents=True)
route_bytes=(O/'route.json').read_bytes();bpy.ops.wm.open_mainfile(filepath=str(B/'harbor-p04a.blend'))
def fingerprint(ob):
 return hashlib.sha256(json.dumps({'matrix':[list(r)for r in ob.matrix_world],'vertices':[list(v.co)for v in ob.data.vertices],'faces':[list(p.vertices)for p in ob.data.polygons]},sort_keys=True).encode()).hexdigest()
protected={o.name:fingerprint(o)for o in bpy.data.objects if o.type=='MESH'and not o.name.endswith('_folded_fronds')};before_tris=sum(len(p.vertices)-2 for o in bpy.data.objects if o.type=='MESH'for p in o.data.polygons)
kit=bpy.data.materials['Harbor_Modular_Atlas'];crowns=[]
for index,old in enumerate(sorted([o for o in bpy.data.objects if o.name.endswith('_folded_fronds')],key=lambda o:o.name)):
 name=old.name;trunk=bpy.data.objects[name.replace('_folded_fronds','_tapered_trunk')];zmax=max(v.co.z for v in trunk.data.vertices);top=sum((v.co for v in trunk.data.vertices if abs(v.co.z-zmax)<.001),Vector())/7
 verts=[];faces=[];uvs=[];variant=index%3;phase=index*.713
 def add(p,uv):verts.append(tuple(p));uvs.append(uv);return len(verts)-1
 def leaf(points,widths):
  ids=[]
  for k,(p,w)in enumerate(zip(points,widths)):
   tangent=(points[min(k+1,len(points)-1)]-points[max(k-1,0)]).normalized();side=tangent.cross(Vector((0,0,1))).normalized();row=[]
   for j in [-1,1]:row.append(add(p+side*w*j+Vector((0,0,.018*(1-abs(j)))),((.025+.95*(j+1)/2)/4,(1.02+.96*k/(len(points)-1))/2)))
   ids.append(row)
  for a,b in zip(ids,ids[1:]):faces.append((a[0],b[0],b[1],a[1]))
 for j in range(11+variant):
  a=phase+j*math.tau/(11+variant)+.12*math.sin(j*2.7);direction=Vector((math.cos(a),math.sin(a),0));side=Vector((-math.sin(a),math.cos(a),0));length=3.15+.32*math.sin(j*1.8+variant);lift=.8+.2*math.cos(j);droop=1.15+.35*(j%3)/2
  if j>=9:length*=.64;lift=1.25;droop=-.15
  def stem(t):return top+direction*(length*t)+side*(.23*math.sin(math.pi*t)*(1 if j%2 else -1))+Vector((0,0,lift*math.sin(math.pi*t)-droop*t*t))
  leaf([stem(k/10)for k in range(11)],[.025*(1-k/11)for k in range(11)])
  for k in range(9):
   t=.13+k*.094;root=stem(t);span=.84*math.sin(math.pi*t)**.7
   for sg in [-1,1]:
    end=root+side*(span*sg)+direction*(.22+.16*t)+Vector((0,0,-.14-.14*t));mid=root.lerp(end,.5)+Vector((0,0,.07));leaf([root,root.lerp(mid,.65),mid.lerp(end,.6),end],[.014,.11*(1-.4*t),.055*(1-.4*t),.001])
 me=bpy.data.meshes.new(name+'_curved');me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);me.materials.append(kit);ob['construction']='Curved feather fronds; three deterministic crown variants; retained source trunk anchor';uv=me.uv_layers.new(name='UVMap')
 for poly in me.polygons:
  poly.use_smooth=True
  for li in poly.loop_indices:uv.data[li].uv=uvs[me.loops[li].vertex_index]
 bpy.data.objects.remove(old,do_unlink=True);ob.name=name;crowns.append({'name':name,'variant':variant,'triangles':sum(len(p.vertices)-2 for p in me.polygons)})
# Planar metres eliminate longitudinal strip UV compression and the closure wrap.
road=bpy.data.objects['road_closed_asphalt'];uv=road.data.uv_layers.active
for poly in road.data.polygons:
 for li in poly.loop_indices:
  v=road.data.vertices[road.data.loops[li].vertex_index].co;uv.data[li].uv=(v.x/2,v.y/2)
out=O/'textures/p04a2';out.mkdir(parents=True,exist_ok=True);manifest=[]
def image(name,arr,space):
 im=bpy.data.images.new(name,width=len(arr),height=len(arr),alpha=True);im.colorspace_settings.name=space;im.pixels.foreach_set(np.clip(arr,0,1).astype(np.float32).ravel());im.filepath_raw=str(out/(name+'.png'));im.file_format='PNG';im.save();im.pack();p=pathlib.Path(im.filepath_raw);manifest.append({'path':str(p.relative_to(P)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size':[len(arr),len(arr)]});return im
def material(name,family,base,grain_scale,roughness):
 n=1024;rng=np.random.default_rng(407+(0 if family=='asphalt'else 1));grain=rng.random((n,n)).astype(np.float32)-.5
 # Isotropic periodic low-frequency field: no sinusoidal directional bands.
 spectrum=np.fft.fft2(rng.normal(size=(n,n)));fy,fx=np.meshgrid(np.fft.fftfreq(n),np.fft.fftfreq(n),indexing='ij');cloud=np.fft.ifft2(spectrum*np.exp(-(fx*fx+fy*fy)/(2*.003**2))).real;cloud=cloud/max(float(cloud.std()),1e-9)
 v=base+grain*grain_scale+cloud*.0025;bc=np.stack((v*.97,v,v*1.015,np.ones_like(v)),axis=-1);rough=np.clip(roughness+grain*.045,.65,.98);nx=grain*.09;ny=np.roll(grain,1,axis=0)*.09
 normal=np.stack((.5+nx*.5,.5+ny*.5,.5+np.sqrt(1-nx*nx-ny*ny)*.5,np.ones_like(v)),axis=-1);orm=np.stack((np.ones_like(v),rough,np.zeros_like(v),np.ones_like(v)),axis=-1)
 ims={k:image(f'{family}_{k}',a,'sRGB'if k=='basecolor'else'Non-Color')for k,a in [('basecolor',bc),('normal',normal),('orm',orm)]};mat=bpy.data.materials[name];nt=mat.node_tree;bs=nt.nodes.get('Principled BSDF')
 for node in list(nt.nodes):
  if node.type not in ['BSDF_PRINCIPLED','OUTPUT_MATERIAL']:nt.nodes.remove(node)
 tex={}
 for k,im in ims.items():node=nt.nodes.new('ShaderNodeTexImage');node.image=im;node.interpolation='Linear';tex[k]=node
 nt.links.new(tex['basecolor'].outputs['Color'],bs.inputs['Base Color']);sep=nt.nodes.new('ShaderNodeSeparateColor');nt.links.new(tex['orm'].outputs['Color'],sep.inputs['Color']);nt.links.new(sep.outputs['Green'],bs.inputs['Roughness']);nt.links.new(sep.outputs['Blue'],bs.inputs['Metallic']);nm=nt.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.45;nt.links.new(tex['normal'].outputs['Color'],nm.inputs['Color']);nt.links.new(nm.outputs['Normal'],bs.inputs['Normal'])
 return ims
asphalt=material('Harbor_Asphalt','asphalt',.205,.05,.91);concrete=material('Harbor_Concrete','concrete',.58,.036,.89)
# Dry mineral paint stays legible; concrete roughness supplies subtle shared wear without new maps.
paint=bpy.data.materials['Harbor_Road_Paint'];bs=paint.node_tree.nodes['Principled BSDF'];bs.inputs['Roughness'].default_value=.9;tex=paint.node_tree.nodes.new('ShaderNodeTexImage');tex.image=concrete['orm'];sep=paint.node_tree.nodes.new('ShaderNodeSeparateColor');paint.node_tree.links.new(tex.outputs['Color'],sep.inputs['Color']);paint.node_tree.links.new(sep.outputs['Green'],bs.inputs['Roughness'])
assert all(fingerprint(bpy.data.objects[name])==value for name,value in protected.items()),'Protected geometry changed';assert (O/'route.json').read_bytes()==route_bytes
for ob in bpy.data.objects:
 if ob.type=='MESH'and ob.name.endswith('_folded_fronds'):
  bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(ob.data);bm.free()
bpy.context.scene['p04a2_source']='Surgical edit from harbor-p04a.blend with existing land exclusion preserved';bpy.ops.wm.save_as_mainfile(filepath=str(B/'harbor.blend'))
for mat in list(bpy.data.materials):
 obs=[o for o in bpy.data.objects if o.type=='MESH'and len(o.data.materials)and o.data.materials[0]==mat]
 if not obs:continue
 bpy.ops.object.select_all(action='DESELECT')
 for ob in obs:ob.select_set(True)
 bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();bpy.context.object.name=mat.name
bpy.ops.export_scene.gltf(filepath=str(O/'harbor.glb'),export_format='GLB',export_yup=True,export_animations=False)
raw=(O/'harbor.glb').read_bytes();g=json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]]);report={'routeSHA256':hashlib.sha256(route_bytes).hexdigest(),'routeBytesUnchanged':True,'protectedMeshCount':len(protected),'protectedMeshGeometryExact':True,'protectedGeometryHashes':protected,'crowns':crowns,'beforeSourceTriangles':before_tris,'afterExportTriangles':sum(g['accessors'][p['indices']]['count']//3 for m in g['meshes']for p in m['primitives']),'primitives':sum(len(m['primitives'])for m in g['meshes']),'materials':len(g['materials']),'images':len(g['images']),'maps':manifest,'files':{str(p.relative_to(P)):{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in [B/'harbor.blend',O/'harbor.glb']},'worldScaleAsphaltTileMetres':2,'status':'Exported surgical candidate; runtime visual review separate'};(E/'waterfront01-export.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items()if k not in ['protectedGeometryHashes','crowns']}))
