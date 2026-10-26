# SentinelForge

**An evidence-driven software repair and verification platform prototype.**

SentinelForge demonstrates a controlled workflow for investigating software failures, proposing repairs, requiring explicit human approval, applying approved changes in an incident working copy, and verifying the outcome with automated tests.

> **Don't just propose a fix — collect evidence and verify that it works.**

SentinelForge integrates **Hindsight Cloud** for persistent engineering incident memory. It can retrieve relevant historical context during an investigation and attempt to retain verified incident outcomes after successful post-repair testing.

> **Project status:** Working prototype. The current repair workflow uses deterministic investigation and an allow-listed patch for a supported Python authentication regression. Hindsight adds persistent historical context; it does not make the repair engine a general-purpose AI system. Working-copy isolation is not a production-grade security boundary.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Proposed Solution](#proposed-solution)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Hindsight Cloud Integration](#hindsight-cloud-integration)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation and Setup](#installation-and-setup)
- [Running Tests](#running-tests)
- [API Reference](#api-reference)
- [Example API Workflow](#example-api-workflow)
- [Demonstration Results](#demonstration-results)
- [Dashboard Sections](#dashboard-sections)
- [Current Limitations](#current-limitations)
- [Future Development](#future-development)
- [Documentation](#documentation)

---

## Problem Statement

Software failures are often investigated using fragmented logs, repeated debugging sessions, and fixes whose effectiveness is not adequately verified. Engineering teams may also lose useful knowledge from previous incidents, forcing them to rediscover solutions to recurring problems.

A proposed patch alone does not establish that a defect has been resolved. A reliable repair workflow should preserve diagnostic evidence, require appropriate human oversight, and verify the resulting behavior.

## Proposed Solution

SentinelForge provides a controlled, evidence-driven workflow that connects incident investigation, repair approval, automated verification, and historical engineering memory.

The prototype demonstrates how these stages can work together:

- Reproduce a known failure before making changes.
- Record evidence and produce a deterministic diagnosis.
- Retrieve relevant historical incident memories when Hindsight is configured.
- Propose an explicitly allow-listed repair.
- Require human approval before applying the change.
- Run automated tests to verify the repaired behavior.
- Attempt to retain the verified outcome in Hindsight.
- Preserve incident history for review and reporting.

The goal is to make software repair more traceable, reviewable, and verifiable.

## Key Features

- **Incident Management:** Create and track incidents from supported failure scenarios.
- **Baseline Testing:** Reproduce the original failure before applying a repair.
- **Evidence-Driven Investigation:** Record failure evidence and produce a deterministic diagnosis.
- **Hindsight Incident Memory:** Recall relevant historical engineering context and attempt to retain verified outcomes through Hindsight Cloud.
- **Controlled Patch Proposal:** Propose an allow-listed repair for the supported scenario.
- **Human Approval Gate:** Require explicit approval before applying a proposed change.
- **Post-Repair Verification:** Execute automated tests after the approved patch is applied.
- **Persistent Incident History:** Store incident records in SQLite and maintain local incident workspaces.
- **Interactive Dashboard:** Inspect incident status, diagnostic evidence, memory activity, and repair progress.
- **Incident Reports:** Review incident details and export text reports.
- **REST API:** Access supported workflow operations through a FastAPI backend.

## How It Works

SentinelForge follows a controlled repair lifecycle:

1. Create an incident from a supported failure scenario.
2. Run baseline tests to reproduce the defect.
3. Investigate the failure and collect diagnostic evidence.
4. Recall relevant historical memories from Hindsight, when configured.
5. Generate a repair proposal for the supported issue.
6. Require explicit human approval.
7. Apply the approved patch in the incident's working copy.
8. Run post-repair verification tests.
9. Attempt to retain the verified outcome in Hindsight when verification passes.
10. Review the incident, evidence, and results in the dashboard or report.

The current demonstration uses a Python authentication regression in which valid credentials are incorrectly rejected. The baseline tests reproduce the defect, the system proposes an allow-listed repair, a human approves the change, and post-repair tests check the repaired behavior.

**Important:** Hindsight memory provides supplementary context. Historical memories do not replace current source evidence or automated test results, and a successful local test run does not by itself prove that a remote memory operation succeeded.

## Hindsight Cloud Integration

SentinelForge integrates Hindsight Cloud to provide persistent historical context across engineering incidents.

### Integration capabilities

| Capability | Description |
|---|---|
| Memory recall | Retrieves historical memories relevant to an investigation. |
| Relevance filtering | Uses deterministic keyword criteria to classify recalled text; this is not an AI judgment. |
| Verified-outcome retention | Attempts to retain incident outcome information after post-patch verification passes. |
| Status reporting | Exposes client configuration status through `GET /api/memory/status`. |
| Failure reporting | Reports missing configuration and remote-operation failures rather than treating them as successful operations. |

A configured client does not guarantee that remote recall or retention will succeed. Inspect the status and returned results reported by the application.

### Configure Hindsight Cloud

1. Set up Hindsight Cloud using its official documentation.
2. Ensure the required memory bank already exists in your account. SentinelForge does not automatically create the bank during application startup.
3. Copy the backend environment example file.
4. Set your own API key and confirm the bank ID matches your Hindsight Cloud configuration.

From the repository root, run:

```powershell
Copy-Item .\backend\.env.example .\backend\.env
```

Edit `backend/.env` with your configuration:

```dotenv
HINDSIGHT_API_KEY=your_api_key_here
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
HINDSIGHT_BANK_ID=sentinelforge-incidents
```

| Environment variable | Purpose |
|---|---|
| `HINDSIGHT_API_KEY` | API key used to initialize the Hindsight client. |
| `HINDSIGHT_BASE_URL` | Hindsight Cloud API base URL. |
| `HINDSIGHT_BANK_ID` | Existing memory bank used for recall and retention. |

The default bank ID is `sentinelforge-incidents`. Use the bank ID configured in your own Hindsight Cloud account.

**Security:** Never commit `backend/.env`, expose your API key, or include credentials in screenshots, demonstration videos, or reports.

### Verify the integration

After configuring the environment and starting the backend:

1. Open `http://127.0.0.1:8000/api/memory/status`.
2. Check whether the Hindsight client is configured.
3. Open the SentinelForge dashboard and create an incident.
4. Run the investigation and inspect the recall status and returned memories.
5. Approve the proposed repair and run post-repair verification.
6. Inspect the reported retention status.

A passing test suite does not prove that a remote Hindsight operation succeeded. Confirm the operation's actual status in the application.

The integration uses the Hindsight Python client's asynchronous recall and retention operations. Refer to the official Hindsight Python SDK documentation for provider-specific setup and API details.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Python, FastAPI |
| Automated testing | pytest |
| Persistence | SQLite |
| Incident memory | Hindsight Cloud, `hindsight-client` |
| Configuration | Environment variables, `python-dotenv` |
| API documentation | OpenAPI, Swagger UI |
| Version control | Git, GitHub |

## Architecture

```text
User
 |
 v
React Dashboard
 |
 v
FastAPI REST API
 |
 v
SentinelForge Engine
 |
 +--> Incident Management
 +--> Baseline Test Execution
 +--> Evidence-Based Investigation
 +--> Hindsight Memory Recall
 +--> Patch Proposal
 +--> Human Approval
 +--> Approved Patch Application
 +--> Post-Repair Verification
 +--> Hindsight Outcome Retention
 +--> SQLite Incident Persistence
 |
 v
Incident Results and Reports
```

The frontend communicates with the backend through REST API endpoints. The backend manages incident state, executes the supported repair workflow, records evidence, persists incident information, and coordinates optional Hindsight memory operations.

## Project Structure

```text
SentinelForge/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── engine.py
│   │   └── memory.py
│   ├── fixtures/
│   │   └── buggy_app/
│   ├── tests/
│   ├── pytest.ini
│   ├── requirements.txt
│   └── .env.example
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

Runtime databases and incident working copies are generated locally under `backend/data/` and are excluded from version control.

*The tree highlights the principal project files; additional files may exist in the repository.*

## Requirements

Install the following before running the project:

- Python 3.11 or newer.
- Node.js and npm.
- Git.
- Internet access for dependency installation and optional Hindsight Cloud requests.

The following instructions use Windows PowerShell.

## Installation and Setup

### 1. Clone the repository

```powershell
git clone https://github.com/ByteForge-Alok/SentinelForge.git
cd SentinelForge
```

If the repository is already cloned, open your existing project directory instead.

### 2. Set up the backend

From the repository root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If PowerShell blocks virtual environment activation, run this in the same PowerShell process:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

This changes the execution policy only for the current PowerShell process.

### 3. Configure optional Hindsight memory

From the repository root, copy the example environment file:

```powershell
Copy-Item .\backend\.env.example .\backend\.env
```

Edit `backend/.env` and set your own API key. Confirm that the configured memory bank exists and that `HINDSIGHT_BANK_ID` is correct.

Do not commit the `.env` file.

If Hindsight is not configured, the core repair workflow may still run, while memory operations are reported as not configured.

### 4. Start the backend

From the `backend` directory, with its virtual environment activated:

```powershell
uvicorn app.main:app --reload
```

The backend should be available at:

- **API base URL:** `http://127.0.0.1:8000`
- **Interactive API documentation:** `http://127.0.0.1:8000/docs`
- **Health endpoint:** `http://127.0.0.1:8000/api/health`
- **Hindsight status:** `http://127.0.0.1:8000/api/memory/status`

Keep the backend terminal running.

### 5. Start the frontend

Open a second terminal in the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite. With the default configuration, this is:

`http://localhost:5173/`

Keep the frontend terminal running.

## Running Tests

From the repository root, activate the backend virtual environment and run:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest -q
```

**Latest reported development result:** 6 tests passed in 4.58 seconds, with one Starlette/httpx deprecation warning.

This result reflects a recorded development run, not a guarantee for every clean installation. After installing dependencies in a fresh environment, run the tests again and report the actual result.

The supported fixture's baseline tests intentionally reproduce the authentication defect before repair. Post-repair verification tests check the repaired behavior.

## API Reference

The backend exposes the following endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Check backend health. |
| `GET` | `/api/scenarios` | List supported failure scenarios. |
| `GET` | `/api/memory/status` | Check Hindsight client configuration. |
| `POST` | `/api/incidents` | Create an incident. |
| `GET` | `/api/incidents` | List incidents. |
| `GET` | `/api/incidents/{id}` | Retrieve an incident. |
| `POST` | `/api/incidents/{id}/investigate` | Investigate the failure. |
| `POST` | `/api/incidents/{id}/propose-patch` | Propose a repair. |
| `POST` | `/api/incidents/{id}/approve-patch` | Approve the proposed repair. |
| `POST` | `/api/incidents/{id}/verify` | Verify the repair and, when eligible, attempt outcome retention. |

Explore the available operations and request schemas through Swagger UI:

`http://127.0.0.1:8000/docs`

## Example API Workflow

Create an incident using the supported scenario by sending this JSON body to `POST /api/incidents`:

```json
{
  "scenario_id": "login-regression"
}
```

Use the returned incident ID for the subsequent operations:

```text
POST /api/incidents/{id}/investigate
POST /api/incidents/{id}/propose-patch
POST /api/incidents/{id}/approve-patch
POST /api/incidents/{id}/verify
```

Replace `{id}` with the actual incident ID. Each operation depends on the incident's current state and the preceding workflow steps.

## Demonstration Results

The supported authentication-regression demonstration follows this sequence:

| Stage | Demonstrated result |
|---|---|
| Baseline tests | 1 failed, 2 passed |
| Investigation | Failure evidence and diagnosis recorded |
| Patch proposal | Allow-listed repair proposed |
| Human approval | Repair explicitly approved |
| Post-repair verification | 3 passed |

These results apply to the supported demonstration scenario. They do not establish that arbitrary software defects can be repaired automatically.

## Dashboard Sections

- **Dashboard:** View incident status and repair progress.
- **Incidents:** Browse and inspect incident history.
- **Scan:** Start the supported incident workflow.
- **Reports:** Review incident information and export text reports.
- **Settings:** Check backend connectivity and view prototype configuration information.

The incident evidence workflow also presents Hindsight recall status and returned memories when available, along with the reported status of verified-outcome retention.

## Current Limitations

SentinelForge is a working prototype, not a production-ready autonomous repair platform.

- **No integrated AI repair model:** Investigation and repair selection are deterministic.
- **Limited repair scope:** The implementation supports a known scenario and an allow-listed patch rather than arbitrary code changes.
- **Limited isolation:** Working copies separate incident changes but are not a hardened security sandbox.
- **Limited scenario coverage:** The current fixture does not represent the full range of real-world software failures.
- **Optional external memory:** Hindsight requires valid configuration and successful remote operations. Recalled memories are supplementary context, not proof that a diagnosis is correct.
- **No production deployment:** Authentication, multi-user access control, hardened execution isolation, and production operational safeguards are outside the current implementation.

These limitations define the prototype's scope and help identify its next development priorities.

## Future Development

Potential extensions include:

- Integrating an AI model to assist with failure diagnosis and repair generation.
- Supporting additional programming languages and failure scenarios.
- Introducing stronger sandboxing for test and patch execution.
- Adding patch-quality checks and regression-test generation.
- Recording richer evidence and verification artifacts.
- Adding role-based approval policies and audit trails.
- Expanding automated acceptance tests and continuous integration workflows.

These are future goals, not claims about existing functionality.

## Documentation

Additional project documentation is available in the `docs/` directory:

- `ARCHITECTURE.md` — architecture documentation.
- `ACCEPTANCE_TESTS.md` — acceptance-test documentation.
- `BUILD_PLAN.md` — project build plan.

## Project Status

SentinelForge demonstrates an end-to-end, evidence-driven repair workflow for a supported Python authentication regression, with explicit human approval and automated post-repair verification.

Its Hindsight integration adds persistent historical incident context and supports attempts to retain outcomes after successful verification, subject to configuration and remote-operation results.

**A proposed repair is not enough. The outcome must be verified.**

*Built as a software reliability and repair prototype.*
