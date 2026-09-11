"""P03A authored technical texture maps and readable detail. Executed inside Blender builder.
No downloaded image input. Every map is generated from explicit material/graphic construction.
"""
import numpy as np
TEX=P/'public/assets/textures/p03a';TEX.mkdir(parents=True,exist_ok=True)
texture_records=[]
def texture(name,rgb,color=True):
 h,w=rgb.shape[:2];im=bpy.data.images.new(name,width=w,height=h,alpha=True);im.colorspace_settings.name='sRGB' if color else 'Non-Color'
 rgba=np.ones((h,w,4),dtype=np.float32);rgba[:,:,:3]=np.clip(rgb,0,1);im.pixels.foreach_set(rgba.ravel());im.filepath_raw=str(TEX/(name+'.png'));im.file_format='PNG';im.save()
 texture_records.append({'name':name,'resolution':[w,h],'role':'sRGB base color' if color else 'linear data','path':str((TEX/(name+'.png')).relative_to(P)),'uncompressedRGBA8Bytes':w*h*4})
 return im
def grid(n):return np.meshgrid(np.linspace(0,1,n,endpoint=False),np.linspace(0,1,n,endpoint=False))
def normalmap(h,sx=1,sy=1):
 dy,dx=np.gradient(h,sy/h.shape[0],sx/h.shape[1]);norm=np.dstack((-dx,-dy,np.ones_like(h)));norm/=np.linalg.norm(norm,axis=2)[:,:,None];return norm*.5+.5
def nodes_for(mat,base,orm,normal,uvname='SurfaceUV',strength=1):
 nt=mat.node_tree;bs=nt.nodes.get('Principled BSDF');uv=nt.nodes.new('ShaderNodeUVMap');uv.uv_map=uvname
 for image,role in [(base,'base'),(orm,'orm'),(normal,'normal')]:
  if image is None:continue
  node=nt.nodes.new('ShaderNodeTexImage');node.image=image;node.label=image.name;node.interpolation='Linear';nt.links.new(uv.outputs['UV'],node.inputs['Vector'])
  if role=='base':nt.links.new(node.outputs['Color'],bs.inputs['Base Color'])
  elif role=='orm':
   sep=nt.nodes.new('ShaderNodeSeparateColor');sep.mode='RGB';nt.links.new(node.outputs['Color'],sep.inputs[0]);nt.links.new(sep.outputs['Green'],bs.inputs['Roughness']);nt.links.new(sep.outputs['Blue'],bs.inputs['Metallic'])
  else:
   nm=nt.nodes.new('ShaderNodeNormalMap');nm.uv_map=uvname;nm.inputs['Strength'].default_value=strength;nt.links.new(node.outputs['Color'],nm.inputs['Color']);nt.links.new(nm.outputs['Normal'],bs.inputs['Normal'])
# Radar Blue Fade uses global vehicle-space paint UVs for consistent front/rear fade and geometric graphics.
n=1024;u,v=grid(n);x=u*2.04-1.02;y=v*3.84-1.70
fade=np.clip((y+.7)/2.55,0,1);base=np.zeros((n,n,3),np.float32)
base[:,:,0]=.018+.012*fade;base[:,:,1]=.26+.18*fade;base[:,:,2]=.60+.22*fade
# Exact-year graphic vocabulary: narrow orange/black wing edges, angular hood accents and rear slashes.
wing=(np.abs(x)>(.895-.045*(y-1.4)))&(np.abs(x)<(.938-.025*(y-1.4)))&(y>1.40)&(y<1.97)
def polygon_mask(px,py,verts):
 result=np.zeros(px.shape,bool)
 for i,(ax,ay) in enumerate(verts):
  bx,by=verts[(i+1)%len(verts)];result^=((ay>py)!=(by>py))&(px<(bx-ax)*(py-ay)/(by-ay+1e-20)+ax)
 return result
