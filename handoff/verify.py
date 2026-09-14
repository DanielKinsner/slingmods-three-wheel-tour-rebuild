"""Read-only handoff checks; run from any clone root with Python 3."""
from pathlib import Path
import hashlib
import json
import subprocess

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'handoff/TRANSFER-MANIFEST.json').read_text(encoding='utf-8'))
frozen = json.loads((root / 'director-kit/production/evidence/P06B/build-inputs-verified.json').read_text(encoding='utf-8'))
line_endings = json.loads((root / 'handoff/LINE-ENDING-REFERENCE.json').read_text(encoding='utf-8'))['files']
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
    if path in line_endings and not path.startswith('director-kit/production/evidence/'):
        lf = data.replace(b'\r\n', b'\n')
        reference = line_endings[path]
        if reference['originalSHA256'] == expected and hashlib.sha256(lf).hexdigest() == reference['normalizedLFSHA256']:
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
