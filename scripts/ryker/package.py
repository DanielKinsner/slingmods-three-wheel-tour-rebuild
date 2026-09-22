"""Create a private, hash-inventoried handoff; never publish or include browser profiles."""
import argparse,pathlib,json,hashlib,shutil,subprocess,zipfile,datetime
p=argparse.ArgumentParser();p.add_argument('--workspace',required=True);a=p.parse_args();workspace=pathlib.Path(a.workspace).resolve();work=workspace/'work';repo=pathlib.Path(__file__).resolve().parents[2];delivery=workspace/'delivery';delivery.mkdir(exist_ok=True)
def copy(src,rel):
 dest=delivery/rel;dest.parent.mkdir(parents=True,exist_ok=True);
 if dest.exists() and dest.stat().st_size==src.stat().st_size and sha(dest)==sha(src):return
 if rel.startswith('source/') and dest.exists():raise ValueError('Preserved delivery source differs; refusing overwrite')
 shutil.copy2(src,dest)
def sha(path):
 with path.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def git(*args):return subprocess.check_output(['git','-C',str(repo),*args]).decode().strip()
copy(repo/'assets/ryker/README.md','README.md')
copy(repo/'assets/ryker/Ryker-Game-Master.blend','editable/Ryker-Game-Master.blend')
copy(workspace/'source/Blender 2.9 .blend','source/Purchased-Ryker-Untouched.blend')
for path in (repo/'public/assets/ryker').iterdir():
 if path.is_file():copy(path,'runtime/'+path.name)
for path in (repo/'scripts/ryker').iterdir():
 if path.is_file() and path.suffix in ['.py','.ps1','.mjs']:copy(path,'pipeline/scripts/ryker/'+path.name)
copy(repo/'public/assets/model02/driver-attachment.json','pipeline/public/assets/model02/driver-attachment.json')
for path in (repo/'assets/ryker/evidence').iterdir():
 if path.is_file():copy(path,'evidence/'+path.name)
for name in ['static-smoke.json','tests-final.log','demo-build.log','workflow-run.log','format-validation.log','fidelity-workflow.log','fidelity-renders.log']:
 copy(work/name,'evidence/'+name)
for path in (work/'fidelity').iterdir():
 if path.is_file():copy(path,'fidelity/'+path.name)
for path in (work/'renders').glob('*.png'):copy(path,'renders/'+path.name)
for path in (work/'browser').glob('*.png'):
 if not path.name.startswith('first-'):copy(path,'browser/'+path.name)
base=git('rev-parse','main');head=git('rev-parse','HEAD');merge=git('merge-tree','--write-tree','main','HEAD')
patch=subprocess.check_output(['git','-C',str(repo),'diff',base,'HEAD','--','src','tests/ryker.test.ts','scripts/ryker','demo-assets.json','public/assets/ryker/*.json'])
(delivery/'integration').mkdir(exist_ok=True);(delivery/'integration/changes.patch').write_bytes(patch)
receipt={'created_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'branch':git('branch','--show-current'),'head':head,'main_base':base,'merge_tree':merge,'merge_conflicts':False,'tested_runtime':json.loads((repo/'demo-current.json').read_text())['commit'],'source_sha256':sha(workspace/'source/Blender 2.9 .blend'),'glb_sha256':sha(repo/'public/assets/ryker/ryker-900.glb'),'tests':json.loads((repo/'assets/ryker/evidence/final-checks.json').read_text())['tests']['passed'],'gltf_validator':{'errors':0,'warnings':0},'published':False,'physics_changed':False,'limits':'Shared Slingshot collision contacts; source width mismatch; rigid rear mechanics; original SIM instrumentation is not OEM artwork; short performance samples only.'}
(delivery/'DELIVERY.json').write_text(json.dumps(receipt,indent=2))
(delivery/'integration/APPLY.md').write_text('Prefer merging the local codex/ryker-game-asset branch. This patch targets main '+base+'. It contains source/scripts/tests and runtime JSON, not large binaries. For transfer, apply the patch in the existing game repository, copy runtime/ryker-900.glb into public/assets/ryker/, and copy editable/Ryker-Game-Master.blend into assets/ryker/. Keep source/ outside public. No changes to other vehicle assets or saved data are required. Do not push or publish without owner authorization.\n')
files={str(x.relative_to(delivery)).replace('\\','/'):{'bytes':x.stat().st_size,'sha256':sha(x)}for x in sorted(delivery.rglob('*')) if x.is_file() and x.name!='CONTENTS.json'}
(delivery/'CONTENTS.json').write_text(json.dumps({'files':files},indent=2));archive=workspace/'Ryker-Game-Asset-Handoff.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for path in sorted(delivery.rglob('*')):
  if path.is_file():z.write(path,str(path.relative_to(delivery)).replace('\\','/'))
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 for name,entry in files.items():
  with z.open(name) as f:assert hashlib.file_digest(f,'sha256').hexdigest()==entry['sha256'],name
result={'archive':str(archive),'bytes':archive.stat().st_size,'sha256':sha(archive),'entries':len(files)+1,'all_contents_verified':True,**receipt};(workspace/'handoff-receipt.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
