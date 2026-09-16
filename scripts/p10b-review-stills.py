"""Compress selected authentic captures; annotated comparisons keep references labeled."""
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont
import json,hashlib
r=Path(__file__).resolve().parents[1];e=r/'director-kit/production/evidence/P10B';out=e/'review-stills';out.mkdir(exist_ok=False)
selected=[('visual-final-01/1920-entry-blue.png','01-entry.jpg','Current intended hero; original cabinet wall / lift retained'),('material-final-02/1920-tour-wall-build.png','02-tour-wall.jpg','Current physical left side wall; separate accurate lettering'),('material-final-02/1920-matched-baseline-blue-orange.png','03-matched-before.jpg','BEFORE: exact fixed camera, blue/orange stock, 1080p'),('material-final-02/1920-matched-new-blue-orange.png','04-matched-after.jpg','AFTER: same camera and recipe; scoped light/material change'),('material-final-02/1920-matched-new-black-red.png','05-black-finish.jpg','Gloss black retains broad reflections and readable trim'),('visual-final-01/1280-lighting.png','06-lighting-720.jpg','Actual 720p options; scrollable inspector and open center'),('visual-final-01/1920-suspension.png','07-suspension.jpg','Long functional setup remains reachable'),('visual-final-01/1920-destinations.png','08-destinations.jpg','One real-game selected preview and destination rail'),('visual-final-01/1920-shop.png','09-shop.jpg','Current five-product build list and genuine product links'),('visual-final-01/1280-career.png','10-career.jpg','Existing progress and credits preserved'),('contact-visual-final-01/ridge-hud.png','11-hud.jpg','Actual race; open map / tach / live values'),('contact-visual-final-01/ridge-result.png','12-results.jpg','Actual fourth place, field times and projected contact cues')]
rows=[]
for src,name,label in selected:
 im=Image.open(e/src).convert('RGB');im.thumbnail((1600,900));im.save(out/name,quality=87,optimize=True)
 rows.append(dict(source='review-stills/'+name,name=name,original=src,label=label,originalSHA256=hashlib.sha256((e/src).read_bytes()).hexdigest()))
font=ImageFont.truetype(str(r/'assets/fonts/barlow-condensed/BarlowCondensed-Bold.ttf'),23)
sheet=Image.new('RGB',(1600,6*280),(17,20,22));draw=ImageDraw.Draw(sheet)
for n,row in enumerate(rows):
 x=(n%2)*800;y=(n//2)*280;im=Image.open(e/row['source']);im=ImageOps.contain(im,(780,235));sheet.paste(im,(x+(800-im.width)//2,y));draw.text((x+12,y+239),row['label'],font=font,fill=(238,238,238))
sheet.save(out/'13-actual-comparison-contact-sheet.jpg',quality=88,optimize=True)
rows.append(dict(source='review-stills/13-actual-comparison-contact-sheet.jpg',name='13-actual-comparison-contact-sheet.jpg',label='Annotated actual before/current captures; concepts are in separate director reference map'))
(out/'selection.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps({'stills':len(rows),'bytes':sum(p.stat().st_size for p in out.glob('*.jpg'))}))
