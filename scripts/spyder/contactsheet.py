from PIL import Image,ImageDraw
from pathlib import Path
p=Path('assets/spyder/evidence/matched')
for mode in ['clay','pbr']:
 out=Image.new('RGB',(1000,7*424),(25,28,32));d=ImageDraw.Draw(out)
 for row,view in enumerate(['hero','left','right','rear','cockpit','seat','wheel']):
  for col,stage in enumerate(['source','final']):
   im=Image.open(p/f'{stage}-{mode}-{view}.png').convert('RGB');im.thumbnail((500,400));out.paste(im,(col*500,row*424+24));d.text((col*500+8,row*424+5),f'{stage.upper()} | {mode} | {view}',fill='white')
 out.save(p/f'comparison-{mode}.jpg',quality=92)
