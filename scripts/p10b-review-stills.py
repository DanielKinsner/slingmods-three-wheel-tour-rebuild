"""Compress selected authentic captures; annotated comparisons keep references labeled."""
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont
import json,hashlib
r=Path(__file__).resolve().parents[1];e=r/'director-kit/production/evidence/P10B';out=e/'review-stills-final';out.mkdir(exist_ok=False)
selected=[('film-final-01/01-entry.png','01-entry.jpg','Current intended hero; original cabinet wall / lift retained'),('film-final-01/02-tour-wall.png','02-tour-wall.jpg','Current physical left side wall; separate accurate lettering'),('material-final-02/1920-matched-baseline-blue-orange.png','03-matched-before.jpg','BEFORE: exact fixed camera, blue/orange stock, 1080p'),('material-final-02/1920-matched-new-blue-orange.png','04-matched-after.jpg','AFTER: same camera and recipe; scoped light/material change'),('film-final-01/finish-black-red.png','05-black-finish.jpg','Gloss black retains broad reflections and readable trim'),('film-final-01/03-lighting.png','06-lighting-720.jpg','Actual 720p options; scrollable inspector and open center'),('layout-final-01/installed-Suspension.png','07-suspension.jpg','Long functional setup remains reachable'),('film-final-01/06-ridge-blue-hour.png','08-destinations.jpg','One real-game selected preview and destination rail'),('film-final-01/05-shop.png','09-shop.jpg','Current five-product build list and genuine product links'),('loop-final-02/06-unchanged-career.png','10-career.jpg','Existing progress and credits preserved'),('film-final-01/frame-hud.png','11-hud.jpg','Actual race; open map / tach / live values'),('film-final-01/07-actual-result.png','12-results.jpg','Actual finishing place, field times and projected contact cues'),('film-final-01/frame-cockpit.png','13-cockpit.jpg','Captured cockpit: powered display and live racing HUD')]
rows=[]
for src,name,label in selected:
 im=Image.open(e/src).convert('RGB');im.thumbnail((1600,900));im.save(out/name,quality=87,optimize=True)
 rows.append(dict(source='review-stills-final/'+name,name=name,original=src,label=label,originalSHA256=hashlib.sha256((e/src).read_bytes()).hexdigest()))
font=ImageFont.truetype(str(r/'assets/fonts/barlow-condensed/BarlowCondensed-Bold.ttf'),23)
sheet=Image.new('RGB',(1600,7*280),(17,20,22));draw=ImageDraw.Draw(sheet)
for n,row in enumerate(rows):
 x=(n%2)*800;y=(n//2)*280;im=Image.open(e/row['source']);im=ImageOps.contain(im,(780,235));sheet.paste(im,(x+(800-im.width)//2,y));draw.text((x+12,y+239),row['label'],font=font,fill=(238,238,238))
sheet.save(out/'14-actual-comparison-contact-sheet.jpg',quality=88,optimize=True)
rows.append(dict(source='review-stills-final/14-actual-comparison-contact-sheet.jpg',name='14-actual-comparison-contact-sheet.jpg',label='Annotated actual before/current captures; concepts are in separate director reference map'))
(out/'selection.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps({'stills':len(rows),'bytes':sum(p.stat().st_size for p in out.glob('*.jpg'))}))
