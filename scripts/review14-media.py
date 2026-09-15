from pathlib import Path
import json,subprocess,hashlib
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[1];E=R/'director-kit/production/evidence/P07A';D=E/'video-final-02';movie=D/'complete-race-LIVE-AUDIO.mp4';frames=D/'frames';frames.mkdir(exist_ok=False)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(movie)]));v=next(s for s in probe['streams']if s['codec_type']=='video');a=next(s for s in probe['streams']if s['codec_type']=='audio');assert(v['width'],v['height'],v['r_frame_rate'])==(1280,720,'25/1');duration=float(probe['format']['duration']);assert 180<=duration<=240
packets=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','packet=pts_time,duration_time','-of','json',str(movie)]))['packets'];pts=sorted(float(p['pts_time'])for p in packets);assert all(abs((b-a)-.04)<.0001 for a,b in zip(pts,pts[1:]));assert all(abs(float(p['duration_time'])-.04)<.0001 for p in packets)
selections=[2,15,35,50,85,120,165,185,198,min(duration-2,210)];tiles=[]
for i,t in enumerate(selections):
 dest=frames/f'{i:02d}-{t:.2f}.png';subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',str(movie),'-frames:v','1',str(dest)],check=True)
 im=Image.open(dest).convert('RGB');im.thumbnail((480,270));tile=Image.new('RGB',(480,296),'#101820');tile.paste(im,(0,26));ImageDraw.Draw(tile).text((8,8),f'{t:.2f}s / actual movie frame',fill='white');tiles.append(tile)
sheet=Image.new('RGB',(960,296*5),'#101820')
for i,tile in enumerate(tiles):sheet.paste(tile,((i%2)*480,(i//2)*296))
sheet.save(D/'review-contact-sheet.jpg',quality=88)
# Original PNG stills remain. Review JPEGs use the same pixels/dimensions, lossy encoding only.
derived=[]
for name in ['result','cockpit']:
 original=D/(name+'.png');dest=D/(name+'-review.jpg');Image.open(original).convert('RGB').save(dest,quality=90);derived.append({'original':original.relative_to(R).as_posix(),'originalSHA256':sha(original),'review':dest.relative_to(R).as_posix(),'reviewSHA256':sha(dest),'transform':'PNG to JPEG quality90, same1280x720 pixels; no crop, overlay or generative changes'})
raw=next((D/'raw-video').glob('*.webm'));report={'schemaVersion':1,'runtime':json.loads((E/'final-build.json').read_text())['commit'],'movie':movie.relative_to(R).as_posix(),'movieSHA256':sha(movie),'bytes':movie.stat().st_size,'durationSeconds':duration,'video':{k:v.get(k)for k in ['codec_name','width','height','r_frame_rate','nb_frames']},'audio':{k:a.get(k)for k in ['codec_name','channels','sample_rate']},'allVideoPacketTimestamps':{'count':len(pts),'first':pts[0],'last':pts[-1],'everyIntervalSeconds':.04,'constant25fps':True},'retainedOriginal':{'path':raw.relative_to(R).as_posix(),'bytes':raw.stat().st_size,'sha256':sha(raw)},'encoding':'Continuous Playwright wall-clock source at25fps. H264 CRF25 maxrate1100k bufsize2200k yuv420p; no frame-rate conversion/interpolation, no race cut or speed change. Actual live WebAudio MediaRecorder Opus decoded, constant shift using3disclosed chirps/flashes, AAC192k; no pitch/time stretch or replacement soundtrack. Silent entry/garage lie outside livegraph. Detailed anchors in audio-video-verification.json.','reviewStillDerivatives':derived,'sampledFrames':selections,'motionReviewLimit':'Contact sheet comprises selected real frames over the whole sequence. Frame packet cadence is checked completely; it is not a claim of human real-time viewing/listening or universal performance.'}
(E/'media-review.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:report[k]for k in ['bytes','durationSeconds','video','audio','allVideoPacketTimestamps']},indent=2))
