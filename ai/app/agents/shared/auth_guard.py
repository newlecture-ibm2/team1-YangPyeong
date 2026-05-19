"""로그인 가드 — JWT ContextVar 기반.

도구가 사용자 데이터에 접근하기 전에 호출:

    @tool
    async def my_protected_tool(...) -> str:
        if (msg := ensure_logged_in()):
            return msg
        # 이후 백엔드 호출 로직...

백엔드가 게스트 요청을 허용하더라도 챗봇 측에서 사전 차단함으로써
의도하지 않은 데이터 변경/노출을 막는다.
"""
from __future__ import annotations

import logging
from typing import Optional

from app.agents.shared.action_token import action_token
from app.utils.backend_client import user_jwt_ctx

logger = logging.getLogger(__name__)


def login_required_message(login_url: str = "/login") -> str:
    """비로그인 사용자에게 보여줄 안내 + 로그인 페이지 NAVIGATE 액션."""
    return (
        "이 작업은 로그인이 필요해요. 로그인 화면으로 안내해 드릴게요. "
        + action_token({"type": "NAVIGATE", "url": login_url})
    )


def ensure_logged_in(login_url: str = "/login") -> Optional[str]:
    """JWT가 ContextVar에 없으면 로그인 안내 메시지 반환. 있으면 None.

    Returns:
        로그인 안내 문자열 (도구가 즉시 return 하면 됨) 또는 None (정상)
    """
    if not user_jwt_ctx.get():
        logger.info("[AuthGuard] 비로그인 상태 — 작업 거부")
        return login_required_message(login_url)
    return None
