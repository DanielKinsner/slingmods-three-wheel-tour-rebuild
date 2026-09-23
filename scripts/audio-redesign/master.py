"""Repeatable 48 kHz editing, loop joins, conservative levels, manifests and audition page.
Requires existing ffmpeg, numpy, scipy. Original API responses are never overwritten.
"""
from pathlib import Path
import json, subprocess, numpy as np, scipy.signal as sig, wave, hashlib
ROOT=Path(__file__).resolve().parents[2]; SOURCE=ROOT/'assets/audio-redesign/sources'; PUBLIC=ROOT/'public/assets/audio'
SR=48000; rng=np.random.default_rng(92226); reports=[]
def decode(name,stereo=False):
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(SOURCE/(name+'.mp3')),'-f','f32le','-ar',str(SR),'-ac',str(2 if stereo else 1),'-'])
    return np.frombuffer(raw,dtype='<f4').reshape(-1,2 if stereo else 1).copy()
def circular_filter(x,f,kind):
    sos=sig.butter(2,f,fs=SR,btype=kind,output='sos')
    _,h=sig.sosfreqz(sos,worN=2*np.pi*np.fft.rfftfreq(len(x)))
    return np.fft.irfft(np.fft.rfft(x,axis=0)*abs(h)[:,None],n=len(x),axis=0)
