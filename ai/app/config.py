"""
FarmBalance AI 서버 공통 설정
환경변수에서 값을 읽어오며, .env 파일도 지원합니다.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """환경변수 기반 설정 클래스"""

    # ── LLM Provider 설정 ──
    LLM_PROVIDER: str = "gemini"  # gemini | groq | bedrock

    # ── Gemini ──
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # ── Groq ──
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.1-70b-versatile"

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

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


# 싱글톤 인스턴스
settings = Settings()
