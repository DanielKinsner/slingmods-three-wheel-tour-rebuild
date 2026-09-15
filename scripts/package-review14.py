"""Allowlisted review-only delivery. Never modifies source assets or historical evidence."""
from pathlib import Path
import json,hashlib,subprocess,tempfile,zipfile,datetime,shutil,os
R=Path(__file__).resolve().parents[1];E=R/'director-kit/production/evidence/P07A'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=R,text=True).strip()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,d):p.write_text(json.dumps(d,indent=2),encoding='utf-8')
stage=Path(tempfile.mkdtemp(prefix='slingmods-review14-'));files={};mapping=[]
def add(source,dest=None,category='report'):
 source=Path(source);assert source.is_file(),source
 dest=dest or source.relative_to(R).as_posix();assert dest not in files,dest
 target=stage/dest;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,target)
 files[dest]={'path':dest,'bytes':target.stat().st_size,'sha256':sha(target),'category':category}
 mapping.append({'reviewPath':dest,'retainedOriginal':source.relative_to(R).as_posix() if source.is_relative_to(R) else str(source),'originalSHA256':sha(source),'transformation':'Identical bytes copied; ZIP lossless DEFLATE only'})
for folder in ['src','tests','scripts']:
 for p in sorted((R/folder).rglob('*')):
  if p.is_file() and p.suffix in ['.ts','.mjs','.js','.py','.ps1','.css','.json','.md','.sh','.html'] and not any(n in p.parts for n in ['node_modules','__pycache__']):add(p,category='source')
for name in ['index.html','package.json','package-lock.json','tsconfig.json','vite.config.ts','demo-assets.json','.gitignore','AGENTS.md','HANDOFF.md','RESUME.md','DEPLOYMENT-READINESS.md']:
 add(R/name,category='source' if name.endswith(('.json','.ts','.html')) else 'report')
for name in ['AGENTS.md','production/state.json']:
 add(R/'director-kit'/name,category='report')
for p in sorted((R/'director-kit/director-addenda/review-13').rglob('*')):
 if p.is_file() and p.suffix in ['.md','.json','.py'] and 'evidence' not in p.parts and '__pycache__' not in p.parts:add(p,category='report')
for p in sorted((R/'public').rglob('*.json')):add(p,category='metadata')
add(R/'director-kit/production/evidence/P04B2/fixtures/review08-earned.json',category='metadata')
# Complete current raw logs/timing/reports, including failed experiments; never sample/round dynamic evidence.
for p in sorted(E.rglob('*')):
 if p.is_file() and p.suffix in ['.json','.jsonl','.log','.md','.csv','.txt','.mjs','.py'] and not any(n in p.parts for n in ['agent','raw-video','frames','packaging']) and p.name not in ['package-receipt.json']:
  add(p,category='timing' if p.name=='run.json' or p.suffix=='.jsonl' else 'report')
for folder in sorted((R/'director-kit/production/evidence/P06C').iterdir()):
 if folder.is_dir() and folder.name.startswith(('verified-scored-','heavy1080-followup','day-scored-')):
  for p in sorted(folder.glob('*.json')):add(p,category='timing' if p.name=='run.json' else 'report')
for name in ['performance-summary.json','performance-summary-first-matrix.json','day-performance-summary.json','final-performance-review.md','PERFORMANCE-REVIEW.md','scoring-review.md','host-cpu-followup.jsonl','host-gpu-followup.csv','host-telemetry.json','source-clearance.json']:
 p=R/'director-kit/production/evidence/P06C'/name
 if p.exists():add(p,category='timing' if p.suffix in ['.jsonl','.csv'] else 'report')
