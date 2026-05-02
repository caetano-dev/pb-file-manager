from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from .schemas import UserCreate, UserResponse, Token
from .models import User
from .service import (register_user, authenticate_user, create_access_token_for_user, EmailAlreadyRegisteredError, AuthenticationFailedError)
from core import security 

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        new_user = await register_user(user.email, user.password, db)
        return new_user
    except EmailAlreadyRegisteredError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    try:
        user = await authenticate_user(form_data.username, form_data.password, db)
        access_token = create_access_token_for_user(user.id)
        return {"access_token": access_token, "token_type": "bearer"}
    except AuthenticationFailedError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(security.get_current_user)):
    return current_user