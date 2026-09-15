"""Blender background READ ONLY: verify packed/relative dependencies in the current clone."""
import bpy,json,sys,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[sys.argv.index('--')+1]);assert not out.exists()
rows=[];failures=[]
for p in sorted((root/'assets').rglob('*.blend')):
 before=hashlib.sha256(p.read_bytes()).hexdigest();deps=[]
 bpy.ops.wm.open_mainfile(filepath=str(p),load_ui=False)
 for kind,items in [('image',bpy.data.images),('font',bpy.data.fonts),('sound',bpy.data.sounds),('library',bpy.data.libraries)]:
  for item in items:
   raw=getattr(item,'filepath','');packed=bool(getattr(item,'packed_file',None) or len(getattr(item,'packed_files',[])))
   if not raw or raw=='<builtin>' or getattr(item,'source','') in ['GENERATED','VIEWER']:continue
   resolved=Path(bpy.path.abspath(raw))
   owned=resolved.is_relative_to(root)
   okay=packed or (owned and resolved.is_file())
   deps.append({'kind':kind,'name':item.name,'storedPath':raw,'packed':packed,'resolvedInsideClone':owned,'exists':resolved.is_file(),'pass':okay})
   if not okay:failures.append({'blend':p.relative_to(root).as_posix(),'kind':kind,'name':item.name,'path':raw})
 assert hashlib.sha256(p.read_bytes()).hexdigest()==before
 rows.append({'path':p.relative_to(root).as_posix(),'sha256':before,'objects':len(bpy.data.objects),'dependencies':deps})
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps({'pass':not failures,'blender':bpy.app.version_string,'method':'Read-only background opens of every tracked .blend. Packed or existing clone-local files required; no re-export, copy or save. Original stored absolute paths retained as historical metadata when bytes are packed.','files':rows,'failures':failures},indent=2),encoding='utf-8')
if failures:raise RuntimeError('Missing Blender dependencies; see report')
