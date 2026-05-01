import uuid
import os
import json
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from .models import File
from auth.models import User
from config import settings
from storage import session, BUCKET_NAME
from cache import redis_client

ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "application/pdf", "text/plain"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

async def validate_and_get_file_size(file_obj) -> int:
    """Get file size and validate it."""
    file_obj.file.seek(0, os.SEEK_END)
    size = file_obj.file.tell()
    file_obj.file.seek(0)
    
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    return size

def validate_mime_type(mime_type: str):
    """Validate MIME type against allowed types."""
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: .png, .jpg, .pdf, .txt")

async def get_next_version(owner_id: int, filename: str, db: AsyncSession) -> int:
    """Get the next version number for a file."""
    stmt = select(File.version).where(
        File.owner_id == owner_id,
        File.original_name == filename
    ).order_by(File.version.desc()).limit(1)
    
    result = await db.execute(stmt)
    latest_version = result.scalar()
    return (latest_version or 0) + 1

async def upload_file_to_s3(file_obj, storage_key: str):
    """Upload file to S3/MinIO."""
    async with session.client(
        "s3",
        endpoint_url=settings.MINIO_URL,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
    ) as stream_client:
        await stream_client.upload_fileobj(
            file_obj.file,
            BUCKET_NAME,
            storage_key,
            ExtraArgs={"ContentType": file_obj.content_type}
        )

async def create_file_record(
    owner_id: int,
    original_name: str,
    storage_key: str,
    mime_type: str,
    size: int,
    version: int,
    db: AsyncSession
) -> File:
    """Create file record in database."""
    new_file = File(
        owner_id=owner_id,
        original_name=original_name,
        storage_key=storage_key,
        mime_type=mime_type,
        size=size,
        version=version
    )
    
    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)
    return new_file

async def upload_file_service(
    file_obj,
    current_user: User,
    db: AsyncSession
) -> File:
    """Service to handle file upload."""
    validate_mime_type(file_obj.content_type)
    size = await validate_and_get_file_size(file_obj)
    new_version = await get_next_version(current_user.id, file_obj.filename, db)
    storage_key = f"{current_user.id}/{uuid.uuid4()}_{file_obj.filename}"
    
    await upload_file_to_s3(file_obj, storage_key)
    file_record = await create_file_record(
        current_user.id, file_obj.filename, storage_key,
        file_obj.content_type, size, new_version, db
    )
    
    await redis_client.delete(f"user_files:{current_user.id}")
    return file_record

async def list_user_files(current_user: User, db: AsyncSession) -> list[File]:
    """List all files for a user with caching."""
    cache_key = f"user_files:{current_user.id}"
    
    cached_data = await redis_client.get(cache_key)
    if cached_data:
        return json.loads(cached_data)

    result = await db.execute(select(File).filter(File.owner_id == current_user.id))
    files = result.scalars().all()
    
    from .schemas import FileResponse
    files_data = [FileResponse.model_validate(f).model_dump(mode='json') for f in files]
    await redis_client.set(cache_key, json.dumps(files_data), ex=300)
    
    return files

async def get_file_by_id(file_id: int, current_user: User, db: AsyncSession) -> File:
    """Get a specific file, ensuring ownership."""
    result = await db.execute(
        select(File).filter(File.id == file_id, File.owner_id == current_user.id)
    )
    file_record = result.scalars().first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    return file_record

async def download_file_service(file_id: int, current_user: User, db: AsyncSession):
    """Service to handle file download."""
    file_record = await get_file_by_id(file_id, current_user, db)
    
    async def stream_generator():
        async with session.client(
            "s3",
            endpoint_url=settings.MINIO_URL,
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
        ) as stream_client:
            s3_obj = await stream_client.get_object(Bucket=BUCKET_NAME, Key=file_record.storage_key)
            async for chunk in s3_obj['Body']:
                yield chunk

    return stream_generator(), file_record

async def delete_file_service(file_id: int, current_user: User, db: AsyncSession, s3_client):
    """Service to handle file deletion."""
    file_record = await get_file_by_id(file_id, current_user, db)
    
    await s3_client.delete_object(Bucket=BUCKET_NAME, Key=file_record.storage_key)
    
    await db.delete(file_record)
    await db.commit()
    
    await redis_client.delete(f"user_files:{current_user.id}")

async def generate_share_link_service(
    file_id: int,
    expires_in: int,
    current_user: User,
    db: AsyncSession
) -> str:
    """Service to generate a share link for a file."""
    file_record = await get_file_by_id(file_id, current_user, db)
    
    async with session.client(
        "s3",
        endpoint_url=settings.MINIO_URL,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
    ) as s3:
        url = await s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': BUCKET_NAME, 'Key': file_record.storage_key},
            ExpiresIn=expires_in
        )
        
        if "minio:9000" in url:
            url = url.replace("minio:9000", "localhost:9000")
        
        return url
