"""Verify Git-recoverable runtime/editable inputs without an API or local asset copy."""
from pathlib import Path
import hashlib
import json
import sys

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root/'handoff/P10B-REQUIRED-ASSETS.json').read_text(encoding='utf-8'))
failures = []
for name, expected in manifest['files'].items():
    path = root/name
    if not path.is_file():
        failures.append({'path':name, 'error':'missing'})
        continue
    with path.open('rb') as stream:
        actual = hashlib.file_digest(stream, 'sha256').hexdigest()
    if path.stat().st_size != expected['bytes'] or actual != expected['sha256']:
        failures.append({'path':name, 'error':'size or SHA256 mismatch'})
print(json.dumps({'pass':not failures, 'checked':len(manifest['files']), 'failures':failures}, indent=2))
sys.exit(1 if failures else 0)
