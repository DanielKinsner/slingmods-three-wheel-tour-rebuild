"""Original game-feel UI cues for the SlingMods Three-Wheel Tour front end and race HUD.

Pure additive/FM/noise synthesis (numpy + scipy), no samples or third-party sources.
Writes 48 kHz mono 16-bit WAVs plus the bank manifest read by src/audio/graph.ts:

    python scripts/game-feel/synth-cues.py

Deterministic: every noise source is seeded, so reruns reproduce identical bytes.
"""
from __future__ import annotations
import hashlib, json, pathlib
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
OUT = pathlib.Path(__file__).resolve().parents[2] / 'public' / 'assets' / 'audio' / 'game-cues-v1'
rng = np.random.default_rng(20260922)


def t(seconds: float) -> np.ndarray:
    return np.arange(int(SR * seconds)) / SR


def env(n: int, attack: float, decay: float, curve: float = 4.0) -> np.ndarray:
    """Fast attack, exponential-ish decay envelope over n samples."""
    a = max(1, int(SR * attack))
    x = np.ones(n)
    x[:a] = np.linspace(0, 1, a) ** 0.5
    rest = n - a
    if rest > 0:
        x[a:] = np.exp(-curve * np.linspace(0, 1, rest) * (rest / SR) / max(decay, 1e-4))
    return x


def tone(freq, seconds, attack=0.002, decay=0.08, partials=((1, 1.0),), fm=0.0, fm_ratio=2.0, glide=None):
    tt = t(seconds)
    f = np.full_like(tt, float(freq)) if glide is None else np.geomspace(freq, glide, tt.size)
    phase = 2 * np.pi * np.cumsum(f) / SR
    mod = fm * np.sin(phase * fm_ratio)
    y = sum(g * np.sin(phase * k + mod) for k, g in partials)
    return y * env(tt.size, attack, decay)


def noise(seconds, lo=None, hi=None, order=4):
    y = rng.standard_normal(int(SR * seconds))
    if lo and hi:
        y = sosfilt(butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), y)
    elif hi:
        y = sosfilt(butter(order, hi, 'lowpass', fs=SR, output='sos'), y)
    elif lo:
        y = sosfilt(butter(order, lo, 'highpass', fs=SR, output='sos'), y)
    return y


