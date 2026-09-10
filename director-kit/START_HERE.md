# SlingMods: Three-Wheel Tour
## Fresh-start director's kit · Revision 2 · Astra / Dan Kinsner · September 10, 2026

**The assignment:** Build a NEW story-led three-wheel racing game from scratch, with an authentic vehicle garage and real SlingMods products. No code, assets, saves, or implementation obligations are inherited from yesterday's prototype. Deliver one excellent playable slice before multiplying vehicles, locations, and systems. Read `FRESH_START_POLICY.md` first.

This kit contains a design, a production contract, source-backed reference seeds, a staged work queue, and an evidence-manifest validator. **It does not contain a finished game, Blender models, runtime footage, or passed game tests.** Every game gate starts pending.

### What Dan does

Open a NEW empty project folder in Codex, named `slingmods-three-wheel-tour-rebuild`, outside the old game's Git root. Place this kit at `director-kit/` and give Codex the contents of `CODEX_KICKOFF.md`. If Codex is already open in the old project, the kickoff directs it to establish a separate fresh workspace without changing the old one. Blender should be installed; Codex locates its executable and tests exports without taking over Dan's desktop.

Do not overwrite an existing root `AGENTS.md`. The included file is a project-policy template; Codex should read existing instructions and merge a short reference to this kit where appropriate. Existing user changes and secrets must remain intact.

### Read order for the local director

1. `FRESH_START_POLICY.md` and `AGENTS.md` — clean-start scope, authority, safety, and working rules.
2. `docs/01_GAME_DESIGN.md` — the game we are making.
3. `docs/04_ORCHESTRATION.md` and `production/gates.json` — the order of work and evidence needed.
4. The current packet in `production/WORK_PACKETS.md`.
5. Only the relevant specialist document and data files for that packet.

Do not load the entire kit into every subagent. Send a small assignment, the contracts it touches, and its acceptance criteria.

### What's already known, and what is not

Yesterday's project exists, but it is out of scope as an implementation source. Its history explains the failures this process must avoid. The new project starts with new code, newly authored Blender assets, new track geometry, new story scripts, and a fresh versioned save namespace. Brand/product research and the explicitly selected creative concepts can carry forward; old source and asset bundles cannot.

`data/project.reference.json` declares a fresh project with no selected deployment target. Historical identifiers are segregated as read-only context, not permissions or default deployment settings. Leave the live storefront and all old game files, saves, and deployments untouched.

### First useful result

A recognizable 2024 Slingshot R in a small reference-lit garage, able to drive on a proper three-contact test pad, with camera and drivetrain behavior that can be reviewed. This is built incrementally through G0–G2. The first *complete game slice* at G4 adds one finished short circuit, three rivals, one story beat, three real parts, progression, and the shop-this-build loop.

This is not a request to stop after writing another plan. Execute the current packet. Do not fill future stages with placeholders and call the project complete.

### Included validator

From the kit directory, run:

```sh
python -m unittest discover -s tests -v
python tools/check_gate.py --gate G0
```

The second command should initially report **NOT READY** and return exit code 1: no game evidence exists yet. Later, a reviewer creates `production/evidence/G0/review.json` and references actual artifacts. The validator checks dependencies, evidence presence and hashes, reviewer declarations, and blockers. It **cannot judge whether a vehicle looks real, whether footage is genuine, or whether driving is fun**. A reviewer must actually inspect the evidence; a green script alone is not approval.

### Operating boundary

Astra sets the creative and technical direction in this kit. The local Codex lead executes it, reviews tools and evidence, and updates the state. This chat is not an unattended controller of a separate Codex session. No new paid service, production deployment, public asset publication, or storefront write is authorized by this kit.
