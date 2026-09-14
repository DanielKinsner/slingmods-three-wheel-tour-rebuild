from pathlib import Path
import json,hashlib,zipfile,subprocess,re,sys
root=Path.cwd().resolve();assert str(root)==r'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'
b=Path('director-kit/production/evidence/P05');files={}
def add(p,name=None):
 p=Path(p);assert p.is_file(),p;assert not any(x in p.parts for x in ['.git','node_modules','dist','__pycache__','.tools','raw-video','agent','solo-agent','crew-agent']);assert not p.name.startswith('.env') and p.suffix not in ['.blend1','.bak','.key','.pem','.zip'];files[name or p.as_posix()]=p
build=json.loads((b/'build-inputs-verified.json').read_text())
for n,h in build['inputs'].items():
 assert hashlib.sha256(Path(n).read_bytes()).hexdigest()==h,n
 add(n)
for p in Path('public').rglob('*'):
 if p.is_file():add(p)
add('director-kit/production/evidence/P04B2/fixtures/review08-earned.json')
for n in ['README.md','AGENTS.md','AUTONOMOUS_RESUME.md','.gitignore','.gitattributes','director-kit/AGENTS.md','scripts/summarize-review10.py','scripts/package-astra-review10.py','scripts/finalize-review10.py','scripts/check-shared-support.ts','scripts/render-flow-review10.py','scripts/capture-review10-day.mjs','scripts/trace-review10.mjs','scripts/review10-trace-generated.mjs']:add(n)
for p in Path('director-kit/director-addenda/review-09').rglob('*'):
 if p.is_file() and p.suffix in ['.md','.json'] and 'evidence'not in p.parts:add(p)
for n in ['baseline.json','baseline-tests.log','solo-before.json','parity.json','parity-verified.log','support-check.json','preserved-foundation-verified.json','build-inputs-verified.json','build-verified.log','tests-verified.log','milestones.md','reviewer-competition-final.md','reviewer-career-final.md','reviewer-integration-last.md','native-contact-repair.md','failed-native-repeat.json.gz','performance-summary.json','performance-review.md','acceptance-results.json','media-review.json','final-review.md','STATE-EXCERPT.json']:add(b/n)
for n in ['performance-diagnosis.json','performance-diagnosis.md','trace-selection.json.gz','trace-harness-provenance.json','heavy-followup-host-before.json','host-contention.json']:add(b/n)
for n in ['podium-11.json','field-player-97.json','podium-11-ticks.jsonl.gz','field-player-97-ticks.jsonl.gz','adversarial-physical.json','rules-tests.log','adversarial-run.log','rules-provenance.json']:add(b/'competition-repaired'/n)
for folder in ['fresh-verified','ui-verified','controller-verified','audio-verified','solo-ui-verified']:
 for p in (b/folder).glob('*'):
  if p.is_file()and p.suffix in ['.json','.md']:add(p)
for d in sorted(b.glob('verified-scored-*')):
 if d.is_dir():
  for n in ['run.json','provenance.json','bay.json']:add(d/n)
for d in ['stock720-followup','heavy1080-followup','diagnostic-stock720']:
 for n in ['run.json','provenance.json','bay.json']:add(b/d/n)
for n in ['run.json','provenance.json','bay.json','reloaded-bay.json','video.json','ffprobe.json','complete-race-SILENT.mp4']:add(b/'video-verified'/n)
for n in ['grid','contest','cockpit','final-lap','result','saved-build']:add(b/'video-verified'/(n+'.png'))
for n in ['grid','contest','cockpit','final-lap']:add(b/'video-verified'/(n+'.json'))
add(b/'fresh-verified/fresh-chapter.png')
for n in ['day-time-trial.png','capture.json']:add(b/'day-verified'/n)
for n in ['flow-video.json','flow-ffprobe.json','chapter-flow-EDITED-SILENT.mp4']:add(b/'fresh-verified'/n)
add(b/'REVIEW-ME-FIRST.md','REVIEW-ME-FIRST.md');add(b/'STATE-EXCERPT.json','director-kit/production/state.json')
assert len([n for n in files if n.startswith('director-kit/production/evidence/')and n.endswith('.png')])==8
for n,p in files.items():
 if p.suffix in ['.ts','.mjs','.js','.json','.py','.md','.html','.css']:
  assert not re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-proj-|ghp_)[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}',p.read_text(encoding='utf-8-sig')),n
manifest={'root':str(root),'runtimeCommit':build['commit'],'packagingCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'runtimeInputManifest':'director-kit/production/evidence/P05/build-inputs-verified.json','additionalReviewTooling':[n for n in files if n.startswith('scripts/')and n not in build['inputs']],'files':{n:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for n,p in sorted(files.items())}}
if '--selection' in sys.argv:
 (b/'package-selection.json').write_text(json.dumps(sorted(set(p.as_posix()for p in files.values())),indent=2));print('Validated selection:',len(files),'files,',sum(p.stat().st_size for p in files.values()),'raw bytes');sys.exit(0)
out=root/'Astra-Review-10.zip';i=2
while out.exists():out=root/f'Astra-Review-10-{i}.zip';i+=1
with zipfile.ZipFile(out,'x',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for n,p in sorted(files.items()):z.write(p,n)
 z.writestr('PACKAGE-MANIFEST.json',json.dumps(manifest,indent=2))
with zipfile.ZipFile(out)as z:
 assert z.testzip()is None
 for n,v in manifest['files'].items():assert hashlib.sha256(z.read(n)).hexdigest()==v['sha256']
result={'path':str(out),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'runtimeCommit':build['commit'],'packagingCommit':manifest['packagingCommit'],'files':len(files)+1,'verified':'fullCRC and everySHA256'}
(b/'package-result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
