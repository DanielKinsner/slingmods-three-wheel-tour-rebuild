#!/usr/bin/env python3
"""Validate gate-review evidence integrity, not game quality or factual truth.

Python 3.10+, standard library only. Read-only: no mutation, network, or shell calls.
Exit 0 = complete PASS manifest with intact evidence/dependencies;
exit 1 = not ready/invalid evidence; exit 2 = malformed configuration/CLI error.
"""
from __future__ import annotations
import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re
import sys
from typing import Any

KINDS = {"runtime_image", "runtime_video", "test_log", "telemetry", "source_manifest", "diff"}
MODES = {"independent_subagent", "separate_pass_same_agent", "human"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_object(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as stream:
        obj = json.load(stream)
    if not isinstance(obj, dict):
        raise ValueError(f"Expected JSON object: {path.name}")
    return obj


def meaningful(value: Any) -> bool:
    return (isinstance(value, str) and bool(value.strip())
            and not any(token in value.upper() for token in ("REPLACE_WITH", "NOT_RUN", "NOT RUN", "TBD")))


def validate_gate(root: Path, gate_id: str) -> list[str]:
    """Return errors. An empty list does not establish authenticity or aesthetic quality."""
    root = root.resolve()
    config = read_object(root / "production/gates.json")
    rows = config.get("gates")
    if not isinstance(rows, list) or not rows:
        raise ValueError("gates.json must contain a nonempty gates list")
    gates: dict[str, dict[str, Any]] = {}
    for row in rows:
        if not isinstance(row, dict) or not re.fullmatch(r"G\d+", str(row.get("id", ""))):
            raise ValueError("Gate ID must be G followed by digits")
        gid = row["id"]
        if gid in gates:
            raise ValueError(f"Duplicate gate: {gid}")
        deps, criteria = row.get("depends_on"), row.get("criteria")
        if not isinstance(deps, list) or not all(isinstance(x, str) for x in deps):
            raise ValueError(f"{gid}: invalid dependency list")
        if not isinstance(criteria, list) or not criteria:
            raise ValueError(f"{gid}: missing criterion definitions")
        ids = []
        for item in criteria:
            if not isinstance(item, dict) or not meaningful(item.get("id")):
                raise ValueError(f"{gid}: invalid criterion")
            ids.append(item["id"])
        if len(set(ids)) != len(ids):
            raise ValueError(f"{gid}: duplicate criterion")
        gates[gid] = row
    if gate_id not in gates:
        raise ValueError(f"Unknown gate: {gate_id}")
    errors: list[str] = []
    visited, visiting = set(), set()

    def check(gid: str) -> None:
        if gid in visited:
            return
        if gid in visiting:
            raise ValueError(f"Dependency cycle at {gid}")
        if gid not in gates:
            raise ValueError(f"Undefined dependency {gid}")
        visiting.add(gid)
        for dep in gates[gid]["depends_on"]:
            check(dep)
        visiting.remove(gid)
        visited.add(gid)
        path = root / "production/evidence" / gid / "review.json"
        if not path.is_file():
            errors.append(f"{gid}: review manifest missing (not reviewed)")
            return
        try:
            review = read_object(path)
        except (OSError, ValueError) as exc:
            errors.append(f"{gid}: unreadable review: {exc}")
            return
        if review.get("gate_id") != gid:
            errors.append(f"{gid}: review gate_id mismatch")
        if review.get("decision") != "PASS":
            errors.append(f"{gid}: decision is not PASS")
        if review.get("blockers") != []:
            errors.append(f"{gid}: blockers unresolved or not explicitly empty")
        for field in ("build_ref", "implementer_id", "reviewer_id"):
            if not meaningful(review.get(field)):
                errors.append(f"{gid}: missing actual {field}")
        try:
            stamp = datetime.fromisoformat(str(review.get("reviewed_at", "")).replace("Z", "+00:00"))
            if stamp.tzinfo is None:
                raise ValueError("timezone missing")
        except ValueError:
            errors.append(f"{gid}: reviewed_at needs an actual ISO timestamp with timezone")
        mode = review.get("review_mode")
        if mode not in MODES:
            errors.append(f"{gid}: invalid review_mode")
        if mode == "independent_subagent" and review.get("reviewer_id") == review.get("implementer_id"):
            errors.append(f"{gid}: independent reviewer cannot be the implementer")
        if mode == "separate_pass_same_agent" and not meaningful(review.get("review_limitation")):
            errors.append(f"{gid}: same-agent review limitation must be disclosed")
        evidence = review.get("evidence")
        good_ids: set[str] = set()
        seen_ids: set[str] = set()
        if not isinstance(evidence, list) or not evidence:
            errors.append(f"{gid}: no evidence list")
            evidence = []
        for item in evidence:
            if not isinstance(item, dict):
                errors.append(f"{gid}: invalid evidence record")
                continue
            eid = item.get("id")
            if not meaningful(eid) or eid in seen_ids:
                errors.append(f"{gid}: missing or duplicate evidence ID")
                continue
            seen_ids.add(eid)
            if item.get("kind") not in KINDS:
                errors.append(f"{gid}/{eid}: unsupported evidence kind")
                continue
            if not meaningful(item.get("description")):
                errors.append(f"{gid}/{eid}: explain what this artifact demonstrates")
                continue
            raw = item.get("path")
            if not isinstance(raw, str) or not raw or Path(raw).is_absolute():
                errors.append(f"{gid}/{eid}: path must be relative to kit root")
                continue
            target = (root / raw).resolve()
            if not target.is_relative_to(root):
                errors.append(f"{gid}/{eid}: evidence path escapes kit root")
                continue
            try:
                if not target.is_file() or target.stat().st_size == 0:
                    errors.append(f"{gid}/{eid}: evidence file missing or empty")
                    continue
                expected = item.get("sha256")
                if not isinstance(expected, str) or not re.fullmatch(r"[a-fA-F0-9]{64}", expected):
                    errors.append(f"{gid}/{eid}: valid SHA-256 required")
                    continue
                if sha256(target) != expected.lower():
                    errors.append(f"{gid}/{eid}: SHA-256 mismatch")
                    continue
            except OSError as exc:
                errors.append(f"{gid}/{eid}: cannot read evidence: {exc}")
                continue
            good_ids.add(eid)
        criterion_reviews = review.get("criteria")
        if not isinstance(criterion_reviews, dict):
            errors.append(f"{gid}: missing criteria object")
            criterion_reviews = {}
        required = {row["id"] for row in gates[gid]["criteria"]}
        if set(criterion_reviews) != required:
            errors.append(f"{gid}: criteria keys must exactly match the gate definition")
        for cid in sorted(required):
            result = criterion_reviews.get(cid)
            if not isinstance(result, dict) or result.get("status") != "PASS":
                errors.append(f"{gid}/{cid}: criterion not passed")
                continue
            if not meaningful(result.get("reason")):
                errors.append(f"{gid}/{cid}: specific inspection reason required")
            refs = result.get("evidence_ids")
            if (not isinstance(refs, list) or not refs
                    or not all(isinstance(x, str) and x in good_ids for x in refs)):
                errors.append(f"{gid}/{cid}: requires valid supporting evidence IDs")

    check(gate_id)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--gate", required=True)
    args = parser.parse_args()
    try:
        errors = validate_gate(args.root, args.gate)
    except (OSError, ValueError, TypeError) as exc:
        print(f"CONFIGURATION ERROR: {exc}", file=sys.stderr)
        return 2
    if errors:
        print(f"NOT READY: {args.gate}")
        for error in errors:
            print(f"  - {error}")
        return 1
    print(f"MANIFEST INTEGRITY PASS: {args.gate}")
    print("This verifies declarations/files/hashes/dependencies, NOT authenticity, aesthetics, or driving quality.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
