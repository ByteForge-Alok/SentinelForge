from pydantic import BaseModel, Field
from typing import Literal


class CreateIncidentRequest(BaseModel):
    scenario_id: str = Field(default="login-regression", description="Known demo scenario identifier")


class IncidentSummary(BaseModel):
    id: str
    scenario_id: str
    title: str
    status: str
    baseline_passed: bool | None = None
    diagnosis: str | None = None
    evidence: list[str] = []
    proposed_patch: str | None = None
    approval_status: Literal["not_requested", "pending", "approved"] = "not_requested"
    verification_status: Literal["not_run", "passed", "failed", "error"] = "not_run"
    verification_output: str | None = None
