"""Reproducible P09B audio authoring. No network, API credential or paid request."""
from pathlib import Path
import json,wave,hashlib,datetime
import numpy as np
from scipy.signal import butter,sosfiltfilt
ROOT=Path(__file__).resolve().parents[1];SR=48000;rng=np.random.default_rng(90217)
EVIDENCE=ROOT/'director-kit/production/evidence/P09B/audio';EVIDENCE.mkdir(parents=True,exist_ok=True)
SOURCE=ROOT/'director-kit/director-addenda/review-17/owner-audio/thermal sport sound.wav'
with wave.open(str(SOURCE),'rb') as w:
 assert w.getframerate()==SR and w.getnchannels()==2 and w.getsampwidth()==2
 owner=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).astype(float)/32768
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()=='b5e726379308a2e381e55fb3bbe6309b26eac04ebd358dafd7a6fea52a3265ab'

def write(out,name,x,metadata):
 out.mkdir(parents=True,exist_ok=True);x=np.asarray(x);x=np.clip(x,-.98,.98);data=np.round(x*32767).astype('<i2');p=out/(name+'.wav')
 with wave.open(str(p),'wb') as w:w.setparams((1 if x.ndim==1 else x.shape[1],2,SR,len(x),'NONE','not compressed'));w.writeframes(data.tobytes())
 return {'name':name,'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'frames':len(x),'sampleRate':SR,'channels':1 if x.ndim==1 else x.shape[1],'samplePeak':float(np.max(abs(x))),'rmsDbFS':float(20*np.log10(np.sqrt(np.mean(x*x))+1e-12)),**metadata}
def save_manifest(out,files,extra):
 (out/'provenance.json').write_text(json.dumps({'schemaVersion':1,'files':files,**extra},indent=2)+'\n',encoding='utf8')
def bandnoise(n,low,high):
 f=np.fft.rfftfreq(n,1/SR);spec=(rng.normal(size=len(f))+1j*rng.normal(size=len(f)))*((f>low)&(f<high))/np.maximum(f,80)**.65;x=np.fft.irfft(spec,n);return x/(np.std(x)+1e-9)
def level(x,rms=.17,peak=.62):
 x=x-np.mean(x,axis=0);return x*min(rms/(np.sqrt(np.mean(x*x))+1e-9),peak/(np.max(abs(x))+1e-9))
def crossloop(x,seconds=.08):
 n=int(seconds*SR);mix=np.linspace(0,1,n);return np.concatenate([x[n:-n],x[-n:]*(1-mix)+x[:n]*mix])
# Inspect supplied audio without claiming by-ear audition or unknown RPM measurement.
windows=[]
for start in np.arange(0,10,.25):
 y=owner[int(start*SR):int((start+.25)*SR)].mean(axis=1);f=np.fft.rfftfreq(len(y),1/SR);sp=abs(np.fft.rfft(y*np.hanning(len(y))));mask=(f>=30)&(f<=400)
 windows.append({'start':float(start),'rmsDbFS':float(20*np.log10(np.sqrt(np.mean(y*y))+1e-12)),'dominantLowFrequencyHz':float(f[mask][np.argmax(sp[mask])])})
(EVIDENCE/'owner-source-analysis.json').write_text(json.dumps({'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'analysis':'250ms Hann-window spectrum + PCM envelope; no human listening approval','windows':windows,'departureSelection':{'sourceIn':.2,'sourceOut':6.0,'runtimeStart':0,'gain':.85,'fadeIn':.04,'fadeOut':.25,'rationale':'Largest envelope rise around source2.5s maps to cinematic2.3s pull-away. Earlier lower-energy material accompanies door opening. No claimed ignition identification.'},'textureSelection':{'sourceIn':4.55,'sourceOut':5.35,'crossfade':.08,'referenceRpmEstimate':3400,'rpmMeasured':False,'rationale':'Near-steady low-frequency peak ~224Hz over central interval; reference is an authoring estimate, not measured shaft RPM. Restricted to2800-4000 gameRPM as a low-gain texture supplement.'}},indent=2)+'\n')
# Owner departure: local cut, gain and edge fades, no time stretch.
out=ROOT/'public/assets/audio/p09b-departure';x=owner[int(.2*SR):int(6*SR)].copy()*.85;x[:1920]*=np.linspace(0,1,1920)[:,None];x[-12000:]*=np.linspace(1,0,12000)[:,None]
files=[write(out,'thermal',x,{'source':SOURCE.relative_to(ROOT).as_posix(),'sourceInSeconds':.2,'sourceOutSeconds':6,'gain':.85,'fadesSeconds':[.04,.25],'loop':False,'method':'Local owner recording excerpt; no upload or generation'})];save_manifest(out,files,{'method':'Owner supplied Thermal recording retained in Git; local derived cinematic edit','permissionBasis':'Explicit owner supplied recording for this game','humanListeningApproval':False})
# Revised original engine bank: filtered combustion pressure rather than the old bright harmonic oscillator stack.
out=ROOT/'public/assets/audio/p09b';files=[];n=SR*2;t=np.arange(n)/SR
for rpm in [1200,1650,2200,3000,4000,5300,6800]:
 f0=round(rpm/30*2)/2;phase=f0*t;cycles=np.floor(phase).astype(int);within=phase%1
 pulse=np.exp(-within*17)-.42*np.exp(-within*5);pulse*=1+.09*np.sin(2*np.pi*cycles/8)+.035*np.cos(2*np.pi*cycles/3)
 # Short resonant pressure body, moderate lowpassed intake texture; all cutoffs are presentation parameters.
 pressure=sosfiltfilt(butter(3, min(1800,650+rpm*.13),fs=SR,output='sos'),pulse)
 body=.22*np.sin(2*np.pi*f0*t-.3)+.10*np.sin(np.pi*f0*t)
 noise=bandnoise(n,130,2800)*(1+.2*np.cos(2*np.pi*f0*t))
 for state in ['load','lift']:
  x=pressure*(1 if state=='load' else .62)+body+noise*(.032 if state=='load' else .016)
  x=crossloop(x,.03);x=level(x,.17 if state=='load' else .14)
  files.append(write(out,f'engine-{rpm}-{state}',x,{'referenceRpmEstimate':rpm,'loop':[0,len(x)/SR],'method':'Original damped pressure pulse + low body harmonics + restrained filtered intake; approximate even-firing four-cylinder, not an OEM recording','loopBoundaryDelta':float(abs(x[-1]-x[0]))}))
# Preserve road/wind/shift source unchanged. Bank-specific metadata hashes identify exact inputs.
old=json.loads((ROOT/'public/assets/audio/p03b2/provenance.json').read_text())
for name in ['road','wind','shift']:
 f=next(f for f in old['files'] if f['name']==name);(out/f['file']).write_bytes((ROOT/'public/assets/audio/p03b2'/f['file']).read_bytes());files.append({**f,'retainedFrom':'p03b2'})
x=owner[int(4.55*SR):int(5.35*SR)].mean(axis=1);x=sosfiltfilt(butter(2,[85,1600],btype='bandpass',fs=SR,output='sos'),x);x=level(crossloop(x),.18)
files.append(write(out,'thermal-mid',x,{'source':SOURCE.relative_to(ROOT).as_posix(),'sourceInSeconds':4.55,'sourceOutSeconds':5.35,'crossfadeSeconds':.08,'referenceRpmEstimate':3400,'rpmMeasured':False,'pitchRange':[.85,1.18],'gameRpmRange':[2800,4000],'loop':[0,len(x)/SR],'method':'Owner recorded near-steady texture supplement only; not a complete measured engine bed','loopBoundaryDelta':float(abs(x[-1]-x[0]))}))
save_manifest(out,files,{'candidate':'P09B-1','method':'Revised original local synthesis + narrow owner recorded Thermal mid-RPM texture','permissionBasis':'Original authored audio and explicit owner-provided local recording','humanListeningApproval':False,'missingSourceStates':['Measured steady idle/load/lift recordings at knownRPM','Clean sustained highRPM acceleration/deceleration','Matched stock recording under the same microphone conditions'],'script':'scripts/author-p09b-audio.py','seed':90217})
# Small dry coherent mechanical cue family: modal contact + filtered noise, no external generation.
plan=json.loads((ROOT/'director-kit/director-addenda/review-17/audio/CUE-PLAN.json').read_text());out=ROOT/'public/assets/audio/p09b-cues';files=[]
params={'ui.nav':(.075,[1700,2400],.008),'ui.confirm':(.11,[840,1260],.008),'ui.back':(.07,[630,900],.009),'ui.detent':(.035,[1900],.012),'power':(.13,[1500,2300],.01),'finish.apply':(.25,[550],.13),'part.shocks.attach':(.28,[350,970,1770],.025),'part.lights.attach':(.10,[1800,2700],.018),'part.exhaust.attach':(.32,[190,530,930],.035),'part.aero.attach':(.20,[510,1300,2050],.026),'part.storage.attach':(.28,[460,1150],.16),'part.remove':(.15,[630,1550],.022),'build.save':(.16,[680,1020],.008),'build.preset':(.23,[430,860,1290],.018),'career.unlock':(.50,[360,720,1080],.008),'race.count':(.12,[780],.005),'race.start':(.24,[1170,1560],.008),'race.finish':(.60,[520,780,1040],.008)}
for name,(duration,modes,roughness) in params.items():
 length=int(duration*SR);tt=np.arange(length)/SR;decay=24 if duration<.2 else 14;body=sum(np.sin(2*np.pi*f*tt)*np.exp(-tt*(decay+j*8))/(j+1) for j,f in enumerate(modes));noise=bandnoise(length,300,4200)*roughness*np.exp(-tt*15)
 if name=='part.storage.attach':body*=.12;noise*=2.4
 if name=='finish.apply':body*=.08;noise*=2
 x=(body+noise)*np.minimum(1,tt/.002)*np.minimum(1,(duration-tt)/.025);x=level(x,.16,.58)
 files.append(write(out,name,x,{'method':'Original deterministic local modal-contact/noise synthesis','durationSeconds':duration,'sourcePlan':next((c['text']for c in plan['cues']if c['id']==name),'Quiet authored additional switch/detent'),'loop':False}))
save_manifest(out,files,{'method':'Original project-authored dry tactile cues; no generated or recorded physical-product claim','permissionBasis':'Original local synthesis','generationCalls':0,'script':'scripts/author-p09b-audio.py','seed':90217,'humanListeningApproval':False})
(EVIDENCE/'generation-decision.json').write_text(json.dumps({'date':'2026-09-15','generationCalls':0,'requestedGenerationSeconds':0,'spending':0,'accountChanges':False,'sourceUpload':False,'decision':'No metered requests: no ElevenLabs credential in Process/User/Machine namedvariables, repository/home env configuration or identified local provider configuration. Prior generator explicitly process-env-only. Current API/legacy pricing differ and no account-specific prepaid remaining allowance/cost cap can be verified without usable credential. Completed local authorship and retained owner audio instead.','sources':['https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert','https://help.elevenlabs.io/hc/en-us/articles/25735337678481-How-much-does-it-cost-to-generate-sound-effects','https://elevenlabs.io/pricing/api'],'documentedEndpoint':'POST /v1/sound-generation','documentedModel':'eleven_text_to_sound_v2','ceiling':{'callsIncludingRetries':24,'seconds':60,'concurrency':1,'financial':'verified existing/prepaid only'},'secretValuesLogged':False},indent=2)+'\n')
print('P09B original audio bank, 18cues, owner departure and source-analysis written; paid calls0')
