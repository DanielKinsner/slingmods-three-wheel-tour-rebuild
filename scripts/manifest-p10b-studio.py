"""Hash the complete portable studio asset closure; does not generate paid media."""
from pathlib import Path
import hashlib,json,struct
P=Path(__file__).resolve().parents[1]
def row(p):
 b=p.read_bytes();return {'path':p.relative_to(P).as_posix(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
files=[]
for folder in ['assets/blender/p10b','public/assets/p10b','assets/fonts/barlow-condensed']:
 files += [p for p in (P/folder).rglob('*') if p.is_file() and p.name!='ASSET-MANIFEST.json']
files += [P/p for p in ['scripts/build-p10b-mural.py','scripts/build-p10b-wall-details.py','scripts/p10b-survey-room.py','scripts/manifest-p10b-studio.py','src/signature/studio-look.ts','src/presentation/signature-art.ts','tests/p10b-studio.test.ts']]
plate=P/'public/assets/p10b/tour-wall-plate.png';w,h=struct.unpack('>II',plate.read_bytes()[16:24])
assert (w,h)==(2172,724),'Preserve native artwork dimensions, never claim synthetic upscale as detail'
assert plate.read_bytes()==(P/'assets/blender/p10b/tour-wall-generated-master.png').read_bytes()
report={'pass':True,'runtimeArtwork':{'width':w,'height':h,'aspect':3,'nativeResolution':True,'upscaled':False,'colorSpace':'sRGB','role':'Non-emissive matte printed concept art, not real route geography'},'files':[row(p)for p in sorted(set(files))]}
(P/'assets/blender/p10b/ASSET-MANIFEST.json').write_text(json.dumps(report,indent=2),encoding='utf8');print(json.dumps({'pass':True,'files':len(files),'bytes':sum(r['bytes']for r in report['files'])}))
