"""
AI 서버 내부 키 검증 Dependency.
BFF에서 X-AI-Internal-Key 헤더로 전달한 키를 검증합니다.
"""
import logging
from fastapi import Header, HTTPException
from app.config import get_settings

logger = logging.getLogger(__name__)


async def verify_internal_key(
    x_ai_internal_key: str | None = Header(default=None),
) -> None:
    settings = get_settings()
    if not x_ai_internal_key or x_ai_internal_key != settings.AI_INTERNAL_SECRET_KEY:
        logger.warning("내부 키 검증 실패")
        raise HTTPException(status_code=401, detail="유효하지 않은 내부 키입니다.")
