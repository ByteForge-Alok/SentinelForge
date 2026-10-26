# SentinelForge

**An AI-assisted software repair and verification platform prototype.**

SentinelForge demonstrates an evidence-driven workflow for investigating software failures, proposing a repair, requiring human approval, applying the approved repair in an isolated working copy, and verifying the outcome with automated tests.

The goal is simple: **don't just propose a fix — collect evidence and verify that it works.**

> **Project status:** Working prototype. The current implementation uses deterministic investigation and an allow-listed repair for a known Python bug scenario. It is not yet powered by an integrated AI model, and its workspace isolation is not a production-grade security boundary.

## Key Features

- **Incident Creation:** Create incidents from supported software failure scenarios.
- **Baseline Testing:** Run automated tests to establish the initial failure.
- **Evidence-Driven Investigation:** Collect failure evidence and produce a deterministic diagnosis.
- **Patch Proposal:** Generate a proposed repair for the supported scenario.
- **Human Approval Gate:** Require explicit approval before applying the repair.
- **Post-Repair Verification:** Run automated tests after the approved patch is applied.
- **Persistent Incident History:** Store incident records in SQLite and retain local incident workspaces.
- **Interactive Dashboard:** Monitor incident status and progress through the repair workflow.
- **Incident Reports:** Export incident information as text reports.
- **REST API:** Expose the repair workflow through a FastAPI backend.

## How It Works

SentinelForge follows a controlled repair lifecycle:

1. **Create an incident** from a supported failure scenario.
2. **Run baseline tests** to reproduce and document the failure.
3. **Investigate the failure** and record diagnostic evidence.
4. **Propose a patch** for the identified issue.
5. **Request human approval** before applying the proposed change.
6. **Apply the approved patch** in the incident's working copy.
7. **Run verification tests** to determine whether the repair succeeds.
8. **Review the results** through the dashboard or incident report.

The prototype demonstrates this workflow using a known Python authentication bug. The baseline test suite fails, the supported repair is proposed and approved, and the subsequent verification tests pass.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Python, FastAPI |
| Testing | pytest |
| Persistence | SQLite |
| API Documentation | OpenAPI / Swagger UI |
| Version Control | Git and GitHub |

## Architecture

```text
User
 |
 v
React Dashboard
 |
 v
FastAPI Backend
 |
 v
SentinelForge Engine
 |
 +--> Incident Management
 |
 +--> Baseline Test Execution
 |
 +--> Failure Investigation
 |
 +--> Patch Proposal
 |
 +--> Human Approval
 |
 +--> Patch Application
 |
 +--> Post-Repair Verification
 |
 +--> SQLite Incident Persistence
 |
 v
Incident Results and Reports
```

The frontend communicates with the backend through REST API endpoints. The backend engine manages incidents, executes tests, records workflow state, and retains incident data locally.

## Project Structure

```text
SentinelForge/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   └── engine.py
│   ├── fixtures/
│   │   └── buggy_app/
│   ├── tests/
│   ├── pytest.ini
│   └── requirements.txt
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ACCEPTANCE_TESTS.md
│   └── BUILD_PLAN.md
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── index.html
├── .gitignore
└── README.md
```

Runtime incident databases and working copies are generated locally under `backend/data/` and are excluded from version control.

## Requirements

Before running SentinelForge, install:

- Python 3.11 or newer recommended.
- Node.js and npm.
- Git.
- Internet access for the initial dependency installation.

The commands below use Windows PowerShell.


## Hindsight incident memory

SentinelForge now has an optional **real Hindsight integration** for recalling prior engineering incidents during investigation and retaining an outcome only after the post-patch tests pass. The dashboard displays the recall result and retention status; it does not fabricate sample memories.

### Configure Hindsight Cloud

