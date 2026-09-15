"""Create a <=500 MB upload edition; preserve the original review and runtime bytes."""
from pathlib import Path
import hashlib,json,subprocess,zipfile

root=Path(__file__).resolve().parents[1]
base=root/'director-kit/production/evidence/P06C'
work=root/'.tools/review13-upload'
sha=lambda data:hashlib.sha256(data).hexdigest()
receipt=json.loads((base/'package-result.json').read_text())
original=root/'Astra-Review-13.zip'
assert sha(original.read_bytes())==receipt['sha256']
omitted=[f'assets/blender/{s}' for s in ['showcase-quality/quality-foundation.blend','showcase-quality/quality-kit.blend','harbor/harbor.blend']]

def probe(path):
 return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))

def audio_packets(path):
 return json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_packets','-show_entries','packet=pts_time,dts_time,duration_time,size,data_hash','-show_data_hash','sha256','-of','json',str(path)]))['packets']

replacements={};media=[]
for folder,short in [('video-final','crew'),('day-final','day')]:
 name=f'director-kit/production/evidence/P06C/{folder}/complete-race-LIVE-AUDIO.mp4'
 source=root/name;small=work/f'{short}.mp4'
 old,new=probe(source),probe(small)
 a=next(s for s in old['streams'] if s['codec_type']=='video')
 b=next(s for s in new['streams'] if s['codec_type']=='video')
 for k in ['width','height','r_frame_rate','nb_frames']:assert a[k]==b[k],(short,k,a[k],b[k])
 assert abs(float(a['duration'])-float(b['duration']))<0.001
 before_packets,after_packets=audio_packets(source),audio_packets(small)
 assert before_packets==after_packets,'Audio bytes or timestamps changed: '+short
 replacements[name]=small.read_bytes()
 media.append({'path':name,'originalSHA256':sha(source.read_bytes()),'uploadSHA256':sha(replacements[name]),'originalBytes':source.stat().st_size,'uploadBytes':small.stat().st_size,'width':b['width'],'height':b['height'],'frames':int(b['nb_frames']),'videoDurationSeconds':float(b['duration']),'audioPackets':len(after_packets),'audioPayloadAndTimestampsExactlyEqual':True,'method':'H264 CRF24, slow preset, maxrate1000k/bufsize2000k, same dimensions/frame count/duration. AAC copied without re-encoding. Lossy video derivative; original capture receipts describe original MP4 hashes.'})

