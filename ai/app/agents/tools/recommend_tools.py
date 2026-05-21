"""Recommend Tools — 최신 AI 작물 추천 이력 조회·해석."""
from __future__ import annotations

import logging
from typing import Any, Optional

from langchain_core.tools import tool

from app.agents.navigation_urls import FARM_RECOMMEND, login_with_callback
from app.agents.shared import action_token, ensure_logged_in
from app.agents.tools.guidance_tools import _resolve_primary_farm_id
from app.utils.backend_client import BackendError, call_backend

logger = logging.getLogger(__name__)

MODE_LABELS = {
    "PLAN": "신규 재배 계획",
    "PLANNED": "등록 작물(예정) 중심",
    "MANAGE": "재배 중 + 다음 시즌 참고",
    "MIXED": "재배 중 + 예정 작물 혼합",
}

ADVICE_LABELS = {
    "NEW_RECOMMEND": "신규 추천",
    "PLANNED_CROP": "등록 예정 작물",
    "IN_SEASON_COACHING": "재배 중 코칭",
    "NEXT_SEASON": "다음 시즌·참고",
}

SUPPLY_LABELS = {
    "EXCESS_WARN": "과잉 경고",
    "EXCESS_CAUTION": "과잉 주의",
    "BALANCED": "균형",
    "SHORT_CAUTION": "부족 주의",
    "SHORT_WARN": "부족 경고",
}

COACHING_STATUS_LABELS = {
    "ELIGIBLE": "AI 코칭 요청 가능",
    "OPTIONAL": "TOP3 — 버튼으로 코칭 가능",
    "HAS_AI": "AI 코칭 있음(새로고침 가능)",
    "NEEDS_DATA": "재배 데이터 입력 필요",
    "NOT_APPLICABLE": "코칭 대상 아님",
    "COMPLETED_IDLE": "수확 완료 — 복기 코칭 가능",
}


def _unwrap_data(body: dict[str, Any]) -> Optional[dict[str, Any]]:
    if not isinstance(body, dict):
        return None
    data = body.get("data")
    return data if isinstance(data, dict) else None


async def _fetch_latest_recommend(farm_id: int) -> Optional[dict[str, Any]]:
    try:
        body = await call_backend("GET", f"/api/recommend/{farm_id}/history/latest")
    except BackendError as exc:
        logger.warning("[Recommend] latest history 실패 farm_id=%s: %s", farm_id, exc)
        return None
    return _unwrap_data(body)


def _normalize_crop_name(name: str) -> str:
    return name.replace(" ", "").strip().lower()


def _find_crop_by_name(data: dict[str, Any], crop_name: str) -> Optional[tuple[str, dict[str, Any]]]:
    """Returns (list_kind, crop_dict) where list_kind is 'coaching' or 'recommendation'."""
    target = _normalize_crop_name(crop_name)
    if not target:
        return None

    for kind, key in (("coaching", "currentCropAdvices"), ("recommendation", "recommendations")):
        items = data.get(key) or []
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            name = item.get("cropName") or ""
            if _normalize_crop_name(str(name)) == target or target in _normalize_crop_name(str(name)):
                return kind, item
    return None


def _format_crop_line(item: dict[str, Any], *, include_coaching: bool = False) -> str:
    name = item.get("cropName") or "작물"
    rank = item.get("rank")
    score = item.get("score")
    soil = item.get("soilFitnessPercent")
    price = item.get("priceForecastPercent")
    supply = item.get("supplyStabilityPercent")
    advice = ADVICE_LABELS.get(item.get("adviceType") or "", item.get("adviceType") or "")
    supply_status = SUPPLY_LABELS.get(item.get("supplyStatus") or "", item.get("supplyStatus") or "")

    parts = [f"{rank}위 {name} — 종합 {score}점"]
    parts.append(f"토양 {soil}% · 시세 {price}% · 수급 {supply}%({supply_status})")
    if advice:
        parts.append(f"유형: {advice}")

    if include_coaching:
        status = item.get("aiCoachingStatus")
        if status:
            label = COACHING_STATUS_LABELS.get(status, status)
            parts.append(f"코칭: {label}")
            hint = item.get("aiCoachingHint")
            if hint and status == "NEEDS_DATA":
                parts.append(f"안내: {hint}")
        ai_reason = item.get("aiReason")
        if ai_reason and isinstance(ai_reason, str) and len(ai_reason.strip()) >= 12:
            snippet = ai_reason.strip().replace("\n", " ")
            if len(snippet) > 120:
                snippet = snippet[:117] + "…"
            parts.append(f"AI 코칭 요약: {snippet}")

    mismatch = item.get("mismatchNote")
    if mismatch:
        parts.append(f"주의: {mismatch}")

    return " | ".join(parts)


