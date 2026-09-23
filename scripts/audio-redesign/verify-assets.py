"""Decode the delivery bytes, not just authoring arrays. Never contacts an API."""
from pathlib import Path
import json,hashlib,subprocess,numpy as np
ROOT=Path(__file__).resolve().parents[2];rows=json.loads((ROOT/'assets/audio-redesign/mastering-report.json').read_text());allowed=json.loads((ROOT/'demo-assets.json').read_text())['assets'];checks=[]
for row in rows:
    rel='assets/audio/'+row['bank']+'/'+row['file'];p=ROOT/'public'/rel
    assert rel in allowed,rel
    assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'],rel
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-f','f32le','-ar','48000','-ac',str(row['channels']),'-'])
    x=np.frombuffer(raw,dtype='<f4').reshape(-1,row['channels']);peak=float(abs(x).max());rms=float(np.sqrt(np.mean(x*x)))
    assert np.isfinite(x).all() and peak<.98 and rms>.005,(rel,peak,rms)
    seam=float(abs(x[0]-x[-1]).max()) if row['loop'] else None
    # Lossy-codec joins are compared with ordinary adjacent samples, plus a small noise allowance.
    local=float(np.percentile(abs(np.diff(x,axis=0)),99.9))
    if row['loop']:assert seam<max(.025,local*1.5),(rel,'seam',seam,local)
    checks.append(dict(file=rel,seconds=len(x)/48000,peak=peak,rms=rms,seam=seam,adjacentP999=local,bytes=p.stat().st_size))
receipt=json.loads((ROOT/'assets/audio-redesign/generation-receipt.json').read_text())
for row in receipt:
    if row['status']=='created':assert hashlib.sha256((ROOT/'assets/audio-redesign/sources'/(row['id']+'.mp3')).read_bytes()).hexdigest()==row['sha256']
out=ROOT/'assets/audio-redesign/evidence';out.mkdir(exist_ok=True)
(out/'assets.json').write_text(json.dumps(dict(status='PASS',checks=checks,sourceHashesVerified=True,scope='Decoded signal integrity, levels and joins; not subjective listening approval'),indent=2)+'\n')
print('PASS',len(checks),'decoded assets, finite samples, peak headroom, joins, hashes and production allowlist')
