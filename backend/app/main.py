
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .engine import SentinelForgeEngine
from .memory import memory
from .schemas import CreateIncidentRequest


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application resources during startup and shutdown."""
    try:
        yield
    finally:
        await memory.aclose()


app = FastAPI(
    title="SentinelForge API",
    description=(
        "Evidence-driven software repair prototype. "
        "Uses one allow-listed demo scenario."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = SentinelForgeEngine()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "sentinelforge-api",
        "version": "0.1.0",
    }


@app.get("/api/memory/status")
def memory_status() -> dict:
    """Report whether the real Hindsight client is configured."""
    return memory.status()


@app.get("/api/scenarios")
def scenarios() -> list[dict[str, str]]:
    return engine.scenarios()


@app.post("/api/incidents", status_code=201)
def create_incident(request: CreateIncidentRequest) -> dict:
    try:
        incident = engine.create_incident(request.scenario_id)
        return incident.public_dict()
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@app.get("/api/incidents")
def list_incidents(
    limit: int = Query(default=50, ge=1, le=200),
) -> list[dict]:
    """
    Return saved incidents, newest first.

    The engine must expose a list_incidents() method
    that reads from its persistent incident store.
    """
    try:
        incidents = engine.list_incidents()
        incidents.sort(
            key=lambda incident: getattr(
                incident, "created_at", ""
            ),
            reverse=True,
        )
        return [
            incident.public_dict()
            for incident in incidents[:limit]
        ]
    except AttributeError as exc:
        raise HTTPException(
            status_code=501,
            detail=(
                "Incident history is not implemented in "
                "the engine yet."
            ),
        ) from exc


@app.get("/api/incidents/{incident_id}")
def get_incident(incident_id: str) -> dict:
    try:
        return engine.get_incident(incident_id).public_dict()
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@app.post("/api/incidents/{incident_id}/investigate")
def investigate(incident_id: str) -> dict:
    try:
        return engine.investigate(incident_id).public_dict()
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@app.post("/api/incidents/{incident_id}/propose-patch")
def propose_patch(incident_id: str) -> dict:
    try:
        return engine.propose_patch(incident_id).public_dict()
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@app.post("/api/incidents/{incident_id}/approve-patch")
def approve_patch(incident_id: str) -> dict:
    try:
        return engine.approve_patch(incident_id).public_dict()
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@app.post("/api/incidents/{incident_id}/verify")
def verify(incident_id: str) -> dict:
    try:
        return engine.verify(incident_id).public_dict()
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
