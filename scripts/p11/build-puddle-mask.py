"""Puddle mask v2: a continuous, seamless water-depth field for the wet race asphalt.

The v1 mask was derived from the 2x2-repeated 4 m asphalt height map through a steep ramp, so it was nearly binary and
repeated inside its own tile; the shader's thresholds turned it into hard, camouflage-like blotches. This field is
band-limited noise built in the frequency domain, so it tiles exactly with no internal repeat, and its values vary
smoothly: shallow damp edges grade into standing water. The shader samples it at 22 m (main), 8.1 m, 95 m and 1.3 m.

    python scripts/p11/build-puddle-mask.py && python scripts/p11/compress.py
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/assets/p11/race-asphalt/puddle-mask.png'
N, TILE_METRES, SEED = 2048, 22.0, 20260928

rng = np.random.default_rng(SEED)
k = np.fft.fftfreq(N) * N                      # cycles per tile
kk = np.hypot(*np.meshgrid(k, k, indexing='ij'))
kk[0, 0] = 1
# Puddles gather in hollows about 2.5-7 m across; a faint 1 m band lobes their shorelines.
wavelength = TILE_METRES / kk
band = np.exp(-((np.log(wavelength) - np.log(4.2)) / .5) ** 2) + .1 * np.exp(-((np.log(wavelength) - np.log(1.1)) / .4) ** 2)
spectrum = band
spectrum[0, 0] = 0
field = np.real(np.fft.ifft2(np.fft.fft2(rng.standard_normal((N, N))) * spectrum))
field = (field - field.mean()) / field.std()
mask = np.clip(.5 + field * .19, 0, 1).astype(np.float32)   # mean .5, smooth tails

Image.fromarray(np.uint8(np.round(mask * 255)), 'L').save(OUT)

# Coverage as the shader sees it (same four samples and thresholds as race-asphalt.ts WET_FIELD).
def sample(scale, swap=False, offset=(0, 0)):
    idx = np.arange(512)
    u = ((idx[:, None] / 512 * 60 / scale + offset[0]) % 1 * N).astype(int)
    v = ((idx[None, :] / 512 * 60 / scale + offset[1]) % 1 * N).astype(int)
    return mask[v, u] if swap else mask[u, v]
wet = sample(1) * .75 + sample(.37, True, (.31, .31)) * .25 + (sample(4.3, False, (.17, .53)) - .5) * .22 + (sample(.06, True, (.71, .71)) - .5) * .16
standing = (wet > .64).mean()
print(f'{OUT.relative_to(ROOT)}: {N}px, mean {mask.mean():.3f}, standing water ~{standing:.0%} of the road')
