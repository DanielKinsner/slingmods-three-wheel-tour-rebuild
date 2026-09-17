from pathlib import Path
import bpy, json, math
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
vehicle=bpy.data.collections.new('SLINGSHOT | Vehicle');scene.collection.children.link(vehicle)
studio=bpy.data.collections.new('STUDIO | Preview only');scene.collection.children.link(studio)
def link_obj(name,data,col=vehicle):
 o=bpy.data.objects.new(name,data);col.objects.link(o);return o
root=link_obj('Slingshot',None)
root['source']='Reconstructed from user-supplied Slingshot 3D Model.rar'
root['units']='meters; Blender +Z up, -Y forward; GLB +Y up, +Z forward'
# Recover original rest transforms. DisUnity OBJ mirrored Unity X.
a=json.loads((ROOT/'source/original-avatar.json').read_text());av=a['m_Avatar'];sk=av['m_AvatarSkeleton']['data'];names=dict(a['m_TOS']);pose=av['m_DefaultPose']['data']['m_X'];pos={};world=[]
for i,(h,p) in enumerate(zip(sk['m_ID'],pose)):
 t=Vector((-p['t']['x'],p['t']['y'],p['t']['z']));par=sk['m_Node'][i]['m_ParentId'];w=t+(world[par] if par>=0 else Vector());world.append(w);pos[names[h].split('/')[-1]]=w
shift=Vector((0,-1.60,-0.1449274868))
def conv(v):return Vector((v[0],-v[2],v[1]))
def mat(name,texture=None,color=(.12,.12,.12,1),metal=0,rough=.4,coat=0,alpha=False,normal=False):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;links=m.node_tree.links;p=n.get('Principled BSDF');p.inputs['Base Color'].default_value=color;p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;p.inputs['Coat Weight'].default_value=coat
 m.diffuse_color=color
 if texture:
  tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'textures'/f'{texture}.png'),check_existing=True);links.new(tex.outputs['Color'],p.inputs['Base Color'])
  if alpha:links.new(tex.outputs['Alpha'],p.inputs['Alpha']);m.blend_method='HASHED'
 if normal:
  tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'textures/Slingshot_TireDisplacement.png'),check_existing=True);tex.image.colorspace_settings.name='Non-Color';nm=n.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.7;links.new(tex.outputs['Color'],nm.inputs['Color']);links.new(nm.outputs['Normal'],p.inputs['Normal'])
 return m
paint=mat('Paint | SlingMods Red','Paint-Red',metal=.28,rough=.25,coat=.5)
graphite=mat('Body | Graphite','Body-Graphite',metal=.15,rough=.37)
bodydetail=mat('Body | Original detail','Slingshot_BodyDetailAO',metal=.45,rough=.29)
interior=mat('Interior | Upholstery','Slingshot_InteriorAO',rough=.68)
interiorpaint=mat('Interior | Red trim','Interior-Paint',rough=.3,coat=.4)
idetail=mat('Interior | Instruments','Slingshot_InteriorDetailAO',rough=.4)
ired=mat('Interior | Painted console','Interior-Red',rough=.3,coat=.4)
wheel=mat('Wheels | Machined alloy','Slingshot_WheelAO',metal=.8,rough=.26)
tire=mat('Tires | Rubber',color=(.018,.019,.021,1),rough=.77,normal=True)
frame=mat('Frame | Textured metal','Slingshot_Frame1AO',metal=.55,rough=.45)
susp=mat('Suspension | Original detail','Slingshot_SuspensionAO',metal=.55,rough=.39)
rear=mat('Rear | Original detail','Slingshot_RearBodylAO',metal=.15,rough=.45)
black=mat('Trim | Black',color=(.015,.018,.022,1),rough=.45)
glass=mat('Glass | Light smoke',color=(.23,.3,.34,.27),rough=.12);glass.blend_method='BLEND'
glass.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value=.27
decal=mat('Decals | Original','Slingshot_Trans',rough=.4,alpha=True)
assign={'Slingshot_Body_01':[graphite,paint],'Slingshot_BodyDetail1':[bodydetail],'Slingshot_Interior':[interior,interiorpaint],'Slingshot_InteriorDetail1':[idetail,ired],'Slingshot_Frame1':[frame,frame],'Slingshot_Suspension1':[susp],'SlingShot_RearBody_01':[rear],'Slingshot_Glass':[glass],'Slingshot_Trans':[decal],'Slingshot_PhoneHolder':[black],'Slingshot_Mask':[black]}
steers={}
for side,name in [('LF','Slingshot_FLWheelTurn'),('RF','Slingshot_FRWheelTurn')]:
 o=link_obj('Steering_'+side,None);o.parent=root;o.location=conv(pos[name])+shift;steers[side]=o;o['steer_axis']='local Z (Blender), local Y (GLB)'
