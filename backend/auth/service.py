from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from .models import User
import security

async def register_user(email: str, password: str, db: AsyncSession) -> User:
    """Register a new user."""
    result = await db.execute(select(User).filter(User.email == email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = security.get_password_hash(password)
    new_user = User(email=email, hashed_password=hashed_pw)
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

async def authenticate_user(email: str, password: str, db: AsyncSession) -> User:
    """Authenticate user by email and password."""
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def create_access_token_for_user(user_id: int) -> str:
    """Create access token for user."""
    return security.create_access_token(data={"sub": str(user_id)})
