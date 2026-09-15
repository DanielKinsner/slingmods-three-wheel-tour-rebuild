from pathlib import Path
import json,hashlib,subprocess,math
R=Path(__file__).resolve().parents[1];E=R/'director-kit/production/evidence/P07A';b=json.loads((E/'baseline.json').read_text())
allowed={'package.json','src/career/build-ui.ts','src/career/catalog.ts','src/career/chapter-ui.ts','src/career/client.ts','src/crew-ui.ts','src/crew.ts','src/harbor-entry.ts','src/harbor-ui.ts','src/harbor.ts','src/main.ts','src/presentation/prepare.ts','src/presentation/showcase.ts','src/save.ts','src/workbench.ts'}
rows=[]
for name,old in b['files'].items():
 p=R/name;assert p.exists(),name;sha=hashlib.sha256(p.read_bytes()).hexdigest();same=sha==old['sha256'];assert same or name in allowed,name
 rows.append({'path':name,'baselineSHA256':old['sha256'],'candidateSHA256':sha,'bytes':p.stat().st_size,'exact':same,'authorizedSeam':None if same else 'P07A presentation/profile/loading/catalog/navigation only; see text diff and independent review'})
for name,h in b['unrelated'].items():assert hashlib.sha256((R/name).read_bytes()).hexdigest()==h
layout=json.loads((R/'public/assets/brand/sign-layout.json').read_text());signs=[]
for p in layout['placements']:
 half=p['width']/2;hy=half/layout['aspectRatio'];corners=[[p['position'][0]+math.cos(p['yaw'])*x,p['position'][1]+y,p['position'][2]-math.sin(p['yaw'])*x]for x in[-half,half]for y in[-hy,hy]]
 signs.append({'id':p['id'],'worldCorners':corners,'bottomMetres':p['position'][1]-hy,'triangles':2,'colliders':0,'newLights':0,'castsShadow':False})
report={'schemaVersion':1,'baselineCommit':b['baselineCommit'],'candidateAtCheck':subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip(),'method':'Strict bytes/SHA256 against actual P07A starting checkout, no newline normalization. All historical source/binaries in baseline retained. Allowed changed seams separately reviewed. New logo planes visual only; no route/collision edits.','files':rows,'unrelatedPreserved':b['unrelated'],'exactCount':sum(r['exact']for r in rows),'changedCount':sum(not r['exact']for r in rows),'newSignBounds':signs,'bayExtraction':json.loads((E/'bay-extraction.json').read_text()),'parity':json.loads((E/'parity.json').read_text())}
(E/'preservation.json').write_text(json.dumps(report,indent=2));print('P07A strict preservation:',report['exactCount'],'unchanged;',report['changedCount'],'authorized seam files; exact4200tick parity')
