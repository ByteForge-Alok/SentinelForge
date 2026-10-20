# Acceptance tests

## Scenario: login regression

Fixture users: `demo-user` / `correct-horse`.

| Check | Before patch | After approved patch |
|---|---|---|
| Correct username + correct password | Fails | Passes |
| Correct username + wrong password | Passes | Passes |
| Unknown username | Passes | Passes |

## Acceptance criteria

- Creating an incident executes baseline tests and records their output.
- Baseline must fail for the expected reason; failure output must be visible.
- Investigation returns a diagnosis and evidence list.
- Patch proposal must not alter the workspace.
- Verification before approval must be rejected.
- Approval must apply only the known allow-listed change.
- Post-patch verification must report actual subprocess results.
- A verification error or timeout must never be reported as success.
- API tests must cover the complete workflow.

## Current expected result

Baseline: 1 failing test, 2 passing tests.
After patch: 3 passing tests.
