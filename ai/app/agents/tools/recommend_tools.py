"""Recommend Tools — 최신 AI 작물 추천 이력 조회·해석."""
from __future__ import annotations

import logging
from typing import Any, Optional

from langchain_core.tools import tool

from app.agents.navigation_urls import FARM_RECOMMEND, login_with_callback, FARM_REGISTER
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
    "ELIGIBLE": "🟢 AI 코칭 가능",
    "OPTIONAL": "🟡 AI 코칭 가능 (선택)",
    "HAS_AI": "🔵 진행 중인 코칭 있음",
    "NEEDS_DATA": "🔴 데이터 부족 (재배 정보 입력 필요)",
    "NOT_APPLICABLE": "⚪ 코칭 대상 아님",
    "COMPLETED_IDLE": "🏁 수확 완료 (복기 가능)",
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


async def _fetch_all_recommend_history(farm_id: int) -> list[dict[str, Any]]:
    try:
        body = await call_backend("GET", f"/api/recommend/{farm_id}/history")
    except BackendError as exc:
        logger.warning("[Recommend] all history 실패 farm_id=%s: %s", farm_id, exc)
        return []
    
    data = body.get("data")
    if isinstance(data, list):
        return data
    return []


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

    # 메달 이모지
    medal = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else "🏅"

    parts = [f"{medal} {rank}위 {name} — 종합 {score}점"]
    parts.append(f"  🌍 토양 적합도: {soil}%")
    parts.append(f"  💰 시세 전망: {price}%")
    parts.append(f"  📊 수급 안정성: {supply}% ({supply_status})")
    
    if advice:
        parts.append(f"  📋 유형: {advice}")

    if include_coaching:
        status = item.get("aiCoachingStatus")
        if status:
            label = COACHING_STATUS_LABELS.get(status, f"🤖 코칭: {status}")
            parts.append(f"  {label}")
            hint = item.get("aiCoachingHint")
            if hint and status == "NEEDS_DATA":
                parts.append(f"  ⚠️ 안내: {hint}")
        ai_reason = item.get("aiReason")
        if ai_reason and isinstance(ai_reason, str) and len(ai_reason.strip()) >= 12:
            snippet = ai_reason.strip().replace("\n", " ")
            if len(snippet) > 120:
                snippet = snippet[:117] + "…"
            parts.append(f"  💡 코칭 요약: {snippet}")

    mismatch = item.get("mismatchNote")
    if mismatch:
        parts.append(f"  🚨 주의: {mismatch}")

    return "\n".join(parts)


def _format_overview(data: dict[str, Any]) -> str:
    farm = data.get("farmInfo") or {}
    farm_name = farm.get("name") or "내 농장"
    mode = MODE_LABELS.get(data.get("recommendMode") or "", data.get("recommendMode") or "알 수 없음")
    generated = data.get("generatedAt") or "알 수 없음"

    lines = [
        f"📊 **[추천 결과 요약] {farm_name}**",
        f"▪️ 분석 모드: {mode}",
        f"▪️ 분석 시각: {generated}",
    ]

    soil_ph = farm.get("soilPh")
    soil_type = farm.get("soilType")
    if soil_ph is not None or soil_type:
        lines.append(f"▪️ 토양: pH {soil_ph if soil_ph is not None else '-'}, 유형 {soil_type or '-'}")
    
    lines.append("")

    coaching = data.get("currentCropAdvices") or []
    recs = data.get("recommendations") or []

    if coaching:
        lines.append("🌱 **[재배·예정 작물 코칭]**")
        for item in coaching[:5]:
            if isinstance(item, dict):
                lines.append(_format_crop_line(item, include_coaching=True))
                lines.append("")

    if recs:
        lines.append("🌟 **[신규·참고 추천 TOP]**")
        for item in recs[:5]:
            if isinstance(item, dict):
                lines.append(_format_crop_line(item, include_coaching=True))
                lines.append("")

    if not coaching and not recs:
        lines.append("추천 목록이 비어 있습니다. AI 작물 추천 화면에서 다시 분석해 주세요.")
        lines.append("")

    lines.append(
        "ℹ️ 점수는 토양(35%) + 시세(25%) + 수급(25%) + 난이도(15%) 가중합입니다.\n"
        "더 자세한 AI 코칭을 보려면 작물 이름을 포함해 'OO 상세 보여줘' 라고 말씀해 주세요."
    )
    return "\n".join(lines)


