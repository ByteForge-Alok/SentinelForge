from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .engine import SentinelForgeEngine
from .schemas import CreateIncidentRequest

app = FastAPI(
    title="SentinelForge API",
    description="Evidence-driven software repair prototype. Uses one allow-listed demo scenario.",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
engine = SentinelForgeEngine()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "sentinelforge-api", "version": "0.1.0"}


@app.get("/api/scenarios")
def scenarios() -> list[dict[str, str]]:
    return engine.scenarios()


@app.post("/api/incidents", status_code=201)
def create_incident(request: CreateIncidentRequest) -> dict:
    try:
        incident = engine.create_incident(request.scenario_id)
        return incident.public_dict()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/incidents/{incident_id}")
def get_incident(incident_id: str) -> dict:
    try:
        return engine.get_incident(incident_id).public_dict()
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/api/incidents/{incident_id}/investigate")
def investigate(incident_id: str) -> dict:
    try:
        return engine.investigate(incident_id).public_dict()
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/api/incidents/{incident_id}/propose-patch")
def propose_patch(incident_id: str) -> dict:
    try:
        return engine.propose_patch(incident_id).public_dict()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/incidents/{incident_id}/approve-patch")
def approve_patch(incident_id: str) -> dict:
    try:
        return engine.approve_patch(incident_id).public_dict()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/incidents/{incident_id}/verify")
def verify(incident_id: str) -> dict:
    try:
        return engine.verify(incident_id).public_dict()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
