# SentinelForge

**An AI-assisted software repair and verification platform prototype.**

SentinelForge demonstrates an evidence-driven workflow for investigating software failures, proposing a repair, requiring human approval, executing the approved repair in an isolated working copy, and verifying the outcome with automated tests.

The goal is simple: **don't just propose a fix — collect evidence and verify that it works.**

> **Project status:** Working prototype. The current implementation uses deterministic investigation and an allow-listed repair for a known Python bug scenario. It is not yet powered by an integrated AI model, and its workspace isolation is not a production-grade security boundary.

## Key Features

- **Incident Creation:** Create incidents from supported failure scenarios.
- **Baseline Testing:** Run tests to establish the initial failure.
- **Evidence-Driven Investigation:** Record failure evidence and a deterministic diagnosis.
- **Patch Proposal:** Generate a proposed repair for the supported scenario.
- **Human Approval Gate:** Require explicit approval before applying the repair.
- **Post-Repair Verification:** Run automated tests after the approved patch is applied.
- **Persistent Incident History:** Store incident records in SQLite and retain incident workspaces locally.
- **Interactive Dashboard:** Monitor incident status and progress through the repair workflow.
- **Incident Management:** View and track previous incidents.
- **Repair Reports:** Review evidence and export incident reports as text files.
- **Scenario Scanning:** Select a supported scenario and create an incident.
- **Backend Health Check:** Check API availability through the dashboard.
- **Automated Testing:** Validate the repair workflow and approval gate.

## How It Works

SentinelForge follows a controlled, evidence-driven repair workflow.

1. **Create an incident** from a supported scenario.
2. **Reproduce the failure** by running baseline tests.
3. **Investigate the evidence** and record the diagnosis.
4. **Propose a patch** for review.
5. **Approve the patch** explicitly.
6. **Apply the approved repair** to the incident's working copy.
7. **Run verification tests** against the repaired copy.
8. **Review the results** and export the incident report.

Human approval separates proposing a repair from applying it, while automated verification provides evidence of the outcome.

## Demonstrated Example

The included `login-regression` scenario contains a deliberately introduced authentication bug.

| Stage | Test Results |
|---|---|
| Before repair | 1 failed, 2 passed |
| After approved repair | 3 passed, 0 failed |

The baseline test run reproduces the failure. After the proposed repair is approved and applied, the verification suite passes all three tests.

These results describe the included demonstration scenario. They do not guarantee that arbitrary software defects can be repaired automatically.

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Python
- FastAPI
- SQLite
- Pytest

## Architecture

```text
                  React Frontend
                        |
                        v
                   FastAPI API
                        |
                        v
              SentinelForge Engine
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
      Incident      Investigation   Patch Proposal
     Management       & Evidence     & Approval
          |             |             |
          +-------------+-------------+
                        |
                        v
              Approved Repair Applied
                to Working Copy
                        |
                        v
              Automated Verification
                        |
                        v
                  Test Results
                        |
                        v
                SQLite Persistence
```

## Project Structure

```text
sentinelforge/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   └── engine.py
│   ├── fixtures/
│   │   └── buggy_app/
│   ├── tests/
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ACCEPTANCE_TESTS.md
│   └── BUILD_PLAN.md
├── .gitignore
└── README.md
```

**Runtime data:** The `backend/data/` directory contains the local SQLite database and incident workspaces. It is excluded from Git and is created as needed by the backend.

## Requirements

- Python 3.11 or newer recommended.
- Node.js and npm.
- Internet access for initial dependency installation.
- Windows PowerShell commands are provided below.

## Installation and Setup

### 1. Clone the Repository

Once the project is available on GitHub, replace the placeholder with your repository URL.

```powershell
git clone <YOUR-GITHUB-REPOSITORY-URL>
cd sentinelforge
```

Alternatively, open your existing `D:\sentinelforge` folder in VS Code and open a terminal in the project directory.

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

From the `backend` directory, with the virtual environment activated:

```powershell
uvicorn app.main:app --reload --reload-dir app
```

