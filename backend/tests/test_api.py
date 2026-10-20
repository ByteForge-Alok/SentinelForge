from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_full_repair_workflow():
    created = client.post("/api/incidents", json={"scenario_id": "login-regression"})
    assert created.status_code == 201
    incident = created.json()
    incident_id = incident["id"]
    assert incident["baseline_passed"] is False

    investigated = client.post(f"/api/incidents/{incident_id}/investigate").json()
    assert investigated["diagnosis"]
    assert investigated["evidence"]

    proposed = client.post(f"/api/incidents/{incident_id}/propose-patch").json()
    assert proposed["approval_status"] == "pending"

    # Verification must not be allowed before human approval.
    rejected = client.post(f"/api/incidents/{incident_id}/verify")
    assert rejected.status_code == 400

    approved = client.post(f"/api/incidents/{incident_id}/approve-patch").json()
    assert approved["approval_status"] == "approved"

    verified = client.post(f"/api/incidents/{incident_id}/verify").json()
    assert verified["verification_status"] == "passed"
    assert verified["status"] == "verified"
    assert "3 passed" in verified["verification_output"]
