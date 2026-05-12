"""
FarmBalance AI 서버 공통 설정
환경변수에서 값을 읽어오며, .env 파일도 지원합니다.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """환경변수 기반 설정 클래스"""

    # ── LLM Provider 설정 ──
    LLM_PROVIDER: str = "groq"  # gemini | groq | bedrock

    # ── Gemini ──
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash-latest"

    # ── Groq ──
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # ── AWS Bedrock ──
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    BEDROCK_MODEL: str = "anthropic.claude-3-haiku-20240307-v1:0"

    # ── 서버 설정 ──
    AI_SERVER_PORT: int = 8000
    DEBUG: bool = False

    # ── DB (추후 RAG용) ──
    DATABASE_URL: Optional[str] = None

    # ── 외부 API 키 ──
    GOV24_API_KEY: Optional[str] = None
    NONGSARO_API_KEY: Optional[str] = None
    SOIL_API_KEY: Optional[str] = None
    KMA_API_KEY: Optional[str] = None

    # ── 백엔드 연동 ──
    BACKEND_INTERNAL_URL: str = "http://backend:8080"
    AI_INTERNAL_SECRET_KEY: str = "farm-balance-ai-secret-key"

    # ── 스케줄러 ──
    SCHEDULER_ENABLED: bool = False

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


# 싱글톤 인스턴스
settings = Settings()


def get_settings() -> Settings:
    """settings 싱글톤을 반환합니다."""
    return settings
