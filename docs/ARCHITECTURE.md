# SentinelForge architecture (starter)

```text
Browser / API client
        |
        v
FastAPI routes (app/main.py)
        |
        v
SentinelForgeEngine (app/engine.py)
  |      |          |             |
  |      |          |             +--> Structured incident result
  |      |          +--> Allow-listed patch + explicit approval gate
  |      +--> Evidence-based deterministic diagnosis
  +--> Copy known fixture into per-incident temporary workspace
        |
        v
pytest subprocess with timeout
        |
        v
Baseline + post-patch verification outputs
```

## Current implementation boundaries

- The current investigator is deterministic and recognizes one known fault. It is not yet an LLM-powered autonomous agent.
- The proposed patch is a fixed, allow-listed diff. The approval endpoint applies only that exact change to a temporary copy.
- Test execution uses a subprocess and timeout, but a temporary directory is not a secure sandbox. The fixture is trusted demo code; do not run untrusted repositories with this starter.
- Incident state is in memory and resets when the API process restarts.

## Intended next architecture increments

1. Persist incidents and event history with SQLite.
2. Add typed tool interfaces for reading files, searching source, parsing logs and running approved tests.
3. Add a model-provider adapter that returns structured hypotheses and patch proposals, with schema validation and bounded tool calls.
4. Put candidate execution behind a dedicated sandbox service with strict resource and network controls.
5. Add a React + TypeScript dashboard that displays evidence, diffs, approvals and test results.
6. Add a fault-suite runner and baseline comparison report.
