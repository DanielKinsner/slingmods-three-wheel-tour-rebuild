"""Tileable micro-surface maps for vehicle materials (src/presentation/vehicle-surfaces.ts).

  python scripts/build-vehicle-surface-maps.py

Deterministic and original: FFT-filtered noise is periodic by construction, and cellular patterns wrap
their neighbour search, so every map tiles seamlessly. Each 512x512 WebP packs
  R,G = tangent-plane normal x,y (0.5 = flat)   B = roughness modulation (0.5 = unchanged)
The shader projects them triplanar in each part's own metres, so no UVs are required.
"""
import json, pathlib
import numpy as np
from PIL import Image

OUT = pathlib.Path(__file__).resolve().parents[1] / 'public/assets/vehicle-surfaces'
N = 512
rng = np.random.default_rng(20260923)
fy, fx = np.meshgrid(np.fft.fftfreq(N) * N, np.fft.fftfreq(N) * N, indexing='ij')
radius = np.hypot(fx, fy)


def band(lo, hi, aniso=1.0):
    """Periodic noise with energy between lo..hi cycles per tile; aniso>1 stretches features along x."""
    r = np.hypot(fx / aniso, fy)
    spectrum = (np.fft.fft2(rng.standard_normal((N, N)))) * ((r >= lo) & (r <= hi)) / np.maximum(r, 1)
    h = np.real(np.fft.ifft2(spectrum))
    return (h - h.mean()) / (h.std() + 1e-9)


def cells(count, jitter=.9):
    """Periodic jittered-grid Voronoi: F1, F2 distances and a per-cell random id, in cell units."""
    g = np.arange(count) + .5
    base_y, base_x = np.meshgrid(g, g, indexing='ij')
    pts_y = base_y + (rng.random((count, count)) - .5) * jitter
    pts_x = base_x + (rng.random((count, count)) - .5) * jitter
    ids = rng.random((count, count))
    u = (np.arange(N) + .5) / N * count
    py, px = np.meshgrid(u, u, indexing='ij')
    cy, cx = np.floor(py).astype(int), np.floor(px).astype(int)
    f1 = np.full((N, N), 9.); f2 = np.full((N, N), 9.); nid = np.zeros((N, N))
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            gy, gx = cy + dy, cx + dx
            wy, wx = gy % count, gx % count
            d = np.hypot(py - (pts_y[wy, wx] + gy - wy), px - (pts_x[wy, wx] + gx - wx))
            closer = d < f1
            f2 = np.where(closer, f1, np.minimum(f2, d)); nid = np.where(closer, ids[wy, wx], nid); f1 = np.minimum(f1, d)
    return f1, f2, nid


def normals(h, strength):
    """Height (unit std) -> normal x,y. Central differences on a wrapped grid keep the tile seamless."""
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * .5 * strength
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * .5 * strength
    n = np.dstack([-dx, -dy, np.ones_like(h)])
    return n / np.linalg.norm(n, axis=2, keepdims=True)


def save(name, nxy, rough, note):
    rgb = np.dstack([nxy[..., 0] * .5 + .5, nxy[..., 1] * .5 + .5, np.clip(rough, 0, 1)])
    Image.fromarray((np.clip(rgb, 0, 1) * 255 + .5).astype(np.uint8)).save(OUT / f'{name}.webp', quality=92, method=6)
    return {'file': f'{name}.webp', 'note': note}


OUT.mkdir(parents=True, exist_ok=True)
maps = {}
# Metallic paint: every flake is a tiny tilted mirror. Per-cell tilt, not a height field.
f1, f2, cid = cells(96)
ang = cid * 2 * np.pi; mag = .35 * np.sqrt((cid * 7.31) % 1)
flake = np.dstack([np.cos(ang) * mag, np.sin(ang) * mag])
flake *= (f1 < .42)[..., None]                       # binder between flakes stays flat
maps['flake'] = save('flake', flake, .5 + .25 * ((cid * 3.7) % 1 - .5) * (f1 < .42), 'metallic flake, 96 cells per tile')
# Clear-coat orange peel: soft long-wave undulation that makes reflections ripple very slightly.
maps['peel'] = save('peel', normals(band(3, 9), .10)[..., :2], .5 + .03 * band(3, 9), 'clear-coat orange peel')
# Textured automotive plastic: rounded stipple bumps plus fine sand.
f1, f2, cid = cells(64)
stipple = np.clip(1 - f1 / .55, 0, 1) ** 1.5 + .25 * band(90, 200)
stipple = (stipple - stipple.mean()) / stipple.std()
maps['stipple'] = save('stipple', normals(stipple, .9)[..., :2], .5 + .12 * np.tanh(-stipple * .8), 'textured plastic stipple, 64 cells per tile')
# Leather: pebbled cells separated by creases (F2-F1 near zero on cell borders).
f1, f2, cid = cells(40)
leather = -np.exp(-((f2 - f1) / .09) ** 2) + .15 * band(60, 160) + .25 * (cid - .5)
leather = (leather - leather.mean()) / leather.std()
maps['leather'] = save('leather', normals(leather, 1.1)[..., :2], .5 + .15 * np.tanh(-leather), 'leather pebble grain, 40 cells per tile')
# Rubber: fine, slightly clumpy micro-roughness; roughness varies a little with it.
rub = band(40, 220) + .5 * band(6, 20)
rub = (rub - rub.mean()) / rub.std()
maps['rubber'] = save('rubber', normals(rub, .55)[..., :2], .5 + .10 * np.tanh(rub * .7), 'rubber micro texture')
# Cast/brushed metal: long directional streaks with fine sand; the shader picks the streak axis per part.
metal = band(20, 240, aniso=9.0) + .35 * band(80, 240)
metal = (metal - metal.mean()) / metal.std()
maps['metal'] = save('metal', normals(metal, .6)[..., :2], .5 + .16 * np.tanh(metal * .8), 'brushed/cast metal streaks along U')
(OUT / 'manifest.json').write_text(json.dumps({'version': 1, 'size': N, 'build': 'scripts/build-vehicle-surface-maps.py',
    'encoding': 'R,G tangent normal xy (0.5 flat); B roughness modulation (0.5 unchanged)', 'maps': maps}, indent=1))
print('\n'.join(f"{k}: {(OUT / v['file']).stat().st_size} bytes" for k, v in maps.items()))
