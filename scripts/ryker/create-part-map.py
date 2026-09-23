"""Reviewed mapping for the preserved master. Regeneration is explicit, never automatic at export."""
import hashlib,json,pathlib
base=pathlib.Path(__file__).resolve().parents[2]
rows=json.loads((base/'assets/ryker/evidence/complete/source-islands.json').read_text())
manifest={'version':1,'source':'assets/ryker/Ryker-Game-Master.blend','sha256':hashlib.sha256((base/'assets/ryker/Ryker-Game-Master.blend').read_bytes()).hexdigest(),'basis':'+X right +Y up -Z forward','nodes':{}}
for name,islands in rows.items():
 for r in islands:
  k,lo,hi=r['island'],r['min'],r['max'];motion=None
  if name=='body_panels':
   part='stock_ryker_body' if hi[2]<-.57 and hi[1]<.62 else 'retained_body_panels'
  elif name=='front_suspension':
   channel=0 if (lo[0]+hi[0])/2<0 else 1
   if k in [8320,11084,3492,861]:
    part='stock_ryker_shocks';motion={'kind':'shock','channel':channel,'part':'spring' if k in [8320,11084] else 'body-shaft'}
   else:
    part='retained_front_links'
    if (lo[0]>.17 or hi[0]<-.15) and hi[0]-lo[0]>.15:
     motion={'kind':'arm','channel':channel,'pivot':[(-.177 if channel==0 else .193),(.31 if lo[1]>.25 else .222),-.855]}
    elif (lo[0]>.37 or hi[0]<-.36):motion={'kind':'carrier','channel':channel}
  else:
   part='stock_ryker_shocks_rear' if k in [37908,23951] else 'stock_ryker_exhaust' if k==11062 else 'retained_rear_mechanical'
   if k in [37908,23951]:motion={'kind':'shock','channel':2,'part':'spring' if k==37908 else 'body-shaft'}
   elif lo[2]>.70 or k in [5240,18522,14208,20410,23664,26469,38293,26648,26784,20570]:motion={'kind':'rear-arm','channel':2,'pivot':[0,.285,.075]}
  r['part']=part;r['motion']=motion
 manifest['nodes'][name]=islands
(base/'assets/ryker/part-map-v1.json').write_text(json.dumps(manifest,indent=2)+'\n')