1. Create/configure a Hindsight Cloud API key using the official [Hindsight docs](https://hindsight.vectorize.io/).
2. In `backend`, copy `.env.example` to `.env` and set `HINDSIGHT_API_KEY` to your own key. Do not commit `.env` or share the key in screenshots.
3. Install backend dependencies and restart the API so it reads the environment:

   ```powershell
   cd backend
   Copy-Item .env.example .env
   # Edit .env and set HINDSIGHT_API_KEY before continuing.
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

   If your virtual environment is not already created, create it with `python -m venv .venv` first.
4. Open the dashboard, create an incident, and run **Investigate evidence**. The Hindsight panel shows actual recall status and any returned memories.
5. Approve the proposed patch and run verification. Only a passing verification result is sent to Hindsight as a verified-outcome memory.

Configuration uses `HINDSIGHT_BASE_URL` (default `https://api.hindsight.vectorize.io`) and `HINDSIGHT_BANK_ID` (default `sentinelforge-engineering`). The API endpoint `/api/memory/status` reports whether the client is configured. Without a key, the repair workflow still runs, but Hindsight memory calls are explicitly marked as not configured. A configured client alone does not prove a successful remote call; check the incident's displayed recall/retention status.

The implementation follows Hindsight's documented Python client operations (`create_bank`, `recall`, and `retain`): [Python SDK guide](https://docs.hindsight.vectorize.io/cloud/python-sdk/).

## Installation and Setup

### 1. Clone the Repository

Clone the public repository:

```powershell
git clone https://github.com/ByteForge-Alok/SentinelForge.git
cd SentinelForge
```

If you already have the project, open your existing `D:\sentinelforge` folder in VS Code instead.

### 2. Set Up the Backend

From the project root, run:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If PowerShell blocks virtual environment activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

This changes the execution policy only for the current PowerShell process.

### 3. Start the Backend

From the `backend` directory, with the virtual environment activated, run:

```powershell
uvicorn app.main:app --reload --reload-dir app
```

The backend should be available at:

- **API base URL:** http://127.0.0.1:8000
- **Interactive API documentation:** http://127.0.0.1:8000/docs
- **Health endpoint:** http://127.0.0.1:8000/api/health

Keep this terminal running.

### 4. Set Up the Frontend

Open a second terminal in VS Code and run:

```powershell
cd D:\sentinelforge\frontend
npm install
npm run dev
```

Vite will display the local development URL. With the default configuration, open:

http://localhost:5173/

Keep the frontend terminal running as well.

### 5. Run the Backend Tests

Open another terminal and run:

```powershell
cd D:\sentinelforge\backend
.\.venv\Scripts\Activate.ps1
python -m pytest -q
```

The current backend test suite has passed with **2 tests passing**. A Starlette deprecation warning may appear; it is a warning, not a test failure.

The supported fixture's baseline tests intentionally demonstrate the authentication bug before the repair is applied.

## API Endpoints

The backend exposes the following endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend health |
| GET | `/api/scenarios` | List supported failure scenarios |
| POST | `/api/incidents` | Create an incident |
| GET | `/api/incidents` | List incidents |
| GET | `/api/incidents/{id}` | Retrieve an incident |
| POST | `/api/incidents/{id}/investigate` | Investigate the failure |
| POST | `/api/incidents/{id}/propose-patch` | Propose a repair |
| POST | `/api/incidents/{id}/approve-patch` | Approve the proposed repair |
| POST | `/api/incidents/{id}/verify` | Verify the repair with tests |

### Example API Workflow

Create an incident using the supported scenario:

```json
{
  "scenario_id": "login-regression"
}
```

Send this JSON body to:

```text
POST /api/incidents
```

Use the incident ID returned by the API to progress through the workflow:

```text
POST /api/incidents/{id}/investigate
POST /api/incidents/{id}/propose-patch
POST /api/incidents/{id}/approve-patch
POST /api/incidents/{id}/verify
```

Replace `{id}` with the actual incident ID. Each stage depends on the incident's current state and the preceding workflow steps.

You can explore and execute these requests interactively through the Swagger UI at http://127.0.0.1:8000/docs.

## Verification Results

The current supported demonstration follows this sequence:

| Stage | Expected result |
|---|---|
| Baseline tests | 1 failed, 2 passed |
| Investigation | Failure evidence and diagnosis recorded |
| Patch proposal | Allow-listed repair proposed |
| Human approval | Repair explicitly approved |
| Post-repair verification | 3 passed |

These results describe the current supported scenario and test fixture, not a guarantee that arbitrary software defects can be repaired automatically.

## Frontend Pages

The dashboard includes:

- **Dashboard:** View incident status and repair progress.
- **Incidents:** Browse and inspect incident history.
- **Scan:** Start an incident from a supported scenario.
- **Reports:** Review incident information and export text reports.
- **Settings:** Check backend connectivity and view prototype configuration information.

## Current Limitations

SentinelForge is a working prototype, not a production-ready autonomous repair system.

- **No integrated AI model:** Investigation and repair selection are deterministic.
- **Limited repair scope:** The implementation supports a known scenario and an allow-listed patch rather than arbitrary code changes.
- **Limited isolation:** Working copies help separate incident changes, but they are not a hardened security sandbox.
- **Limited scenario coverage:** The current test fixture does not represent the full range of real-world software failures.
- **No production deployment:** Authentication, multi-user access control, hardened execution isolation, and production operational safeguards are outside the current implementation.

These limitations define the current scope and provide a foundation for future development.

## Future Development

Potential extensions include:

- Integrating an AI model to assist with failure diagnosis and repair generation.
- Supporting more programming languages and failure scenarios.
- Introducing stronger sandboxing for test and patch execution.
- Adding patch-quality checks and regression-test generation.
- Recording richer evidence and verification artifacts.
- Adding role-based approval policies and audit trails.
- Expanding automated acceptance tests and CI workflows.

These are future goals, not claims about existing functionality.

## Documentation

Additional project documentation is available in the [`docs/`](docs/) directory:

- [Architecture](docs/ARCHITECTURE.md)
- [Acceptance Tests](docs/ACCEPTANCE_TESTS.md)
- [Build Plan](docs/BUILD_PLAN.md)

## Project Status

SentinelForge currently demonstrates an end-to-end, evidence-driven repair workflow for a supported Python bug scenario, with explicit human approval and automated post-repair verification.

**The central principle is simple: a proposed repair is not enough. The outcome must be verified.**

---

Built as a software reliability and repair prototype.
