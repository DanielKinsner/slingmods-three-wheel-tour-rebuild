"""Decode the final movie and verify continuous ordered packet timestamps per stream."""
from pathlib import Path
import json, subprocess, sys, hashlib
root=Path(sys.argv[1]); film=root/'P08B-Signature-Experience.mp4'
subprocess.run(['ffmpeg','-v','error','-i',str(film),'-f','null','-'],check=True)
p=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_packets','-show_streams','-of','json',str(film)]))
streams=[]
for stream in p['streams']:
 rows=[v for v in p['packets'] if v['stream_index']==stream['index'] and 'dts_time' in v]
 times=[float(v['dts_time']) for v in rows];assert rows and all(b>a for a,b in zip(times,times[1:]))
 gaps=[b-a for a,b in zip(times,times[1:])];maximum=max(gaps);assert maximum<.1
 streams.append({'type':stream['codec_type'],'codec':stream['codec_name'],'packets':len(rows),'firstDTS':times[0],'lastDTS':times[-1],'maximumDTSGapSeconds':maximum,'strictlyIncreasing':True})
assert {s['type'] for s in streams}=={'video','audio'}
result={'pass':True,'film':film.name,'bytes':film.stat().st_size,'sha256':hashlib.sha256(film.read_bytes()).hexdigest(),'fullDecode':'pass','streams':streams,'method':'FFmpeg full audio/video decode and ffprobe packet DTS audit. Threshold <100ms gap in each stream; negative initial encoder-delay timestamps are allowed. This is technical playback validation, not human listening approval.'}
(root/'DECODE-AND-PACKETS.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
