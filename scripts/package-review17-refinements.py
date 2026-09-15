"""Add owner front/hoop refinements to the immutable P09A review, preserving its full evidence/film."""
from pathlib import Path
import zipfile,json,hashlib,subprocess,shutil,lzma,io
from PIL import Image
r=Path(__file__).resolve().parents[1];dest=r/'Astra-Review-17-Lean.zip';base=r/'Astra-Review-17-P09A-original.zip'
expected='bc183008e14bfb3bf10d591020699f62347bc15634ba99d17f34a79ac143f616'
if not base.exists():
 assert hashlib.sha256(dest.read_bytes()).hexdigest()==expected,'Original packet identity differs; preserve and inspect before repackaging'
 shutil.copyfile(dest,base)
assert hashlib.sha256(base.read_bytes()).hexdigest()==expected
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=r,text=True).strip();branch='feature/p09a-own-the-build'
assert head==subprocess.check_output(['git','ls-remote','origin','refs/heads/'+branch],cwd=r,text=True).split()[0]
with zipfile.ZipFile(base)as z:payload={n:z.read(n)for n in z.namelist()}
old=json.loads(payload.pop('MANIFEST.json'));payload['historical/P09A-MANIFEST.json']=json.dumps(old,indent=2).encode();payload['historical/P09A-REVIEW-ME-FIRST.md']=payload['REVIEW-ME-FIRST.md'];payload['historical/P09A-REMOTE-ASSETS.json']=payload['REMOTE-ASSETS.json']
tracked=subprocess.check_output(['git','ls-files'],cwd=r,text=True).splitlines()
for n in tracked:
 if n.startswith(('src/','tests/')) or n in ['HANDOFF.md','AGENTS.md','demo-assets.json','director-kit/production/state.json','handoff/HOOP-REFINEMENT.json','handoff/FRONT-REFINEMENT.json'] or n.startswith('scripts/')and any(t in n for t in ['front-refinement','hoop-refinement','preserve-front-runtime','package-review17-refinements','build-p08b-art']) or n.startswith(('director-kit/director-addenda/owner-hoop-refinement/','director-kit/director-addenda/owner-front-refinement/')):payload[n]=(r/n).read_bytes()
