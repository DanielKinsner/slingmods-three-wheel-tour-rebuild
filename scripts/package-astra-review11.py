from pathlib import Path
import json,hashlib,zipfile,subprocess,re,sys
root=Path.cwd().resolve();assert str(root)==r'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
b=Path('director-kit/production/evidence/P06');files={}
def add(p,name=None):
 p=Path(p);assert p.is_file(),p;assert not any(x in p.parts for x in ['.git','node_modules','dist','__pycache__','.tools','raw-video','agent','solo-agent','crew-agent']);assert not p.name.startswith('.env') and not re.search(r'\.blend\d+$',p.name) and p.suffix not in ['.bak','.key','.pem','.zip','.pyc'];files[name or p.as_posix()]=p
def tree(folder,extensions=None):
 for p in Path(folder).rglob('*'):
  if p.is_file() and not any(x in p.parts for x in ['__pycache__','node_modules']) and not re.search(r'\.blend\d+$',p.name) and (extensions is None or p.suffix in extensions):add(p)
build=json.loads((b/'build-inputs-verified.json').read_text())
tooling=json.loads((b/'post-freeze-review-tooling.json').read_text());allowed={r['path']:r for r in tooling['reviewToolingChanges']}
for n,h in build['inputs'].items():
 current=hashlib.sha256(Path(n).read_bytes()).hexdigest()
 assert current==h or (n in allowed and n.startswith('scripts/') and h==allowed[n]['capturedSHA256'] and current==allowed[n]['packagedSHA256']),n
 add(n)
for folder in ['public','assets/blender/showcase','scripts','tests','src']:tree(folder)
for n in ['README.md','AGENTS.md','.gitignore','.gitattributes','director-kit/AGENTS.md','scripts/package-astra-review11.py','scripts/summarize-review11.py','scripts/sync-review11.py']:add(n)
for n in ['AUTONOMOUS_RESUME.md']:
 if Path(n).exists():add(n)
tree('director-kit/director-addenda/review-10',{'.md','.json'})
add('director-kit/production/evidence/P04B2/fixtures/review08-earned.json');add('director-kit/production/evidence/P05/solo-before.json')
# Small current receipts/reviews, not all historical media or scratch fixtures.
for p in b.glob('*'):
 if p.is_file() and p.suffix in ['.json','.md','.log'] and p.name not in ['package-result.json','package-selection.json']:add(p)
for folder in ['artist','fresh-verified','lifecycle-verified','final-transitions','controller-verified','audio-verified','solo-ui-verified','integrated-ui-final','bay-material-isolation','bay-final','lighting-final','full-art-review-02','baseline-districts-corrected','crew-ui-diagnosis','crew-ui-clock-reproduction','crew-ui-clock-aligned','crew-ui-final-clock-proof','bay-material-repaired-final','bay-material-repaired','live-audio-final-routing','program-diagnostic','day-verified','video-final']:
 d=b/folder
 if d.exists():
  for p in d.glob('*'):
   if p.is_file() and p.suffix in ['.json','.md','.log']:add(p)
add(b/'matched-before/fixture/scene.js');add(b/'matched-before/source-inputs.json')
for pattern in ['verified-scored-*','baseline-stock720','baseline-equipped1080']:
 for d in b.glob(pattern):
  if d.is_dir():
   for n in ['run.json','provenance.json','bay.json','interruption.json']:
    if (d/n).is_file():add(d/n)
for folder in ['baseline-districts-corrected','full-art-review-02']:
 for p in (b/folder).glob('district-*.png'):add(p)
for p in (b/'bay-final').glob('*.png'):add(p)
for n in ['root-fresh-720.png','build-link-720.png','crew-hud-1080.png']:add(b/'integrated-ui-final'/n)
for site in ['grid','corner']:
 for rival in ['maya','jett','nico']:
  for spacing in [3,8,20]:add(b/'lighting-final'/f'{site}-{rival}-{spacing}-near-night-stock.png')
for color in ['cyan','red']:
 for view in ['near','cockpit']:add(b/'lighting-final'/f'corner-jett-8-{view}-night-{color}.png')
for rival in ['maya','jett','nico']:add(b/'lighting-final'/f'grid-{rival}-3-near-day-stock.png')
for n in ['headlight-contact-sheet.jpg','district-comparison.jpg']:add(b/n)
for n in ['complete-race-LIVE-AUDIO-captioned.mp4','live-game-audio.webm','grid.png','contest.png','cockpit.png','final-lap.png','result.png','saved-build.png']:add(b/'video-final'/n)
for n in ['garage-day-SILENT-fixed.mp4','day-time-trial.png']:add(b/'day-verified'/n)
add(b/'REVIEW-ME-FIRST.md','REVIEW-ME-FIRST.md');add(b/'STATE-EXCERPT.json','director-kit/production/state.json')
# Reports require a known-current build; prior unchanged large Blender originals are listed by hash.
for n,p in files.items():
 if p.suffix in ['.ts','.mjs','.js','.json','.py','.md','.html','.css']:
  assert not re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-proj-|ghp_)[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}',p.read_text(encoding='utf-8-sig')),n
manifest={'root':str(root),'runtimeCommit':build['commit'],'packagingCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'runtimeInputManifest':str(b/'build-inputs-verified.json').replace('\\','/'),'additionalReviewTooling':[n for n in files if n.startswith('scripts/') and n not in build['inputs']],'files':{n:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for n,p in sorted(files.items())}}
if '--selection' in sys.argv:(b/'package-selection.json').write_text(json.dumps(sorted(set(p.as_posix()for p in files.values())),indent=2));print(len(files),sum(p.stat().st_size for p in files.values()));sys.exit(0)
out=root/'Astra-Review-11.zip';i=2
while out.exists():out=root/f'Astra-Review-11-{i}.zip';i+=1
with zipfile.ZipFile(out,'x',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for n,p in sorted(files.items()):z.write(p,n)
 z.writestr('PACKAGE-MANIFEST.json',json.dumps(manifest,indent=2))
with zipfile.ZipFile(out)as z:
 assert z.testzip()is None
 for n,v in manifest['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==v['sha256']
result={'path':str(out),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'runtimeCommit':build['commit'],'packagingCommit':manifest['packagingCommit'],'files':len(files)+1,'verified':'Full CRC and every SHA256'};(b/'package-result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
