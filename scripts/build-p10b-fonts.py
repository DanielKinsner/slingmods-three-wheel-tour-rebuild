"""Rebuild self-hosted Barlow Condensed from the verified, licensed TTF inputs in Git.
Requires fontTools + brotli. No network or font-system dependency.
"""
from pathlib import Path
import hashlib,json
from fontTools.ttLib import TTFont
root=Path(__file__).resolve().parents[1]
provenance=json.loads((root/'assets/fonts/barlow-condensed/PROVENANCE.json').read_text(encoding='utf-8'))
for item in provenance['files']:
    source=root/item['path']
    assert hashlib.sha256(source.read_bytes()).hexdigest()==item['sha256'],str(source)
    if 'runtime' in item:
        font=TTFont(source,recalcTimestamp=False);font.flavor='woff2';font.save(root/item['runtime'])
        assert hashlib.sha256((root/item['runtime']).read_bytes()).hexdigest()==item['runtimeSha256'],item['runtime']
print('Barlow Condensed: source, license and runtime hashes verified.')