The backend will be available at:

- **API:** http://127.0.0.1:8000
- **Interactive API documentation:** http://127.0.0.1:8000/docs
- **Health check:** http://127.0.0.1:8000/api/health

Keep this terminal running.

### 4. Set Up the Frontend

Open a **second terminal** in VS Code and run:

```powershell
cd D:\sentinelforge\frontend
npm install
npm run dev
```

Open the application at:

http://localhost:5173/

Keep both the frontend and backend running while using the application.

### 5. Run the Tests

Open another terminal and run:

```powershell
cd D:\sentinelforge\backend
.\.venv\Scripts\Activate.ps1
python -m pytest -q
```

The tests should pass when the implementation and test environment are correctly configured.

## API Workflow

The backend exposes the following endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Check backend health |
| `GET` | `/api/scenarios` | List supported scenarios |
| `POST` | `/api/incidents` | Create an incident |
| `GET` | `/api/incidents` | List saved incidents |
| `GET` | `/api/incidents/{id}` | Retrieve an incident |
| `POST` | `/api/incidents/{id}/investigate` | Investigate the incident |
| `POST` | `/api/incidents/{id}/propose-patch` | Propose a repair |
| `POST` | `/api/incidents/{id}/approve-patch` | Approve and apply the proposed repair |
| `POST` | `/api/incidents/{id}/verify` | Verify the repair with tests |

Explore and interact with the API using the Swagger documentation:

http://127.0.0.1:8000/docs

### Example Incident Request

To create an incident for the demonstration scenario, send a `POST` request to `/api/incidents` with this JSON body:

```json
{
  "scenario_id": "login-regression"
}
```

Then follow the workflow in order:

1. Investigate the incident.
2. Propose a patch.
3. Approve the proposed patch.
4. Verify the result.

Verification before approval should be rejected by the workflow.

## Project Status

SentinelForge currently has a working prototype with a connected React frontend and FastAPI backend.

### Implemented

- Incident creation and SQLite persistence.
- Automated baseline test execution.
- Failure investigation and repair-proposal workflow.
- Explicit approval before applying a repair.
- Post-repair test execution and verification results.
- Incident history, dashboard, reports, and backend health checks.

### Current Limitations

SentinelForge is a prototype, and its current scope is intentionally limited.

- Investigation is deterministic; a live AI model is not integrated.
- Only the supported, allow-listed demonstration repair is implemented.
- Arbitrary repositories and arbitrary patches are not supported.
- Passing tests demonstrate the included scenario's result, not universal correctness.
- The working-copy design is not a hardened security sandbox.
- Production deployment would require stronger isolation, authentication, authorization, audit controls, resource limits, and additional security testing.

**Safety note:** Do not use this prototype to repair production systems or execute untrusted code.

## Future Development

Potential next steps include:

- Integrating an AI model for evidence-grounded investigation and patch generation.
- Supporting additional failure scenarios, repositories, and test frameworks.
- Improving patch review with explicit diffs and risk analysis.
- Strengthening sandbox isolation and execution controls.
- Expanding verification with regression tests and additional quality checks.
- Improving evidence traceability and report generation.
- Exploring integration with developer workflows and CI/CD pipelines.

## Documentation

Additional technical documentation is available in the `docs/` directory:

- [Architecture](docs/ARCHITECTURE.md) — System architecture and component responsibilities.
- [Acceptance Tests](docs/ACCEPTANCE_TESTS.md) — Acceptance criteria and testing workflow.
- [Build Plan](docs/BUILD_PLAN.md) — Development plan and implementation milestones.

## Project Vision

SentinelForge aims to make software repair more **traceable, reviewable, and verifiable** by combining failure evidence, controlled repair approval, and automated testing in one workflow.

The long-term vision is to extend this foundation toward AI-assisted software repair while preserving human oversight and evidence-based verification.

**A repair isn't complete just because the code has changed. The result should be verified.**

---

*SentinelForge — from software failure to verified repair.*