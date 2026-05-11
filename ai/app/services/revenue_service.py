"""
수익 예측 AI 서비스
KAMIS 실시간 시세 + 환경 요인 + LLM Agent를 결합하여 예상 수익을 계산합니다.
"""

import json
import re
import logging
from typing import Optional

from app.llm import get_llm
from app.agents.tools.kamis_tool import (
    fetch_kamis_price,
    get_planting_penalty,
    get_average_yield_per_sqm,
    OPTIMAL_SOWING_PERIODS,
)
from app.prompts.revenue_prompt import build_revenue_prediction_prompt
from app.models.revenue import RevenuePredictionRequest, RevenuePredictionResponse

logger = logging.getLogger(__name__)


def _extract_json(text: str) -> dict:
    """LLM 응답에서 JSON 블록을 추출합니다."""
    # ```json ... ``` 블록 추출 시도
    match = re.search(r"```json\s*([\s\S]*?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # 순수 JSON 시도
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # { ... } 패턴 검색
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    return {}


async def predict_revenue(req: RevenuePredictionRequest) -> RevenuePredictionResponse:
    """
    AI Agent를 활용한 수익 예측 메인 로직
    
    1. KAMIS API에서 실시간 도매 시세 조회
    2. 파종 시기 페널티 계산  
    3. 환경 요인(기후/토양) 가중치 적용
    4. LLM Agent가 종합 분석 후 인사이트 생성
    """
    crop_name = req.crop_name
    area_sqm = req.area_sqm
    sowing_month = req.sowing_month
    actual_yield_kg = req.actual_yield_kg

    logger.info(
        f"수익 예측 시작: crop={crop_name}, area={area_sqm}㎡, "
        f"sowing_month={sowing_month}, actual_yield={actual_yield_kg}"
    )

    # ── 1. KAMIS 실시간 시세 조회 (Backend 캐시 우선 사용) ──
    if req.kamis_price:
        kamis_result = req.kamis_price
        logger.info(f"Backend 캐시 시세 적용: {kamis_result}")
    else:
        kamis_result = await fetch_kamis_price(crop_name)
        logger.info(f"KAMIS 실시간 직접 조회 결과: {kamis_result}")

    # ── 2. 파종 시기 페널티 계산 ──
    penalty = get_planting_penalty(crop_name, sowing_month)
    logger.info(f"파종 시기 페널티: {penalty:.0%}")

    # ── 3. 평년 단수 조회 ──
    avg_yield = get_average_yield_per_sqm(crop_name)

    # ── 4. 최적 파종 시기 문자열 ──
    optimal = OPTIMAL_SOWING_PERIODS.get(crop_name)
    optimal_str = f"{optimal[0]}월 ~ {optimal[1]}월" if optimal else "정보 없음"

    # ── 5. Agent 프롬프트 구성 ──
    context = {
        "crop_name": crop_name,
        "area_sqm": area_sqm,
        "kamis_price": kamis_result,
        "planting_penalty": penalty,
        "avg_yield_per_sqm": avg_yield,
        "sowing_month": sowing_month,
        "actual_yield_kg": actual_yield_kg,
        "optimal_sowing_period": optimal_str,
        "weather_context": req.weather_context,
    }

    prompt = build_revenue_prediction_prompt(context)

    # ── 6. LLM 호출 ──
    llm = get_llm("gemini")
    raw_response = await llm.generate(prompt, temperature=0.2)
    logger.info(f"LLM 원본 응답 길이: {len(raw_response)}")

    # ── 7. JSON 파싱 ──
    parsed = _extract_json(raw_response)

    if not parsed:
        logger.error(f"LLM JSON 파싱 실패. 원본: {raw_response[:500]}")
        # Fallback: 단순 계산
        base_yield = area_sqm * avg_yield * penalty
        price = kamis_result.get("price", 0)
        final_yield = actual_yield_kg if actual_yield_kg else base_yield
        revenue = int(final_yield * price) if price else 0

        return RevenuePredictionResponse(
            crop_name=crop_name,
            area_sqm=area_sqm,
            predicted_yield_kg=round(final_yield, 1),
            predicted_price_per_kg=price,
            predicted_revenue=revenue,
            yield_factors={
                "planting_time_impact": f"파종 시기 보정 {penalty:.0%} 적용",
                "weather_impact": "기상 데이터 분석 불가",
                "overall_adjustment": "AI 분석 불가로 기본 계산 적용",
            },
            price_insight="AI 시세 분석을 일시적으로 사용할 수 없습니다. KAMIS 현재 시세 기준으로 산출하였습니다.",
            revenue_insight=f"현재 시세 기준 예상 수익은 {revenue:,}원입니다.",
            confidence="낮음",
            kamis_raw=kamis_result,
        )

    # ── 8. 응답 조합 ──
    return RevenuePredictionResponse(
        crop_name=crop_name,
        area_sqm=area_sqm,
        predicted_yield_kg=parsed.get("predicted_yield_kg", 0),
        predicted_price_per_kg=parsed.get("predicted_price_per_kg", 0),
        predicted_revenue=parsed.get("predicted_revenue", 0),
        yield_factors=parsed.get("yield_factors", {}),
        price_insight=parsed.get("price_insight", ""),
        revenue_insight=parsed.get("revenue_insight", ""),
        confidence=parsed.get("confidence", "보통"),
        kamis_raw=kamis_result,
    )