xx=np.abs(x)
hoodblack=polygon_mask(xx,y,[(.23,.49),(.54,.55),(.66,.86),(.73,1.22),(.49,1.77),(.43,1.77),(.60,1.18),(.52,.88)])
hood=polygon_mask(xx,y,[(.36,.60),(.51,.64),(.605,.87),(.673,1.19),(.602,1.30),(.614,1.13),(.56,.91)])
# The rear fairing UV projects its height into pseudo-X: two short slanted upper accents.
rear=np.zeros(x.shape,bool)
for ya,yb in [(-1.115,-1.008),(-.993,-.925),(-.91,-.877)]:
 rear|=polygon_mask(y,xx,[(ya,.835),(yb,.814),(yb+.086,.773),(ya+.087,.773)])
border=(np.abs(x)>(.883-.045*(y-1.4)))&(np.abs(x)<(.895-.045*(y-1.4)))&(y>1.40)&(y<1.97)
base[border|hoodblack]=(.018,.035,.058);base[wing|hood|rear]=(.98,.245,.025)
rng=np.random.default_rng(24032024);grain=rng.random((n,n));rough=.25+(grain-.5)*.015
orm=np.dstack((np.ones_like(u),rough,np.full_like(u,.22)))
height=(np.sin(u*math.tau*143)*np.sin(v*math.tau*159)+.25*np.sin(u*math.tau*339+v*63))*.0000018
nodes_for(paint,texture('radar-blue_basecolor',base),texture('radar-blue_orm',orm,False),texture('radar-blue_normal',normalmap(height,2.04,3.84),False),'PaintUV',.32)
for o in list(bpy.data.objects):
 if o.type=='MESH' and paint in list(o.data.materials):
  uv=o.data.uv_layers.get('PaintUV') or o.data.uv_layers.new(name='PaintUV')
  for poly in o.data.polygons:
   for li in poly.loop_indices:
    co=o.matrix_world@o.data.vertices[o.data.loops[li].vertex_index].co
    px=math.copysign(.72+(co.z-.55)*.5,co.x) if o.name.startswith('rear_shoulder_wedge') else co.x
    uv.data[li].uv=((px+1.02)/2.04,(co.y+1.70)/3.84)
# Directional road-tire tread: 46 repeating blocks, center chevron grooves, two circumferential channels.
u,v=grid(1024);tread=(v>.10)&(v<.90);phase=np.mod(u*40+np.abs(v-.5)*5.7,1);groove=(phase<.18)&tread
channels=((np.abs(v-.35)<.012)|(np.abs(v-.65)<.012))&tread
groove|=channels
height=np.where(groove,-.0030,0.0);height+=np.where(tread,np.sin(v*math.pi*60)*.000015,0)
base=np.zeros((*u.shape,3),np.float32);shade=np.where(groove,.045,.115)+np.where(tread,.009,0)
for k,f in enumerate((.90,.98,1.05)):base[:,:,k]=shade*f
orm=np.dstack((np.ones_like(u),np.where(groove,.9,.78),np.zeros_like(u)))
nodes_for(rubber,texture('road-tire_basecolor',base),texture('road-tire_orm',orm,False),texture('road-tire_normal',normalmap(height,2.1,.225),False),'TireUV',.9)
for o in list(bpy.data.objects):
 if o.type=='MESH' and o.name.endswith('_tire'):
  width=.305 if o.name.startswith('rear') else .225;uv=o.data.uv_layers.new(name='TireUV')
  for poly in o.data.polygons:
   vals=[]
   for li in poly.loop_indices:
    co=o.data.vertices[o.data.loops[li].vertex_index].co;vals.append((li,(math.atan2(co.y,co.z)/math.tau)%1,co.x/width+.5))
   wrap=max(a[1] for a in vals)-min(a[1] for a in vals)>.5
   for li,a,b in vals:uv.data[li].uv=(a+1 if wrap and a<.5 else a,b)
