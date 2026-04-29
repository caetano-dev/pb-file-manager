import os
import aioboto3

MINIO_URL = os.getenv("MINIO_URL", "http://minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
BUCKET_NAME = "pixelbreeders"

session = aioboto3.Session()

async def get_s3_client():
    async with session.client(
        "s3",
        endpoint_url=MINIO_URL,
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
    ) as client:
        yield client

async def init_bucket():
    async with session.client(
        "s3",
        endpoint_url=MINIO_URL,
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
    ) as client:
        try:
            await client.head_bucket(Bucket=BUCKET_NAME)
        except Exception:
            await client.create_bucket(Bucket=BUCKET_NAME)