def hp(x,f=45): return circular_filter(x,f,'highpass')
def lp(x,f): return circular_filter(x,f,'lowpass')
def loop(x,fade=.15):
    n=min(int(fade*SR),len(x)//4); w=np.linspace(0,1,n)[:,None]
    return np.concatenate([x[n:-n],x[-n:]*(1-w)+x[:n]*w])
def level(x,rms=.18,peak=.76):
    x=np.nan_to_num(x); x-=np.mean(x,axis=0); x*=rms/max(1e-9,np.sqrt(np.mean(x*x))); x*=min(1,peak/max(1e-9,np.max(abs(x)))); return x
def shot(x,maximum=None):
    energy=np.max(abs(x),axis=1); hits=np.flatnonzero(energy>max(energy.max()*.025,.0001))
    if len(hits): x=x[max(0,hits[0]-240):min(len(x),hits[-1]+2400)]
    if maximum: x=x[:int(maximum*SR)]
    n=min(480,len(x)//3);x[:n]*=np.linspace(0,1,n)[:,None];x[-n:]*=np.linspace(1,0,n)[:,None]; return x
banks={}
def write(bank,name,x,source,looped=False,ref=None):
    out=PUBLIC/bank;out.mkdir(parents=True,exist_ok=True);path=out/(name+'.ogg' if looped and not name.startswith(('engine','ryker')) else name+'.wav')
    if looped:
        # 2.7 ms endpoint correction after filtering: identical endpoints, smooth derivative.
        x=x.copy();n=128;w=np.linspace(0,1,n)[:,None];w=w*w*(3-2*w);anchor=(x[0]+x[-1])/2
        x[:n]-=(x[0]-anchor)*(1-w);x[-n:]-=(x[-1]-anchor)*w
    pcm=(np.clip(x,-1,1)*32767).astype('<i2'); temp=out/(name+'.working.wav')
    with wave.open(str(temp),'wb') as w:w.setparams((x.shape[1],2,SR,len(x),'NONE','not compressed'));w.writeframes(pcm.tobytes())
    if path.suffix=='.ogg': subprocess.run(['ffmpeg','-v','error','-y','-i',str(temp),'-c:a','libvorbis','-q:a','5',str(path)],check=True);temp.unlink()
    else:temp.replace(path)
    item=dict(name=name,file=path.name,source=source,loop=looped,duration=len(x)/SR,channels=x.shape[1],sampleRate=SR,rms=float(np.sqrt(np.mean(x*x))),peak=float(abs(x).max()),seamDelta=float(abs(x[0]-x[-1]).max()) if looped else None,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bytes=path.stat().st_size,referenceRpmEstimate=ref)
    banks.setdefault(bank,[]).append(item);reports.append(dict(bank=bank,**item))

# Rich generated combustion textures, separated load/lift spectra. Reference RPMs are prompt
# estimates, not tachometer measurements; this remains an artistic game approximation.
for vehicle,prefix in [('sling','engine'),('ryker','ryker')]:
    beds={r:loop(hp(decode(f'{vehicle}-{r}'),65),.12) for r in [1200,3000,6000]}
    for rpm in [1200,1650,2200,3000,4000,5300,6800]:
        ref=min(beds,key=lambda r:abs(np.log(rpm/r))); x=beds[ref]
        # Polyphase resampling gives a fixed reference bed; realtime pitches at most 1.4x.
        from fractions import Fraction
        ratio=Fraction(ref/rpm).limit_denominator(160)
        x=sig.resample_poly(x,ratio.numerator,ratio.denominator,axis=0)
        x=loop(x[:min(len(x),4*SR)],.08)
        for load in ['load','lift']:
            edited=lp(x,5000 if load=='load' else 1900)
            write('tour-engine-v1',f'{prefix}-{rpm}-{load}',level(edited,.29 if load=='load' else .24),f'{vehicle}-{ref}.mp3',True,rpm)
for name in ['road','wind']:
    write('tour-engine-v1',name,level(loop(hp(decode(name)),.25),.20),name+'.mp3',True)
write('tour-engine-v1','shift',level(shot(hp(decode('shift')), .42),.25),'shift.mp3')
# Preserve the owner's narrow Thermal supplement and its provenance, used only when fitted.
old=json.loads((PUBLIC/'p09b/provenance.json').read_text())
for f in old['files']:
    if f['name']=='thermal-mid':
        import shutil
        shutil.copyfile(PUBLIC/'p09b'/f['file'],PUBLIC/'tour-engine-v1'/f['file']);banks['tour-engine-v1'].append(f)

for name in ['harbor','express','ridge','night','rain','showroom','road','wind','tire-scrub','gravel','wet-tire']:
    write('tour-world-v1',name,level(loop(hp(decode(name,True)),.6),.15 if name in ['tire-scrub','gravel','wet-tire'] else .12),name+'.mp3',True)
for name in ['impact','suspension','ignition-sling','ignition-ryker']:
    write('tour-world-v1',name,level(shot(hp(decode(name))),.24),name+'.mp3')
for name in ['music-garage','music-race','music-ridge']:
    write(name+'-v1',name,level(loop(hp(decode(name,True),38),2.4),.14,.65),name+'.mp3',True)

def tone(notes,duration,noise=.015):
    t=np.arange(int(duration*SR))/SR;x=np.zeros(len(t))
    for freq,offset in notes:
        tt=np.maximum(0,t-offset); env=np.where(t>=offset,(1-np.exp(-tt*900))*np.exp(-tt*13),0)
        x+=(np.sin(2*np.pi*freq*tt)+.12*np.sin(2*np.pi*freq*2*tt))*env
    x+=rng.normal(0,noise,len(t))*np.exp(-t*80);return shot(x[:,None])
cue_tones={
 'ui.nav':([(680,0)],.08),'ui.back':([(440,0)],.1),'ui.confirm':([(660,0),(990,.04)],.2),'ui.detent':([(1250,0)],.035),
 'power':([(220,0),(440,.04)],.22),'build.save':([(440,0),(660,.08),(880,.16)],.45),'build.preset':([(330,0),(495,.06),(660,.12)],.38),
 'career.unlock':([(293.66,0),(440,.12),(587.33,.24),(880,.38)],.9),
 'race.count':([(740,0)],.16),'race.start':([(1480,0),(740,.08)],.38),'race.finish':([(293.66,0),(440,.13),(587.33,.26)],.85),
 'race.checkpoint':([(880,0),(1320,.04)],.2),'race.invalid':([(330,0),(277,.12)],.4),'ui.error':([(350,0),(311,.08)],.25),
 'race.recovery':([(440,0),(587,.12)],.4)}
for name,(notes,duration) in cue_tones.items():write('tour-cues-v1',name,level(tone(notes,duration),.24),'Original modal synthesis; D/A theme, seed 92226')
for name,source,cut in [('finish.apply','paint',.9),('part.shocks.attach','fit-metal',1.2),('part.exhaust.attach','fit-metal',1.2),('part.aero.attach','fit-panel',.9),('part.storage.attach','latch',.6),('part.lights.attach','fit-panel',.5),('part.remove','fit-panel',.7)]:
    x=shot(hp(decode(source)),cut)
    if name=='part.exhaust.attach':x=lp(x,2200)
    write('tour-cues-v1',name,level(x,.26),source+'.mp3')
for bank,files in banks.items():
    (PUBLIC/bank/'provenance.json').write_text(json.dumps(dict(version=1,method='ElevenLabs source design + original cue synthesis; edited locally by scripts/audio-redesign/master.py',licenseBasis='User-authorized ElevenLabs generation under account terms; no OEM sound authenticity claim',humanListeningApproval=False,files=files),indent=2)+'\n')
# Explicit production asset allowlist: add only this package, preserve every existing entry.
p=ROOT/'demo-assets.json';d=json.loads(p.read_text());new=[]
for bank in banks:
    new.extend(str(f.relative_to(ROOT/'public')).replace('\\','/') for f in (PUBLIC/bank).iterdir() if f.is_file())
from manifest import append_assets
append_assets(p,sorted(new))
(ROOT/'assets/audio-redesign/mastering-report.json').write_text(json.dumps(reports,indent=2)+'\n')
print(len(reports),'mastered sounds;',sum(x['bytes'] for x in reports),'runtime bytes')
