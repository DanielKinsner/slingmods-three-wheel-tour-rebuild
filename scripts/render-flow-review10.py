from pathlib import Path
import json,subprocess,hashlib
b=Path('director-kit/production/evidence/P05/fresh-verified')
names=['fresh-chapter','flow-earned','flow-purchased','flow-result','flow-reloaded','flow-replay']
labels=['OPENING CHAPTER','CLEAN LAP - 800 CREDITS','ACTUAL KIT PURCHASE','CREW RESULT AND REWARDS','SAVED KIT AFTER RELOAD','REPLAY THROUGH BAY MENU']
parts=[]
for i,(n,label) in enumerate(zip(names,labels)):
 out=b/f'flow-part-{i}.mp4'
 vf=f"drawbox=x=0:y=0:w=iw:h=22:color=black@0.85:t=fill,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='EDITED RUNTIME STILLS - CONTROLLED-TIME FUNCTIONAL TEST - SILENT - {label}':x=12:y=5:fontsize=12:fontcolor=white"
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-loop','1','-i',str(b/(n+'.png')),'-t','3','-vf',vf,'-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p','-r','25',str(out)],check=True)
 parts.append("file '"+out.name+"'")
(b/'flow-concat.txt').write_text('\n'.join(parts))
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(b/'flow-concat.txt'),'-c','copy',str(b/'chapter-flow-EDITED-SILENT.mp4')],check=True)
(b/'flow-video.json').write_text(json.dumps({'method':'18-second labeled edited sequence of six actual runtime screenshots from fresh isolated career: clean lap, real purchase, actual two-lap podium, durable reload, and ordinary Replay button. Controlled-time driving functional test; never performance or continuous motion proof.','audio':'SILENT','inputs':{n+'.png':hashlib.sha256((b/(n+'.png')).read_bytes()).hexdigest()for n in names}},indent=2))
