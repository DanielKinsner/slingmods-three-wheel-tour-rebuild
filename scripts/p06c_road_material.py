"""Derive aligned, non-mirrored fine asphalt channels from retained CC0 originals."""
from pathlib import Path
import hashlib, json
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/blender/showcase-quality/sources'
OUT = ROOT / 'public/assets/showcase-quality/textures'

def periodic(a):
    """Remove the smooth opposite-edge mismatch; preserve original interior detail."""
    h,w=a.shape[:2];boundary=np.zeros_like(a)
    boundary[0]=a[-1]-a[0];boundary[-1]=a[0]-a[-1]
    boundary[:,0]+=a[:,-1]-a[:,0];boundary[:,-1]+=a[:,0]-a[:,-1]
    denominator=2*np.cos(2*np.pi*np.arange(h)/h)[:,None]+2*np.cos(2*np.pi*np.arange(w)/w)[None,:]-4
    denominator[0,0]=1
    spectrum=np.fft.fft2(boundary,axes=(0,1))/denominator[:,:,None];spectrum[0,0]=0
    return a-np.fft.ifft2(spectrum,axes=(0,1)).real

def build():
    rows = []
    for channel in ['Diffuse', 'nor_gl', 'Rough', 'AO']:
        source = SOURCE / f'asphalt_02_{channel}.jpg'
        im = Image.open(source).convert('RGB').crop((460,190,972,702))
        a = np.asarray(im, dtype=np.float32)
        if channel == 'Diffuse':
            # An intact quarter-area photograph has aggregate without repeating hero cracks.
            # No reflected copies; smooth boundary mismatch is removed in frequency space.
            low = np.asarray(im.filter(ImageFilter.GaussianBlur(12)), dtype=np.float32)
            a = np.clip(93 + (a-low)*.66, 0, 255)
        elif channel == 'Rough':
            a = np.clip(210 + (a-a.mean())*.24, 188, 240)
        elif channel == 'AO':
            a = np.clip(240 + (a-a.mean())*.16, 218, 255)
        a=periodic(a)
        if channel=='nor_gl':
            normals=a/127.5-1;normals/=np.maximum(np.linalg.norm(normals,axis=2,keepdims=True),1e-6);a=(normals+1)*127.5
        im = Image.fromarray(np.clip(a,0,255).astype('uint8'))
        target = OUT / f'p06c_asphalt_{channel}.jpg'
        im.save(target, quality=95, optimize=True)
        rows.append(dict(channel=channel, original=str(source.relative_to(ROOT)).replace('\\','/'),
                         originalSHA256=hashlib.sha256(source.read_bytes()).hexdigest(),
                         derived=str(target.relative_to(ROOT)).replace('\\','/'),
                         derivedSHA256=hashlib.sha256(target.read_bytes()).hexdigest(),
                         colorSpace='sRGB' if channel=='Diffuse' else 'Non-Color'))
    record = dict(method='Aligned intact512px crop(460,190,972,702); diffuse high-pass at12px; smooth opposite-edge mismatch removal in Fourier space; scalar roughness/AO restraint and normal renormalization. No mirrored copies. Fine0.75m aggregate separate from authored route vertex tone.',
                  asset='asphalt_02', license='CC0-1.0', sourcePage='https://polyhaven.com/a/asphalt_02',
                  sourceLicense='https://polyhaven.com/license', physicalTileMetres=.75, channels=rows)
    (OUT.parent/'p06c-road-provenance.json').write_text(json.dumps(record, indent=2))
    print('P06C aligned road channels ready')

if __name__ == '__main__':
    build()
