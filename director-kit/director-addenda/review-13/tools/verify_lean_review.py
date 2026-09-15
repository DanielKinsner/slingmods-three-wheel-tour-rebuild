#!/usr/bin/env python3
"""Read-only lean-review archive contract validator; not a gameplay/quality test."""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import stat
import sys
import zipfile
from pathlib import Path, PurePosixPath

TARGET = 60_000_000
CAP = 100_000_000
REQUIRED = {
    'REVIEW-ME-FIRST.md', 'RESUME.md', 'SOURCE-SNAPSHOT.json',
    'BULK-ASSET-INDEX.json', 'EVIDENCE-INDEX.json', 'REVIEW-MANIFEST.json',
    'package.json', 'package-lock.json',
}
FORBIDDEN = {'.git', 'node_modules', '.tools', 'dist', 'browser-profile', '__pycache__'}


def validate(path: Path, cap: int = CAP) -> dict:
    """Raise ValueError for a malformed archive. Never extract or mutate it."""
    if not path.is_file():
        raise ValueError(f'Not a file: {path}')
    size = path.stat().st_size
    if size > cap:
        raise ValueError(f'Archive {size:,} bytes exceeds delivery budget {cap:,}')
    with zipfile.ZipFile(path) as archive:
        entries: dict[str, zipfile.ZipInfo] = {}
        for item in archive.infolist():
            name = item.filename
            parts = PurePosixPath(name).parts
            if (not name or name.startswith('/') or '\\' in name or ':' in name
                    or any(p in ('..', '.') for p in name.rstrip('/').split('/'))
                    or any(not p for p in name.rstrip('/').split('/'))):
                raise ValueError(f'Unsafe/noncanonical path: {name!r}')
            if any(p in FORBIDDEN or p == '.env' or p.startswith('.env.') for p in parts):
                raise ValueError(f'Excluded path in review ZIP: {name}')
            if stat.S_ISLNK((item.external_attr >> 16) & 0xFFFF):
                raise ValueError(f'Symlink not permitted: {name}')
            if item.flag_bits & 1:
                raise ValueError(f'Encrypted entry not permitted: {name}')
            if item.is_dir():
                continue
            if name in entries:
                raise ValueError(f'Duplicate file: {name}')
            entries[name] = item
        missing = REQUIRED - entries.keys()
        if missing:
            raise ValueError(f'Missing required files: {sorted(missing)}')
        if not any(n.startswith('src/') for n in entries) or not any(n.startswith('tests/') for n in entries):
            raise ValueError('Complete small src/ and tests/ trees are required')
        # Safety bound for mistaken/bomb-like input; normal lean evidence is far smaller.
        if sum(i.file_size for i in entries.values()) > 4_000_000_000:
            raise ValueError('Uncompressed payload exceeds 4GB inspection safety bound')
        for name in ('SOURCE-SNAPSHOT.json', 'BULK-ASSET-INDEX.json', 'EVIDENCE-INDEX.json'):
            data = json.loads(archive.read(name))
            if not isinstance(data, dict) or data.get('schemaVersion') != 1:
                raise ValueError(f'{name}: expected object with schemaVersion=1')
        manifest = json.loads(archive.read('REVIEW-MANIFEST.json'))
        if not isinstance(manifest, dict) or manifest.get('schemaVersion') != 1 or not isinstance(manifest.get('files'), list):
            raise ValueError('Manifest must have schemaVersion=1 and files array')
        listed: set[str] = set()
        for row in manifest['files']:
            if not isinstance(row, dict):
                raise ValueError('Manifest file rows must be objects')
            name = row.get('path')
            if not isinstance(name, str) or name in listed or name == 'REVIEW-MANIFEST.json':
                raise ValueError(f'Invalid or duplicate manifest path: {name!r}')
            listed.add(name)
            if name not in entries:
                raise ValueError(f'Manifest file absent from ZIP: {name}')
            if type(row.get('bytes')) is not int or row['bytes'] < 0 or row['bytes'] != entries[name].file_size:
                raise ValueError(f'Size mismatch: {name}')
            digest = row.get('sha256')
            if not isinstance(digest, str) or not re.fullmatch('[0-9a-f]{64}', digest):
                raise ValueError(f'Invalid SHA-256: {name}')
            if row.get('category') not in {'source','report','timing','image','video','metadata','other'}:
                raise ValueError(f'Missing/invalid category: {name}')
            actual = hashlib.sha256()
            with archive.open(name) as handle:
                for chunk in iter(lambda: handle.read(1024 * 1024), b''):
                    actual.update(chunk)
            if actual.hexdigest() != digest:
                raise ValueError(f'SHA-256 mismatch: {name}')
        if listed != entries.keys() - {'REVIEW-MANIFEST.json'}:
            raise ValueError(f'Unlisted ZIP files: {sorted(entries.keys() - listed - {"REVIEW-MANIFEST.json"})}')
    return {'contract': 'PASS', 'zipBytes': size, 'targetBytes': TARGET,
            'deliveryCapBytes': cap, 'withinTarget': size <= TARGET,
            'hashedFiles': len(listed),
            'limits': 'Does not validate evidence truth, completeness, quality, secret content or bulk-file recovery.'}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(validate(args.archive), indent=2))
        return 0
    except (ValueError, OSError, zipfile.BadZipFile, KeyError, TypeError) as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
