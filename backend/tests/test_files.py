import pytest

MAX_SIZE = 10 * 1024 * 1024

@pytest.mark.asyncio
async def test_upload_valid_file_and_versioning(authenticated_client, s3_mock):
    client, user = authenticated_client
    files = {"file": ("test.txt", b"hello world", "text/plain")}
    r = await client.post("/files/upload", files=files)
    assert r.status_code == 201
    data = r.json()
    assert data["original_name"] == "test.txt"
    assert data["version"] == 1
    assert s3_mock.upload_fileobj.await_count >= 1

    r2 = await client.post("/files/upload", files=files)
    assert r2.status_code == 201
    data2 = r2.json()
    assert data2["version"] == 2


@pytest.mark.asyncio
async def test_upload_invalid_mime(authenticated_client):
    client, user = authenticated_client
    files = {"file": ("bad.exe", b"x", "application/exe")}
    r = await client.post("/files/upload", files=files)
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_upload_size_limit(authenticated_client):
    client, user = authenticated_client
    large = b"a" * (MAX_SIZE + 1)
    files = {"file": ("big.txt", large, "text/plain")}
    r = await client.post("/files/upload", files=files)
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_list_files(authenticated_client, s3_mock, redis_mock):
    client, user = authenticated_client
    r0 = await client.get("/files")
    assert r0.status_code == 200

    files = {"file": ("list.txt", b"content", "text/plain")}
    ru = await client.post("/files/upload", files=files)
    assert ru.status_code == 201

    r = await client.get("/files")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert any(f["original_name"] == "list.txt" for f in data)
    assert redis_mock.set.await_count >= 1


@pytest.mark.asyncio
async def test_download_stream_and_not_found(authenticated_client, s3_mock):
    client, user = authenticated_client
    files = {"file": ("dl.txt", b"x", "text/plain")}
    ru = await client.post("/files/upload", files=files)
    assert ru.status_code == 201
    fid = ru.json()["id"]

    r = await client.get(f"/files/{fid}/download")
    assert r.status_code == 200
    content = r.content
    assert content == b"chunk1chunk2"
    assert "attachment; filename=\"dl.txt\"" in r.headers.get("Content-Disposition", "")

    rn = await client.get("/files/999999/download")
    assert rn.status_code == 404


@pytest.mark.asyncio
async def test_delete_file_triggers_s3_and_redis(authenticated_client, s3_mock, redis_mock):
    client, user = authenticated_client
    files = {"file": ("del.txt", b"to-delete", "text/plain")}
    ru = await client.post("/files/upload", files=files)
    assert ru.status_code == 201
    fid = ru.json()["id"]

    rd = await client.delete(f"/files/{fid}")
    assert rd.status_code == 204
    assert s3_mock.delete_object.await_count >= 1
    assert redis_mock.delete.await_count >= 1

    rlist = await client.get("/files")
    assert rlist.status_code == 200
    files_after = rlist.json()
    assert all(f["id"] != fid for f in files_after)
