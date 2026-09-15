"""Owner hoop correction; preserve front refinement, original finish and every other part."""
import bpy,runpy,json,hashlib
from pathlib import Path
P=Path(__file__).resolve().parents[1];H=runpy.run_path(str(P/'scripts/build-p08b-art.py'))
A=P/'assets/blender/hoop-refinement';O=P/'public/assets/hoop-refinement';E=P/'director-kit/production/evidence/Hoop-Refinement'
for p in [A,O,E]:p.mkdir(parents=True,exist_ok=True)
source=P/'assets/blender/front-refinement/slingshot-front-refined.blend';bpy.ops.wm.open_mainfile(filepath=str(source))
removed=[o.name for o in bpy.data.objects if o.name.startswith('hoop_rear_brace_')];assert len(removed)==4,removed
before=set(o.name for o in bpy.data.objects)
for name in removed:bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
assert set(o.name for o in bpy.data.objects)==before-set(removed)
for name in ['roll_hoop_driver','roll_hoop_passenger','roll_hoop_inner_driver','roll_hoop_inner_passenger']:assert name in bpy.data.objects
H['batch_and_export'].__globals__.update({'A':A,'O':O})
report=H['batch_and_export']('slingshot-hoops-refined',{o.name for o in bpy.data.objects if o.type=='EMPTY'})
preserve=runpy.run_path(str(P/'scripts/preserve-front-runtime.py'))['preserve_runtime'];report.update(preserve(P/'public/assets/front-refinement/slingshot-front-refined.glb',O/'slingshot-hoops-refined.glb',{'body_static__Textured_Polymer'}))
report.update({'source':str(source.relative_to(P)),'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'removed':removed,'unchangedHoopsAndFinish':True,'frontRefinementPreserved':True,'change':'Delete four invented rear diagonal braces only. Keep original outer/inner hoop curves, black finish, seats, body and wing mounts. No carbon finish or simulation changes.'})
(E/'build.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