# Pebbled molded polymer: small scale grain without large random stains/highlights.
u,v=grid(512);h=(np.sin(u*math.tau*137)*np.sin(v*math.tau*151)+.4*np.sin((u+v)*math.tau*89))*.000014
shade=.022+.003*np.sin(u*math.tau*137)*np.sin(v*math.tau*151)
base=np.dstack((shade*.92,shade,shade*1.14));orm=np.dstack((np.ones_like(u),.64+.025*np.sin(u*math.tau*151)*np.sin(v*math.tau*139),np.zeros_like(u)))
nodes_for(black,texture('molded-polymer_basecolor',base),texture('molded-polymer_orm',orm,False),texture('molded-polymer_normal',normalmap(h,1,1),False),'SurfaceUV',.65)
# Seat panel map: cupped center, real seam channels and restrained short stitch marks.
u,v=grid(1024);base=np.ones((*u.shape,3),np.float32)*np.array([.052,.056,.061]);center=(u>.25)&(u<.75);base[center]=(.070,.074,.080)
seams=np.zeros(u.shape,bool)
for line in [.22,.37,.54,.70]:seams|=(np.abs(v-line)<.003)&(u>.24)&(u<.76)
edge=(np.abs(u-.245)<.004)|(np.abs(u-.755)<.004);stitch=((np.abs(u-.259)<.0017)|(np.abs(u-.741)<.0017))&(np.mod(v*115,1)<.45)
base[seams|edge]=(.025,.027,.03);base[stitch]=(.27,.28,.29)
height=.000011*np.sin(u*math.tau*233)*np.sin(v*math.tau*241)-seams*.00032-edge*.00018
orm=np.dstack((np.ones_like(u),np.where(seams,.91,.80),np.zeros_like(u)))
nodes_for(upholstery,texture('sport-seat_basecolor',base),texture('sport-seat_orm',orm,False),texture('sport-seat_normal',normalmap(height,.44,1.0),False),'SurfaceUV',.65)
# Machined metal retains real metallic reflectance with directional machining rather than glitter.
u,v=grid(512);striations=np.sin(u*math.tau*231)*.5+.5
base=np.dstack((.46+striations*.028,.49+striations*.028,.53+striations*.028));orm=np.dstack((np.ones_like(u),.235+striations*.028,np.full_like(u,.88)))
nodes_for(metal,texture('machined-alloy_basecolor',base),texture('machined-alloy_orm',orm,False),texture('machined-alloy_normal',normalmap(np.sin(u*math.tau*231)*.0000008,.4,.4),False),'SurfaceUV',.3)
# Passive instrument scale artwork (no baked speed/RPM claim); the screen remains an inactive display.
u,v=grid(512);base=np.zeros((*u.shape,3),np.float32);base[:]=(.004,.009,.014)
for cx in (.245,.755):
 dx=u-cx;dy=(v-.5)*.60;r=np.sqrt(dx*dx+dy*dy);a=np.mod(np.arctan2(dy,dx),math.tau);ticks=(r>.19)&(r<.213)&(np.mod(a*22/math.tau,1)<.11)
 base[ticks]=(.54,.60,.64);line=(r>.214)&(r<.218);base[line]=(.10,.15,.18)
instrument=material('P03A_Instrument_Scale',(.02,.03,.04),.24,.1,.35)
nodes_for(instrument,texture('instrument-scale_basecolor',base),None,None,'InstrumentUV')
for o in list(bpy.data.objects):
 if o.name=='instrument_lens':
  o.data.materials[0]=instrument;uv=o.data.uv_layers.new(name='InstrumentUV')
  for poly in o.data.polygons:
   for li in poly.loop_indices:
    co=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=((co.x+.4945)/.269,(co.z-.6485)/.123)
