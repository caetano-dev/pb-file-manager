from pydantic import BaseModel
from datetime import datetime

class FileResponse(BaseModel):
    id: int
    original_name: str
    mime_type: str
    size: int
    created_at: datetime
    version: int

    class Config:
        from_attributes = True

class ShareResponse(BaseModel):
    share_url: str
    expires_in: int
