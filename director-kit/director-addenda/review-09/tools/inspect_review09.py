#!/usr/bin/env python3
"""Read-only independent Review09 evidence audit. No execution of submitted game code.
Usage: python inspect_review09.py EXTRACTED_REVIEW09 REVIEW08_ZIP OUTPUT_JSON
"""
import argparse, hashlib, json, math, pathlib, statistics, zipfile

def digest(b): return hashlib.sha256(b).hexdigest()
def quantile(xs,q):
    a=sorted(xs); p=(len(a)-1)*q;i=math.floor(p);j=math.ceil(p)
    return a[i]+(a[j]-a[i])*(p-i) if a else None

def main():
    ap=argparse.ArgumentParser();ap.add_argument('root',type=pathlib.Path);ap.add_argument('previous',type=pathlib.Path);ap.add_argument('output',type=pathlib.Path);a=ap.parse_args()
    e=a.root/'director-kit/production/evidence/P04B2';rd=lambda p:json.loads(p.read_text())
    manifest=rd(a.root/'PACKAGE-MANIFEST.json'); bad=[]
    for n,v in manifest['files'].items():
        p=a.root/n
        if not p.exists() or digest(p.read_bytes())!=v['sha256'] or p.stat().st_size!=v['bytes']:bad.append(n)
    protected=rd(e/'protected-baseline.json');compared=[];missing=[];mismatch=[]
    with zipfile.ZipFile(a.previous) as z:
        for n,h in protected.items():
            p=a.root/n
            if not p.is_file() or n not in z.namelist():missing.append(n);continue
            x=digest(p.read_bytes());y=digest(z.read(n))
            (compared if x==y==h else mismatch).append(n)
    inputs=rd(e/'build-inputs.json');raw_inputs=inputs['inputs'];overrides=inputs.get('packagingOnlyInputs',{}); inpbad=[]; inpmissing=[]
    for n,h in raw_inputs.items():
        p=a.root/n
        if not p.is_file():inpmissing.append(n)
        elif digest(p.read_bytes())!=h and digest(p.read_bytes())!=overrides.get(n):inpbad.append(n)
    all_running=[]; runs=[];provenance_bad=[]
    for path in sorted(e.glob('scored-*/run.json')):
        d=rd(path);p=d['profile'];col={x:i for i,x in enumerate(p['columns'])}; rows=p['rows'];i=lambda name:col[name]
        running=[r for r in rows if r[i('phaseCode')]==2];intervals=[r[i('intervalMs')] for r in running];all_running+=intervals
        dt_errors=[k for k,r in enumerate(rows[1:],1) if abs(r[i('intervalMs')]-(r[i('rafMs')]-rows[k-1][i('rafMs')]))>1e-6]
        provenance=rd(path.parent/'provenance.json')
        for n,h in provenance['served'].items():
            if not (a.root/n).is_file() or digest((a.root/n).read_bytes())!=h:provenance_bad.append([path.parent.name,n])
        runs.append({'name':path.parent.name,'commit':d['commit'],'browser':d['browser'],'renderer':p['renderer'],'drawingBuffer':p['size'],'DPR':p['dpr'],'recording':d['record'],'expandedGLDiagnostic':d['diagnostic'],'oldFullInspection':d['oldInspect'],'preserveDrawingBuffer':p['buffer']['preserveDrawingBuffer'],'racingIntervals':len(intervals),'p95Ms':quantile(intervals,.95),'p99Ms':quantile(intervals,.99),'worstRacingMs':max(intervals),'above33_4Ms':sum(x>33.4 for x in intervals),'above50Ms':sum(x>50 for x in intervals),'above100Ms':sum(x>100 for x in intervals),'allPhaseMaxMs':max(r[i('intervalMs')] for r in rows),'racingShaderCounts':sorted(set(r[i('programs')] for r in running)),'residentSpotCounts':sorted(set(r[i('residentSpot')] for r in running)),'residentAreaCounts':sorted(set(r[i('residentArea')] for r in running)),'timestampMismatchRows':len(dt_errors),'overflow':p['overflow'],'sourceLoadMs':p['loadMs'],'preparationMs':p['preparation']['ms'],'raceResults':[r['race']['result'] for r in d['results']],'errors':d['errors']})
    bases=[]
    for name in ['baseline-clean','baseline-diagnostic-gl']:
        d=rd(e/name/'run.json');p=d['profile'];col={x:i for i,x in enumerate(p['columns'])};rs=p['rows']; worst=max(rs,key=lambda r:r[col['renderSubmissionMs']]);end=worst[col['rafMs']]+worst[col['cpuFrameMs']]+20;start=worst[col['rafMs']]-20
        block=[x for x in d['glEvents'] if x['name']=='getProgramInfoLog' and start<=x['start']<=end]
        bases.append({'name':name,'recording':d['record'],'preserveDrawingBuffer':p['buffer'].get('preserveDrawingBuffer'),'maxRenderSubmissionMs':worst[col['renderSubmissionMs']],'maxRAFIntervalMs':max(r[col['intervalMs']] for r in rs),'worstRenderRafMs':worst[col['rafMs']],'programTransitions':[x for x in p['events'] if x['event']=='program-count'],'blockingInfoCallsInWorstRender':len(block),'blockingInfoCalls':block,'limit':'Historical baseline byte snapshot not independently preserved; causal support is trace plus changed source, not a freshly rerun baseline.'})
    result={'artifact':'Astra Review09 independent analysis','method':'Recomputed from supplied raw files; no local browser/GPU benchmark. Percentiles use linear interpolation. Reading recorded results is not rerunning their race physics.','runtimeCommit':manifest['runtimeCommit'],'packagingCommit':manifest['packagingCommit'],'manifest':{'verifiedEntries':len(manifest['files'])-len(bad),'mismatches':bad},'capturedInputs':{'count':len(raw_inputs),'mismatches':inpbad,'missing':inpmissing,'packagingOverrides':overrides},'protected':{'previous':'Astra-Review-08.zip','verifiedCount':len(compared),'verified':compared,'mismatches':mismatch,'unavailableForIndependentComparison':missing},'servedAssetMismatches':provenance_bad,'runs':runs,'aggregate':{'scoredRuns':len(runs),'reportedValidLaps':sum(x['valid'] for r in runs for x in r['raceResults']),'racingIntervals':len(all_running),'p95Ms':quantile(all_running,.95),'p99Ms':quantile(all_running,.99),'worstMs':max(all_running),'over33_4Ms':sum(x>33.4 for x in all_running),'allPhaseMaxMs':max(r['allPhaseMaxMs'] for r in runs)},'baselines':bases,'notIndependentlyReexecuted':['74-test full suite','browser reload/UI suite','10200-step kit on/off physics comparison','hardware timing','audio audition']}
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result[k] for k in ['manifest','capturedInputs','aggregate']},indent=2));print('protected',len(compared),'unavailable',missing,'mismatch',mismatch);print('baselines',[(x['name'],x['maxRenderSubmissionMs'],x['blockingInfoCallsInWorstRender']) for x in bases])
if __name__=='__main__':main()
