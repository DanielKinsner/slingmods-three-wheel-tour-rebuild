"""Read-only frozen-neighbor and contact check for P03A2 proof."""
import bpy,pathlib,json,hashlib,array,struct,importlib.util,sys
P=pathlib.Path(__file__).resolve().parents[1];E=P/'director-kit/production/evidence/P03A2/artist'
def source(path):
 bpy.ops.wm.open_mainfile(filepath=str(path));out={}
 for o in bpy.data.objects:
  if o.type not in {'MESH','CURVE','EMPTY'}:continue
  info={'type':o.type,'parent':o.parent.name if o.parent else None,'matrix':list(sum((list(row) for row in o.matrix_local),[]))}
  if o.type=='MESH':
   vs=array.array('f',[0])*(len(o.data.vertices)*3);o.data.vertices.foreach_get('co',vs);idx=array.array('I',[0])*len(o.data.loops);o.data.loops.foreach_get('vertex_index',idx);info['positionsFaces']=hashlib.sha256(vs.tobytes()+idx.tobytes()).hexdigest();info['materials']=[m.name for m in o.data.materials]
  elif o.type=='CURVE':info['splines']=[[[*p.co]for p in sp.points]for sp in o.data.splines]
  out[o.name]=info
 return out
integrated='--integrated' in sys.argv
a=source(P/'assets/blender/vehicles/slingshot-p03a1.blend');b=source(P/('assets/blender/vehicles/slingshot-p03a2.blend' if integrated else 'assets/blender/vehicles/slingshot-p03a2-proof01.blend'));removed=sorted(a.keys()-b.keys());added=sorted(b.keys()-a.keys());changed=sorted(k for k in a.keys()&b.keys()if a[k]!=b[k]);assert removed==(['P03A1_wing_brow_shell_left','P03A1_wing_brow_shell_right'] if integrated else ['P03A1_wing_brow_shell_left'])and added==(['P03A2_left_brow_boundary_master','P03A2_right_brow_boundary_master'] if integrated else ['P03A2_left_brow_boundary_master'])and not changed,(removed,added,changed)
r={'status':'PASS frozen-neighbor check only','removed':removed,'added':added,'changedExistingObjects':changed,'retainedObjects':len(a.keys()&b.keys()),'method':'Exact source mesh position/face-index bytes, material slots, parents and local matrices; no aesthetic inference'}
(E/('integration-frozen-neighbors.json' if integrated else 'frozen-neighbors.json')).write_text(json.dumps(r,indent=2));print(json.dumps(r))
