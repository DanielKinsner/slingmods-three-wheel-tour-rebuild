from pathlib import Path
import json,datetime
R=Path(__file__).resolve().parents[1];E=R/'director-kit/production/evidence/P07A'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
summary=read(E/'performance-summary.json');final=[r for r in summary['runs'] if '/verified-scored-'in r['path'] or '/day-scored-'in r['path']]
assert len(final)==6 and sum(len(r['attempts'])for r in final)==7
native=read(E/'native-final-02/report.json');hard=read(E/'hardening-final/report.json');output=read(E/'output-fetch-verification.json');audio=read(E/'video-final-02/audio-video-verification.json')
assert native['complete'] and hard['complete'] and output['pass'];assert audio['nonfiniteSamples']==0
runtime=read(E/'final-build.json');manifest=read(E/'final-output-manifest.json');ok=all(r['targetMet']for r in final)
verdict='LOCAL DEMO READY'if ok else'NOT SHARE-READY — performance HOLD'
lines=[]
for r in final:
 for a in r['attempts']:
  s=a['intervals'];lines.append(f"| {Path(r['path']).parent.name} / {a['attempt']} | {s['p95']:.3f} | {s['p99']:.3f} | {s['max']:.3f} | {s['over100']} | {'PASS'if a['targetMet']else'HOLD'} |")
before=read(E/'loading-before/loading.json');after=read(E/'loading-after/loading.json');loading=[]
for old,new in zip(before['runs'],after['runs']):
 loading.append({'warm':old['warm'],'beforeMs':old['elapsedWallMs'],'afterMs':new['elapsedWallMs'],'beforeTransferBytes':sum(r['transferSize']for r in old['resources']),'afterTransferBytes':sum(r['transferSize']for r in new['resources'])})