# Thin optical materials: transparent windshield, clearcoated lamp lenses, amber marker housings.
gb=glass.node_tree.nodes['Principled BSDF'];gb.inputs['Alpha'].default_value=.34;gb.inputs['Roughness'].default_value=.075;gb.inputs['IOR'].default_value=1.49
amber=material('P03A_Amber_Lens',(.70,.18,.012),.16,.05,.7)
# Recessed optical assemblies: dark backplates, individual dished reflector cells,
# and transparent outer covers. Surfaces remain grouped under their light bindings.
optical=material('P03A_Clear_Optical_Cover',(.28,.34,.39),.065,.05,.55)
ob=optical.node_tree.nodes['Principled BSDF'];ob.inputs['Alpha'].default_value=.20;optical.surface_render_method='DITHERED'
ab=amber.node_tree.nodes['Principled BSDF'];ab.inputs['Alpha'].default_value=.42;amber.surface_render_method='DITHERED'
reflector=material('P03A_Optical_Reflector',(.48,.53,.59),.18,.84,.35)
amberreflector=material('P03A_Amber_Reflector',(.42,.085,.006),.22,.58,.3)
for old in list(bpy.data.objects):
 if old.name.startswith(('lamp_bezel_lights_head_upper','lamp_bezel_lights_head_center')):
  bpy.data.objects.remove(old,do_unlink=True)
for o in list(bpy.data.objects):
 if o.type!='MESH' or not o.name.startswith(('lights_signals','lights_head_upper','lights_head_center')):continue
 isamber=o.name.startswith('lights_signals');pts=[v.co.copy() for v in o.data.vertices[:4]];nrm=(pts[1]-pts[0]).cross(pts[3]-pts[0]).normalized()
 target=Vector((math.copysign(1,sum(p.x for p in pts)),0,0)) if isamber else Vector((0,1,0))
 if nrm.dot(target)<0:nrm=-nrm
 def surf(u,v):return pts[0]*(1-u)*(1-v)+pts[1]*u*(1-v)+pts[2]*u*v+pts[3]*(1-u)*v
 if not isamber:curve('lamp_bezel_open_rim_'+o.name,[p+nrm*.010 for p in pts+[pts[0]]],.0025,rim,o.parent)
 o.data.materials[0]=recess
 # Original mirrored sheets carry opposite windings. Their old Solidify back walls
 # must not remain in front of the newly recessed optical cells.
 o.modifiers.clear()
 for vert in o.data.vertices:vert.co-=nrm*.018
 coverpts=[surf(u,v)+nrm*.007 for u,v in [(.045,.12),(.955,.12),(.955,.88),(.045,.88)]]
 panel(o.name+'_clear_cover',coverpts,amber if isamber else optical,o.parent,.002,.001)
 cells=5 if isamber else (5 if 'center' in o.name else 4)
 for k in range(cells):
  a=.075+k*.85/cells;b=a+.85/cells-.026;v0=.22 if isamber else .18;v1=.78 if isamber else .82
  cellv=[]
  for vv in [v0,(v0+v1)*.5,v1]:
   for uu in [a,(a+b)*.5,b]:
    depth=-.003 if uu==(a+b)*.5 and vv==(v0+v1)*.5 else .003
    cellv.append(surf(uu,vv)+nrm*depth)
  mesh(o.name+'_reflector_cell',cellv,[(j*3+i,j*3+i+1,(j+1)*3+i+1,(j+1)*3+i) for j in range(2) for i in range(2)],amberreflector if isamber else reflector,o.parent,False)
  # Small optical center has thickness and a clear edge, rather than a white filled polygon.
  if not isamber:
   cu=surf((a+b)/2,(v0+v1)/2)+nrm*.004
   axis=(pts[1]-pts[0]).normalized();other=nrm.cross(axis).normalized()
   rad=.013 if 'center' in o.name else .016
   disc=[cu+axis*math.cos(t*math.tau/16)*rad+other*math.sin(t*math.tau/16)*rad for t in range(16)]
   panel(o.name+'_projector_eye',disc,lens,o.parent,.004,.001)
