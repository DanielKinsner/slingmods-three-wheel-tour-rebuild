import bpy,numpy as np,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];scene=bpy.context.scene
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.view_settings.view_transform='AgX'
for name in ['golden-hour','dusk','clear-night','after-rain','marine-layer']:
 im=bpy.data.images.load(str(ROOT/'public/assets/p11/skies'/(name+'-1k.hdr')));a=np.asarray(im.pixels[:],dtype=np.float32).reshape(im.size[1],im.size[0],4);l=a[:,:,:3]@np.array([.2126,.7152,.0722]);average=float(np.exp(np.log(np.maximum(l,1e-8)).mean()));middle=.025 if name=='clear-night' else .08 if name=='dusk' else .2;scene.view_settings.exposure=math.log2(middle/max(average,1e-8));im.save_render(str(ROOT/'assets/p11/previews'/(name+'-sky.png')),scene=scene);bpy.data.images.remove(im)
print('Rendered five display-referred previews; original HDR radiance untouched')
