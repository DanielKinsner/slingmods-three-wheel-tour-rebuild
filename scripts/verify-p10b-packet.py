"""Verify the retrieved Review21 ZIP and every nested data member without extracting."""
from pathlib import Path
import hashlib
import io
import json
import tarfile
import zipfile

root = Path(__file__).resolve().parents[1]
receipt = json.loads((root/'handoff/P10B-PACKET.json').read_text(encoding='utf-8'))
archive = root/'Astra-Review-21-Lean.zip'
with archive.open('rb') as stream:
    digest = hashlib.file_digest(stream, 'sha256').hexdigest()
assert archive.stat().st_size == receipt['bytes'] and digest == receipt['sha256']
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None
    names = package.namelist()
    assert len(names) == len(set(names))
    manifest = json.loads(package.read('MANIFEST.json'))
    assert set(names) == set(manifest['files']) | {'MANIFEST.json'}
    for name, expected in manifest['files'].items():
        data = package.read(name)
        assert len(data) == expected['bytes'] and hashlib.sha256(data).hexdigest() == expected['sha256'], name
    index = json.loads(package.read('verification/DATA-INDEX.json'))
    expected_members = {entry['member']: entry for entry in index.values()}
    assert len(expected_members) == len(index)
    seen = set()
    verified_payloads = {}
    with tarfile.open(fileobj=io.BytesIO(package.read('verification/P10B-complete-data.tar.xz')), mode='r:xz') as data_archive:
        for member in data_archive:
            assert (member.isfile() or member.islnk()) and member.name in expected_members and member.name not in seen
            if member.islnk():
                assert member.linkname in seen and expected_members[member.name]['hardlinkTarget'] == member.linkname
                # The stored target bytes were already independently hashed.
                # Validate the actual link rather than seeking backward through
                # the compressed stream and re-decoding identical bytes.
                length, member_digest = verified_payloads[member.linkname]
            else:
                data = data_archive.extractfile(member).read()
                length, member_digest = len(data), hashlib.sha256(data).hexdigest()
            expected = expected_members[member.name]
            assert length == expected['memberBytes'] and member_digest == expected['memberSHA256'], member.name
            verified_payloads[member.name] = (length, member_digest)
            seen.add(member.name)
    assert seen == set(expected_members)
print(json.dumps({'pass': True, 'file': archive.name, 'bytes': archive.stat().st_size, 'sha256': digest, 'zipMembers': len(names), 'completeDataMembers': len(seen), 'packagingCommit': manifest['packagingCommit'], 'runtimeCommit': manifest['runtimeCommit']}, indent=2))
