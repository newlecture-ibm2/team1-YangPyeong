"""
FarmBalance Agent 서버 공통 설정
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
    AGENT_SERVER_PORT: int = 8001
    DEBUG: bool = False

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
