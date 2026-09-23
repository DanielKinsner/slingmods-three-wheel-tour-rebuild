"""Add every file under the given public/ asset directories to the `assets` array of demo-assets.json.

    python scripts/game-feel/allowlist.py assets/audio/game-cues-v1 [more dirs...]
Idempotent (skips anything already listed in `assets` or `notices`). Edits the file textually so its existing mixed
line endings stay byte-for-byte; new entries go right after the last `assets`-array entry sharing the directory's
parent (never into `notices`).
"""
import json, pathlib, sys
root = pathlib.Path(__file__).resolve().parents[2]
path = root / 'demo-assets.json'
raw = path.read_bytes()
doc = json.loads(raw)
known = set(doc['assets']) | set(doc.get('notices', []))
lines = raw.split(b'\n')
start = next(i for i, l in enumerate(lines) if l.strip().startswith(b'"assets": ['))
end = None
for i in range(start + 1, len(lines)):
    if lines[i].strip().startswith(b']'):
        end = i
        break
for d in sys.argv[1:]:
    folder = root / 'public' / d
    files = sorted(p.relative_to(root / 'public').as_posix() for p in folder.rglob('*') if p.is_file())
    new = [f for f in files if f not in known]
    if not new:
        print(f'{d}: +0')
        continue
    parent = d.rsplit('/', 1)[0] + '/'
    within = [i for i in range(start + 1, end) if lines[i].strip().startswith(b'"' + parent.encode())]
    at = within[-1] if within else end - 1
    eol = b'\r' if lines[at].endswith(b'\r') else b''
    body = lines[at].rstrip(b'\r')
    last = not body.endswith(b',')
    if last:
        lines[at] = body + b',' + eol
    block = [b'    "' + f.encode() + b'",' + eol for f in new]
    if last:
        block[-1] = block[-1].replace(b'",', b'"')
    lines[at + 1:at + 1] = block
    end += len(block)
    known |= set(new)
    print(f'{d}: +{len(new)}')
out = b'\n'.join(lines)
final = json.loads(out)
assert len(final['assets']) == len(set(final['assets'])), 'duplicate allowlist entries'
path.write_bytes(out)
