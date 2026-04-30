import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile
import os
from config import settings
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from database import get_db
import models, schemas, security
from storage import get_s3_client, BUCKET_NAME, session
import json
from cache import redis_client

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "application/pdf", "text/plain"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("/upload", response_model=schemas.FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    current_user: models.User = Depends(security.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: .png, .jpg, .pdf, .txt")
    
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)
    
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    storage_key = f"{current_user.id}/{uuid.uuid4()}_{file.filename}"
    
    async with session.client(
        "s3",
        endpoint_url=settings.MINIO_URL,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
    ) as stream_client:
        
        await stream_client.upload_fileobj(
            file.file,
            BUCKET_NAME,
            storage_key,
            ExtraArgs={"ContentType": file.content_type}
        )
    
    new_file = models.File(
        owner_id=current_user.id,
        original_name=file.filename,
        storage_key=storage_key,
        mime_type=file.content_type,
        size=size
    )
    
    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)
    
    await redis_client.delete(f"user_files:{current_user.id}")
    
    return new_file

@router.get("/", response_model=list[schemas.FileResponse])
async def list_files(
    current_user: models.User = Depends(security.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    cache_key = f"user_files:{current_user.id}"
    
    cached_data = await redis_client.get(cache_key)
    if cached_data:
        return json.loads(cached_data)

    result = await db.execute(select(models.File).filter(models.File.owner_id == current_user.id))
    files = result.scalars().all()
    
    files_data = [schemas.FileResponse.model_validate(f).model_dump(mode='json') for f in files]
    await redis_client.set(cache_key, json.dumps(files_data), ex=300)
    
    return files

@router.get("/{file_id}/download")
async def download_file(
    file_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.File).filter(models.File.id == file_id, models.File.owner_id == current_user.id)
    )
    file_record = result.scalars().first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
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

    return StreamingResponse(
        stream_generator(),
        media_type=file_record.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{file_record.original_name}"'}
    )

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: AsyncSession = Depends(get_db),
    s3_client = Depends(get_s3_client)
):
    result = await db.execute(
        select(models.File).filter(models.File.id == file_id, models.File.owner_id == current_user.id)
    )
    file_record = result.scalars().first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    await s3_client.delete_object(Bucket=BUCKET_NAME, Key=file_record.storage_key)
    
    await db.delete(file_record)
    await db.commit()
    
    await redis_client.delete(f"user_files:{current_user.id}")
    return None
    
class ShareResponse(BaseModel):
    share_url: str
    expires_in: int
    
@router.get("/{file_id}/share", response_model=ShareResponse)
async def generate_share_link(
    file_id: int,
    expires_in: int = 3600,
    current_user: models.User = Depends(security.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.File).filter(models.File.id == file_id, models.File.owner_id == current_user.id)
    )
    file_record = result.scalars().first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
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
        
        # Rewrite internal Docker hostname to localhost for local testing
        if "minio:9000" in url:
            url = url.replace("minio:9000", "localhost:9000")
            
    return {"share_url": url, "expires_in": expires_in}