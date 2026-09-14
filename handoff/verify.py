"""Read-only handoff checks; run from any clone root with Python 3."""
from pathlib import Path
import hashlib
import json
import subprocess

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'handoff/TRANSFER-MANIFEST.json').read_text(encoding='utf-8'))
frozen = json.loads((root / 'director-kit/production/evidence/P06B/build-inputs-verified.json').read_text(encoding='utf-8'))
doc_changes = {'README.md', 'AGENTS.md', 'AUTONOMOUS_RESUME.md', '.gitignore'}
failures, normalized = [], []

def check(path, expected):
    p = root / path
    if not p.is_file():
        failures.append(path + ': missing')
        return
    data = p.read_bytes()
    if hashlib.sha256(data).hexdigest() == expected:
        return
    # Windows text checkout and Unix LF checkout can differ without content drift.
    if p.suffix in {'.ts', '.mjs', '.js', '.json', '.py', '.md', '.html', '.css', '.ps1'}:
        lf = data.replace(b'\r\n', b'\n')
        if any(hashlib.sha256(v).hexdigest() == expected for v in (lf, lf.replace(b'\n', b'\r\n'))):
            normalized.append(path)
            return
    failures.append(path + ': hash differs')

for path, value in manifest['files'].items():
    if path not in doc_changes:
        check(path, value['sha256'])
for path, sha in frozen['inputs'].items():
    check(path, sha)
result = {
    'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(),
    'frozenRuntimeCommit': frozen['commit'],
    'transferFiles': len(manifest['files']),
    'frozenInputs': len(frozen['inputs']),
    'intentionalDocumentationChanges': sorted(doc_changes),
    'lineEndingOnlyDifferences': sorted(set(normalized)),
    'failures': sorted(set(failures)),
}
print(json.dumps(result, indent=2))
raise SystemExit(bool(failures))
