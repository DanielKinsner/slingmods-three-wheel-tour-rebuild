"""Three-level tree skeletons, leaf-card LODs and wind attributes. Background Blender."""
import bpy,math,random,json
import runpy
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/assets/p11/ridge-trees';SRC=ROOT/'assets/p11'
bind_pbr=runpy.run_path(str(ROOT/'scripts/p11/blender-materials.py'))['bind_pbr']
bpy.ops.wm.read_factory_settings(use_empty=True)
records=[]
for si,species in enumerate(['oak','sycamore','eucalyptus']):
 for lod,target in enumerate([12000,3000,600]):
  bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);rng=random.Random(900+si)
  height=[10,14,18][si];spread=[4.8,4.3,3.5][si]
  bark=bpy.data.materials.new(species+' bark');bark.use_nodes=True;p=bark.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=[(.16,.1,.055,1),(.45,.42,.34,1),(.49,.45,.36,1)][si];p.inputs['Roughness'].default_value=.9
  bind_pbr(bark,OUT,species+'-bark')
  image=bpy.data.images.load(str(OUT/(species+'-leaves-baseColor.png')),check_existing=True)
  leaf=bpy.data.materials.new(species+' leaf card');leaf.use_nodes=True;p=leaf.node_tree.nodes.get('Principled BSDF');tex=leaf.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
  leaf.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);leaf.node_tree.links.new(tex.outputs['Alpha'],p.inputs['Alpha']);p.inputs['Roughness'].default_value=.65;leaf.surface_render_method='DITHERED';leaf.use_backface_culling=False
  verts=[];faces=[];uvs=[];winds=[];ends=[]
  def tube(a,b,ra,rb,level):
   a,b=Vector(a),Vector(b);axis=(b-a).normalized();u=axis.cross(Vector((0,1,0))).normalized();v=axis.cross(u);base=len(verts);n=6 if lod==0 else 4
   for ring,(c,r) in enumerate([(a,ra),(b,rb)]):
    for j in range(n):
     pos=c+r*(u*math.cos(j*math.tau/n)+v*math.sin(j*math.tau/n));verts.append(tuple(pos));winds.append((min(1,pos.z/height),min(1,level/3),0,1))
   for j in range(n):faces.append((base+j,base+(j+1)%n,base+n+(j+1)%n,base+n+j));uvs.append([(j/n,0),((j+1)/n,0),((j+1)/n,(b-a).length/2),(j/n,(b-a).length/2)])
  tube((0,0,0),(.15,.1,height*.66),.32,.09,0)
  for j in range(14 if lod<2 else 5):
   f=j/(13 if lod<2 else 4);a=j*2.399+si;r=spread*math.sin(math.pi*(.15+.7*f))*(.85+.15*rng.random());start=(.1,0,height*(.22+.3*f));end=(math.cos(a)*r,math.sin(a)*r,height*(.4+.45*f));tube(start,end,.1,.035,1)
   for k in range(3 if lod<2 else 2):
    aa=a+(k-1)*.68;tip=(end[0]+math.cos(aa)*spread*.24,end[1]+math.sin(aa)*spread*.24,end[2]+height*.08);tube(end,tip,.035,.009,2)
    for q in range(2 if lod==0 else 1):
     twig=(tip[0]+rng.uniform(-.5,.5),tip[1]+rng.uniform(-.5,.5),tip[2]+rng.uniform(.2,.8));tube(tip,twig,.009,.003,3);ends.append(twig)
  mesh=bpy.data.meshes.new(species+' woody structure');mesh.from_pydata(verts,[],faces);mesh.materials.append(bark);uv=mesh.uv_layers.new(name='Bark metres')
  for polygon,coords in zip(mesh.polygons,uvs):
   for loop,co in zip(polygon.loop_indices,coords):uv.data[loop].uv=co
  wind=mesh.color_attributes.new(name='Wind',type='FLOAT_COLOR',domain='POINT')
  for i,c in enumerate(winds):wind.data[i].color=c
  o=bpy.data.objects.new(species+' trunk and branches',mesh);bpy.context.collection.objects.link(o)
  woody=sum(len(f)-2 for f in faces);cards=max(1,(target-woody)//2)
  vs=[];fs=[];cardUV=[];windData=[]
  for i in range(cards):
   end=ends[i%len(ends)];center=Vector(end)+Vector((rng.uniform(-1,1),rng.uniform(-1,1),rng.uniform(-.5,.7)));angle=rng.random()*math.tau;size=[.35,.6,1.15][lod];u=Vector((math.cos(angle),math.sin(angle),rng.uniform(-.5,.5)))*size;v=Vector((-u.y,u.x,size*.8));base=len(vs)
   for pos in [center-u-v,center+u-v,center+u+v,center-u+v]:vs.append(tuple(pos));windData.append((min(1,max(0,pos.z/height)),.8,1,1))
   fs.append((base,base+1,base+2,base+3));tile=rng.randrange(8);cx=tile%4;cy=tile//4
   cardUV.append([((cx+.025)/4,1-(cy+.975)/3),((cx+.975)/4,1-(cy+.975)/3),((cx+.975)/4,1-(cy+.025)/3),((cx+.025)/4,1-(cy+.025)/3)])
  mesh=bpy.data.meshes.new(species+' leaf cards');mesh.from_pydata(vs,[],fs);mesh.materials.append(leaf);uv=mesh.uv_layers.new(name='Leaf atlas')
  for poly,coords in zip(mesh.polygons,cardUV):
   for loop,co in zip(poly.loop_indices,coords):uv.data[loop].uv=co
  wind=mesh.color_attributes.new(name='Wind',type='FLOAT_COLOR',domain='POINT')
  for i,c in enumerate(windData):wind.data[i].color=c
  o=bpy.data.objects.new(species+' canopy',mesh);bpy.context.collection.objects.link(o)
  for ob in bpy.context.scene.objects:ob['windChannels']='Wind: R trunk sway; G branch motion; B leaf flutter';ob['physicalHeightMetres']=height
  name=f'{species}-lod{lod}'
  for im in bpy.data.images:
   if im.source=='FILE':
    absolute=bpy.path.abspath(im.filepath)
    if im.packed_file:im.unpack(method='REMOVE')
    im.filepath=bpy.path.relpath(absolute,start=str(SRC))
  bpy.ops.wm.save_as_mainfile(filepath=str(SRC/(name+'.blend')),compress=True)
  bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',export_yup=True,export_extras=True,export_vertex_color='NAME',export_vertex_color_name='Wind',export_all_vertex_colors=True)
  records.append({'file':name+'.glb','triangles':woody+cards*2,'leafCards':cards,'nominalHeightMetres':height})
(OUT/'trees.json').write_text(json.dumps({'models':records,'pending':['Bark PBR textures','Leaf normal/roughness/translucency data','Wind shader must consume attributes without tinting albedo','Eight-direction octahedral imposters','In-game golden-hour visual validation']},indent=2), encoding="utf-8")
print('Exported nine tree LODs')
