"""One original local synthesis bank, no service calls or sourced engine recordings."""
from pathlib import Path
import numpy as np,wave,json,hashlib
OUT=Path('public/assets/audio/p03b2');OUT.mkdir(parents=True,exist_ok=True);sr=48000;seconds=2;n=sr*seconds;t=np.arange(n)/sr;rng=np.random.default_rng(3042);files=[]
def noise(low,high):
 f=np.fft.rfftfreq(n,1/sr);s=rng.normal(size=len(f))+1j*rng.normal(size=len(f));s*=((f>low)&(f<high));s/=np.maximum(f,80)**.45;x=np.fft.irfft(s,n);return x/(np.std(x)+1e-9)
def save(name,x,ref=None,loop=True,method=''):
 x=np.asarray(x);x-=np.mean(x);x=x/(max(abs(x))+.00001)*.65;data=(x*32767).astype('<i2');p=OUT/(name+'.wav')
 with wave.open(str(p),'wb') as w:w.setparams((1,2,sr,len(data),'NONE','not compressed'));w.writeframes(data.tobytes())
 files.append({'name':name,'file':p.name,'referenceRpmEstimate':ref,'sampleRate':sr,'channels':1,'frames':len(data),'loop':[0,len(data)/sr] if loop else None,'method':method,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'samplePeak':float(max(abs(data.astype(float)))/32768),'loopBoundaryDelta':float(abs(int(data[0])-int(data[-1]))/32768)})
for rpm in [1200,3600,6200]:
 # Chosen even-firing four-cylinder approximation, integer-cycle2s loops; not measured OEM timbre.
 f0=round(rpm/30*seconds)/seconds;phase=2*np.pi*f0*t;comb=sum(np.sin(k*phase+.24*np.sin(k))*(np.exp(-k/(5+rpm/1500))/k**.55) for k in range(1,25));comb/=max(abs(comb));sub=.18*np.sin(phase/2);mechanical=noise(250,4500)*(1+.18*np.sin(phase));
 for load in ['load','lift']:
  x=(comb*(.80 if load=='load' else .42)+sub+mechanical*(.12 if load=='load' else .065));save(f'engine-{rpm}-{load}',x,rpm,method='Periodic harmonic combustion pulse train, subharmonic and filtered mechanical noise; independent RPM/load beds')
save('road',noise(80,3200),method='Periodic band-limited colored noise');save('wind',noise(90,1600),method='Periodic low-mid colored noise');x=noise(250,4200)[:int(sr*.14)]*np.exp(-np.arange(int(sr*.14))/sr*42);x[:120]*=np.linspace(0,1,120);save('shift',x,loop=False,method='Short decaying original mechanical noise impulse')
(OUT/'provenance.json').write_text(json.dumps({'candidate':1,'candidatesCreated':1,'method':'Original local Python/Numpy synthesis; no recording, service call, payment or OEM claim','permissionBasis':'New project-authored procedural audio; no third-party source samples','auralFidelity':'HOLD: provisional synthetic timbre; numerical checks are not an audition','parameters':{'seed':3042,'sampleRate':sr,'engineRpmBeds':[1200,3600,6200],'periodSeconds':2},'files':files},indent=2),encoding='utf-8')
print('Original bank',len(files),'files',sum((OUT/x['file']).stat().st_size for x in files),'bytes')
