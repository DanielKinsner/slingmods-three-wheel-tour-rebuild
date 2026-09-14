from pathlib import Path
import json,subprocess,numpy as np,sys,hashlib
p=Path(sys.argv[1]);meta=json.loads((p/'audio-capture.json').read_text());audio=p/'live-game-audio.webm';video=p/'complete-race-video-only.mp4'
def run(args):return subprocess.check_output(['ffmpeg','-hide_banner','-loglevel','error',*map(str,args)])
raw=run(['-i',audio,'-f','f32le','-ar','48000','-ac','2','-']);st=np.frombuffer(raw,dtype='<f4').reshape(-1,2);mono=st.mean(axis=1);sr=48000
frames=np.frombuffer(run(['-i',video,'-vf','fps=25,crop=180:40:0:0,scale=1:1','-pix_fmt','rgb24','-f','rawvideo','-']),dtype=np.uint8).reshape(-1,3)
ix=np.where((frames[:,0]>150)&(frames[:,2]>120)&(frames[:,1]<90))[0];groups=np.split(ix,np.where(np.diff(ix)>1)[0]+1);vt=[int(g[0])/25 for g in groups if len(g)>0]
assert len(vt)==3,vt
anchors=[]
for mark,v in zip(meta['markers'],vt):
 expected=mark['audioTime']-meta['startedAudio'];freq=mark['frequency'];size=960;osc=np.exp(-2j*np.pi*freq*np.arange(size)/sr);rows=[]
 for start in range(max(0,int((expected-.5)*sr)),min(len(mono)-size,int((expected+.5)*sr)),240):
  amp=float(abs(np.dot(mono[start:start+size],osc))*2/size);rows.append((start/sr,amp))
 maximum=max(x[1]for x in rows);assert maximum>.04,(mark,maximum)
 at=next(t for t,a in rows if a>maximum*.55)
 anchors.append({'id':mark['id'],'frequency':freq,'audioOnsetApproxSeconds':at,'videoFlashSeconds':v,'videoMinusAudioSeconds':v-at,'toneAmplitude':maximum,'windowMs':20,'hopMs':5,'videoFrameMs':40})
offset=float(np.median([x['videoMinusAudioSeconds']for x in anchors]));residual=[x['videoMinusAudioSeconds']-offset for x in anchors];assert max(abs(x)for x in residual)<.12,(anchors,residual)
af=f'adelay={round(offset*1000)}:all=1,apad' if offset>=0 else f'atrim=start={-offset},asetpts=PTS-STARTPTS,apad'
out=p/'complete-race-LIVE-AUDIO.mp4';assert not out.exists()
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(video),'-i',str(audio),'-filter_complex',f'[1:a]{af}[a]','-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-shortest',str(out)],check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(out)]));(p/'ffprobe.json').write_text(json.dumps(probe,indent=2))
result={'method':'Native recorded live player and nearest-two-rival buses; actual game mix. Three disclosed evidence-only sync chirps/DOM flashes are retained. One constant audio shift, no time stretching or engine dubbing. Video and input use wallclock. Bay/loading outside capture graph is silent. Numerical signal checks do not confer human listening approval.','anchors':anchors,'constantAudioOffsetSeconds':offset,'alignmentResidualSeconds':residual,'decodedSampleRate':sr,'channels':2,'durationSeconds':len(st)/sr,'channelPeak':np.max(np.abs(st),axis=0).tolist(),'channelRms':np.sqrt(np.mean(st.astype(float)**2,axis=0)).tolist(),'clippedSamples':int(np.sum(np.abs(st)>=1)),'nonfiniteSamples':int(np.sum(~np.isfinite(st))),'sourceAudioSHA256':hashlib.sha256(audio.read_bytes()).hexdigest(),'sourceVideoSHA256':hashlib.sha256(video.read_bytes()).hexdigest(),'outputSHA256':hashlib.sha256(out.read_bytes()).hexdigest()}
(p/'audio-video-verification.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
