"""Level match five pairs from the shared OfflineAudioContext output; do not overwrite sources."""
from pathlib import Path
import sys,wave,json,hashlib
import numpy as np
p=Path(sys.argv[1]);sr=48000
samples={}
for k in ['old','new']:
 with wave.open(str(p/(k+'-unmatched.wav')),'rb')as w:samples[k]=np.frombuffer(w.readframes(w.getnframes()),'<i2').reshape(-1,2).astype(float)/32768
labels=['Idle / 1050 RPM','Steady / 3400 RPM','Acceleration / 1600-6400 RPM','Lift / 5800-2400 RPM','Shifts / real graph shift edges'];parts=[];receipts=[];offset=0
for i,label in enumerate(labels):
 clips={k:x[i*3*sr:(i+1)*3*sr].copy()for k,x in samples.items()};rms={k:np.sqrt(np.mean(x*x))for k,x in clips.items()};target=min(10**(-23/20),min(.88/(np.max(abs(x))+1e-9)*rms[k]for k,x in clips.items()))
 for k,x in clips.items():
  scale=target/rms[k];x*=scale;x[:240]*=np.linspace(0,1,240)[:,None];x[-480:]*=np.linspace(1,0,480)[:,None];parts +=[x,np.zeros((sr//2,2))];receipts.append({'state':label,'version':k,'startSeconds':offset,'durationSeconds':3,'gainDb':float(20*np.log10(scale)),'matchedRmsDbFS':float(20*np.log10(np.sqrt(np.mean(x*x)))),'peak':float(np.max(abs(x)))});offset+=3.5
x=np.concatenate(parts);dest=p/'Engine-AB-level-matched.wav'
with wave.open(str(dest),'wb')as w:w.setparams((2,2,sr,len(x),'NONE','not compressed'));w.writeframes(np.round(x*32767).astype('<i2').tobytes())
report={'method':'Per-state A old then B new; matched RMS target -23dBFS, paired peak safeguard;5ms/10ms edge fades applied equally. Identical test-state timeline, no hardware/by-ear approval. Road and wind silent to isolate engine. Sport recording texture excluded here to compare shared stock source revision.','durationSeconds':len(x)/sr,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'segments':receipts,'worstPairRmsDifferenceDb':max(abs(receipts[i]['matchedRmsDbFS']-receipts[i+1]['matchedRmsDbFS'])for i in range(0,10,2))};(p/'level-matching.json').write_text(json.dumps(report,indent=2)+'\n')
rows=''.join(f"<tr><td>{r['startSeconds']:04.1f}s</td><td>{r['version'].upper()}</td><td>{r['state']}</td></tr>"for r in receipts)
(p/'LISTEN.html').write_text('<!doctype html><meta charset="utf-8"><title>P09B engine A/B</title><style>body{font:18px system-ui;max-width:800px;margin:40px auto;background:#17191b;color:#f2f2ef}td{padding:7px 14px}audio{width:100%}small{color:#b9bcbf}</style><h1>Running engine: A / B</h1><p>A = retained P03B2 bank. B = revised P09B bank.</p><audio controls src="Engine-AB-level-matched.wav"></audio><table>'+rows+'</table><p>Each pair is RMS level matched. This is an isolated OfflineAudioContext comparison using the actual old/new graph and source files with identical scripted telemetry states.</p><small>Human listening approval and measured OEM fidelity remain open. The separate live game film contains the owner Thermal departure recording.</small>',encoding='utf8');print(json.dumps(report))