stills=[('ui-final/entry-1080.jpg','entry.jpg'),('ui-final/entry-narrow.jpg','desktop-support.jpg'),('ui-final/garage-day.jpg','garage.jpg'),('ui-final/shop-build.jpg','shop-build.jpg'),('ui-final/garage-night.jpg','garage-night.jpg'),('ui-final/stock-compare.jpg','stock-compare.jpg'),('ui-final/crew-ready.jpg','crew-controls.jpg'),('ui-final/daylight-ready.jpg','daylight.jpg'),('signs-final/service-594-day.jpg','service-brand-day.jpg'),('signs-final/service-875-night.jpg','service-brand-night.jpg'),('video-final-02/result-review.jpg','result.jpg'),('video-final-02/cockpit-review.jpg','race-cockpit.jpg')]
stills.append(('native-final-02/shop-installed-720.jpg','shop-720.jpg'))
for source,dest in stills:add(E/source,'review-images/'+dest,'image')
add(E/'video-final-02/complete-race-LIVE-AUDIO.mp4','review-media/showcase-LIVE-AUDIO.mp4','video')
add(E/'REVIEW-ME-FIRST.md','REVIEW-ME-FIRST.md','report')
baseline=read(E/'baseline.json');runtime=read(E/'final-build.json');packaging=git('rev-parse','HEAD');tree=git('rev-parse','HEAD^{tree}')
intro=stage/'REVIEW-ME-FIRST.md';intro.write_text(intro.read_text(encoding='utf-8').replace('PACKAGING_COMMIT_AT_DELIVERY',packaging),encoding='utf-8');files['REVIEW-ME-FIRST.md'].update(bytes=intro.stat().st_size,sha256=sha(intro));next(m for m in mapping if m['reviewPath']=='REVIEW-ME-FIRST.md')['transformation']='Packaging commit token resolved to the verified local HEAD; content otherwise identical.'
sourceInventory=[v for k,v in files.items() if v['category']=='source' or k.startswith('public/')]
binarySuffixes={'.blend','.glb','.gltf','.bin','.png','.jpg','.jpeg','.webp','.hdr','.exr','.wav','.mp3','.ogg','.ktx2'}
bulk=[];tracked=git('ls-files','assets','public').splitlines()
for name in tracked:
 p=R/name
 if p.suffix.lower() not in binarySuffixes or name in files:continue
 h=sha(p);old=baseline['files'].get(name);blob=git('rev-parse',runtime['commit']+':'+name)
 # Verify retained Git binary bytes against the actual local file, not merely a path label.
 committed=subprocess.check_output(['git','cat-file','blob',blob],cwd=R);assert hashlib.sha256(committed).hexdigest()==h,name
 role='Editable Blender source' if p.suffix=='.blend' else 'Runtime asset' if name.startswith('public/') else 'Retained authoring/reference asset'
 relationship='Original retained project asset; corresponding authored generators under scripts and source manifests under public/assets.'
 if name.endswith('/bay.glb'):relationship='Exact dependency subset of public/assets/showcase-quality/kit.glb; scripts/p07a_extract_bay.py; editable counterpart assets/blender/showcase-quality/showcase-bay-exact.blend; bay-extraction.json verifies every retained descriptor and binary view.'
 if 'slingmods-sign' in name or 'showcase-branding' in name:relationship='scripts/p07a_brand_build.py; original public/assets/brand/slingmods-logo-main.png; placement/source receipts included.'
 if name.endswith('slingmods-logo-main.png'):relationship='Unaltered first-party artwork; proprietary trademark, explicitly authorized local P07A use; slingmods-logo-main.source.json contains URL and original hash.'
 if name.endswith('showcase-bay-exact.blend'):relationship='Exact bay objects and dependencies loaded from assets/blender/showcase-quality/built-waterfront.blend; scripts/p07a_brand_build.py.'
 bulk.append({'path':name,'role':role,'bytes':p.stat().st_size,'sha256':h,'baselineSHA256':old['sha256'] if old else None,'statusVersusBaseline':'unchanged' if old and old['sha256']==h else 'changed' if old else 'new','sourceExportRelationship':relationship,'identity':'Original source' if p.suffix=='.blend' or name.endswith('slingmods-logo-main.png') else 'Derived runtime/reference; see relationship and included provenance','recovery':{'availability':'LOCAL_ONLY','checkoutRelativePath':name,'commit':runtime['commit'],'gitBlob':blob,'gitCommand':['git','show',runtime['commit']+':'+name],'verifiedExistsAndHash':True}})
