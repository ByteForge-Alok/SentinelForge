# Build plan to the 27 October hackathon

## Phase 1 — Working repair workflow
- [x] One known, deliberately broken Python fixture
- [x] Baseline test run and output capture
- [x] Evidence-based diagnosis for the known fault
- [x] Proposed patch and explicit approval gate
- [x] Post-approval verification and structured result
- [x] Automated API workflow tests

## Phase 2 — Stronger engineering core
- [ ] Add persistent SQLite incident/event history
- [ ] Define typed tool contracts and bounded agent state machine
- [ ] Add log parsing and repository search tools
- [ ] Add model adapter for diagnosis/patch suggestions
- [ ] Keep generated patches untrusted until reviewed and validated
- [ ] Add a hardened execution boundary; do not treat the current temp directory as a sandbox

## Phase 3 — Evaluation and product UI
- [ ] Add 10–20 known fault scenarios if time allows
- [ ] Compare against a simple baseline under the same test conditions
- [ ] Track repair success, regression rate, evidence support, time and cost
- [ ] Build React dashboard: incident, evidence, patch diff, approval, test results
- [ ] Add architecture diagram, README walkthrough and demo script

## Phase 4 — Submission hardening
- [ ] Fresh setup test on another machine or clean environment
- [ ] Full demo rehearsal and backup recording
- [ ] Confirm event rubric, team rules and deliverables
- [ ] Freeze features before event day
