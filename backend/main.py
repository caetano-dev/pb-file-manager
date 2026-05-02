from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine, Base
from core.storage import init_bucket
from core.cache import redis_client
from auth.router import router as auth_router
from files.router import router as files_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_bucket()
    yield
    await redis_client.aclose()

app = FastAPI(title="Pixel Breeders API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(files_router, prefix="/files", tags=["Files"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "API is running"}