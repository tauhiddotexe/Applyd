import boto3
import uuid
from pathlib import Path
from botocore.exceptions import ClientError
from app.core.config import settings
from app.core.logging import logger

class S3Service:
    def __init__(self):
        self.s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket = settings.AWS_S3_BUCKET

    def upload_file(self, file_bytes: bytes, filename: str, content_type: str = None) -> str:
        """
        Uploads a file to S3 and returns the public URL.
        """
        if not self.bucket:
            logger.error("AWS_S3_BUCKET not configured")
            raise ValueError("S3 Bucket not configured")

        extension = Path(filename).suffix
        stored_name = f"{uuid.uuid4()}{extension}"
        
        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            # For public access (adjust if using CloudFront or private bucket)
            extra_args['ACL'] = 'public-read'

            self.s3.put_object(
                Bucket=self.bucket,
                Key=stored_name,
                Body=file_bytes,
                **extra_args
            )
            
            url = f"https://{self.bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{stored_name}"
            logger.info(f"Uploaded file to S3: {url}")
            return url
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            raise e

s3_service = S3Service()
