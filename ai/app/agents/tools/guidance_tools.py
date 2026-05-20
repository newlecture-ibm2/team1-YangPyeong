"""Guidance Tools — 농장·재배·추천·수익 화면 유도."""
from __future__ import annotations

import logging
from typing import Any, Optional

import httpx
from langchain_core.tools import tool

from app.agents.navigation_urls import (
    FARM_DASHBOARD,
    FARM_RECOMMEND,
    FARM_REGISTER,
    PAGE_LABELS,
    PAGE_PATHS,
    login_with_callback,
)
from app.agents.shared import action_token, ensure_logged_in
from app.config import get_settings
from app.utils.backend_client import BackendError, call_backend, user_jwt_ctx

logger = logging.getLogger(__name__)


async def _fetch_agent_summary(farm_id: int) -> Optional[dict[str, Any]]:
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{settings.BACKEND_INTERNAL_URL.rstrip('/')}/api/internal/farms/{farm_id}/agent-summary",
                headers={"X-AI-Internal-Key": settings.AI_INTERNAL_SECRET_KEY},
            )
        if response.status_code != 200:
            return None
        body = response.json()
        return (body.get("data") or {}) if isinstance(body, dict) else None
    except Exception as exc:
        logger.warning("[Guidance] agent-summary 실패 farm_id=%s: %s", farm_id, exc)
        return None


async def _resolve_primary_farm_id() -> Optional[int]:
    if not user_jwt_ctx.get():
        return None
    try:
        data = await call_backend("GET", "/api/farms")
    except BackendError:
        return None
    farms = data.get("data") or []
    if not farms:
        return None
    first = farms[0]
    return first.get("id") if isinstance(first, dict) else None


def _navigate_message(page_key: str, *, prefix: str = "") -> str:
    url = PAGE_PATHS.get(page_key, FARM_DASHBOARD)
    label = PAGE_LABELS.get(page_key, "해당 화면")
    lead = f"{prefix} " if prefix else ""
    return f"{lead}{label}(으)로 안내해 드릴게요. " + action_token({"type": "NAVIGATE", "url": url})


@tool
async def get_farm_guidance_state() -> str:
    """농장·재배 등록 여부를 확인하고 다음에 갈 화면을 안내합니다.
    '작물 추천', '뭐 키울까', '재배 등록했어?', '내 농장 상태' 등 농장 준비 상태가 필요할 때 호출하세요."""
    if (msg := ensure_logged_in(login_url=login_with_callback(FARM_RECOMMEND))):
        return msg

    farm_id = await _resolve_primary_farm_id()
    if not farm_id:
        return (
            "[농장 안내] 등록된 농장이 없어요. 먼저 농장을 등록해 주세요. "
            + _navigate_message("farm_register")
        )

    summary = await _fetch_agent_summary(farm_id)
    if not summary:
        return (
            "[농장 안내] 농장 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요. "
            + _navigate_message("farm_register")
        )

    status = summary.get("farmStatus") or {}
    active_crops = status.get("activeCrops") or []
    farm_name = status.get("name") or "내 농장"
    crop_text = ", ".join(active_crops) if active_crops else "없음"

    if not active_crops:
        return (
            f"[농장 안내] {farm_name}에 재배 중인 작물이 아직 없어요. "
            "재배 작물을 등록한 뒤 AI 추천을 받을 수 있어요. "
            + _navigate_message("farm_register")
        )

    return (
        f"[농장 안내] {farm_name} — 재배 작물: {crop_text}. "
        "AI 작물 추천이나 수익 분석 화면으로 안내할 수 있어요."
    )


@tool
async def guide_to_crop_recommend() -> str:
    """AI 작물 추천 페이지로 안내합니다. '작물 추천', '뭐 키울까', 'AI 추천' 요청 시 호출하세요."""
    if (msg := ensure_logged_in(login_url=login_with_callback(FARM_RECOMMEND))):
        return msg

    farm_id = await _resolve_primary_farm_id()
    if not farm_id:
        return (
            "[추천 안내] 농장 등록 후 작물 추천을 받을 수 있어요. "
            + _navigate_message("farm_register")
        )

    summary = await _fetch_agent_summary(farm_id)
    active = (summary or {}).get("farmStatus", {}).get("activeCrops") or []
    if not active:
        return (
            "[추천 안내] 재배 작물을 먼저 등록해 주세요. "
            + _navigate_message("farm_register")
        )

    return _navigate_message("farm_recommend", prefix="[추천 안내] 조건이 갖춰졌어요.")


@tool
async def guide_to_farm_register() -> str:
    """농장·재배 작물 등록 화면으로 안내합니다. '농장 등록', '재배 작물 등록' 요청 시 호출하세요."""
    if (msg := ensure_logged_in(login_url=login_with_callback(FARM_REGISTER))):
        return msg
    return _navigate_message("farm_register", prefix="[등록 안내]")


@tool
async def guide_to_farm_dashboard() -> str:
    """내 농장 대시보드(수익·날씨·분석)로 안내합니다. '예상 수익', '수확량', '내 농장 보기' 요청 시 호출하세요."""
    if (msg := ensure_logged_in(login_url=login_with_callback(FARM_DASHBOARD))):
        return msg

    farm_id = await _resolve_primary_farm_id()
    if not farm_id:
        return (
            "[농장 안내] 등록된 농장이 없어요. "
            + _navigate_message("farm_register")
        )

    return _navigate_message("farm", prefix="[농장 안내]")


@tool
async def guide_to_balance() -> str:
    """수급·시세 분석 화면으로 안내합니다. (시세 자체는 balance_agent가 담당할 수 있음)"""
    return _navigate_message("balance", prefix="[시세 안내]")


@tool
async def navigate_guidance_page(page: str) -> str:
    """guidance 도메인에서 지정된 화면으로 이동합니다.

    Args:
        page: farm_register | farm | farm_recommend | balance | policy_recommend | community
    """
    key = page.strip().lower()
    if key not in PAGE_PATHS:
        return f"'{page}' 화면을 찾지 못했어요. 다시 말씀해 주실래요?"
    if key in ("farm", "farm_register", "farm_recommend") and (msg := ensure_logged_in()):
        return msg
    return _navigate_message(key, prefix="[화면 이동]")