meshes=[]
for path in sorted((ROOT/'source').glob('*.obj')):
 name=path.stem
 if name in ['pCube1','Slingshot_Shadow']:continue
 vs=[];uvs=[];normals=[];faces=[];fuv=[];fn=[];fmat=[];mats=[];idx=0
 for line in path.read_text().splitlines():
  a=line.split()
  if not a:continue
  if a[0]=='v':vs.append(conv(tuple(map(float,a[1:4]))))
  elif a[0]=='vt':uvs.append(tuple(map(float,a[1:3])))
  elif a[0]=='vn':normals.append(conv(tuple(map(float,a[1:4]))))
  elif a[0]=='usemtl':
   if a[1] not in mats:mats.append(a[1])
   idx=mats.index(a[1])
  elif a[0]=='f':
   corners=[v.split('/') for v in a[1:]];faces.append([int(v[0])-1 for v in corners]);fuv.append([int(v[1])-1 if len(v)>1 and v[1] else 0 for v in corners]);fn.append([int(v[2])-1 if len(v)>2 else 0 for v in corners]);fmat.append(idx)
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(vs,[],faces);mesh.update();o=link_obj(name,mesh);o.parent=root;o.location=conv(pos.get(name,Vector()))+shift
 m=assign.get(name,[frame])
 if 'Wheel' in name:m=[wheel,tire]
 for mt in m:mesh.materials.append(mt)
 uv=mesh.uv_layers.new(name='UVMap')
 custom=[]
 for p,ids,nids,mi in zip(mesh.polygons,fuv,fn,fmat):
  p.material_index=min(mi,len(m)-1);p.use_smooth=True
  for li,ui,ni in zip(p.loop_indices,ids,nids):
   if uvs:uv.data[li].uv=(uvs[ui][0],1-uvs[ui][1])
   if normals:custom.append(normals[ni])
 if custom:
  mesh.use_auto_smooth=True;mesh.normals_split_custom_set(custom)
 for side in ['LF','RF']:
  if name=='Slingshot_Wheel'+side or name==('Slingshot_FBrakes_01' if side=='LF' else 'Slingshot_FBrakes_02'):
   loc=o.location.copy();o.parent=steers[side];o.location=loc-steers[side].location
 if 'Wheel' in name:o['spin_axis']='local X';o['source_rest_position']='Recovered from original Unity Avatar'
 meshes.append(o)
bpy.context.view_layer.update()
scene.world=bpy.data.worlds.new('Studio World');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.14,.17,.22,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.4
for im in bpy.data.images:
 if im.source=='FILE':im.pack()
bpy.ops.object.select_all(action='DESELECT')
for o in vehicle.objects:o.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Slingshot.glb'),export_format='GLB',use_selection=True,export_extras=True,export_yup=True)
# Studio is kept separate and excluded from model export.
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.012));floor=bpy.context.object;floor.name='Studio floor'
for c in list(floor.users_collection):c.objects.unlink(floor)
studio.objects.link(floor);floor.data.materials.append(mat('Studio | Floor',color=(.055,.065,.08,1),rough=.3,metal=.15))
def point(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
def area(name,loc,power,size,color=(1,1,1)):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color;o=link_obj(name,d,studio);o.location=loc;point(o,(0,0,.7))
area('Key softbox',(2,-3,5),1200,5)
area('Rim softbox',(-3,2,4),1500,4,(.7,.82,1))
area('Front fill',(-3,-4,2),700,3)
area('Rear softbox',(1,4,3),900,3)
cam=link_obj('Camera | Front three-quarter',bpy.data.cameras.new('Camera'),studio);cam.location=(5.3,-7.3,4);point(cam,(0,0,.58));cam.data.type='ORTHO';cam.data.ortho_scale=5.35;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=False
scene.render.resolution_x=1600;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.exposure=-.6
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'Slingshot-Preview.png')
# Open the project focused on the vehicle.
for a in bpy.context.screen.areas:
 if a.type=='VIEW_3D':a.spaces.active.region_3d.view_distance=5.5;a.spaces.active.region_3d.view_location=(0,0,.5)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Slingshot.blend'))
report={'meshes':len(meshes),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes),'materials':len({m.name for o in meshes for m in o.data.materials}),'wheel_rest_positions':{n:list(pos[n]) for n in pos if 'Wheel' in n},'source':'User supplied RAR; mesh topology preserved; materials rebuilt for PBR','ground_offset_m':.1449274868}
(ROOT/'model-report.json').write_text(json.dumps(report,indent=2))
bpy.ops.render.render(write_still=True)
cam.location=(-4.8,6.5,3.6);point(cam,(0,.15,.65));scene.render.filepath=str(ROOT/'Slingshot-Rear.png');bpy.ops.render.render(write_still=True)
print('BUILD COMPLETE',report)