def _no_history_message() -> str:
    return (
        "[추천 결과] 아직 AI 작물 적합도 분석 이력이 없어요.\n\n"
        "📌 분석을 시작하려면:\n"
        "1️⃣ 농장 등록 (토양 정보 입력)\n"
        "2️⃣ 재배 작물 등록\n"
        "3️⃣ AI 작물 추천 화면에서 「작물 적합도 다시 분석」 클릭\n\n"
        "지금 추천 화면으로 안내할까요?"
        + action_token({"type": "NAVIGATE", "url": FARM_RECOMMEND})
    )

def _no_farm_message() -> str:
    return (
        "[추천 결과] 농장 등록이 필요해요.\n\n"
        "AI 작물 추천을 받으려면 먼저 농장(토양 정보)을 등록해야 합니다.\n"
        "지금 농장 등록 화면으로 이동할까요?"
        + action_token({"type": "NAVIGATE", "url": FARM_REGISTER})
    )


@tool
async def get_latest_recommend_overview() -> str:
    """최신 AI 작물 추천 결과 요약을 조회합니다.
    '1등 작물', 'TOP3', '추천 순위', '몇 점', '추천 결과 알려줘' 등 질문에 사용하세요."""
    if (msg := ensure_logged_in(login_url=login_with_callback(FARM_RECOMMEND))):
        return msg

    farm_id = await _resolve_primary_farm_id()
    if not farm_id:
        return _no_farm_message()

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
        return _no_farm_message()

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
        reg_id = item.get("registrationId")
        if reg_id is not None:
            url += f"&registrationId={reg_id}"
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
        return _no_farm_message()

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

def _format_comparison(items: list[dict[str, Any]]) -> str:
    if not items:
        return "비교할 작물 데이터가 없습니다."
        
    lines = ["⚖️ **작물 비교 결과**\n"]
    
    # 헤더
    header = "| 항목 | " + " | ".join([str(item.get("cropName", "작물")) for item in items]) + " |"
    divider = "|---|" + "|".join(["---"] * len(items)) + "|"
    lines.append(header)
    lines.append(divider)
    
    # 종합 점수
    score_line = "| 종합 | " + " | ".join([f'{item.get("score", "-")}점' for item in items]) + " |"
    lines.append(score_line)
    
    # 토양
    soil_line = "| 토양 | " + " | ".join([f'{item.get("soilFitnessPercent", "-")}%' for item in items]) + " |"
    lines.append(soil_line)
    
    # 시세
    price_line = "| 시세 | " + " | ".join([f'{item.get("priceForecastPercent", "-")}%' for item in items]) + " |"
    lines.append(price_line)
    
    # 수급
    supply_line = "| 수급 | " + " | ".join([f'{item.get("supplyStabilityPercent", "-")}%' for item in items]) + " |"
    lines.append(supply_line)
    
    # 유형
    advice_line = "| 유형 | " + " | ".join([ADVICE_LABELS.get(item.get("adviceType", ""), "추천") for item in items]) + " |"
    lines.append(advice_line)
    
    return "\n".join(lines)

@tool
async def compare_crop_recommendations(crop_names: str) -> str:
    """두 개 이상의 작물의 추천 점수를 비교합니다.
    '감자 vs 배추', '감자랑 고구마 비교' 요청 시 사용하세요.
    
    Args:
        crop_names: 비교할 작물명들 (쉼표 또는 'vs'로 구분. 예: '감자, 배추')
    """
    if (msg := ensure_logged_in(login_url=login_with_callback(FARM_RECOMMEND))):
        return msg

    farm_id = await _resolve_primary_farm_id()
    if not farm_id:
        return _no_farm_message()

    data = await _fetch_latest_recommend(farm_id)
    if not data:
        return _no_history_message()

    names = [n.strip() for n in crop_names.replace("vs", ",").replace("랑", ",").replace("하고", ",").replace("과", ",").replace("와", ",").split(",")]
    names = [n for n in names if n]
    
    # 비교는 최대 3개까지만
    names = names[:3]
    
    found_items = []
    not_found = []
    
    for name in names:
        found = _find_crop_by_name(data, name)
        if found:
            found_items.append(found[1])
        else:
            not_found.append(name)
            
    if not found_items:
        return f"요청하신 작물({', '.join(names)})을 최근 분석 결과에서 찾을 수 없습니다."
        
    res = _format_comparison(found_items)
    if not_found:
        res += f"\n\n(※ '{', '.join(not_found)}' 작물은 최근 추천 목록에 없어 비교에서 제외되었습니다.)"
        
    return res

