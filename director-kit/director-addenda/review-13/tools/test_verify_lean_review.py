"""Synthetic tests only; these do not test the game or a real Review14 artifact."""
import hashlib
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from verify_lean_review import validate, REQUIRED


class ArchiveTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / 'test.zip'
        self.files = {p: b'fixture' for p in REQUIRED if p != 'REVIEW-MANIFEST.json'}
        self.files.update({'src/main.ts': b'export {};', 'tests/test.ts': b'export {};'})
        for p in ('SOURCE-SNAPSHOT.json','BULK-ASSET-INDEX.json','EVIDENCE-INDEX.json'):
            self.files[p] = b'{"schemaVersion":1}'

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, *, tamper=None, extra=None):
        rows = [{'path': p, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(),
                 'category':'other'} for p, b in self.files.items()]
        with zipfile.ZipFile(self.path, 'w', zipfile.ZIP_DEFLATED) as z:
            for p, b in self.files.items():
                z.writestr(p, b'changed' if p == tamper else b)
            z.writestr('REVIEW-MANIFEST.json', json.dumps({'schemaVersion':1,'files':rows}))
            if extra:
                z.writestr(extra, b'extra')

    def test_valid_fixture(self):
        self.write()
        self.assertEqual(validate(self.path)['contract'], 'PASS')

    def test_corrupt_member(self):
        self.write(tamper='src/main.ts')
        with self.assertRaises(ValueError):
            validate(self.path)

    def test_missing_required_file(self):
        del self.files['RESUME.md']
        self.write()
        with self.assertRaises(ValueError):
            validate(self.path)

    def test_unlisted_member(self):
        self.write(extra='extra.txt')
        with self.assertRaises(ValueError):
            validate(self.path)

    def test_unsafe_path(self):
        self.files['../escape.txt'] = b'bad'
        self.write()
        with self.assertRaises(ValueError):
            validate(self.path)

    def test_forbidden_environment_file(self):
        self.files['subdir/.env.local'] = b'not a real secret'
        self.write()
        with self.assertRaises(ValueError):
            validate(self.path)

    def test_size_budget(self):
        self.write()
        with self.assertRaises(ValueError):
            validate(self.path, cap=1)

    def test_metadata_schema(self):
        self.files['BULK-ASSET-INDEX.json'] = b'[]'
        self.write()
        with self.assertRaises(ValueError):
            validate(self.path)


if __name__ == '__main__':
    unittest.main(verbosity=2)