with zipfile.ZipFile(original) as src:
 old_manifest=json.loads(src.read('PACKAGE-MANIFEST.json'))
 omission_records=[]
 for n in omitted:
  data=src.read(n)
  baseline=subprocess.check_output(['git','show',f'9780d62e4ea032dafc414dd838b040ed05565da5:{n}'],cwd=root)
  assert sha(data)==sha(baseline),'Omitted authoring source must be unchanged from actual start'
  omission_records.append({'path':n,**old_manifest['files'][n],'reason':'Unchanged original authoring input. Delivery packet permits path/size/hash provenance; retained in original Review13 ZIP and Git. Changed editable P06C sources remain included.'})
 edition={'originalArchive':original.name,'originalArchiveSHA256':receipt['sha256'],'originalRuntimeCommit':receipt['runtimeCommit'],'originalPackagingCommit':receipt['packagingCommit'],'uploadPackagingCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'limitBytes':500_000_000,'omittedUnchangedAuthoringInputs':omission_records,'media':media,'retained':'All runtime assets, source, tests, current changed editable Blender files, original source audio, stills, raw timings including failed repeats, logs and reviews. No gameplay/runtime changes. Performance and final art remain HOLD; G3/G4 pending. Original independent media review applies to original movies; upload video was recompressed and separately checked.'}
 note='''# Upload edition — under 500 MB

This is the upload-sized copy of Astra Review13. The original archive remains unchanged locally. UPLOAD-EDITION.json lists every omission/replacement and original/new hashes. ORIGINAL-PACKAGE-MANIFEST.json preserves the original inventory; PACKAGE-MANIFEST.json hashes this edition.

Both complete movies retain 1280x720 dimensions, original frame count and duration, and exactly identical AAC payloads and timestamps. Only video compression changed, so fine moving detail may be softer. Existing capture/audio verification reports and independent movie review describe the original movie hashes; use UPLOAD-EDITION.json for the delivered derivative hashes and verification.

Three unchanged historical authoring inputs (quality-kit.blend, quality-foundation.blend, harbor.blend) are represented by path/size/hash provenance, as permitted by the director packet. They remain in the original archive and Git. Current built-waterfront.blend and built-waterfront-foundation.blend, their source bakes, all current runtime assets and all test/timing evidence remain included. Playing/building requires no omitted Blender input; re-running historical authoring pipelines requires retrieving the unchanged inputs.

Performance HOLD, G3/G4 and final art status are unchanged.

---

'''
 for n in ['REVIEW-ME-FIRST.md','director-kit/production/evidence/P06C/REVIEW-ME-FIRST.md']:
  replacements[n]=(note+src.read(n).decode('utf-8')).encode()
 n='director-kit/production/evidence/P06C/editable-source-manifest.json'
 editable=json.loads(src.read(n))
 for item in editable['sources']:
  if item['path'] in omitted:item['includedInPackage']=False;item['uploadEditionNote']='Retained unchanged in original Review13 archive and Git; see UPLOAD-EDITION.json'
 replacements[n]=(json.dumps(editable,indent=2)+'\n').encode()
 additions={'UPLOAD-EDITION.json':json.dumps(edition,indent=2).encode(),'ORIGINAL-PACKAGE-MANIFEST.json':src.read('PACKAGE-MANIFEST.json'),'scripts/package-review13-upload.py':Path(__file__).read_bytes()}
 out=root/'Astra-Review-13-Upload.zip';i=2
 while out.exists():out=root/f'Astra-Review-13-Upload-{i}.zip';i+=1
 inventory={}
 with zipfile.ZipFile(out,'x',zipfile.ZIP_DEFLATED,compresslevel=9) as dest:
  for n in src.namelist():
   if n=='PACKAGE-MANIFEST.json' or n in omitted:continue
   data=replacements.get(n)
   if data is None:data=src.read(n)
   dest.writestr(n,data);inventory[n]={'bytes':len(data),'sha256':sha(data)}
  for n,data in additions.items():
   assert n not in inventory
   dest.writestr(n,data);inventory[n]={'bytes':len(data),'sha256':sha(data)}
  manifest={**{k:v for k,v in old_manifest.items() if k!='files'},'edition':'upload-under-500MB','packagingCommit':edition['uploadPackagingCommit'],'uploadChanges':'UPLOAD-EDITION.json','files':inventory}
  dest.writestr('PACKAGE-MANIFEST.json',json.dumps(manifest,indent=2))
assert out.stat().st_size<=500_000_000,('Upload exceeds safety limit; preserve this trial',out.stat().st_size)
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 assert len(z.namelist())==len(set(z.namelist()))==len(inventory)+1
 for n,v in inventory.items():
  data=z.read(n);assert len(data)==v['bytes'] and sha(data)==v['sha256'],n
 for n in old_manifest['files']:
  if n.startswith(('src/','public/','tests/')):assert inventory[n]==old_manifest['files'][n],n
result={'path':str(out),'bytes':out.stat().st_size,'decimalMB':out.stat().st_size/1e6,'sha256':sha(out.read_bytes()),'entries':len(inventory)+1,'verified':'Full CRC and every entry SHA256/length; unchanged source/runtime/tests; both videos same frame count/duration and exactly identical audio payloads/timestamps','media':media,'omitted':omission_records}
(base/'package-upload-result.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
