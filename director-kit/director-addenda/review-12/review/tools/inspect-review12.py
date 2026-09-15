"""Read-only package, asset and supplied-profile review. Does not run the game."""
from pathlib import Path
import json,hashlib,zipfile,struct,math,collections
import numpy as np
ROOT=Path('/mnt/data/astra-review-12-input'); E=ROOT/'director-kit/production/evidence/P06B'; OUT=Path('/mnt/data/SlingMods-Astra-Review-12/evidence')
def load(p):return json.loads(p.read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def norm(p):return str(p).replace('\\','/')
manifest=load(ROOT/'PACKAGE-MANIFEST.json'); bad=[]
for p,m in manifest['files'].items():
 f=ROOT/norm(p)
 if not f.is_file():bad.append([p,'missing']);continue
 b=f.read_bytes()
 if len(b)!=m['bytes'] or sha(b)!=m['sha256']:bad.append([p,'hash_or_size_mismatch'])
report={'runtimeCommit':manifest['runtimeCommit'],'packagingCommit':manifest['packagingCommit'],'package':{'listedFiles':len(manifest['files']),'mismatches':bad}}
protected=load(E/'preservation-final.json')['physicalAndGameInputs'];checks=[]
with zipfile.ZipFile('/mnt/data/Astra-Review-11.zip') as z:
 for item in protected:
  p=norm(item['path']); now=(ROOT/p).read_bytes(); old=z.read(p)
  checks.append({'path':p,'currentHash':sha(now),'baselineHash':sha(old),'rawIdentical':now==old,'reportedCurrentMatches':sha(now)==item['after']})
 git_checks=[]
 for item in load(E/'protected-git-comparison.json')['checks']:
  p=norm(item['path']);now=(ROOT/p).read_bytes();old=z.read(p)
  text=p.endswith(('.ts','.mjs','.json','.css','.md'))
  git_checks.append({'path':p,'rawIdentical':now==old,'lfNormalizedIdentical':now.replace(b'\r\n',b'\n')==old.replace(b'\r\n',b'\n') if text else now==old})
report['protectedRawComparisons']=checks;report['protectedExtendedComparisons']=git_checks
sources=load(ROOT/'public/assets/showcase-quality/source-manifest.json'); src_checks=[]
for s in sources['assets']:
 p=ROOT/norm(s.get('originalPath') or s['runtimePath']);d=ROOT/norm(s.get('derivedPath') or s['runtimePath'])
 src_checks.append({'asset':s['id'],'channel':s['channel'],'originalMatch':sha(p.read_bytes())==s['originalSHA256'],'derivedMatch':sha(d.read_bytes())==s['derivedSHA256'],'recordedLicense':s['license'],'sourcePage':s['assetPage']})
report['sourceChecks']=src_checks
exports={}
for file in ['foundation.glb','kit.glb']:
 p=ROOT/'public/assets/showcase-quality'/file;b=p.read_bytes();g=json.loads(b[20:20+struct.unpack_from('<I',b,12)[0]])
 m=[]
 for x in g['materials']:
  ex=x.get('extras',{})
  if ex.get('sourceAsset'):m.append({'name':x['name'],'source':ex['sourceAsset'],'tileMetres':ex.get('physicalTileMetres'),'channels':{'basecolor':bool(x.get('pbrMetallicRoughness',{}).get('baseColorTexture')),'normal':bool(x.get('normalTexture')),'orm':bool(x.get('pbrMetallicRoughness',{}).get('metallicRoughnessTexture')),'occlusion':bool(x.get('occlusionTexture'))}})
 exports[file]={'sha256':sha(b),'bytes':len(b),'meshes':len(g.get('meshes',[])),'primitives':sum(len(x['primitives']) for x in g.get('meshes',[])),'materials':len(g['materials']),'embeddedImages':sum('bufferView' in x for x in g.get('images',[])),'photoMaterials':m,'sourceTriangles':sum(g['accessors'][pr['indices']]['count']//3 for m in g['meshes'] for pr in m['primitives'])}
report['exports']=exports
layout=load(ROOT/'public/assets/showcase-quality/scene-layout.json');report['layout']={'placements':len(layout['instances']),'modules':dict(collections.Counter(i['module'] for i in layout['instances'])),'districts':layout['districts'],'routeLength':layout.get('routeLength'),'spatialChunkMetres':layout.get('spatialChunkMetres')}
profiles=[]
for folder in sorted(E.glob('verified-scored-*')):
 r=load(folder/'run.json'); cols=r['profile']['columns']; rows=r['profile']['rows'];idx={k:i for i,k in enumerate(cols)}
 active=[x for x in rows if x[idx['phaseCode']]==2];vals=sorted(x[idx['intervalMs']] for x in active)
 nearest=lambda p: vals[math.ceil(p*len(vals))-1]
 resources=[]
 for t in r.get('trace',[]):
  # exact recursively named summary values are stored separately below
  pass
 profiles.append({'configuration':folder.name,'width':r['width'],'recording':r['record'],'activeSamples':len(active),'p95ms':nearest(.95),'p99ms':nearest(.99),'maxMs':max(vals),'above33_4ms':sum(v>33.4+1e-6 for v in vals),'above100ms':sum(v>100+1e-6 for v in vals),'resultsCount':len(r['results']),'playerResults':[{'raceMs':x['telemetry']['time']*1000,'rank':x.get('competition',{}).get('position'),'resultFields':list(x.keys())} for x in r['results']],'programCounts':sorted(set(x[idx['programs']] for x in active)),'errors':r['errors'],'allPhaseOver100ms':[{'phase':x[idx['phaseCode']],'rafMs':x[idx['rafMs']],'intervalMs':x[idx['intervalMs']]} for x in rows if x[idx['intervalMs']]>100+1e-6]})
report['suppliedNativeProfiles']=profiles
report['verificationLimit']='Profiles and captures were supplied by Codex; statistics/hashes/export channels were independently recomputed here. No independent browser, hardware timing, physical controller, full physics/build or audio audition.'
(OUT/'independent-inspection.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'packageFiles':report['package'],'protectedRaw':{'total':len(checks),'mismatches':[i['path'] for i in checks if not i['rawIdentical']]},'protectedExtended':{'total':len(git_checks),'rawMismatches':[i['path'] for i in git_checks if not i['rawIdentical']],'normalizedMismatches':[i['path'] for i in git_checks if not i['lfNormalizedIdentical']]},'sourceRecords':len(src_checks),'sourceProblems':[i for i in src_checks if not i['originalMatch'] or not i['derivedMatch']],'layout':report['layout'],'exports':{k:{q:v[q] for q in ['bytes','primitives','materials','embeddedImages','sourceTriangles']} for k,v in exports.items()},'profiles':[{k:v for k,v in p.items() if k in ['configuration','activeSamples','p95ms','p99ms','maxMs','above100ms','resultsCount']} for p in profiles]},indent=2))