def _format_overview(data: dict[str, Any]) -> str:
    farm = data.get("farmInfo") or {}
    farm_name = farm.get("name") or "내 농장"
    mode = MODE_LABELS.get(data.get("recommendMode") or "", data.get("recommendMode") or "알 수 없음")
    generated = data.get("generatedAt") or "알 수 없음"

    lines = [
        f"[추천 결과] {farm_name} — 분석 모드: {mode}",
        f"분석 시각: {generated}",
    ]

    soil_ph = farm.get("soilPh")
    soil_type = farm.get("soilType")
    if soil_ph is not None or soil_type:
        lines.append(f"토양: pH {soil_ph if soil_ph is not None else '-'}, 유형 {soil_type or '-'}")

    coaching = data.get("currentCropAdvices") or []
    recs = data.get("recommendations") or []

    if coaching:
        lines.append("[재배·예정 작물 코칭]")
        for item in coaching[:5]:
            if isinstance(item, dict):
                lines.append("- " + _format_crop_line(item, include_coaching=True))

    if recs:
        lines.append("[신규·참고 추천 TOP]")
        for item in recs[:5]:
            if isinstance(item, dict):
                lines.append("- " + _format_crop_line(item, include_coaching=True))

    if not coaching and not recs:
        lines.append("추천 목록이 비어 있습니다. AI 작물 추천 화면에서 다시 분석해 주세요.")

    lines.append(
        "점수는 토양 35% + 시세 25% + 수급 25% + 난이도 15% 가중합입니다. "
        "상세 AI 코칭은 추천 상세 화면에서 요청할 수 있습니다."
    )
    return "\n".join(lines)


def _no_history_message() -> str:
    return (
        "[추천 결과] 아직 AI 작물 적합도 분석 이력이 없어요. "
        "AI 작물 추천 화면에서 「작물 적합도 다시 분석」을 실행해 주세요. "
        + action_token({"type": "NAVIGATE", "url": FARM_RECOMMEND})
    )


@tool
async def get_latest_recommend_overview() -> str:
    """최신 AI 작물 추천 결과 요약을 조회합니다.
    '1등 작물', 'TOP3', '추천 순위', '몇 점', '추천 결과 알려줘' 등 질문에 사용하세요."""
    if (msg := ensure_logged_in(login_url=login_with_callback(FARM_RECOMMEND))):
        return msg

    farm_id = await _resolve_primary_farm_id()
    if not farm_id:
        return "[추천 결과] 등록된 농장이 없어요. 농장 등록 후 분석할 수 있습니다."

    data = await _fetch_latest_recommend(farm_id)
    if not data:
        return _no_history_message()

    return _format_overview(data)


@tool
async def get_crop_recommendation_detail(crop_name: str) -> str:
    """특정 작물의 추천 점수·순위·코칭 상태를 조회합니다.
    '감자 몇 점', '배추 왜 추천', 'OO 작물 적합도' 질문에 사용하세요.

    Args:
        crop_name: 조회할 작물명 (예: 감자, 배추, 사과)
    """
    if (msg := ensure_logged_in(login_url=login_with_callback(FARM_RECOMMEND))):
        return msg

    farm_id = await _resolve_primary_farm_id()
    if not farm_id:
        return "[추천 결과] 등록된 농장이 없어요."

    data = await _fetch_latest_recommend(farm_id)
    if not data:
        return _no_history_message()

    found = _find_crop_by_name(data, crop_name)
    if not found:
        return (
            f"[추천 결과] '{crop_name}' 작물을 최신 추천 목록에서 찾지 못했어요. "
            "다른 이름으로 검색하거나 전체 순위를 확인해 주세요."
        )

    kind, item = found
    kind_label = "재배·예정 작물" if kind == "coaching" else "신규·참고 추천"
    detail = _format_crop_line(item, include_coaching=True)
    crop_id = item.get("cropId")
    nav = ""
    if crop_id:
        url = f"/farm/recommend/{crop_id}?farmId={farm_id}"
        nav = " " + action_token({"type": "NAVIGATE", "url": url})

    return f"[추천 결과] ({kind_label}) {detail}{nav}"


@tool
async def navigate_to_crop_recommend_detail(crop_name: str) -> str:
    """특정 작물의 AI 추천 상세 화면으로 이동합니다.

    Args:
        crop_name: 이동할 작물명
    """
    if (msg := ensure_logged_in(login_url=login_with_callback(FARM_RECOMMEND))):
        return msg

    farm_id = await _resolve_primary_farm_id()
    if not farm_id:
        return "[추천 안내] 등록된 농장이 없어요."

    data = await _fetch_latest_recommend(farm_id)
    if not data:
        return _no_history_message()

    found = _find_crop_by_name(data, crop_name)
    if not found:
        return f"'{crop_name}' 작물을 추천 목록에서 찾지 못했어요."

    _, item = found
    crop_id = item.get("cropId")
    if not crop_id:
        return f"'{crop_name}' 상세 정보를 열 수 없어요."

    url = f"/farm/recommend/{crop_id}?farmId={farm_id}"
    name = item.get("cropName") or crop_name
    return (
        f"[추천 안내] {name} 작물의 상세 분석 화면으로 안내해 드릴게요. "
        + action_token({"type": "NAVIGATE", "url": url})
    )
