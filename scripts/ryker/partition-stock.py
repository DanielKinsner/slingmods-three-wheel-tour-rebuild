"""Hash-gated exact corner/normal/material partition. No topology reduction."""
import bpy,json,pathlib,hashlib
from mathutils import Vector
from components import components
ROOT=pathlib.Path(__file__).resolve().parents[2]
ANCHORS=[([-.168,.416,-.855],[-.378,.176,-.855]),([.184,.416,-.855],[.394,.176,-.855]),([.002,.49,.078],[.002,.34,.415])]
def partition(source,group,made):
 spec=json.loads((ROOT/'assets/ryker/part-map-v1.json').read_text())
 if hashlib.sha256((ROOT/spec['source']).read_bytes()).hexdigest()!=spec['sha256']:raise RuntimeError('Ryker source changed: review semantic part map before rebuilding')
 sm=source.data;_,islands=components(sm);rows={r['island']:r for r in spec['nodes'][source.name]}
 if set(rows)!=set(islands):raise RuntimeError('Island membership changed')
 parents={};report=[]
 for key,faceids in islands.items():
  row=rows[key]
  if len(faceids)!=row['faces']:raise RuntimeError('Island topology changed')
  part=row['part'];motion=row['motion'];bins={}
  for i in faceids:
   segment=''
   if motion and motion['kind']=='shock' and motion['part']=='body-shaft':
    a,b=map(Vector,ANCHORS[motion['channel']]);axis=(b-a).normalized();p=source.matrix_world@sm.polygons[i].center;p=Vector((p.x,p.z,-p.y));segment='body' if (p-a).dot(axis)<(b-a).length*.56 else 'shaft'
   bins.setdefault(segment,[]).append(i)
  if part not in parents:parents[part]=group(part)
  for segment,fs in bins.items():
   faces=[sm.polygons[i] for i in fs];ids=sorted({i for p in faces for i in p.vertices});remap={old:new for new,old in enumerate(ids)};data=bpy.data.meshes.new(part)
   data.from_pydata([source.matrix_world@sm.vertices[i].co for i in ids],[],[[remap[i] for i in p.vertices] for p in faces]);data.update()
   for m in sm.materials:data.materials.append(m)
   for p,orig in zip(data.polygons,faces):p.material_index=orig.material_index;p.use_smooth=orig.use_smooth
   # Preserve authored per-corner UVs, even on currently untextured material slots.
   for layer in sm.uv_layers:
    target=data.uv_layers.new(name=layer.name)
    for p,orig in zip(data.polygons,faces):
     for dst,src in zip(p.loop_indices,orig.loop_indices):target.data[dst].uv=layer.data[src].uv
   normals=[tuple((source.matrix_world.to_3x3().inverted().transposed()@sm.corner_normals[j].vector).normalized()) for p in faces for j in p.loop_indices]
   data.normals_split_custom_set(normals)
   name=f'{part}_{key}_{segment}';o=bpy.data.objects.new(name,data);bpy.context.scene.collection.objects.link(o);o.parent=parents[part];made.append(o)
   if motion:
    meta=dict(motion)
    if segment:meta['part']=segment
    if meta['kind']=='shock':meta['upper'],meta['lower']=ANCHORS[meta['channel']]
    o['rykerMotion']=meta
   o['sourceIsland']=key;o['sourceNode']=source.name
   # Exact reconstruction per corner, including normal directions and material slots.
   maxpos=max((data.vertices[remap[i]].co-source.matrix_world@sm.vertices[i].co).length for i in ids)
   maxnormal=max(((data.corner_normals[j].vector-Vector(n)).length for j,n in enumerate(normals) if Vector(n).length>.5 and data.corner_normals[j].vector.length>.5),default=0)
   if maxpos>1e-6 or maxnormal>1e-3:raise RuntimeError(f'Partition changed surface {name}: {maxpos} {maxnormal}')
   report.append({'node':name,'source':source.name,'island':key,'part':part,'motion':motion,'faces':len(fs),'maxPositionError':maxpos,'maxNormalError':maxnormal,'degenerateNormalCorners':sum(Vector(n).length<.5 for n in normals),'uvLayers':len(data.uv_layers),'materials':row['materials'],'min':row['min'],'max':row['max']})
 return report
