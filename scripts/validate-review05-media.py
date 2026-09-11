"""Read-only numerical media validation for the First Drive review."""
from pathlib import Path
import json,subprocess,wave,hashlib,re,numpy as np
root=Path('director-kit/production/evidence/Review05-final');report={'audition':'Unavailable: no human/tool auditory audition performed; numerical checks do not certify timbre','sourceBank':[],'wav':[]}
for p in Path('public/assets/audio/p03b2').glob('*.wav'):
 with wave.open(str(p),'rb')as w:x=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768
 d=np.abs(np.diff(x));report['sourceBank'].append({'file':p.name,'finite':bool(np.isfinite(x).all()),'peak':float(np.max(np.abs(x))),'loopEdgeDelta':float(abs(x[-1]-x[0])),'maximumAdjacentDelta':float(d.max()),'rms':float(np.sqrt(np.mean(x*x))),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
for name in ['first-drive-aligned.wav','audio-focus.wav']:
 p=root/name
 with wave.open(str(p),'rb')as w:sr=w.getframerate();channels=w.getnchannels();x=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float).reshape(-1,channels)/32768
 assert np.isfinite(x).all() and abs(x).max()<1 and np.mean(x*x)>1e-7
 result=subprocess.run(['ffmpeg','-hide_banner','-i',str(p),'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,check=True);peak=re.findall(r'Peak:\s*([-\d.]+) dBFS',result.stderr);assert peak;tp=float(peak[-1]);assert tp<=-1,tp
 windows=[(24.3,24.7),(26.3,26.7)] if name.startswith('first') else[(18.3,18.7)];silence=[]
 for a,b in windows:
  rms=float(np.sqrt(np.mean(x[int(a*sr):int(b*sr)]**2)));assert rms<1e-4,(name,a,rms);silence.append({'seconds':[a,b],'rms':rms})
 report['wav'].append({'file':name,'duration':len(x)/sr,'sampleRate':sr,'channels':channels,'samplePeakDbFS':float(20*np.log10(abs(x).max())),'oversampledTruePeakDbTP':tp,'truePeakMethod':'FFmpeg ebur128 peak=true oversampled estimate, distinct from source sample peak','mutePauseWindows':silence,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
p=root/'first-drive-game-audio.mp4';probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)],text=True));subprocess.run(['ffmpeg','-hide_banner','-v','error','-i',str(p),'-f','null','-'],capture_output=True,check=True);video=next(s for s in probe['streams']if s['codec_type']=='video');audio=next(s for s in probe['streams']if s['codec_type']=='audio');assert int(video['nb_frames'])==840 and video['avg_frame_rate']=='24/1';assert abs(float(video['duration'])-35)<.05 and abs(float(audio['duration'])-35)<.05
report['movie']={'file':p.name,'videoSeconds':video['duration'],'audioSeconds':audio['duration'],'videoRate':video['avg_frame_rate'],'videoFrames':video['nb_frames'],'decode':'PASS','sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(root/'media-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report['wav']+ [report['movie']],indent=2))
