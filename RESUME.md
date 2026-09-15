# P07B local preflight / complete remote handoff

Read HANDOFF.md (including NEW-MACHINE RESUME PROMPT), AGENTS.md, handoff/P07B-VALIDATION.json and director-kit/director-addenda/review-14/CODEX_NEXT.md. P07A accepted by Review14; existing source/assets preserved. P07B local delivery and fresh remote clone validation are complete. Tested commit886a0d41d87320b87ea4458f8f261ad07f637ac6; receipt-only follow-up commits preserve runtime. Read the validation receipt for full remote-recovery proof, retained failures and exact local server identities.

Fresh checkout: python handoff/verify-current.py; npm ci; npm test; npm run build; npm run demo:build; npm run demo:preview. Local address http://127.0.0.1:5188/. Optional local publication stage: npm run demo:stage; npm run demo:stage:preview at http://127.0.0.1:5189/.

Next: separately authorized P07B publication to an eligible isolated target, then actual HTTPS verification. Hosting authorization/access is pending. Git handoff to private main is explicitly authorized; no deployment/spending/account changes. Do not restart P06C/P07A or advance G3/G4.
