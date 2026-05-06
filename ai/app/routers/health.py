"""
헬스체크 라우터.
서버 상태, DB 연결, LLM 연결을 확인합니다.
"""
from fastapi import APIRouter

from app.config import get_settings
from app.db import check_db_connection

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    """기본 헬스체크 — 서버 살아있는지만 확인."""
    return {"status": "ok", "service": "farm-ai-server"}


@router.get("/health/detail")
async def health_detail() -> dict:
    """
    상세 헬스체크.
    - DB 연결 상태
    - LLM Provider 정보
    - 환경변수 로딩 상태
    """
    settings = get_settings()

    # DB 연결 확인
    db_status = check_db_connection()

    # LLM Provider 확인
    llm_status: dict = {"provider": settings.LLM_PROVIDER}
    try:
        from app.llm import get_llm
        llm = get_llm()
        llm_status["status"] = "configured"
        llm_status["provider_name"] = llm.get_provider_name()
    except Exception as e:
        llm_status["status"] = "error"
        llm_status["message"] = str(e)

    # API 키 로딩 상태 (키 자체는 노출하지 않음)
    # TODO: 운영 환경에서는 api_keys 블록을 제거하거나,
    #        PROFILE=prod 분기로 상세 정보를 숨길 것.
    #        개발 환경에서만 set/missing 표시 허용.
    api_keys_status = {
        "gemini_api_key": "set" if settings.GEMINI_API_KEY else "missing",
        "groq_api_key": "set" if settings.GROQ_API_KEY else "missing",
        "gov24_api_key": "set" if settings.GOV24_API_KEY else "missing",
        "nongsaro_api_key": "set" if settings.NONGSARO_API_KEY else "missing",
        "soil_api_key": "set" if settings.SOIL_API_KEY else "missing",
        "kma_api_key": "set" if settings.KMA_API_KEY else "missing",
    }

    return {
        "status": "ok",
        "service": "farm-ai-server",
        "database": db_status,
        "llm": llm_status,
        "api_keys": api_keys_status,
        "scheduler_enabled": settings.SCHEDULER_ENABLED,
    }
