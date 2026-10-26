"""FastAPI application for SentinelForge."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from app.engine import engine
from app.memory import memory


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application resources during startup and shutdown."""
    try:
        yield
    finally:
        await memory.aclose()


app = FastAPI(
    title="SentinelForge API",
    description="Evidence-driven software repair and verification.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/api/health")
def health() -> dict:
    """Return API health status."""
    return {"status": "ok"}


@app.get("/api/memory/status")
def memory_status() -> dict:
    """Return Hindsight configuration status."""
    return memory.status()


@app.get("/api/scenarios")
def scenarios() -> dict:
    """List supported repair scenarios."""
    return engine.list_scenarios()


@app.get("/api/incidents")
def list_incidents() -> dict:
    """List saved incidents."""
    return engine.list_incidents()


@app.post("/api/incidents", status_code=201)
def create_incident(scenario_id: str = "login-regression") -> dict:
    """Create an incident for the selected scenario."""
    try:
        return engine.create_incident(scenario_id).public_dict()
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@app.get("/api/incidents/{incident_id}")
def get_incident(incident_id: str) -> dict:
    """Retrieve an incident."""
    try:
        return engine.get_incident(incident_id).public_dict()
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@app.post("/api/incidents/{incident_id}/investigate")
async def investigate(incident_id: str) -> dict:
    """Investigate an incident using source evidence and memory."""
    try:
        incident = await engine.investigate(incident_id)
        return incident.public_dict()
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@app.post("/api/incidents/{incident_id}/propose-patch")
def propose_patch(incident_id: str) -> dict:
    """Propose a repair for an incident."""
    try:
        return engine.propose_patch(incident_id).public_dict()
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@app.post("/api/incidents/{incident_id}/approve-patch")
def approve_patch(incident_id: str) -> dict:
    """Approve the proposed repair."""
    try:
        return engine.approve_patch(incident_id).public_dict()
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@app.post("/api/incidents/{incident_id}/verify")
async def verify(incident_id: str) -> dict:
    """Run post-patch verification and retain successful outcomes."""
    try:
        incident = await engine.verify(incident_id)
        return incident.public_dict()
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc