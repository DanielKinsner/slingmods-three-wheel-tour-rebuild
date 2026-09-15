"""Optional Blender in-memory recovery of old project-root image paths; never saves."""
from pathlib import Path
import bpy,hashlib

def recover_images(root):
 rows=[];root=Path(root).resolve()
 for image in bpy.data.images:
  raw=image.filepath
  if image.packed_file or len(image.packed_files) or not raw:continue
  normalized=raw.replace('\\','/');marker='/slingmods-three-wheel-tour-rebuild/'
  if marker not in normalized:continue
  relative=normalized.split(marker,1)[1]
  if not relative.startswith(('public/assets/','assets/')) or '..' in relative.split('/'):continue
  target=(root/relative).resolve()
  if not target.is_relative_to(root) or not target.is_file():continue
  current=Path(bpy.path.abspath(raw))
  if current.is_file() and current.resolve().is_relative_to(root):continue
  original=raw;image.filepath=bpy.path.relpath(str(target));image.reload()
  if not image.has_data or min(image.size)==0:raise RuntimeError('Image reload failed: '+image.name)
  rows.append({'image':image.name,'historicalPath':original,'recoveredPath':relative,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'pixels':list(image.size),'method':'Reload actual tracked image bytes at clone-relative path in memory; no source save/export'})
 return rows

if __name__=='__main__':
 import json
 print(json.dumps(recover_images(Path(__file__).resolve().parents[1]),indent=2))
