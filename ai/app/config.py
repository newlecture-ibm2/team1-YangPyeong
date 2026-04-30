"""
FarmBalance AI 서버 설정.
루트 .env.local에서 환경변수를 로딩합니다.
"""
from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


def _find_env_local() -> Path:
    """프로젝트 루트의 .env.local 경로를 탐색합니다."""
    # ai/app/config.py → ai/app → ai → 프로젝트 루트
    project_root = Path(__file__).resolve().parent.parent.parent
    env_path = project_root / ".env.local"
    if env_path.exists():
        return env_path
    # 폴백: ai 폴더 내 .env.local
    ai_env = Path(__file__).resolve().parent.parent / ".env.local"
    if ai_env.exists():
        return ai_env
    # 없으면 루트 경로를 반환 (환경변수 직접 주입 가정 — CI/CD)
    return env_path


class Settings(BaseSettings):
    """환경변수 기반 설정 클래스."""

    model_config = SettingsConfigDict(
        env_file=str(_find_env_local()),
        env_file_encoding="utf-8",
        extra="ignore",  # 알 수 없는 환경변수 무시
    )

    # ── 데이터베이스 ──
    # Python SQLAlchemy용 PostgreSQL URL
    # .env.local의 DB_URL은 jdbc 형식이므로 별도 변수 사용
    # 기본값 없음 — DATABASE_URL 환경변수가 없으면 DB 연결 비활성화
    database_url: str = ""

    # ── LLM 프로바이더 ──
    llm_provider: str = "gemini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    groq_api_key: str = ""

    # ── 정책/혜택 수집용 API Keys ──
    gov24_api_key: str = ""
    data_go_kr_api_key: str = ""
    nongsaro_api_key: str = ""
    kosis_api_key: str = ""
    kma_api_key: str = ""
    soil_api_key: str = ""

    # ── AI 서버 설정 ──
    scheduler_enabled: bool = False
    ai_server_port: int = 8000


@lru_cache()
def get_settings() -> Settings:
    """싱글턴 Settings 인스턴스를 반환합니다."""
    return Settings()
