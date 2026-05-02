import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_success_and_duplicate(test_client: AsyncClient):
    payload = {"email": "newuser@example.com", "password": "securepass"}
    
    r = await test_client.post("/auth/register", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == payload["email"]

    r2 = await test_client.post("/auth/register", json=payload)
    assert r2.status_code == 400

@pytest.mark.asyncio
async def test_login_success(test_client: AsyncClient, create_user):
    payload = {"username": "testuser@example.com", "password": "testpassword"}
    
    r = await test_client.post("/auth/login", data=payload)
    
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_failure(test_client: AsyncClient, create_user):
    payload = {"username": "testuser@example.com", "password": "wrongpassword"}
    r = await test_client.post("/auth/login", data=payload)
    
    assert r.status_code == 401
    assert r.json()["detail"] == "Incorrect email or password"

@pytest.mark.asyncio
async def test_get_current_user_profile(authenticated_client):
    client, user = authenticated_client
    
    r = await client.get("/auth/me")
    
    assert r.status_code == 200
    assert r.json()["email"] == user.email