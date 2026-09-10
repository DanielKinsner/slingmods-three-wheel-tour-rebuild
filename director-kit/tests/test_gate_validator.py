"""Synthetic fixtures only. These tests do NOT test or approve the game."""
from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

script = Path(__file__).resolve().parents[1] / "tools/check_gate.py"
spec = importlib.util.spec_from_file_location("check_gate", script)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class EvidenceIntegrityTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.config = {"gates":[
            {"id":"G0","depends_on":[],"criteria":[{"id":"fixture","description":"Synthetic only"}]},
            {"id":"G1","depends_on":["G0"],"criteria":[{"id":"fixture","description":"Synthetic only"}]}
        ]}
        self.write("production/gates.json", self.config)
        artifact = self.root / "synthetic.log"
        artifact.write_text("SYNTHETIC UNIT TEST FIXTURE - NOT GAME EVIDENCE\n")
        self.review = {
            "gate_id":"G0","decision":"PASS","build_ref":"synthetic-test-fixture",
            "reviewed_at":"2026-09-10T12:00:00-07:00","implementer_id":"test-writer",
            "reviewer_id":"test-reviewer","review_mode":"independent_subagent","blockers":[],
            "criteria":{"fixture":{"status":"PASS","reason":"Examined synthetic test fixture only.","evidence_ids":["fixture-file"]}},
            "evidence":[{"id":"fixture-file","kind":"test_log","path":"synthetic.log",
                         "description":"Synthetic test data, not game evidence.","sha256":module.sha256(artifact)}]
        }
    def write(self, name, obj):
        p = self.root/name; p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text(json.dumps(obj))
    def save(self, review=None):
        value = review or self.review
        self.write(f"production/evidence/{value['gate_id']}/review.json", value)
    def errors(self, gid="G0"):
        return module.validate_gate(self.root,gid)
    def test_missing_manifest_does_not_pass(self):
        self.assertTrue(self.errors())
    def test_valid_synthetic_manifest(self):
        self.save(); self.assertEqual(self.errors(),[])
    def test_pending_decision_rejected(self):
        self.review["decision"]="PENDING"; self.save(); self.assertTrue(self.errors())
    def test_hash_change_rejected(self):
        self.save(); (self.root/"synthetic.log").write_text("changed")
        self.assertTrue(any("mismatch" in x for x in self.errors()))
    def test_empty_file_rejected(self):
        self.save(); (self.root/"synthetic.log").write_text("")
        self.assertTrue(self.errors())
    def test_criterion_needs_evidence(self):
        self.review["criteria"]["fixture"]["evidence_ids"]=[]; self.save()
        self.assertTrue(self.errors())
    def test_dependency_cannot_be_skipped(self):
        child=deepcopy(self.review); child["gate_id"]="G1"; self.save(child)
        self.assertTrue(any("G0" in x for x in self.errors("G1")))
    def test_complete_dependency_chain(self):
        self.save(); child=deepcopy(self.review); child["gate_id"]="G1"; self.save(child)
        self.assertEqual(self.errors("G1"),[])
    def test_traversal_rejected(self):
        self.review["evidence"][0]["path"]="../outside.log"; self.save()
        self.assertTrue(any("escapes" in x for x in self.errors()))
    def test_independent_reviewer_must_differ(self):
        self.review["reviewer_id"]=self.review["implementer_id"]; self.save()
        self.assertTrue(self.errors())
    def test_same_agent_requires_disclosure(self):
        self.review["review_mode"]="separate_pass_same_agent"; self.save()
        self.assertTrue(self.errors())
        self.review["review_limitation"]="A separate review pass by the same agent, not independent."; self.save()
        self.assertEqual(self.errors(),[])
    def test_blocker_prevents_pass(self):
        self.review["blockers"]=["Unresolved issue"]; self.save(); self.assertTrue(self.errors())
    def test_unknown_gate_rejected(self):
        with self.assertRaises(ValueError): self.errors("G99")
    def test_cycle_rejected(self):
        self.config["gates"][0]["depends_on"]=["G1"]
        self.write("production/gates.json", self.config)
        with self.assertRaises(ValueError): self.errors("G1")
    def test_missing_criterion_rejected(self):
        self.review["criteria"]={}; self.save(); self.assertTrue(self.errors())
    def test_malformed_review_rejected(self):
        self.write("production/evidence/G0/review.json",[])
        self.assertTrue(self.errors())

if __name__ == "__main__": unittest.main()
