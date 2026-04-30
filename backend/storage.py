import aioboto3
from config import settings

BUCKET_NAME = "pixelbreeders"

session = aioboto3.Session()

async def get_s3_client():
    async with session.client(
        "s3",
        endpoint_url=settings.MINIO_URL,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
    ) as client:
        yield client

async def init_bucket():
    async with session.client(
        "s3",
        endpoint_url=settings.MINIO_URL,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
    ) as client:
        try:
            await client.head_bucket(Bucket=BUCKET_NAME)
        except Exception:
            await client.create_bucket(Bucket=BUCKET_NAME)