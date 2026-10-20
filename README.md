# SentinelForge

**An evidence-driven software repair prototype.** SentinelForge reproduces a known bug, records evidence, proposes a patch, requires explicit approval, runs tests in a separate working copy, and reports the actual verification result.

> Current scope: this is a deterministic prototype with one allow-listed Python fault scenario. The AI model adapter, persistent storage, secure production-grade sandbox, and React dashboard are not implemented yet. Do not point it at production code or treat its demo execution model as a security boundary.

## What works in this starter

- FastAPI backend and interactive API docs.
- A deliberately broken sample Python application.
- Baseline test execution at incident creation.
- Evidence-linked deterministic investigation for the known scenario.
- A proposed patch that is not applied until the approval endpoint is called.
- Test execution after approval and a structured status report.
- Automated tests for the complete workflow and approval gate.

## Requirements

- Python 3.11 or newer recommended.
- Internet connection for the initial dependency installation.

## Windows PowerShell: run it

1. Extract the project folder to a location such as `D:\SentinelForge`.
2. Open that folder in VS Code.
3. In VS Code, choose **Terminal → New Terminal**.
4. Move into the backend folder:

   ```powershell
   cd backend
   ```

5. Create a virtual environment:

   ```powershell
   py -m venv .venv
   ```

6. Activate it:

   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

   If PowerShell blocks activation, use this for the current terminal only:

   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\.venv\Scripts\Activate.ps1
   ```

7. Install dependencies:

   ```powershell
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

8. Run the API:

   ```powershell
   uvicorn app.main:app --reload
   ```

9. Open `http://127.0.0.1:8000/docs` in your browser. Use the API docs to try the workflow below.

## Demo workflow in `/docs`

Call these endpoints in order:

1. `GET /api/health` — confirm the API is running.
2. `GET /api/scenarios` — see the supported scenario.
3. `POST /api/incidents` with body `{"scenario_id":"login-regression"}` — creates a separate workspace and runs the baseline tests. The baseline should fail because one test exposes the known bug.
4. Copy the returned `id` into the path parameter for the following calls.
5. `POST /api/incidents/{id}/investigate` — inspect the evidence-backed diagnosis.
6. `POST /api/incidents/{id}/propose-patch` — review the patch. It remains pending approval.
7. Try `POST /api/incidents/{id}/verify` before approval. It should be rejected.
8. `POST /api/incidents/{id}/approve-patch` — explicitly approve the allow-listed patch.
9. `POST /api/incidents/{id}/verify` — run tests after the repair. Expected result: `verification_status` is `passed`, and the output reports three passing tests.

## Run the backend tests

From the `backend` folder with the virtual environment active:

```powershell
python -m pytest -q
```

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/ACCEPTANCE_TESTS.md`](docs/ACCEPTANCE_TESTS.md), and [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md).

## Safety notes

- The starter only applies one exact, allow-listed patch to its copied fixture.
- It does not accept arbitrary shell commands or arbitrary patch text from API clients.
- It uses a temporary workspace per incident; this is useful for a prototype, not a production isolation guarantee.
- Before running untrusted code, use a properly hardened sandbox with strict network, filesystem, process, CPU, memory, and time limits.
- Keep API keys in environment variables; never commit secrets.
