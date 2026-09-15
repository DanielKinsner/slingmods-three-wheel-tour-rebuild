"""Cut loading and 240ms top-layer sync mirrors from actual live captures; preserve real-speed audio/video."""
import json, subprocess, sys, array, math, hashlib
from pathlib import Path
root=Path(sys.argv[1]); recorded=json.loads((root/'video-path.json').read_text())['path']; video=root/'raw-video'/recorded.replace('\\','/').split('/')[-1]; assert video.is_file(), 'Recover original raw-video file from Git first'
all_segments=json.loads((root/'audio-segments.json').read_text());excluded=set(a.split('=',1)[1]for a in sys.argv[2:]if a.startswith('--exclude='));segments=[s for s in all_segments if s['name']not in excluded]
def run(args): return subprocess.check_output(args)
meta=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]))
v=next(s for s in meta['streams'] if s['codec_type']=='video');num,den=map(int,v['avg_frame_rate'].split('/'));fps=num/den
pixels=run(['ffmpeg','-v','error','-i',str(video),'-vf','crop=2:2:4:4,scale=1:1,format=rgb24','-f','rawvideo','-'])
active=[i//3 for i in range(0,len(pixels),3) if pixels[i]>180 and pixels[i+1]<95 and pixels[i+2]>170]
groups=[]
for i in active:
 if not groups or i>groups[-1][-1]+2:groups.append([i])
 else:groups[-1].append(i)
all_groups=groups
omitted_groups={int(a.split('=',1)[1]) for a in sys.argv[2:] if a.startswith('--omit-sync-group=')}
assert not omitted_groups or excluded, 'Only explicitly excluded segments may have unmatched marker groups omitted'
assert all(0<=i<len(groups) for i in omitted_groups)
groups=[g for i,g in enumerate(groups) if i not in omitted_groups]
assert len(groups)==len(segments)*2, f'Expected two actual magenta sync groups per segment, got {len(groups)}'
cuts=[];parts=[]
for i,s in enumerate(segments):
 start,end=groups[2*i][0]/fps,groups[2*i+1][0]/fps
 if s.get('silent'):
  duration=end-start-.60;part=root/(s['name']+'.mp4');parts.append(part)
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(start+.30),'-i',str(video),'-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-t',str(duration),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-crf','24','-maxrate','1050k','-bufsize','2100k','-pix_fmt','yuv420p','-r','25','-c:a','aac','-b:a','128k','-movflags','+faststart',str(part)],check=True)
  cuts.append({'segment':s['name'],'sourceVideoStart':start+.30,'duration':duration,'audio':'Authentic silent career UI. Silent track for concatenation; no replacement sound.'});continue
 marks=s['markers'];assert len(marks)==2
 audio=Path(root/(s['name']+'-audio.webm'))
 # Detect the actual recorded chirps, instead of trusting API call timestamps.
 samples=array.array('f');samples.frombytes(run(['ffmpeg','-v','error','-i',str(audio),'-f','f32le','-ac','1','-ar','12000','-']))
 def tone_onset(mark):
  expected=mark['audioTime']-s['startedAudio'];freq=mark['frequency'];best=(-1,0)
  for at in range(max(0,int((expected-.15)*12000)),min(len(samples)-360,int((expected+.2)*12000)),60):
   re=sum(samples[at+j]*math.cos(2*math.pi*freq*j/12000) for j in range(360));im=sum(samples[at+j]*math.sin(2*math.pi*freq*j/12000) for j in range(360));power=(re*re+im*im)/360**2
   if power>best[0]:best=(power,at/12000)
  assert best[0]>.00005, f'No captured sync tone for {mark["id"]}: {best}'
  # Peak 30ms window is inside the 80ms chirp; timing anchor uses its center.
  return best[1]+.015
 tones=[tone_onset(m) for m in marks]
 # Each visible flash starts at chirp onset; center is 40ms later.
 astart=tones[0]-.04; drift=(end-start)-(tones[1]-tones[0])
 assert abs(drift)<.16, f'A/V duration drift too large: {drift}'
 duration=end-start-.60; offset=.30
 part=root/(s['name']+'.mp4');parts.append(part)
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(start+offset),'-i',str(video),'-ss',str(max(0,astart+offset)),'-i',str(audio),'-t',str(duration),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-crf','24','-maxrate','1050k','-bufsize','2100k','-pix_fmt','yuv420p','-r','25','-c:a','aac','-b:a','128k','-ar','48000','-movflags','+faststart',str(part)],check=True)
 decoded=array.array('f');decoded.frombytes(run(['ffmpeg','-v','error','-i',str(part),'-vn','-f','f32le','-ac','1','-ar','12000','-']));body=decoded[6000:-6000];energy=math.sqrt(sum(x*x for x in body)/len(body));assert energy>.0003, f'Game audio missing between markers: {s["name"]}'
 cuts.append({'gameAudioRMSBetweenMarkers':energy,'segment':s['name'],'sourceVideoStart':start+offset,'sourceAudioStart':astart+offset,'duration':duration,'measuredAVDriftMs':drift*1000,'audioChirpCenters':tones,'videoFlashStarts':[start,end]})
concat=root/'concat.txt';concat.write_text('\n'.join("file '"+p.name+"'" for p in parts))
final=root/'P09A-Own-the-Build.mp4';subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-c:v','copy','-af','aresample=async=1:first_pts=0','-c:a','aac','-b:a','128k','-ar','48000','-movflags','+faststart',str(final)],check=True)
probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(final)]));duration=float(probe['format']['duration']);assert 120<=duration<=240
pcm=array.array('f');pcm.frombytes(run(['ffmpeg','-v','error','-i',str(final),'-vn','-f','f32le','-ac','1','-ar','12000','-']));peak=max(abs(x) for x in pcm);rms=math.sqrt(sum(x*x for x in pcm)/len(pcm));assert all(math.isfinite(x) for x in pcm) and rms>.0005 and peak<1
report={'pass':True,'method':'Real-speed edited demonstration, with only loading and disclosed sync-marker boundaries cut. Actual live game graph audio, measured recorded chirps aligned to captured video flashes. No synthesized replacement audio or time warping. Audio listening approval remains human.','excludedSegments':{name:'A required video sync flash is absent from captured frames; full original video/audio retained. Optional Original Harbor excerpt omitted rather than claiming unverified synchronization.' for name in excluded},'omittedVisualGroups':[{'groupIndex':i,'startSeconds':all_groups[i][0]/fps,'endSeconds':all_groups[i][-1]/fps} for i in sorted(omitted_groups)],'cuts':cuts,'video':str(video),'film':str(final),'duration':duration,'bytes':final.stat().st_size,'sha256':hashlib.sha256(final.read_bytes()).hexdigest(),'decodedAudio':{'peak':peak,'rms':rms,'samples':len(pcm)},'probe':probe}
(root/'FILM-VERIFICATION.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:report[k] for k in ['pass','duration','bytes','sha256']}))
