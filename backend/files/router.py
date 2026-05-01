from fastapi import APIRouter, Depends, status, UploadFile, File as FastAPIFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from auth.models import User
from .schemas import FileResponse, ShareResponse
from .service import (
    upload_file_service,
    list_user_files,
    download_file_service,
    delete_file_service,
    generate_share_link_service,
)
from storage import get_s3_client
import security

router = APIRouter()

@router.post("/upload", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(security.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    file_record = await upload_file_service(file, current_user, db)
    return file_record

@router.get("", response_model=list[FileResponse])
async def list_files(
    current_user: User = Depends(security.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    files = await list_user_files(current_user, db)
    return files

@router.get("/{file_id}/download")
async def download_file(
    file_id: int,
    current_user: User = Depends(security.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stream_generator, file_record = await download_file_service(file_id, current_user, db)
    
    return StreamingResponse(
        stream_generator,
        media_type=file_record.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{file_record.original_name}"'}
    )

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: int,
    current_user: User = Depends(security.get_current_user),
    db: AsyncSession = Depends(get_db),
    s3_client = Depends(get_s3_client)
):
    await delete_file_service(file_id, current_user, db, s3_client)
    return None

@router.get("/{file_id}/share", response_model=ShareResponse)
async def generate_share_link(
    file_id: int,
    expires_in: int = 3600,
    current_user: User = Depends(security.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    share_url = await generate_share_link_service(file_id, expires_in, current_user, db)
    return {"share_url": share_url, "expires_in": expires_in}
