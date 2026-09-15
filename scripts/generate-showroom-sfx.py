"""Explicit owner-authorized, one-shot ElevenLabs generation. Key only from process environment."""
import os,json,urllib.request,urllib.error,hashlib,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
key=os.environ['ELEVENLABS_API_KEY']
dest=root/'assets/source/showroom-refinement/bay-door-open-original.mp3'
if dest.exists():raise SystemExit('Existing generation preserved; no automatic paid retry.')
prompt='One electric metal roll-up garage bay door opening in an automotive workshop. Small initial latch clunk, low electric motor and rolling metal slat rattle for three seconds, slowing into a soft stop clunk. Restrained indoor reverberation, clear mechanical recording. Door mechanism only: no voices, music, engine, beeps or dramatic impact.'
body={'text':prompt,'duration_seconds':3.5,'prompt_influence':.7,'model_id':'eleven_text_to_sound_v2','loop':False}
request=urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128',data=json.dumps(body).encode(),headers={'xi-api-key':key,'Content-Type':'application/json'},method='POST')
try:
 with urllib.request.urlopen(request,timeout=120)as response:
  data=response.read();cost=response.headers.get('character-cost');kind=response.headers.get('Content-Type','')
except urllib.error.HTTPError as e:
 safe=re.sub(r'sk_[A-Za-z0-9_-]+','[REDACTED]',e.read().decode(errors='replace').replace(key,'[REDACTED]'))
 print(json.dumps({'status':'failed','httpStatus':e.code,'safeError':safe[:600],'note':'No automatic retry or account/purchase change. Credential suppressed.'}));raise SystemExit(1)
assert len(data)>1000 and ('audio' in kind or data[:3]==b'ID3')
dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
record={'provider':'ElevenLabs','endpoint':'https://api.elevenlabs.io/v1/sound-generation','documentation':'https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert','request':body,'ownerAuthorized':True,'credentialStorage':'Process environment only; credential omitted from all artifacts','characterCost':cost,'source':dest.relative_to(root).as_posix(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'purpose':'Synthetic bay-door mechanism for the showroom departure. Not a recording of the actual showroom.'}
(dest.parent/'bay-door-provenance.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps({k:record[k]for k in ['provider','source','bytes','sha256','characterCost']}))
