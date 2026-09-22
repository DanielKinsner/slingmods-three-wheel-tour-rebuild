import bpy,sys,pathlib,json,math,numpy as np
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:];runtime=pathlib.Path(args[0]);out=pathlib.Path(args[1]);manifest=json.loads((runtime/'manifest.json').read_text())
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(runtime/'ryker-900.glb'))
objects=list(bpy.data.objects);names=[o.name for o in objects];checks={};checks['required_nodes']=all(n in names for n in ['vehicle_root','body_static','ryker_foundation','steering_control','front_left_steer','front_right_steer','front_left_spin','front_right_spin','rear_spin'])
checks['unique_names']=len(names)==len(set(names));checks['no_staging']=all(o.type in ['MESH','EMPTY'] for o in objects);checks['no_images']=not any(i.source!='VIEWER' for i in bpy.data.images)
total=0;coords=[];nodes=[]
for o in objects:
 checks['finite_'+o.name]=all(math.isfinite(x) for row in o.matrix_world for x in row)
 if o.type=='MESH':
  o.data.calc_loop_triangles();total+=len(o.data.loop_triangles);co=np.array([o.matrix_world@v.co for v in o.data.vertices]);coords.append(co);assert np.isfinite(co).all()
 nodes.append({'name':o.name,'parent':o.parent.name if o.parent else None,'type':o.type})
checks['triangle_count']=total==manifest['triangles'];co=np.concatenate(coords);lo,hi=co.min(axis=0),co.max(axis=0);checks['ground']=abs(float(lo[2]))<.005
wheel_errors={}
for name,entry in manifest['wheels'].items():
 target=Vector((entry['center'][0],-entry['center'][2],entry['center'][1]));actual=bpy.data.objects[entry['spin']].matrix_world.translation;wheel_errors[name]=(actual-target).length
checks['wheel_centers']=max(wheel_errors.values())<1e-5
checks['calipers_fixed']=all(bpy.data.objects[n+'_caliper'].parent.name==entry['carrier'] for n,entry in manifest['wheels'].items())
checks['rotors_spin']=all(bpy.data.objects[n+'_rotor_hub'].parent.name==n+'_spin' for n in manifest['wheels'])
checks['instrument_fixed']=bpy.data.objects['instrument_fixed'].parent.name=='body_static'
checks['fenders_steer']=all(bpy.data.objects[n+'_fender'].parent.name==n+'_steer' for n in ['front_left','front_right'])
report={'native_reimport':True,'blender':bpy.app.version_string,'checks':checks,'pass':all(checks.values()),'triangles':total,'wheel_center_errors_metres':wheel_errors,'bounds_blender':[lo.tolist(),hi.tolist()],'nodes':nodes}
(out/'native-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));assert report['pass']
