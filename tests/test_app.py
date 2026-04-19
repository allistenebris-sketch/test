from pathlib import Path

from fastapi.testclient import TestClient


def test_auth_flow():
    db_file = Path("music_service.db")
    if db_file.exists():
        db_file.unlink()

    from app.main import app  # noqa: WPS433

    client = TestClient(app)

    register_payload = {
        "email": "user@example.com",
        "password": "strong-password",
        "display_name": "User",
    }
    r = client.post('/api/auth/register', json=register_payload)
    assert r.status_code == 200
    code = r.json()['debug_code']

    r = client.post('/api/auth/verify', json={"email": register_payload['email'], "code": code})
    assert r.status_code == 200

    r = client.post('/api/auth/login', json={"email": register_payload['email'], "password": register_payload['password']})
    assert r.status_code == 200
    assert 'access_token' in r.json()
