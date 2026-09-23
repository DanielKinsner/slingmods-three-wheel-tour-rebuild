"""Add every file under the given public/ asset directories to demo-assets.json (the hosted build allowlist).

    python scripts/game-feel/allowlist.py assets/audio/game-cues-v1 [more dirs...]
Idempotent. Edits the file textually (binary-safe) so the existing mixed line endings are preserved byte-for-byte;
new entries go right after the last existing entry that shares the directory's parent.
"""
import json, pathlib, sys
root = pathlib.Path(__file__).resolve().parents[2]
path = root / 'demo-assets.json'
raw = path.read_bytes()
assets = json.loads(raw)['assets']
lines = raw.split(b'\n')
for d in sys.argv[1:]:
    folder = root / 'public' / d
    files = sorted(p.relative_to(root / 'public').as_posix() for p in folder.rglob('*') if p.is_file())
    new = [f for f in files if f not in assets]
    if not new:
        print(f'{d}: +0'); continue
    parent = d.rsplit('/', 1)[0] + '/'
    idx = [i for i, l in enumerate(lines) if l.strip().startswith(b'"' + parent.encode())]
    at = idx[-1] if idx else max(i for i, l in enumerate(lines) if l.strip().startswith(b'"assets/'))
    anchor = lines[at].rstrip(b'\r')
    eol = b'\r' if lines[at].endswith(b'\r') else b''
    if not anchor.endswith(b','):
        lines[at] = anchor + b',' + eol
        tail_comma = False
    else:
        tail_comma = True
    block = [b'    "' + f.encode() + b'",' + eol for f in new]
    if not tail_comma:
        block[-1] = block[-1].replace(b'",', b'"')
    lines[at + 1:at + 1] = block
    assets += new
    print(f'{d}: +{len(new)}')
out = b'\n'.join(lines)
json.loads(out)
path.write_bytes(out)
