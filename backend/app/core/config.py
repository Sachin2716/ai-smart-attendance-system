import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartFace Attendance Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security & JWT
    SECRET_KEY: str = "smartface-super-secret-key-bca-aiml-2026-production-grade"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    # Default to local SQLite fallback so it works 100% out of the box without requiring external cloud credentials
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smartface.db")
    
    # Face Recognition Thresholds (Calibrated for SFace Deep ResNet)
    SIMILARITY_THRESHOLD: float = 0.50  # SFace cosine similarity threshold (true person: 0.85-0.99, imposter: 0.05-0.25)
    LIVENESS_THRESHOLD: float = 0.55    # Anti-spoofing threshold
    MIN_FACE_AREA_RATIO: float = 0.02   # Minimum face area relative to image
    BLUR_MIN_VARIANCE: float = 10.0     # Minimum Laplacian variance for blur detection
    BRIGHTNESS_MIN: float = 15.0        # Minimum mean luminance
    BRIGHTNESS_MAX: float = 245.0       # Maximum mean luminance
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
