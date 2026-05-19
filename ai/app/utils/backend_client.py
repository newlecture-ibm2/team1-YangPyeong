"""
Spring Boot 백엔드 호출 헬퍼.

Shop Agent 등 사용자 컨텍스트가 필요한 도구가 JWT를 자동으로 주입한 채로
백엔드 REST API를 호출할 수 있도록 ContextVar 기반의 인증 전파 메커니즘을 제공합니다.

사용 방법:
    # 라우터에서 invoke 직전:
    user_jwt_ctx.set(request.metadata.get("jwt"))

    # 도구 내부:
    data = await call_backend("GET", "/api/shop/cart")
"""
from __future__ import annotations

import logging
from contextvars import ContextVar
from typing import Any, Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

# 현재 요청의 JWT를 보관하는 ContextVar (비동기 요청 격리)
user_jwt_ctx: ContextVar[Optional[str]] = ContextVar("user_jwt", default=None)


class BackendError(Exception):
    """백엔드 호출 실패 (HTTP 4xx/5xx)."""

    def __init__(self, status_code: int, message: str, payload: Optional[dict[str, Any]] = None):
        super().__init__(f"[{status_code}] {message}")
        self.status_code = status_code
        self.message = message
        self.payload = payload


async def call_backend(
    method: str,
    path: str,
    *,
    json_body: Optional[dict[str, Any]] = None,
    params: Optional[dict[str, Any]] = None,
    timeout: float = 10.0,
) -> dict[str, Any]:
    """
    Spring Boot 백엔드를 호출하고 JSON 응답을 반환합니다.

    - JWT가 ContextVar에 있으면 Authorization 헤더에 자동 첨부
    - HTTP 오류 시 BackendError 발생 (status_code 보존)
    """
    settings = get_settings()
    base_url = settings.BACKEND_INTERNAL_URL.rstrip("/")
    url = f"{base_url}{path}"

    headers = {"Content-Type": "application/json"}
    jwt = user_jwt_ctx.get()
    if jwt:
        headers["Authorization"] = f"Bearer {jwt}"

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.request(
                method.upper(),
                url,
                headers=headers,
                json=json_body,
                params=params,
            )
    except httpx.RequestError as exc:
        logger.error("[BackendClient] 네트워크 오류: %s %s — %s", method, path, exc)
        raise BackendError(0, f"백엔드 통신 실패: {exc}") from exc

    if response.status_code >= 400:
        try:
            payload = response.json()
            message = (
                (payload.get("error") or {}).get("message")
                if isinstance(payload, dict)
                else None
            ) or response.text
        except ValueError:
            payload = None
            message = response.text or response.reason_phrase
        logger.warning(
            "[BackendClient] %s %s → %s: %s", method, path, response.status_code, message
        )
        raise BackendError(response.status_code, message, payload)

    try:
        return response.json()
    except ValueError:
        return {}
