"""Cut loading and 240ms top-layer sync mirrors from actual live captures; preserve real-speed audio/video."""
import json, subprocess, sys, array, math, hashlib, re, os
from pathlib import Path
root=Path(sys.argv[1]); recorded=json.loads((root/'video-path.json').read_text())['path']; video=root/'raw-video'/recorded.replace('\\','/').split('/')[-1]; assert video.is_file(), 'Recover original raw-video file from Git first'
runtime=next((a.split('=',1)[1] for a in sys.argv[2:] if a.startswith('--runtime=')), '')
assert re.fullmatch(r'[0-9a-f]{12,40}', runtime), 'Pass --runtime=verified-runtime-sha'
font_candidates=[Path(os.environ.get('FILM_FONT','')),Path(os.environ.get('WINDIR','C:/Windows'))/'Fonts/arial.ttf',Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'),Path('/System/Library/Fonts/Supplemental/Arial.ttf')]
font=next((p for p in font_candidates if p.is_file()),None)
assert font, 'Set FILM_FONT to an installed redistributable or locally licensed font for metadata caption'
font_path=font.resolve().as_posix().replace(':',r'\:')
label="drawtext=fontfile='"+font_path+"':text='P09C "+runtime[:12]+" | EDITED CAPTURE':fontsize=12:fontcolor=white:box=1:boxcolor=black@0.72:boxborderw=3:x=8:y=h-th-7"
all_segments=json.loads((root/'audio-segments.json').read_text());excluded=set(a.split('=',1)[1]for a in sys.argv[2:]if a.startswith('--exclude='));segments=[s for s in all_segments if s['name']not in excluded]
def run(args): return subprocess.check_output(args)
meta=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]))
v=next(s for s in meta['streams'] if s['codec_type']=='video');num,den=map(int,v['avg_frame_rate'].split('/'));fps=num/den
pixels=run(['ffmpeg','-v','error','-i',str(video),'-vf','crop=2:2:90:20,scale=1:1,format=rgb24','-f','rawvideo','-'])
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
manual_silent={a.split('=',1)[1].split(':')[0]:float(a.rsplit(':',1)[1]) for a in sys.argv[2:] if a.startswith('--silent-start=')}
assert set(manual_silent)<=set(s['name'] for s in segments if s.get('silent')), 'Manual cuts are allowed only for authentically silent UI'
assert len(groups)==len(segments)*2-len(manual_silent), f'Unexpected sync group count: {len(groups)}'
bounds=[];cursor=0
for s in segments:
 if s['name'] in manual_silent:
  start,end=manual_silent[s['name']],groups[cursor][0]/fps;cursor+=1
  assert start<end and (not bounds or start>bounds[-1][1])
  bounds.append((start,end,'Silent UI start manually selected from inspected original frames; end uses actual flash. No audio synchronization is claimed for silence.'))
 else:
  bounds.append((groups[cursor][0]/fps,groups[cursor+1][0]/fps,'Actual paired video flashes'));cursor+=2
cuts=[];parts=[]
for i,s in enumerate(segments):
 start,end,boundary_method=bounds[i]
 if s.get('silent'):
  segment_label=label
  duration=end-start-.60;part=root/(s['name']+'.mp4');parts.append(part)
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(start+.30),'-i',str(video),'-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-t',str(duration),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-crf','24','-maxrate','1050k','-bufsize','2100k','-vf',segment_label,'-pix_fmt','yuv420p','-r','25','-c:a','aac','-b:a','128k','-movflags','+faststart',str(part)],check=True)
  cuts.append({'segment':s['name'],'sourceVideoStart':start+.30,'duration':duration,'boundaryMethod':boundary_method,'audio':'Authentic silent career UI. Silent track for concatenation; no replacement sound.'});continue
 marks=s['markers'];assert len(marks)==2
 audio=Path(root/(s['name']+'-audio.webm'))
 segment_label=label
 motion=root/(s['name']+'-motion.json')
 if motion.exists():
  measured=json.loads(motion.read_text());scored=[r for r in measured['samples'] if r['scored']];rms_error=math.sqrt(sum(r['error']**2 for r in scored)/len(scored));peak_error=max(abs(r['error']) for r in scored)
  note=f'CAPTURED SCORED TRACE | RMS {rms_error:.2f} m | PEAK {peak_error:.2f} m | {len(scored)/60:.1f} s'
  segment_label+=",drawtext=fontfile='"+font_path+"':text='"+note+"':fontsize=15:fontcolor=white:box=1:boxcolor=black@0.78:boxborderw=5:x=8:y=h-th-32"
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
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(start+offset),'-i',str(video),'-ss',str(max(0,astart+offset)),'-i',str(audio),'-t',str(duration),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-crf','24','-maxrate','1050k','-bufsize','2100k','-vf',segment_label,'-pix_fmt','yuv420p','-r','25','-c:a','aac','-b:a','128k','-ar','48000','-movflags','+faststart',str(part)],check=True)
 decoded=array.array('f');decoded.frombytes(run(['ffmpeg','-v','error','-i',str(part),'-vn','-f','f32le','-ac','1','-ar','12000','-']));body=decoded[6000:-6000];energy=math.sqrt(sum(x*x for x in body)/len(body));assert energy>.0003, f'Game audio missing between markers: {s["name"]}'
 cuts.append({'gameAudioRMSBetweenMarkers':energy,'segment':s['name'],'sourceVideoStart':start+offset,'sourceAudioStart':astart+offset,'duration':duration,'measuredAVDriftMs':drift*1000,'audioChirpCenters':tones,'videoFlashStarts':[start,end]})
concat=root/'concat.txt';concat.write_text('\n'.join("file '"+p.name+"'" for p in parts))
final=root/'P09C-Freedom-to-Drive.mp4';subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-c:v','copy','-af','aresample=async=1:first_pts=0','-c:a','aac','-b:a','128k','-ar','48000','-movflags','+faststart',str(final)],check=True)
probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(final)]));duration=float(probe['format']['duration']);assert 180<=duration<=240
pcm=array.array('f');pcm.frombytes(run(['ffmpeg','-v','error','-i',str(final),'-vn','-f','f32le','-ac','1','-ar','12000','-']));peak=max(abs(x) for x in pcm);rms=math.sqrt(sum(x*x for x in pcm)/len(pcm));assert all(math.isfinite(x) for x in pcm) and rms>.0005 and peak<1
report={'runtime':runtime,'overlay':'Encoded runtime / edited capture label plus diagnostic-only scored RMS/peak calculated from captured trace added. Original game UI and actual audio unchanged. Automated input label captured live.','pass':True,'method':'Real-speed edited demonstration, with only loading and disclosed sync-marker boundaries cut. Actual live game graph audio, measured recorded chirps aligned to captured video flashes. No synthesized replacement audio or time warping. Audio listening approval remains human.','excludedSegments':{name:'A required video sync flash is absent from captured frames; full original video/audio retained. Optional Original Harbor excerpt omitted rather than claiming unverified synchronization.' for name in excluded},'omittedVisualGroups':[{'groupIndex':i,'startSeconds':all_groups[i][0]/fps,'endSeconds':all_groups[i][-1]/fps} for i in sorted(omitted_groups)],'cuts':cuts,'video':str(video),'film':str(final),'duration':duration,'bytes':final.stat().st_size,'sha256':hashlib.sha256(final.read_bytes()).hexdigest(),'decodedAudio':{'peak':peak,'rms':rms,'samples':len(pcm)},'probe':probe}
(root/'FILM-VERIFICATION.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:report[k] for k in ['pass','duration','bytes','sha256']}))
