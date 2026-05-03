import pytest
from unittest.mock import AsyncMock, MagicMock
from core import storage
from botocore.exceptions import ClientError

@pytest.mark.asyncio
async def test_init_bucket_creates_if_not_exists(monkeypatch):
    mock_client = AsyncMock()
    error_response = {'Error': {'Code': '404', 'Message': 'Not Found'}}
    mock_client.head_bucket = AsyncMock(side_effect=ClientError(error_response, 'HeadBucket'))
    mock_client.create_bucket = AsyncMock()

    class _MockClientContextManager:
        async def __aenter__(self):
            return mock_client
        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

    mock_session = MagicMock()
    mock_session.client.return_value = _MockClientContextManager()
    
    monkeypatch.setattr(storage, "session", mock_session)

    await storage.init_bucket()

    mock_client.head_bucket.assert_called_once_with(Bucket=storage.settings.BUCKET_NAME)
    mock_client.create_bucket.assert_called_once_with(Bucket=storage.settings.BUCKET_NAME)

@pytest.mark.asyncio
async def test_init_bucket_does_not_create_if_exists(monkeypatch):
    mock_client = AsyncMock()
    
    mock_client.head_bucket = AsyncMock()
    mock_client.create_bucket = AsyncMock()

    class _MockClientContextManager:
        async def __aenter__(self):
            return mock_client
        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

    mock_session = MagicMock()
    mock_session.client.return_value = _MockClientContextManager()
    
    monkeypatch.setattr(storage, "session", mock_session)

    await storage.init_bucket()

    mock_client.head_bucket.assert_called_once_with(Bucket=storage.settings.BUCKET_NAME)
    mock_client.create_bucket.assert_not_called()