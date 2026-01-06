from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./blue_tape.db"
    
    # Security
    secret_key: str = "your-super-secret-key-change-in-production"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"
    
    # Email (SendGrid)
    sendgrid_api_key: Optional[str] = None
    sendgrid_from_email: str = "noreply@yourdomain.com"
    
    # SMS (Twilio)
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_from_number: Optional[str] = None
    
    # Storage
    upload_dir: str = "./uploads"
    max_photo_size_mb: int = 10
    
    # App
    app_name: str = "Blue Tape"
    app_url: str = "http://localhost:3000"
    debug: bool = False
    
    # Additional email config
    email_from: str = "noreply@bluetape.app"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
