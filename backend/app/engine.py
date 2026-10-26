
from __future__ import annotations

import json
import shutil
import sqlite3
import subprocess
import sys
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .memory import memory

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "fixtures" / "buggy_app"
DATA_DIR = ROOT / "data"
WORKSPACES_DIR = DATA_DIR / "workspaces"
DATABASE_PATH = DATA_DIR / "incidents.db"

BUGGY_LINE = (
    "    if users[username] == password:\n"
    "        return False  # BUG: valid credentials are rejected\n"
)

FIXED_LINE = (
    "    if users[username] == password:\n"
    "        return True  # FIX: accept valid credentials\n"
)


def utc_now() -> str:
    """Return the current UTC time as an ISO 8601 timestamp."""
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Incident:
    id: str
    scenario_id: str
    title: str
    status: str = "created"
    workspace: str = ""
    baseline_passed: bool | None = None
    baseline_output: str = ""
    diagnosis: str | None = None
    evidence: list[str] = field(default_factory=list)
    proposed_patch: str | None = None
    approval_status: str = "not_requested"
    verification_status: str = "not_run"
    verification_output: str | None = None
    created_at: str = ""
    memory_status: str = "not_checked"
    memory_query: str = ""
    recalled_memories: list[dict[str, str]] = field(default_factory=list)
    memory_message: str = ""
    memory_retention_status: str = "not_attempted"

    def public_dict(self) -> dict[str, Any]:
        """Return incident data without exposing local workspace paths."""
        data = asdict(self)
        data.pop("workspace", None)
        return data


