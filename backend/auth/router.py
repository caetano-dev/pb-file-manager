from fastapi import APIRouter, Depends, status, HTTPException, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from .schemas import UserCreate, UserResponse
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

@router.post("/login")
async def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    try:
        user = await authenticate_user(form_data.username, form_data.password, db)
        access_token = create_access_token_for_user(user.id)
        
        response.set_cookie(
            key="token",
            value=access_token,
            httponly=True,
            secure=False, # Para desenvolvimento
            samesite="lax",
            max_age=86400  
        )
        return {"message": "Autenticado com sucesso"}
    except AuthenticationFailedError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("token")
    return {"message": "Deslogado com sucesso"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(security.get_current_user)):
    return current_user