retained=[]
for p in sorted(E.rglob('*')):
 if p.is_file() and p.suffix.lower() in ['.mp4','.webm','.png','.jpg','.blend','.glb','.wav']:
  retained.append({'path':p.relative_to(R).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p),'availability':'LOCAL_ONLY','retained':True})
status=git('status','--porcelain');assert status=='?? P06C-HOME-KICKOFF.md',status
indexes={
 'SOURCE-SNAPSHOT.json':{'schemaVersion':1,'repository':{'remote':baseline['remote'],'branch':'main'},'baselineCommit':baseline['baselineCommit'],'candidateCommit':runtime['commit'],'runtimeBuildRef':runtime['buildRef'],'packagingCommit':packaging,'packagingTree':tree,'runtimeTree':git('rev-parse',runtime['commit']+'^{tree}'),'inventory':sourceInventory,'uncommittedIncluded':[],'uncommittedExcluded':[{'path':n,'sha256':h,'reason':'Unrelated pre-existing user work preserved byte-for-byte'}for n,h in baseline['unrelated'].items()],'retainedCompleteSnapshot':{'kind':'Exact local Git trees plus all verified local required binaries and immutable evidence','rootProvenance':str(R),'recovery':'git show <candidateCommit>:<path> or existing checkout; binary hashes checked against Git blobs. Windows working text uses Git CRLF conversion; uploaded current text exact hashes inventoried, baseline preservation uses strict unnormalized bytes.','evidence':retained},'remoteAvailability':{'result':'LOCAL_ONLY','verification':'No new authenticated remote availability query performed. No upload/push in P07A. Do not assume either commit downloadable.'}},
 'BULK-ASSET-INDEX.json':{'schemaVersion':1,'reviewOnlyNotPlayable':True,'baselineCommit':baseline['baselineCommit'],'candidateCommit':runtime['commit'],'files':bulk,'notices':'Included original source/provenance manifests carry CC0 notices, authored audio provenance and proprietary official artwork authorization. Complete playable output separately retained and inventoried in final-output-manifest.json.'},
 'EVIDENCE-INDEX.json':{'schemaVersion':1,'candidateCommit':runtime['commit'],'packagingCommit':packaging,'included':mapping,'retainedRawMediaAndBinaryEvidence':retained,'timing':'All included run.json/profile rows and lifecycle events are complete, unrounded original files; scorer thresholds and host alignment in scripts/summarize-review14.py. Historical P06C failures, P07A baseline repeats and final matrix remain distinct. Recording runs are not acceptance timing.','media':'One continuous720p25fps gameplay movie with actual captured game audio and three disclosed sync chirps. Constant audio shift only. Source/master/upload hashes and complete stream metadata in video-final-02/audio-video-verification.json and ffprobe.json. Original Playwright webm, live audio and video-only master retained locally; no cuts, interpolation or speed change. Review JPEGs are declared copies or PNG-to-JPEG derivatives, original receipt mapping in media-review.json.','omissions':'No playable dist, historical meshes, Blender/texture masters, raw video/audio duplicates or prior ZIPs. Full source/bulk/evidence remains in exact local Git trees and named local files. Thirteen selected stills (extra720p shop view for responsive verification); other matching day/night views retained locally.'}}
for name,data in indexes.items():write(stage/name,data);p=stage/name;files[name]={'path':name,'bytes':p.stat().st_size,'sha256':sha(p),'category':'metadata'}
write(stage/'REVIEW-MANIFEST.json',{'schemaVersion':1,'files':list(files.values())})
output=R/'Astra-Review-14-Lean.zip';assert not output.exists(),'Retain existing delivery; investigate before replacing'
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name in [*files,'REVIEW-MANIFEST.json']:z.write(stage/name,name)
assert output.stat().st_size<=100_000_000,'Delivery exceeds cap: do not hand off'
receipt={'zip':output.name,'bytes':output.stat().st_size,'sha256':sha(output),'stageProvenance':str(stage),'packagingCommit':packaging,'runtimeCommit':runtime['commit'],'files':len(files)+1,'reviewOnly':True}
write(E/'package-receipt.json',receipt);print(json.dumps(receipt,indent=2))