(E/'loading-comparison.json').write_text(json.dumps({'method':'Unthrottled localhost cold fresh browser/context and same-page warm reload. OS/driver cache not reset. Single observed comparison per phase, not an internet/causal/universal startup claim. Exact garage dependency extraction removes 21,306,148 file bytes. Landing defers every GLB/HDR until a scene is selected.','rows':loading},indent=2))
text=f'''# Review14 — P07A Shareable Showcase

**REVIEW-ONLY / NON-PLAYABLE ZIP.** The complete editable project, required binaries and original captures remain in the indexed local checkout. This ZIP contains source, reports, complete relevant timing and selected compressed visual evidence; it is neither a backup nor a standalone Blender/playable reproduction.

## Verdict: {verdict}

Runtime `{runtime['commit']}`; packaging `PACKAGING_COMMIT_AT_DELIVERY`. Actual starting point `6f473ee7d25869c0c4c4fa2462da652150adb949` on main. Both new identities are LOCAL_ONLY; no new remote availability query or push. `SOURCE-SNAPSHOT.json` identifies exact trees, current source hashes and recovery. Pre-existing untracked `P06C-HOME-KICKOFF.md` remains untouched and excluded; no other intended uncommitted work remains at packaging.

The existing P06C world is retained. New explicit Development Preview offers real crew racing, garage, daylight and existing career. A versioned per-tab demo profile separates prepared kit/unlocks, rewards, settings and records from personal career. Original race/reward/physics semantics remain. Actual SlingMods artwork appears on the garage, gantry and two service fronts. Shop This Build names TricLED SM-133 base Kit #1, 2024 Slingshot R, cosmetic effect and excluded add-ons, with a deliberate safe HTTPS link to the verified first-party listing. No prices, backend or storefront mutations.

Exact bay extraction reduces its GLB from 28,974,372 to 7,668,224 bytes without mesh/material/image recompression. The separate static output contains {manifest['bytes']:,} payload bytes plus its inventory; public asset allowlist includes required collision and complete audio dependencies. Runtime size and the lean review ZIP budget are different.

## Validation

- Final pinned installed suite: 134/134 passed; normal production and demo builds passed. Full logs included. Existing large-JS-chunk warnings are retained.
- Final static hardening: 11/11 passed, including missing model/HDR/JS/audio, sound retry, actual WebGL loss, disabled WebGL, inert recovery focus and browser Back. Ordinary 720p keyboard/menu/product-return checks pass without scene hooks; native report distinguishes actual popup/network result, explicit fault injection and physical-device limits.
- Protected comparison: 299 baseline files exact, 15 declared frontend/profile/loading/catalog seams. All source vehicle/rear/driver, route/collision, simulation/rivals, reward/store core remain exact. A 4,200-tick solo replay byte-identical. New signs are visual-only with zero colliders/lights/shadows; exact corner and route-clearance measurements included.
- Actual three-rival races complete two laps and results/retry/garage. One sampled early player/Nico order change appears across the six final races; the other traces do not show sustained passing after three seconds. Deterministic blocked-line/contact scenarios report actual positions, not AI intent counters. No fabricated podium or AI retune.

## Final native timing — each attempt, no pooling

| Configuration / attempt | p95 ms | p99 ms | max ms | active >100ms | Result |
| --- | ---: | ---: | ---: | ---: | --- |
{chr(10).join(lines)}

Standard quality, DPR1, actual 1280 x 720 or 1920 x 1080 buffer, Chromium 153 / RTX 4080 ANGLE-D3D11, audio graph enabled and host output muted, native RAF, isolated ordinary virtual device samples, no recording in scored runs. Thresholds p95<=20ms/p99<=33.4ms/no active interval >100 ms, tolerance1e-6ms. `performance-summary.json` retains exact values; every original row/event/phase remains in run.json. CPU submission durations are not GPU time.

Historical P06C second-race p95=33.3ms failures remain included. Two exact-frozen-P06C repeat contexts and the final repeat meet targets under their observed host conditions. This supports **not reproduced under these observations**, not a proven causal repair. Unrelated processes were not stopped or changed. Time-aligned 2-second nominal aggregate process/global CPU samples, interval and collector overhead are retained. Initial preflight process deltas rounded to zero because a PowerShell overload used integer 0; corrected to 0.0 before accepted baseline measurements. That unsuccessful preflight remains, with no process-attribution claim. Startup/non-racing spikes and shader transitions remain separate open observations, not silently counted as solved.

## Internal repairs and limits

Initial ordinary click timeouts were retained; explicit D3D11 follow-up did not establish a definitive original cause. It exposed an omitted audio bank in the first staging allowlist. Complete metadata and nine WAVs plus closure regressions repaired that omission; unchanged audio implementation then passed retry and capture. Independent review prompted a gauge-overlap and narrow-support-note fix. Close-up sign inspection exposed two service planes behind their mounting band; moving them to the spare visible band fixed placement without changing building geometry. Original failures/assets/captures remain local and indexed. A native-test poll initially read camera settings before the next frame wrote them; a null-safe wait fixed the harness. The first movie take was stopped early after detecting a harness wait for a hidden chapter button; the successful fresh take waits for the product panel. The original network classifier grouped same-origin blob image decodes as external; network-closure.json corrects that interpretation without rewriting raw responses.

G3/G4, the wider environmental visual target, human playtesting, subjective engine/listening approval, physical controllers, mobile driving and broad-browser certification remain held. Scenery repetition/dark inherited facades and an inherited mojibake dash in the sound-retry copy are documented polish debt. These claims are distinct from local automated acceptance. No deployment, cloud upload, account linking, spending, remote change or desktop takeover occurred.

## Local launch and recovery

On this complete checkout, run `npm run demo:preview`, then open `http://127.0.0.1:5188/`. It serves `{manifest['output']}` via demo-current.json. For a recovered complete checkout with indexed binaries: `npm ci`, `npm run demo:build`, `npm run demo:preview`. The lean ZIP alone cannot run. Paths resolve relative to the recovered checkout; originating usernames are provenance only. `DEPLOYMENT-READINESS.md` records exact output, cache/base-path rules, tested routes and a proposed isolated target. External publication/smoke testing needs separate authorization.

## Evidence map

- `director-kit/production/evidence/P07A/final-build.json`, final-output-manifest.json, output-fetch-verification.json: frozen source/output and actual fetched bytes.
- `performance-summary.json`, baseline-repeat*/run.json, verified-scored*/run.json, day-scored*/run.json, *-host.jsonl and P06C historical failures: complete timing and provenance.
- `preservation.json`, bay-extraction.json, sign-clearance.json, field-verification.json, demo-contract.md and hardening/native reports: bounded contracts and observed behavior.
- `review-images/`: 13 selected final stills. Stationary sign inspection explicitly hides ready modal and disables fog; those images are not driving proof.
- `review-media/showcase-LIVE-AUDIO.mp4`: continuous 720p, 25 fps ordinary entry→actual race→result→garage. Explicit same-scene test/profile reload enables disclosed virtual input/livegraph recording; no controlled clock, cut race, speed-up, replacement soundtrack or invented result. Three disclosed sync chirps/flashes and one constant audio shift verified. Original Playwright video/audio, video-only master, upload hashes and encoding metadata retained in EVIDENCE-INDEX and video-final-02 receipts. Recording overhead is excluded from acceptance timing.
- `independent-review-integration.md` and `independent-review-final.md`: separate review with actual image/motion/performance limits.
- `SOURCE-SNAPSHOT.json`, `BULK-ASSET-INDEX.json`, `EVIDENCE-INDEX.json`, `REVIEW-MANIFEST.json`: exact local recovery and review selection. No remote fetchability assumed.

Stop after this Review14 delivery; no automatic next milestone or P06C restart.
'''
(E/'REVIEW-ME-FIRST.md').write_text(text,encoding='utf-8')
state=read(R/'director-kit/production/state.json');state.update(as_of=datetime.datetime.now(datetime.timezone.utc).isoformat(),commit=runtime['commit'],current_packet='P07A Shareable Showcase — Review14',next_action='Review14 delivered for director review; await next explicit packet. No automatic implementation/deployment.',demo_readiness=verdict)
state['blockers']=['G3/G4 and global environmental art remain pending.','Publication/account linking/spending not authorized.','Historical repeat slowdown not reproduced in observed baseline/final contexts; original cause unproven.']
(R/'director-kit/production/state.json').write_text(json.dumps(state,indent=2),encoding='utf-8')
(R/'RESUME.md').write_text(f'# P07A / Review14 return point\n\nVerdict: {verdict}. Frozen runtime {runtime["commit"]}. Full source and binaries retained in this checkout; required authority remains director-kit/director-addenda/review-13/CODEX_NEXT.md. Read director-kit/production/evidence/P07A/REVIEW-ME-FIRST.md and the Review14 root indexes for evidence, exact packaging identity and LOCAL_ONLY recovery. User kickoff preserved.\n\nLocal launch: npm run demo:preview → http://127.0.0.1:5188/. For recovered complete checkout: npm ci; npm run demo:build; npm run demo:preview. Lean ZIP is review-only/non-playable. Discovered machine paths in receipts are provenance, not required next-machine paths.\n\nP07A implemented, internally repaired, independently reviewed and validated. G3/G4/global art/human and physical-controller approval remain held; original historical slowdown cause unproven, observed repeats/final matrix meet targets when verdictREADY. No deployment/push/account changes authorized. Stop and await director Review14 or an explicit new assignment; do not restart P06C or rerun kickoff.\n',encoding='utf-8')
print(verdict)