class SentinelForgeEngine:
    """Controlled demo engine with persistent incident records."""

    def __init__(self) -> None:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        WORKSPACES_DIR.mkdir(parents=True, exist_ok=True)

        self.incidents: dict[str, Incident] = {}
        self._initialize_database()
        self._load_incidents()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(DATABASE_PATH, timeout=10)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize_database(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS incidents (
                    id TEXT PRIMARY KEY,
                    payload TEXT NOT NULL
                )
                """
            )

    def _save_incident(self, incident: Incident) -> None:
        payload = json.dumps(asdict(incident))

        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO incidents (id, payload)
                VALUES (?, ?)
                ON CONFLICT(id) DO UPDATE SET payload = excluded.payload
                """,
                (incident.id, payload),
            )

    def _load_incidents(self) -> None:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT payload FROM incidents"
            ).fetchall()

        allowed_parent = WORKSPACES_DIR.resolve()

        for row in rows:
            try:
                data = json.loads(row["payload"])
                incident = Incident(**data)
                workspace = Path(incident.workspace).resolve()

                # Restore only direct child workspaces belonging to this app.
                if workspace.parent != allowed_parent:
                    continue

                if workspace.is_dir():
                    self.incidents[incident.id] = incident

            except (ValueError, TypeError, KeyError, OSError):
                # Skip damaged records rather than preventing startup.
                continue

    @staticmethod
    def scenarios() -> list[dict[str, str]]:
        return [
            {
                "id": "login-regression",
                "title": "Login regression: valid users are rejected",
                "description": (
                    "A deliberate bug causes the login function to reject "
                    "valid credentials."
                ),
                "language": "Python",
                "scope": "A small local fixture with three regression tests.",
            }
        ]

    def create_incident(self, scenario_id: str) -> Incident:
        if scenario_id != "login-regression":
            raise ValueError(f"Unknown scenario: {scenario_id}")

        if not FIXTURE.is_dir():
            raise ValueError(
                f"Demo fixture directory not found: {FIXTURE}"
            )

        incident_id = str(uuid.uuid4())[:8]
        workspace = WORKSPACES_DIR / incident_id

        if workspace.exists():
            raise ValueError(
                "Incident workspace already exists; try again"
            )

        shutil.copytree(FIXTURE, workspace)

        incident = Incident(
            id=incident_id,
            scenario_id=scenario_id,
            title="Login regression: valid users are rejected",
            workspace=str(workspace.resolve()),
            created_at=utc_now(),
        )

        result = self._run_tests(workspace)

        incident.baseline_output = result["output"]
        incident.baseline_passed = result["passed"]
        incident.status = (
            "baseline_failed"
            if not result["passed"]
            else "baseline_passed"
        )

        self.incidents[incident.id] = incident
        self._save_incident(incident)

        return incident

    def get_incident(self, incident_id: str) -> Incident:
        try:
            return self.incidents[incident_id]
        except KeyError as exc:
            raise ValueError("Incident not found") from exc

    def list_incidents(self) -> list[Incident]:
        """Return incidents newest first, using creation timestamps."""
        return sorted(
            self.incidents.values(),
            key=lambda incident: (
                bool(incident.created_at),
                incident.created_at,
                incident.id,
            ),
            reverse=True,
        )

    @staticmethod
    def _classify_memories(
        memories: list[dict[str, str]],
    ) -> tuple[list[str], list[str]]:
        """
        Classify recalled text using explicit keyword criteria.

        This is a deterministic relevance heuristic, not an AI judgment.
        """
        relevant: list[str] = []
        other: list[str] = []

        for item in memories:
            text = str(item.get("text", "")).strip()

            if not text:
                continue

            normalized = text.lower()

            matches_authentication = any(
                term in normalized
                for term in (
                    "login",
                    "authentication",
                    "credential",
                    "password",
                )
            )

            matches_repair = any(
                term in normalized
                for term in (
                    "return true",
                    "valid credentials",
                    "matching-password",
                    "root cause",
                )
            )

            indicates_success = any(
                term in normalized
                for term in (
                    "passed",
                    "verified",
                    "verification result",
                )
            )

            if (
                matches_authentication
                and matches_repair
                and indicates_success
            ):
                relevant.append(text)
            else:
                other.append(text)

        return relevant, other

    def investigate(self, incident_id: str) -> Incident:
        incident = self.get_incident(incident_id)
        source_path = Path(incident.workspace) / "auth_logic.py"
        source = source_path.read_text(encoding="utf-8")

        # Establish current code evidence before consulting memory.
        if BUGGY_LINE not in source:
            incident.diagnosis = (
                "The known faulty line was not found; "
                "no diagnosis was asserted."
            )
            incident.evidence = [
                "Expected faulty code pattern was not present "
                "in the workspace."
            ]
            incident.status = "investigation_inconclusive"
            self._save_incident(incident)
            return incident

        # Retrieve prior experience from Hindsight.
        incident.memory_query = (
            "Verified Python authentication login regression where valid "
            "credentials are rejected. Retrieve prior root causes, exact "
            "repair patterns, failed approaches, and regression test outcomes."
        )

        recalled = memory.recall(incident.memory_query)
        incident.memory_status = recalled["status"]
        incident.recalled_memories = recalled.get("results", [])
        incident.memory_message = recalled.get("message", "")

        relevant_memories, other_memories = self._classify_memories(
            incident.recalled_memories
        )

        # The diagnosis is grounded in the current source pattern.
        incident.diagnosis = (
            "The credential comparison is correct, but the matching-password "
            "branch returns False. This reverses the expected result for "
            "valid credentials."
        )

        incident.evidence = [
            "auth_logic.py: the branch compares the stored password "
            "with the supplied password.",
            "auth_logic.py: the matching-password branch returns False; "
            "this is direct evidence of the suspected defect.",
            (
                "Baseline test output: "
                + incident.baseline_output[-1500:]
                if incident.baseline_output
                else "No baseline test output was recorded."
            ),
        ]

        if relevant_memories:
            incident.evidence.append(
                f"Hindsight relevance check: {len(relevant_memories)} "
                "memory item(s) matched the authentication, repair-pattern, "
                "and successful-outcome criteria."
            )
            incident.evidence.append(
                "Memory-assisted guidance: matching prior experience supports "
                "considering the return-value correction. Current source "
                "evidence and regression tests remain authoritative."
            )
        elif incident.memory_status == "success":
            incident.evidence.append(
                "Hindsight recall succeeded, but no recalled item matched "
                "all relevance criteria. The diagnosis relies on current "
                "source evidence rather than unrelated memories."
            )
        else:
            incident.evidence.append(
                "Hindsight recall was unavailable or failed. The diagnosis "
                "relies on current source evidence."
            )

        incident.status = "investigated"
        self._save_incident(incident)

        return incident

    def propose_patch(self, incident_id: str) -> Incident:
        incident = self.get_incident(incident_id)

        if (
            not incident.diagnosis
            or incident.status == "investigation_inconclusive"
        ):
            raise ValueError(
                "Investigate the incident successfully "
                "before proposing a patch"
            )

        incident.proposed_patch = """--- a/auth_logic.py
+++ b/auth_logic.py
@@
-        return False  # BUG: valid credentials are rejected
+        return True  # FIX: accept valid credentials
"""

        incident.approval_status = "pending"
        incident.status = "patch_pending_approval"

        self._save_incident(incident)
        return incident

    def approve_patch(self, incident_id: str) -> Incident:
        incident = self.get_incident(incident_id)

        if not incident.proposed_patch:
            raise ValueError("No patch is awaiting approval")

        if incident.approval_status != "pending":
            raise ValueError("Patch must be pending approval")

        source_path = Path(incident.workspace) / "auth_logic.py"
        source = source_path.read_text(encoding="utf-8")

        if BUGGY_LINE not in source:
            raise ValueError(
                "Patch precondition failed: expected source line "
                "was not found"
            )

        # Apply only the exact allow-listed patch after explicit approval.
        updated_source = source.replace(BUGGY_LINE, FIXED_LINE, 1)
        source_path.write_text(updated_source, encoding="utf-8")

        incident.approval_status = "approved"
        incident.status = "patch_approved"

        self._save_incident(incident)
        return incident

    def verify(self, incident_id: str) -> Incident:
        incident = self.get_incident(incident_id)

        if incident.approval_status != "approved":
            raise ValueError(
                "Approve the proposed patch before verification"
            )

        result = self._run_tests(Path(incident.workspace))

        incident.verification_output = result["output"]
        incident.verification_status = (
            "passed" if result["passed"] else "failed"
        )
        incident.status = (
            "verified" if result["passed"] else "verification_failed"
        )

        # Retain only after tests pass.
        if incident.verification_status == "passed":
            retained = memory.retain(
                content=(
                    f"Verified software incident: {incident.title}. "
                    f"Scenario: {incident.scenario_id}. "
                    f"Evidence: {'; '.join(incident.evidence)}. "
                    f"Root cause: {incident.diagnosis}. "
                    "Approved repair: in the matching-password branch, "
                    "return True instead of False. "
                    f"Verification result: passed. "
                    f"Test output: {incident.verification_output}. "
                    "Use this as prior experience only when current evidence "
                    "and the code pattern match."
                ),
                context=(
                    "SentinelForge post-patch verification; outcome recorded "
                    "only after tests passed."
                ),
                metadata={
                    "incident_id": incident.id,
                    "scenario_id": incident.scenario_id,
                    "verification": incident.verification_status,
                },
            )

            incident.memory_retention_status = retained["status"]

            if retained.get("message"):
                incident.memory_message = (
                    incident.memory_message + " " + retained["message"]
                ).strip()

        self._save_incident(incident)
        return incident

    @staticmethod
    def _run_tests(workspace: Path) -> dict[str, Any]:
        try:
            command = [
                sys.executable,
                "-m",
                "pytest",
                "-q",
                "--tb=short",
                "tests",
            ]

            completed = subprocess.run(
                command,
                cwd=str(workspace),
                capture_output=True,
                text=True,
                timeout=30,
                check=False,
            )

            output = (
                (completed.stdout or "")
                + "\n"
                + (completed.stderr or "")
            ).strip()

            if completed.returncode == 0:
                return {
                    "passed": True,
                    "output": output[-12000:] or "All tests passed.",
                }

            return {
                "passed": False,
                "output": (
                    output[-12000:]
                    or (
                        "Tests failed with exit code "
                        f"{completed.returncode}."
                    )
                ),
            }

        except subprocess.TimeoutExpired as exc:
            partial_output = ""

            if isinstance(exc.stdout, bytes):
                partial_output += exc.stdout.decode(
                    "utf-8", errors="replace"
                )
            elif exc.stdout:
                partial_output += exc.stdout

            if isinstance(exc.stderr, bytes):
                partial_output += exc.stderr.decode(
                    "utf-8", errors="replace"
                )
            elif exc.stderr:
                partial_output += exc.stderr

            message = "ERROR: test execution timed out after 30 seconds."

            if partial_output.strip():
                message += "\n" + partial_output.strip()

            return {
                "passed": False,
                "output": message[-12000:],
            }

        except Exception as exc:
            return {
                "passed": False,
                "output": (
                    f"ERROR running tests: {type(exc).__name__}: {exc}"
                ),
            }
