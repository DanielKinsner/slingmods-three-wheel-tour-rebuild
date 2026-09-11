"""Read-only checks of recorded rear transforms and prior lap trajectories.
This checks supplied runtime evidence against independent endpoint equations;
it does not launch the browser, the physics engine, or Three.js.
"""
import json,argparse,zipfile
from pathlib import Path
import numpy as np

def point(m,p):return (m@np.r_[p,1])[:3]
def assess(rows,rig):
    C,A,H,U,L=[np.array(rig[k],float)for k in ['wheelCenter','armPivot','armHub','shockUpper','shockLower']]
    lengths=[];maxerr=0.;mindiff=1.;presentations=0;spingroup={};spinfail=0
    for r in rows:
        rear=r.get('rear');
        if not rear:continue
        presentations+=1;c=np.array(rear['wheelCenter']);hub=H+c-C
        mats={k:np.array(v).reshape(4,4).T for k,v in rear['groups'].items()}
        lower=point(mats['arm'],L)
        errors=[np.linalg.norm(point(mats['arm'],A)-A),np.linalg.norm(point(mats['arm'],H)-hub),np.linalg.norm(point(mats['axle'],C)-c),np.linalg.norm(point(mats['caliper'],C)-c),np.linalg.norm(point(mats['shockBody'],U)-U),np.linalg.norm(point(mats['shockPiston'],L)-lower),np.linalg.norm(point(mats['shockSpring'],U)-U),np.linalg.norm(point(mats['shockSpring'],L)-lower),np.linalg.norm(np.array(rear['visibleWheelCenter'])-c)]
        maxerr=max(maxerr,*errors);lengths.append(float(np.linalg.norm(hub-A)-np.linalg.norm(H-A)))
        shockLen=np.linalg.norm(lower-U);mindiff=min(mindiff,rig['sleeves']['bodyLength']+rig['sleeves']['pistonLength']-shockLen)
        key=round(c[1],12)
        if key in spingroup:
            if max(np.max(np.abs(mats[k]-spingroup[key][k]))for k in mats)>1e-10:spinfail+=1
        else:spingroup[key]=mats
    return dict(presentations=presentations,maxIndependentEndpointErrorM=maxerr,maxAbsVisualArmLengthChangeM=max(map(abs,lengths)),maxAbsVisualArmScaleChange=max(map(abs,lengths))/np.linalg.norm(H-A),minSleeveOverlapM=mindiff,spinDependentOrHistoryDependentMatrixFailures=spinfail)

def main():
    a=argparse.ArgumentParser();a.add_argument('root');a.add_argument('--previous-zip',required=True);a.add_argument('--output',required=True);args=a.parse_args();P=Path(args.root)
    rig=json.loads((P/'public/assets/vehicles/slingshot-p04a1-rear-rig.json').read_text());r=json.loads((P/'director-kit/production/evidence/Review07-rear/rear-capture.json').read_text())
    out={'scope':'Independent endpoint reconstruction from supplied matrices, not browser execution or complete moving-mesh clearance certification. Diagnostic poses injected, ordinary driving separately tagged.', 'sweep':assess(r['sweep'],rig),'rearMotion':assess(r['motion'],rig),'laps':{}}
    with zipfile.ZipFile(args.previous_zip)as z:
        for name in ['day','night']:
            rows=json.loads((P/f'director-kit/production/evidence/Review07-final/{name}-timeline.json').read_text())
            previous=json.loads(z.read(f'director-kit/production/evidence/Review06-final02/{name}-timeline.json'))
            mismatches=[i for i,(r,p)in enumerate(zip(rows,previous))if r['telemetry']!=p['telemetry']]
            item=assess(rows,rig);item.update(rows=len(rows),previousRows=len(previous),physicsRowCountMatches=len(rows)==len(previous),physicsTelemetryMismatches=mismatches,peakSpeedMph=max(abs(r['telemetry']['speed'])for r in rows)*2.2369362920544,gears=sorted(set(r['telemetry']['gear']for r in rows)),result=rows[-1]['race'].get('result'),cameraModes=sorted(set(str(r['camera'].get('active',r['camera'].get('mode','unknown')))for r in rows)))
            out['laps'][name]=item
    Path(args.output).write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
if __name__=='__main__':main()
