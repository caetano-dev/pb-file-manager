from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    MINIO_URL: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    REDIS_URL: str
    SECRET_KEY: str = "insecure_dev_key_change_in_production"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()