@tool
async def get_recommendations_by_score_type(score_type: str) -> str:
    """특정 점수 기준으로 추천 작물을 정렬합니다.
    '토양 점수 높은 순', '시세 전망 좋은 작물' 요청 시 사용하세요.
    
    Args:
        score_type: 'soil'(토양), 'price'(시세), 'supply'(수급), 'difficulty'(난이도), 'score'(종합) 중 하나
    """
    if (msg := ensure_logged_in(login_url=login_with_callback(FARM_RECOMMEND))):
        return msg

    farm_id = await _resolve_primary_farm_id()
    if not farm_id:
        return _no_farm_message()

    data = await _fetch_latest_recommend(farm_id)
    if not data:
        return _no_history_message()

    recs = data.get("recommendations", [])
    advices = data.get("currentCropAdvices", [])
    
    # 모든 작물 합치기
    all_items = []
    if isinstance(recs, list): all_items.extend(recs)
    if isinstance(advices, list): all_items.extend(advices)
    
    if not all_items:
        return "추천 목록이 비어 있습니다."
        
    key_map = {
        "soil": ("토양 점수", "soilFitnessPercent"),
        "price": ("시세 전망", "priceForecastPercent"),
        "supply": ("수급 안정성", "supplyStabilityPercent"),
        "difficulty": ("난이도", "score"), # 난이도 필드가 명확치 않음(score에 반영). 일단 대체
        "score": ("종합 점수", "score"),
    }
    
    stype = score_type.lower()
    
    # 매핑되지 않은 키워드가 들어온 경우 휴리스틱 매핑
    if "토양" in stype: stype = "soil"
    elif "시세" in stype or "전망" in stype: stype = "price"
    elif "수급" in stype: stype = "supply"
    elif "난이도" in stype or "초보" in stype: stype = "difficulty"
    
    label, sort_key = key_map.get(stype, key_map["score"])
    
    # 내림차순 정렬
    sorted_items = sorted(all_items, key=lambda x: x.get(sort_key, 0) if isinstance(x, dict) else 0, reverse=True)
    
    lines = [f"📈 **[{label} 기준 상위 작물]**\n"]
    for i, item in enumerate(sorted_items[:5]):
        name = item.get("cropName", "작물")
        val = item.get(sort_key, 0)
        suffix = "%" if sort_key.endswith("Percent") else "점"
        lines.append(f"{i+1}. {name} : {val}{suffix}")
        
    return "\n".join(lines)

@tool
async def get_recommend_analysis_info() -> str:
    """최신 추천 분석의 시각, 모드 등 메타 정보를 조회합니다.
    '분석 언제 했어?', '분석 모드 뭐야' 요청 시 사용하세요.
    """
    if (msg := ensure_logged_in(login_url=login_with_callback(FARM_RECOMMEND))):
        return msg

    farm_id = await _resolve_primary_farm_id()
    if not farm_id:
        return _no_farm_message()

    data = await _fetch_latest_recommend(farm_id)
    if not data:
        return _no_history_message()

    farm = data.get("farmInfo") or {}
    farm_name = farm.get("name") or "내 농장"
    mode = MODE_LABELS.get(data.get("recommendMode") or "", data.get("recommendMode") or "알 수 없음")
    generated = data.get("generatedAt") or "알 수 없음"
    
    return f"[{farm_name}] 마지막 AI 작물 분석은 **{generated}**에 실행되었습니다. (분석 모드: {mode})\n최신 데이터로 다시 분석하려면 작물 추천 화면에서 '다시 분석'을 실행해 주세요."

