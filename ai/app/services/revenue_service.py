"""
수익 예측 AI 서비스
KAMIS 실시간 시세 + 환경 요인 + LLM Agent를 결합하여 예상 수익을 계산합니다.
"""

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
from app.utils.json_utils import extract_json

logger = logging.getLogger(__name__)

# LLM JSON 파싱 실패 시 사용자 안내 (실제 계산은 KAMIS·규칙 기반 폴백)
_PRICE_INSIGHT_PARSE_FALLBACK_WITH_KAMIS = (
    "AI 응답을 JSON으로 해석하지 못했습니다. "
    "KAMIS에서 조회한 현재 도매 시가를 가격으로 쓰고, 재배 면적·평년 단수·파종 시기를 반영한 규칙으로 수확량과 수익을 산출했습니다."
)
_PRICE_INSIGHT_PARSE_FALLBACK_NO_PRICE = (
    "AI 응답을 JSON으로 해석하지 못했고, 유효한 시세도 없어 가격·수익 산정에 한계가 있습니다."
)


def _build_revenue_json_repair_prompt(
    *,
    crop_name: str,
    area_sqm: float,
    kamis_result: dict,
    penalty: float,
    avg_yield: float,
    sowing_month: Optional[int],
    actual_yield_kg: Optional[float],
    weather_context: Optional[str],
    raw_snippet: str,
) -> str:
    price = kamis_result.get("price")
    price_note = f"{price:,}원/kg" if price is not None else "조회 실패"
    weather_line = (weather_context or "").strip()[:800]
    weather_block = f"\n기상(발췌): {weather_line}\n" if weather_line else ""
    snippet = (raw_snippet or "")[:2000]
    return f"""이전 응답이 JSON 파서에 맞지 않았습니다. 아래 스키마의 유효한 JSON **객체 하나만** 출력하세요.
마크다운·코드펜스·설명 문장은 넣지 마세요.

스키마:
{{
  "predicted_yield_kg": <number, 소수 1자리>,
  "predicted_price_per_kg": <integer>,
  "predicted_revenue": <integer>,
  "yield_factors": {{
    "planting_time_impact": "<string>",
    "weather_impact": "<string>",
    "overall_adjustment": "<string>"
  }},
  "price_insight": "<string>",
  "revenue_insight": "<string>",
  "confidence": "높음" | "보통" | "낮음"
}}

고정 컨텍스트:
- 작물: {crop_name}
- 면적(㎡): {area_sqm}
- KAMIS 시세(원/kg 또는 없음): {price_note}
- 파종 시기 페널티: {penalty:.4f}
- 평년 단수(kg/㎡): {avg_yield}
- 파종 월: {sowing_month}
- 사용자 실제 수확량(kg, 없으면 null): {actual_yield_kg}
{weather_block}
실패한 이전 응답(참고용, 그대로 복사하지 마세요):
{snippet}
"""


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

    # ── 7. JSON 파싱 (실패 시 1회 재생성) ──
    parsed = extract_json(raw_response)

    if not parsed:
        repair_prompt = _build_revenue_json_repair_prompt(
            crop_name=crop_name,
            area_sqm=area_sqm,
            kamis_result=kamis_result,
            penalty=penalty,
            avg_yield=avg_yield,
            sowing_month=sowing_month,
            actual_yield_kg=actual_yield_kg,
            weather_context=req.weather_context,
            raw_snippet=raw_response,
        )
        try:
            raw_retry = await llm.generate(
                repair_prompt, temperature=0.0, max_tokens=2048
            )
            logger.info("수익 예측 LLM JSON 재시도 응답 길이: %s", len(raw_retry))
            parsed = extract_json(raw_retry)
        except Exception as e:
            logger.warning("수익 예측 LLM JSON 재시도 실패: %s", e)

    if not parsed:
        logger.error(
            "LLM JSON 파싱 실패(재시도 포함). 응답 앞부분만 로깅: %s",
            raw_response[:500],
        )
        # Fallback: 단순 계산
        base_yield = area_sqm * avg_yield * penalty
        price = kamis_result.get("price", 0)
        final_yield = actual_yield_kg if actual_yield_kg else base_yield
        revenue = int(final_yield * price) if price else 0

        price_insight = (
            _PRICE_INSIGHT_PARSE_FALLBACK_WITH_KAMIS
            if price
            else _PRICE_INSIGHT_PARSE_FALLBACK_NO_PRICE
        )

        return RevenuePredictionResponse(
            crop_name=crop_name,
            area_sqm=area_sqm,
            predicted_yield_kg=round(final_yield, 1),
            predicted_price_per_kg=price,
            predicted_revenue=revenue,
            yield_factors={
                "planting_time_impact": f"파종 시기 보정 {penalty:.0%} 적용",
                "weather_impact": "기상 데이터 분석 불가",
                "overall_adjustment": "AI JSON 파싱 실패로 규칙 기반 계산 적용",
            },
            price_insight=price_insight,
            revenue_insight=f"현재 시세 기준 예상 수익은 {revenue:,}원입니다."
            if price
            else "시세가 없어 수익 추정이 불완전합니다.",
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