def swept_noise(seconds, f0, f1, q=3.0, blocks=64):
    """Band-pass noise whose centre glides f0 -> f1 (block-wise, crossfaded)."""
    n = int(SR * seconds)
    src = rng.standard_normal(n + SR // 10)
    out = np.zeros(n)
    edges = np.linspace(0, n, blocks + 1).astype(int)
    centres = np.geomspace(f0, f1, blocks)
    for i, c in enumerate(centres):
        lo, hi = c / (1 + 1 / q), min(c * (1 + 1 / q), SR / 2 - 100)
        seg = sosfilt(butter(2, [lo, hi], 'bandpass', fs=SR, output='sos'), src[: edges[i + 1] + 2048])
        a, b = edges[i], edges[i + 1]
        out[a:b] = seg[a:b]
    return out


def mix(*parts):
    n = max(p.size for _, p in parts)
    y = np.zeros(n)
    for offset, p in parts:
        o = int(SR * offset)
        end = min(n, o + p.size)
        if o < n:
            y[o:end] += p[: end - o]
    return y


def pad(y, seconds):
    return np.concatenate([y, np.zeros(int(SR * seconds))])


def room(y, seconds=0.35, wet=0.18, bright=6000):
    ir = noise(seconds, hi=bright) * np.exp(-6 * t(seconds) / seconds)
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    tail = np.convolve(y, ir)
    dry = np.concatenate([y, np.zeros(tail.size - y.size)])
    return dry * (1 - wet) + tail * wet


def finish(y, peak=0.8, fade=0.004):
    y = np.tanh(y * 1.4) / np.tanh(1.4)  # gentle glue saturation
    f = int(SR * fade)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    m = np.max(np.abs(y)) or 1
    return y / m * peak


def click(seconds=0.012, hi=9000):
    return noise(seconds, lo=1800, hi=hi) * env(int(SR * seconds), 0.0004, 0.003)


CUES: dict[str, tuple[str, np.ndarray]] = {}

# Focus move: a tight, woody tick with a pitched body. Quiet by design (played on every focus change).
CUES['gx.focus'] = ('Focus tick: pitched 2.3 kHz body + filtered click', finish(mix((0, tone(2300, .05, .0008, .012, ((1, 1), (2.01, .25)))), (0, click() * .6)), .55))

# Tab / bumper switch: two quick detents, second slightly higher.
CUES['gx.tab'] = ('Tab switch: paired detents 1.6/2.1 kHz', finish(mix((0, tone(1600, .05, .0008, .015, ((1, 1), (3, .15)))), (.035, tone(2100, .06, .0008, .02, ((1, 1), (3, .15)))), (0, click() * .5), (.035, click() * .4)), .6))

# Select: bright upward FM blip with a transient, the "yes" of the menus.
sel = mix((0, tone(880, .16, .001, .06, ((1, 1), (2, .35), (3, .12)), fm=.8, fm_ratio=1.5)),
          (.045, tone(1320, .2, .001, .08, ((1, 1), (2, .3)), fm=.5, fm_ratio=2)),
          (0, click(.015) * .8))
CUES['gx.select'] = ('Select: 880 -> 1320 Hz FM pair + transient, short room', finish(room(sel, .25, .14), .75))

# Back: soft downward pair.
back = mix((0, tone(990, .12, .001, .05, ((1, 1), (2, .2)))), (.04, tone(660, .15, .001, .06, ((1, 1), (2, .2)))), (0, click() * .4))
CUES['gx.back'] = ('Back: 990 -> 660 Hz pair', finish(room(back, .2, .1), .6))

# Whoosh for screen/scene transitions: band-passed noise sweeping up then air tail.
w = swept_noise(.55, 280, 5200, q=2.2) * np.sin(np.linspace(0, np.pi, int(SR * .55))) ** 1.6
CUES['gx.whoosh'] = ('Transition whoosh: 280 -> 5200 Hz swept band noise', finish(room(w, .3, .2), .7))

# Reverse whoosh (arrival) for curtains opening.
w2 = swept_noise(.45, 4200, 360, q=2.0) * np.sin(np.linspace(0, np.pi, int(SR * .45))) ** 1.3
CUES['gx.arrive'] = ('Arrival whoosh: 4200 -> 360 Hz swept band noise', finish(room(w2, .3, .2), .6))

# Slam: title/result impact. Pitched-down sub thump + noise crack + metallic ring.
thump = tone(95, .6, .001, .16, ((1, 1), (2, .3)), glide=48)
crack = noise(.12, lo=900, hi=9000) * env(int(SR * .12), .0005, .03)
ring = tone(1780, .7, .001, .25, ((1, .5), (2.76, .3), (5.4, .15)))
CUES['gx.slam'] = ('Impact: 95 -> 48 Hz thump, broadband crack, inharmonic ring', finish(room(mix((0, thump * 1.2), (0, crack * .7), (0, ring * .18)), .6, .22, 5000), .85))

# Press start: riser into a hit.
riser = swept_noise(.7, 200, 7000, q=3) * np.linspace(0, 1, int(SR * .7)) ** 2.2
chord = sum(tone(f, 1.1, .002, .45, ((1, 1), (2, .25)), fm=.3) for f in (293.66, 440, 587.33, 880)) / 3
CUES['gx.start'] = ('Press start: noise riser into D major stab with thump', finish(room(mix((0, riser * .6), (.66, chord), (.66, thump), (.66, crack * .6)), .8, .25), .85))

# Credit tally tick: a coin-ish high double partial, very short.
CUES['gx.tick'] = ('Tally tick: 3.1 kHz inharmonic coin blip', finish(tone(3100, .045, .0005, .012, ((1, 1), (2.4, .4), (3.9, .2))), .5))

# Tally total / reward land: short bright chord.
land = sum(tone(f, .5, .002, .18, ((1, 1), (2, .3), (3, .1))) for f in (587.33, 739.99, 880, 1174.66)) / 3
CUES['gx.reward'] = ('Reward land: D major chord, bright, short room', finish(room(mix((0, land), (0, click(.02) * .7)), .35, .2), .75))

# Level up: rising arpeggio + shimmer.
arp = mix(*[(i * .085, tone(f, .55, .002, .22, ((1, 1), (2, .35), (4, .1)), fm=.4)) for i, f in enumerate((440, 554.37, 659.25, 880, 1108.73, 1318.51))])
shimmer = noise(1.2, lo=6000, hi=14000) * env(int(SR * 1.2), .35, .5) * .12
CUES['gx.levelup'] = ('Level up: A major rising arpeggio + air shimmer', finish(room(mix((0, arp), (.4, shimmer)), .9, .3), .8))

# Position gained / lost.
CUES['gx.pos-up'] = ('Position gained: 1047 -> 1568 Hz bright pair', finish(room(mix((0, tone(1046.5, .14, .001, .05, ((1, 1), (2, .3)))), (.07, tone(1568, .22, .001, .08, ((1, 1), (2, .3))))), .25, .15), .7))
CUES['gx.pos-down'] = ('Position lost: 784 -> 587 Hz muted pair', finish(mix((0, tone(784, .14, .001, .05, ((1, 1), (2, .15)))), (.08, tone(587.33, .2, .001, .07, ((1, 1), (2, .15))))), .55))

# Lap / split chime.
CUES['gx.lap'] = ('Lap chime: 1318/1760 Hz bell pair', finish(room(mix((0, tone(1318.5, .5, .001, .2, ((1, 1), (2.01, .3), (3.9, .12)))), (.09, tone(1760, .6, .001, .25, ((1, 1), (2.01, .3), (3.9, .1))))), .5, .25), .7))

# New record fanfare.
rec = mix(*[(i * .11, tone(f, .8 if i == 3 else .3, .002, .35 if i == 3 else .1, ((1, 1), (2, .4), (3, .2)), fm=.5)) for i, f in enumerate((659.25, 783.99, 987.77, 1318.51))])
CUES['gx.record'] = ('New record: E minor-to-high rising fanfare', finish(room(mix((0, rec), (.33, shimmer[: int(SR * .8)])), .8, .28), .8))

# Countdown lights (distinct from race.count so the HUD can layer): short square-ish beep, and the GO tone.
sq = lambda f, s: tone(f, s, .001, s * .5, ((1, 1), (3, .33), (5, .2), (7, .14)))
CUES['gx.light'] = ('Start light: 587 Hz odd-harmonic beep', finish(pad(sq(587.33, .16), .05), .6))
CUES['gx.go'] = ('Go: 1175 Hz odd-harmonic beep with thump', finish(room(mix((0, sq(1174.66, .5)), (0, thump * .6)), .3, .15), .75))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    files = []
    for name, (source, y) in CUES.items():
        path = OUT / f'{name}.wav'
        wavfile.write(path, SR, (y * 32767).astype(np.int16))
        data = path.read_bytes()
        files.append({'name': name, 'file': path.name, 'source': source, 'loop': False,
                      'duration': round(y.size / SR, 4), 'channels': 1, 'sampleRate': SR,
                      'rms': float(np.sqrt(np.mean(y ** 2))), 'peak': float(np.max(np.abs(y))),
                      'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)})
    manifest = {'version': 1, 'method': 'Original numpy/scipy synthesis by scripts/game-feel/synth-cues.py (seeded, deterministic)',
                'licenseBasis': 'Original work for this project; no samples or third-party audio', 'humanListeningApproval': False, 'files': files}
    (OUT / 'provenance.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'wrote {len(files)} cues to {OUT}')


if __name__ == '__main__':
    main()