@tool
async def get_needs_data_guidance(crop_name: str) -> str:
    """코칭 상태가 NEEDS_DATA인 작물에 대해 필요한 데이터 입력 안내를 제공합니다.
    
    Args:
        crop_name: 안내할 작물명
    """
    if (msg := ensure_logged_in(login_url=login_with_callback(FARM_RECOMMEND))):
        return msg

    farm_id = await _resolve_primary_farm_id()
    if not farm_id:
        return _no_farm_message()

    data = await _fetch_latest_recommend(farm_id)
    if not data:
        return _no_history_message()

    found = _find_crop_by_name(data, crop_name)
    if not found:
        return f"'{crop_name}' 작물을 추천 목록에서 찾을 수 없습니다."
        
    _, item = found
    hint = item.get("aiCoachingHint", "정확한 AI 코칭을 위해 재배 작물 등록 등 추가 데이터가 필요합니다.")
    reg_id = item.get("registrationId")
    
    # registrationId가 있으면 기존 작물 수정 화면으로, 없으면 신규 등록 화면으로 안내
    nav_url = f"/farm/cultivation-register/edit/{reg_id}" if reg_id else "/farm/cultivation-register"
    
    return (
        f"⚠️ **{crop_name} AI 코칭 불가 (데이터 부족)**\n\n"
        f"{hint}\n\n"
        "아래 버튼을 눌러 데이터를 입력하시면 더 정확한 코칭을 받을 수 있습니다.\n"
        + action_token({"type": "NAVIGATE", "url": nav_url})
    )

@tool
async def compare_with_previous_recommendation() -> str:
    """최근 추천 이력 2건을 비교하여, 지난 분석 대비 점수나 순위 변동 사항을 알려줍니다.
    '지난번 추천이랑 달라진 거 있어?', '추천 점수가 올랐어?' 질문에 사용하세요.
    """
    if (msg := ensure_logged_in(login_url=login_with_callback(FARM_RECOMMEND))):
        return msg

    farm_id = await _resolve_primary_farm_id()
    if not farm_id:
        return _no_farm_message()

    history = await _fetch_all_recommend_history(farm_id)
    if len(history) < 2:
        return "최소 2회 이상의 분석 이력이 있어야 비교가 가능합니다. AI 작물 추천 화면에서 새로운 분석을 실행해 보세요."

    latest = history[0]
    previous = history[1]
    
    latest_date = latest.get("generatedAt", "최근")
    prev_date = previous.get("generatedAt", "이전")
    
    # 1. 1등 작물 비교
    def get_top_crop(data):
        recs = data.get("recommendations", [])
        for r in recs:
            if isinstance(r, dict) and r.get("rank") == 1:
                return r
        return None
        
    latest_top = get_top_crop(latest)
    prev_top = get_top_crop(previous)
    
    lines = [f"📊 **[추천 이력 비교]**\n(기준: {prev_date} ➔ {latest_date})\n"]
    
    if latest_top and prev_top:
        lt_name = latest_top.get("cropName")
        pt_name = prev_top.get("cropName")
        lt_score = latest_top.get("score", 0)
        pt_score = prev_top.get("score", 0)
        
        if lt_name == pt_name:
            diff = lt_score - pt_score
            diff_str = f"{diff}점 상승 🔼" if diff > 0 else f"{abs(diff)}점 하락 🔽" if diff < 0 else "동일"
            lines.append(f"• **1위 유지**: '{lt_name}' 작물이 여전히 1위를 기록했습니다. (종합 점수: {pt_score}점 ➔ {lt_score}점, {diff_str})")
        else:
            lines.append(f"• **1위 변동**: 1위 작물이 '{pt_name}'({pt_score}점)에서 **'{lt_name}'**({lt_score}점)으로 변경되었습니다! 🔄")
            
    # 2. 상위권 진입/탈락 요약 (TOP 3 기준)
    def get_top3_names(data):
        recs = data.get("recommendations", [])
        return {r.get("cropName") for r in recs if isinstance(r, dict) and r.get("rank", 99) <= 3 and r.get("cropName")}
        
    latest_top3 = get_top3_names(latest)
    prev_top3 = get_top3_names(previous)
    
    new_entries = latest_top3 - prev_top3
    dropped = prev_top3 - latest_top3
    
    if new_entries:
        lines.append(f"• **새로운 TOP 3 진입**: {', '.join(new_entries)} 작물이 상위권으로 올라왔습니다. 🎉")
    if dropped:
        lines.append(f"• **TOP 3 이탈**: {', '.join(dropped)} 작물은 상위권에서 내려갔습니다.")
        
    if not new_entries and not dropped and lt_name == pt_name:
        lines.append("• 전체적으로 이전 분석 대비 상위권 작물 순위에 큰 변동이 없습니다.")
        
    lines.append("\n상세한 변동 내역을 보시려면 추천 화면에서 지난 이력을 확인해 주세요.")
    return "\n".join(lines)
