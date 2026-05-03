import pytest
from datetime import timedelta
import jwt
from fastapi import HTTPException, status, Request
from core import security
from core.config import settings
from unittest.mock import AsyncMock, MagicMock

def test_password_hashing_and_verification():
    password = "supersecretpassword"
    hashed = security.get_password_hash(password)
    
    assert password != hashed
    assert hashed.startswith("$argon2")
    assert security.verify_password(password, hashed) is True
    assert security.verify_password("wrongpassword", hashed) is False

def test_create_access_token_default_expiry():
    data = {"sub": "123"}
    token = security.create_access_token(data)
    
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
    
    assert payload["sub"] == "123"
    assert "exp" in payload

def test_create_access_token_custom_expiry():
    data = {"sub": "123"}
    expires = timedelta(minutes=5)
    token = security.create_access_token(data, expires_delta=expires)
    
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
    assert payload["sub"] == "123"

@pytest.mark.asyncio
async def test_get_current_user_invalid_token():
    mock_db = AsyncMock()
    mock_request = MagicMock(spec=Request)
    mock_request.cookies = {"token": "invalid.jwt.token"}
    
    with pytest.raises(HTTPException) as exc_info:
        await security.get_current_user(request=mock_request, db=mock_db)
        
    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Could not validate credentials"