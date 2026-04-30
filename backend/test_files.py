import pytest
from httpx import AsyncClient

MAX_SIZE = 10 * 1024 * 1024

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
async def test_upload_valid_file_and_versioning(test_client: AsyncClient, create_user, s3_mock):
    files = {"file": ("test.txt", b"hello world", "text/plain")}
    r = await test_client.post("/files/upload", files=files)
    assert r.status_code == 201
    data = r.json()
    assert data["original_name"] == "test.txt"
    assert data["version"] == 1
    assert s3_mock.upload_fileobj.await_count >= 1

    r2 = await test_client.post("/files/upload", files=files)
    assert r2.status_code == 201
    data2 = r2.json()
    assert data2["version"] == 2


@pytest.mark.asyncio
async def test_upload_invalid_mime(test_client: AsyncClient, create_user):
    files = {"file": ("bad.exe", b"x", "application/exe")}
    r = await test_client.post("/files/upload", files=files)
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_upload_size_limit(test_client: AsyncClient, create_user):
    large = b"a" * (MAX_SIZE + 1)
    files = {"file": ("big.txt", large, "text/plain")}
    r = await test_client.post("/files/upload", files=files)
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_list_files(test_client: AsyncClient, create_user, s3_mock, redis_mock):
    r0 = await test_client.get("/files/")
    assert r0.status_code == 200

    files = {"file": ("list.txt", b"content", "text/plain")}
    ru = await test_client.post("/files/upload", files=files)
    assert ru.status_code == 201

    r = await test_client.get("/files/")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert any(f["original_name"] == "list.txt" for f in data)
    # Redis set should have been called
    assert redis_mock.set.await_count >= 1


@pytest.mark.asyncio
async def test_download_stream_and_not_found(test_client: AsyncClient, create_user, s3_mock):
    files = {"file": ("dl.txt", b"x", "text/plain")}
    ru = await test_client.post("/files/upload", files=files)
    assert ru.status_code == 201
    fid = ru.json()["id"]

    r = await test_client.get(f"/files/{fid}/download")
    assert r.status_code == 200
    content = r.content
    assert content == b"chunk1chunk2"
    assert "attachment; filename=\"dl.txt\"" in r.headers.get("Content-Disposition", "")

    rn = await test_client.get("/files/999999/download")
    assert rn.status_code == 404


@pytest.mark.asyncio
async def test_delete_file_triggers_s3_and_redis(test_client: AsyncClient, create_user, s3_mock, redis_mock):
    files = {"file": ("del.txt", b"to-delete", "text/plain")}
    ru = await test_client.post("/files/upload", files=files)
    assert ru.status_code == 201
    fid = ru.json()["id"]

    rd = await test_client.delete(f"/files/{fid}")
    assert rd.status_code == 204
    assert s3_mock.delete_object.await_count >= 1
    assert redis_mock.delete.await_count >= 1

    rlist = await test_client.get("/files/")
    assert rlist.status_code == 200
    files_after = rlist.json()
    assert all(f["id"] != fid for f in files_after)
