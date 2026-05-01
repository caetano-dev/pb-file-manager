from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from .models import User
import security

class EmailAlreadyRegisteredError(ValueError):
    pass

class AuthenticationFailedError(ValueError):
    pass

async def register_user(email: str, password: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).filter(User.email == email))
    if result.scalars().first():
        raise EmailAlreadyRegisteredError("Email already registered")
    
    hashed_pw = security.get_password_hash(password)
    new_user = User(email=email, hashed_password=hashed_pw)
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

async def authenticate_user(email: str, password: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    
    if not user or not security.verify_password(password, user.hashed_password):
        raise AuthenticationFailedError("Incorrect email or password")
    return user

def create_access_token_for_user(user_id: int) -> str:
    return security.create_access_token(data={"sub": str(user_id)})