sb=seataccent.node_tree.nodes['Principled BSDF'];sb.inputs['Base Color'].default_value=(.085,.091,.10,1);sb.inputs['Roughness'].default_value=.82
# Split wheel finish: deep glossy barrel, machined rim lip and stationary brake caliper.
redcaliper=material('P03A_Brake_Caliper',(.48,.012,.018),.3,.18,.4)
def rimlip(n,par,w,rr):
 verts=[];faces=[];prof=[(-w*.495,rr*.986),(-w*.493,rr*1.014),(-w*.455,rr*1.016),(w*.455,rr*1.016),(w*.493,rr*1.014),(w*.495,rr*.986)]
 for x,r in prof:
  for i in range(96):a=i*math.tau/96;verts.append((x,r*math.sin(a),r*math.cos(a)))
 for j in range(len(prof)-1):
  for i in range(96):faces.append((j*96+i,j*96+(i+1)%96,(j+1)*96+(i+1)%96,(j+1)*96+i))
 o=mesh(n,verts,faces,metal,par);uv=o.data.uv_layers.new(name='SurfaceUV')
 for poly in o.data.polygons:
  for li in poly.loop_indices:
   co=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(co.y*3,co.z*3)
for name in ['front_left','front_right','rear']:
 w=.305 if name=='rear' else .225;rr=.254 if name=='rear' else .2286;rimlip(name+'_machined_lip',bpy.data.objects[name+'_spin'],w,rr)
 if name!='rear':
  box(name+'_stationary_caliper',((-.075 if name=='front_left' else .075),-.13,.025),(.053,.087,.16),redcaliper,bpy.data.objects[name+'_steer'],.016)
 else:box('rear_stationary_caliper',(.10,-1.47,.383),(.046,.085,.12),redcaliper,bpy.data.objects['suspension_rear'],.012)
# Legible AutoDrive labels are geometry, kept with cockpit static material batching.
for i,label in enumerate(['R','N','D']):
 y=-.16-i*.072;z=.448+.17*(y+.24)
 cu=bpy.data.curves.new('autodrive_'+label,'FONT');cu.body=label;cu.size=.019;cu.align_x='CENTER';cu.align_y='CENTER';cu.extrude=.00015
 o=bpy.data.objects.new('autodrive_label_'+label,cu);bpy.context.collection.objects.link(o);o.parent=cockpit;o.location=(0,y,z+.008);o.rotation_euler.x=.14;cu.materials.append(seataccent)
 bpy.ops.object.select_all(action='DESELECT');bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
# Add UVs for newly authored detail components; every exported mapped primitive remains UV-complete.
for o in list(bpy.data.objects):
 if o.type=='MESH' and not o.data.uv_layers:
  uv=o.data.uv_layers.new(name='SurfaceUV')
  for poly in o.data.polygons:
   axes=[k for k in range(3) if k!=max(range(3),key=lambda k:abs(poly.normal[k]))]
   for li in poly.loop_indices:
    co=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(co[axes[0]],co[axes[1]])
report={'method':'Original technical maps authored in Blender/Python from material construction; no photos or directional lighting baked','maps':texture_records,'rawRGBA8Bytes':sum(t['uncompressedRGBA8Bytes'] for t in texture_records),'estimatedRGBA8WithMipBytes':round(sum(t['uncompressedRGBA8Bytes'] for t in texture_records)*4/3),'normalConvention':'OpenGL tangent space +Y','paint':'Vehicle-space UV for consistent Radar Blue Fade and original geometric orange/black graphics; clearcoat .72, metalness .22','instrumentLimitation':'Passive scale markings only; no baked speed/RPM readouts; dynamic instrument animation is not claimed','rights':'All maps newly authored; manufacturer/dealer research photos remain external research-only references'}
(EV/'texture-manifest.json').write_text(json.dumps(report,indent=2))
