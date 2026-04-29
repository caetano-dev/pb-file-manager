from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True

class FileResponse(BaseModel):
    id: int
    original_name: str
    mime_type: str
    size: int
    created_at: datetime

    class Config:
        from_attributes = True
      
class Token(BaseModel):
    access_token: str
    token_type: str