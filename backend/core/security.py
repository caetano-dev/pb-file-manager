from datetime import datetime, timedelta, timezone
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import jwt
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from .database import get_db
from auth.models import User
from .config import settings

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 

ph = PasswordHasher()

def verify_password(plain_password, hashed_password) -> bool:
  try:
    return ph.verify(hashed_password, plain_password)
  except VerifyMismatchError:
    return False

def get_password_hash(password) -> str:
    return ph.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    token = request.cookies.get("token")
    
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    result = await db.execute(select(User).filter(User.id == int(user_id)))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user