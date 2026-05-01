import asyncio
from sqlalchemy.future import select
import json
from unittest.mock import AsyncMock
import pytest
import pytest_asyncio
import httpx
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker
from auth.models import User
from files.models import File
from database import Base
from database import get_db as orig_get_db
import storage
import security
from auth.router import router as auth_router
from files.router import router as files_router

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture(scope="session")
def event_loop():
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await test_engine.dispose()

@pytest_asyncio.fixture()
async def async_db_session():
    async with TestSessionLocal() as session:
        yield session

async def override_get_db():
    async with TestSessionLocal() as session:
        yield session

@pytest_asyncio.fixture()
async def s3_mock(monkeypatch, test_app):
    mock_client = AsyncMock()
    mock_client.upload_fileobj = AsyncMock()

    async def async_body_iter():
        yield b"chunk1"
        yield b"chunk2"

    async def get_object(*args, **kwargs):
        class BodyIter:
            def __aiter__(self):
                return async_body_iter()
        return {"Body": BodyIter()}

    mock_client.get_object = AsyncMock(side_effect=get_object)
    mock_client.delete_object = AsyncMock()
    mock_client.generate_presigned_url = AsyncMock(return_value="http://presigned-url")

    async def _get_s3_client_override():
        yield mock_client
        
    test_app.dependency_overrides[storage.get_s3_client] = _get_s3_client_override

    class _AsyncCM:
        def __init__(self, client):
            self.client = client
        async def __aenter__(self): return self.client
        async def __aexit__(self, exc_type, exc, tb): return False

    class DummySession:
        def client(self, *args, **kwargs): return _AsyncCM(mock_client)

    monkeypatch.setattr("files.service.session", DummySession())
    return mock_client


@pytest_asyncio.fixture()
async def redis_mock(monkeypatch):
    mock = AsyncMock()
    mock.get = AsyncMock(return_value=None)
    mock.set = AsyncMock()
    mock.delete = AsyncMock()

    monkeypatch.setattr("files.service.redis_client", mock)
    return mock

@pytest_asyncio.fixture()
async def test_app():
    app = FastAPI()
    app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
    app.include_router(files_router, prefix="/files", tags=["Files"])
    app.dependency_overrides[orig_get_db] = override_get_db
    yield app

@pytest_asyncio.fixture
async def test_client(test_app, s3_mock, redis_mock):
    async with httpx.AsyncClient(app=test_app, base_url="http://testserver") as client:
        yield client

@pytest_asyncio.fixture
async def create_user(async_db_session, test_app):
    result = await async_db_session.execute(
        select(User).filter(User.email == "testuser@example.com")
    )
    user = result.scalars().first()
    
    if not user:
        hashed = security.get_password_hash("testpassword")
        user = User(email="testuser@example.com", hashed_password=hashed)
        async_db_session.add(user)
        await async_db_session.commit()
        await async_db_session.refresh(user)

    async def _override_current_user():
        return user

    test_app.dependency_overrides[security.get_current_user] = _override_current_user
    return user