# Full relevant new numerical/text data, with original bytes recovered using Python's lzma.decompress.
index={}
for scope in ['Front-Refinement','Hoop-Refinement']:
 for p in sorted((r/'director-kit/production/evidence'/scope).rglob('*')):
  if p.is_file()and p.suffix in ['.json','.txt','.md']:
   n=p.relative_to(r).as_posix();raw=p.read_bytes();payload[n+'.xz']=lzma.compress(raw);index[n]={'stored':n+'.xz','bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
payload['refinements/VERIFICATION-INDEX.json']=json.dumps(index,indent=2).encode()
payload['scripts/restore-refinement-data.py']=b"from pathlib import Path\nimport lzma,json,hashlib,sys\nr=Path(__file__).resolve().parents[1];out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=False)\nfor n,v in json.loads((r/'refinements/VERIFICATION-INDEX.json').read_text()).items():\n d=lzma.decompress((r/v['stored']).read_bytes());assert hashlib.sha256(d).hexdigest()==v['sha256'];p=out/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(d)\n"
shots=[('hoops-side-before','Hoop-Refinement/inspection-01/hoops-side-before.png'),('hoops-side-after','Hoop-Refinement/inspection-01/hoops-side-after.png'),('hoops-rear-after','Hoop-Refinement/inspection-01/hoops-rear-after.png'),('wing-mounts','Hoop-Refinement/inspection-01/wing-after.png'),('front-before','Front-Refinement/inspection-03/corner-before.png'),('front-after','Hoop-Refinement/inspection-01/front-after.png')]
for caption,n in shots:
 im=Image.open(r/'director-kit/production/evidence'/n).convert('RGB');out=io.BytesIO();im.save(out,'JPEG',quality=93,optimize=True);payload['screenshots/refinements/'+caption+'.jpg']=out.getvalue()
assets={}
for name in ['FRONT','HOOP']:assets.update(json.loads((r/f'handoff/{name}-REFINEMENT.json').read_text())['assets'])
payload['REMOTE-ASSETS.json']=json.dumps({'branch':branch,'commit':head,'refinementAssets':assets,'otherRuntimeAssets':'historical/P09A-REMOTE-ASSETS.json; all still retained in Git. demo-assets.json is the complete current allowlist.','retrieve':'git clone --branch '+branch+' https://github.com/DanielKinsner/slingmods-three-wheel-tour-rebuild.git; git checkout '+head},indent=2).encode()
payload['OWNER-REFINEMENTS.diff']=subprocess.check_output(['git','diff','978a7a0c07dea4359dd4909b62ef81c8b9a828e7',head,'--','src','tests','scripts','demo-assets.json'],cwd=r)
intro=f'''# Astra Review17 - updated with owner vehicle corrections

Pushed feature branch: `{branch}` at `{head}`. This packet includes the completed P09A chapter and later front/hoop corrections.

## Added since the original Review17

- Closed front fascia gaps, continuous upper accent lenses, retained lower continuous lenses and center optics, filled splitter and open honeycomb grille.
- Removed four invented diagonal supports behind the roll hoops. Retained original hoop shapes, black finish (no carbon), seats and wing mounts.
- Current source/tests and full relevant new numerical/text verification, references and before/after screenshots. Editable and runtime assets recoverable from the exact Git commit above; see REMOTE-ASSETS.json and HANDOFF.md.
- 218 tests pass. Isolated browser checks cover four finishes, five free previews, save/reload, departure, keyboard drive and return. Background Blender plus byte-preservation tests constrain non-target changes.

The included original 2:55 P09A gameplay film has actual game audio and demonstrates the completed chapter. It predates the later visual corrections: use screenshots/refinements and the current runtime asset to assess those. The historical P09A numerical evidence, failed runs and performance HOLD remain intact. No new OEM fidelity, hardware, G3/G4 or release approval.

This is a review packet, not a standalone game. Clone Git, npm ci, npm run demo:build, set PORT=5197, npm run demo:preview. To restore refinement verification: python scripts/restore-refinement-data.py NEW_OUTPUT_DIRECTORY. Original P09A data uses scripts/restore-p09a-data.py.

Read historical/P09A-REVIEW-ME-FIRST.md for the original chapter delivery. MANIFEST.json hashes this updated packet; historical/P09A-MANIFEST.json records the previous immutable delivery.
'''
payload['REVIEW-ME-FIRST.md']=intro.encode()
manifest={'runtimeCommit':json.loads((r/'handoff/HOOP-REFINEMENT.json').read_text()).get('runtimeCommit',head),'packagingCommit':head,'branch':branch,'historicalP09ARuntime':old['runtimeCommit'],'originalZIP_SHA256':expected,'files':{n:{'bytes':len(d),'sha256':hashlib.sha256(d).hexdigest()}for n,d in sorted(payload.items())},'note':'No recursive manifest hash. Film is original P09A; updated visual evidence explicitly labeled. Full current runtime/editable binaries are in private Git.'};payload['MANIFEST.json']=json.dumps(manifest,indent=2).encode()
temp=r/'Astra-Review-17-Updating.zip'
with zipfile.ZipFile(temp,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for n,d in sorted(payload.items()):z.writestr(n,d,compress_type=zipfile.ZIP_STORED if n.endswith(('.xz','.gz','.mp4','.jpg','.png'))else zipfile.ZIP_DEFLATED)
assert temp.stat().st_size<=100000000
with zipfile.ZipFile(temp)as z:
 assert z.testzip()is None
 for n,v in manifest['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==v['sha256'],n
 # All original film and numerical compressed blobs survive byte for byte.
 for n,d in payload.items():
  if n.endswith('.mp4')or '/complete-data/'in n:
   with zipfile.ZipFile(base)as original:assert original.read(n)==d
shutil.move(str(temp),str(dest));receipt={'path':dest.name,'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'packagingCommit':head,'runtimeCommit':manifest['runtimeCommit'],'payloads':len(payload),'originalPreserved':base.name}
(r/'handoff/REVIEW17-UPDATED-RECEIPT.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt,indent=2))
