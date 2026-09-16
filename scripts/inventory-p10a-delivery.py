"""Index every original P10A evidence file, including material failures and raw media."""
from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).resolve().parents[1];e=root/'director-kit/production/evidence/P10A'
receipt=json.loads((root/'handoff/P10A-VALIDATION.json').read_text(encoding='utf-8'))
selected=set(receipt['packetDataDirectories']);files={}
for p in sorted(e.rglob('*')):
    if not p.is_file() or p.name=='DELIVERY-INVENTORY.json':continue
    name=p.relative_to(e).as_posix()
    nested=p.suffix.lower() in ['.json','.txt','.md','.csv','.gz','.html','.log'] and 'raw-video' not in p.parts and (p.parent==e or name.split('/')[0] in selected)
    direct=name=='film-01/P10A-Ridge-Run.mp4' or name in ['REVIEW20-SUMMARY.md','P10A-AUDIT.md','PERFORMANCE.md','film-01/FILM-REVIEW.md']
    selected_still=(name.startswith('art-proof-06/') and any(name.endswith(x+'.png') for x in ['paddock-grid','woods','overlook','descent'])) or name in ['geometry-final-02/route-profile.png','art-proof-06/night-crest-cockpit.png','ui-final-01/destinations-1280.png','finish-wait-03/02-resumed-field-award.png',receipt['hosted']['directory']+'/04-same-build.png']
    files[p.relative_to(root).as_posix()]={'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'packet':'lossless nested data' if nested else 'direct film/review/still' if direct or selected_still else 'Git only: original capture, intermediate or exploratory evidence'}
result={'schemaVersion':1,'scope':'Every original P10A file at packaging; this inventory excludes itself to avoid recursion. Later delivery receipts separately identify final remote verification. Every listed file must be in main, including all Git-only raw media and failures.','sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'files':files}
(e/'DELIVERY-INVENTORY.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({'files':len(files),'bytes':sum(f['bytes'] for f in files.values())}))
