import json,pathlib
def driver_attachment(runtime):
 repo=pathlib.Path(__file__).resolve().parents[2]
 original=json.loads((repo/'public/assets/model02/driver-attachment.json').read_text(encoding='utf-8'))
 d={key:original[key] for key in ['headVisualNode','arms','feet','legs']}
 d.update({'handlebar':True,'rootOffset':[.36,.25,-.06],'eye':[0,1.36,.12]})
 for side,a in d['arms'].items():
  sign=-1 if side=='left' else 1;a['wheelGripLocal']=[sign*.274,.02,.012];a['poleHint']=[sign*.52,.98,.03]
 for side,l in d['legs'].items():
  sign=-1 if side=='left' else 1;l['ankle']=[sign*.30,.24,-.18];l['pole']=[sign*.37,.62,-.07];l['footPitch']=.05
 (pathlib.Path(runtime)/'driver-attachment.json').write_text(json.dumps(d,indent=2),encoding='utf-8')
