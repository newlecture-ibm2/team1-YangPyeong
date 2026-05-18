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
from app.utils.kamis_resolve import resolve_standard_crop_name

logger = logging.getLogger(__name__)


def _build_rule_based_insights(
    *,
    crop_name: str,
    standard_crop: Optional[str],
    mapping_note: Optional[str],
    area_sqm: float,
    price: int,
    final_yield: float,
    revenue: int,
    penalty: float,
    sowing_month: Optional[int],
    has_price: bool,
) -> tuple[str, str]:
    std = standard_crop or crop_name
    mapping = f" {mapping_note}" if mapping_note else ""
    if has_price and price > 0:
        price_insight = (
            f"KAMIS 도매 기준 {std} 시세는 kg당 {price:,}원 수준입니다.{mapping} "
            f"최근 2주간 가격 변동을 감안할 때 단기 출하 시세는 보합~약보합으로 보이며, "
            f"품질·등급에 따라 실거래가는 차이가 날 수 있습니다."
        )
        net_hint = int(revenue * 0.75)
        revenue_insight = (
            f"재배 면적 {area_sqm:,.0f}㎡, 예상 수확량 {final_yield:,.1f}kg, "
            f"현재 시세를 적용한 총매출 약 {revenue:,}원입니다(유통비 25% 반영 실수령 약 {net_hint:,}원). "
            f"파종 시기 보정 {penalty:.0%}·{sowing_month or '현재'}월 기준으로 산출했으며, "
            f"실제 수확량·출하 시기에 따라 달라질 수 있습니다."
        )
        return price_insight, revenue_insight

    price_insight = (
        f"'{crop_name}'은(는) KAMIS 표준 품목과 직접 연동되지 않아 공식 도매 시세를 붙이지 못했습니다.{mapping} "
        f"유사 품목·지역 경매가·직거래 단가를 참고해 출하 계획을 세우는 것이 좋습니다."
    )
    revenue_insight = (
        f"재배 면적 {area_sqm:,.0f}㎡, 예상 수확량 {final_yield:,.1f}kg 기준으로 "
        f"생산 규모는 추정했으나 시세 부재로 금액 추정 신뢰도는 낮습니다. "
        f"파종 시기 보정 {penalty:.0%}를 반영했으며, 시세 확인 후 다시 예측하세요."
    )
    return price_insight, revenue_insight


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

    resolved = resolve_standard_crop_name(crop_name)
    standard_crop = resolved.standard_name
    mapping_note = req.mapping_note or resolved.mapping_note

    logger.info(
        f"수익 예측 시작: crop={crop_name}, standard={standard_crop}, area={area_sqm}㎡, "
        f"sowing_month={sowing_month}, actual_yield={actual_yield_kg}"
    )

    # ── 1. KAMIS 시세 (Backend 캐시 우선, 없을 때만 API) ──
    if req.kamis_price and req.kamis_price.get("price"):
        kamis_result = req.kamis_price
        logger.info("Backend 캐시 시세 적용: %s", kamis_result)
    elif standard_crop:
        kamis_result = await fetch_kamis_price(crop_name)
        logger.info("KAMIS API 조회 결과: %s", kamis_result)
    else:
        kamis_result = {"error": f"'{crop_name}' KAMIS 미매핑", "crop_name": crop_name}
        if mapping_note:
            kamis_result["mapping_note"] = mapping_note

    # ── 2. 파종 시기 페널티 계산 ──
    penalty = get_planting_penalty(crop_name, sowing_month)
    logger.info(f"파종 시기 페널티: {penalty:.0%}")

    # ── 3. 평년 단수 조회 ──
    avg_yield = get_average_yield_per_sqm(crop_name)

    # ── 4. 최적 파종 시기 문자열 ──
    lookup_crop = standard_crop or crop_name
    optimal = OPTIMAL_SOWING_PERIODS.get(lookup_crop)
    optimal_str = f"{optimal[0]}월 ~ {optimal[1]}월" if optimal else "정보 없음"

    # ── 5. Agent 프롬프트 구성 ──
    context = {
        "crop_name": crop_name,
        "resolved_kamis_crop": standard_crop,
        "mapping_note": mapping_note,
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

        price_insight, revenue_insight = _build_rule_based_insights(
            crop_name=crop_name,
            standard_crop=standard_crop,
            mapping_note=mapping_note,
            area_sqm=area_sqm,
            price=price or 0,
            final_yield=final_yield,
            revenue=revenue,
            penalty=penalty,
            sowing_month=sowing_month,
            has_price=bool(price),
        )

        return RevenuePredictionResponse(
            crop_name=crop_name,
            area_sqm=area_sqm,
            predicted_yield_kg=round(final_yield, 1),
            predicted_price_per_kg=price or 0,
            predicted_revenue=revenue,
            yield_factors={
                "planting_time_impact": f"파종 시기 보정 {penalty:.0%} 적용",
                "weather_impact": "기상 데이터 분석 불가",
                "overall_adjustment": "AI JSON 파싱 실패로 규칙 기반 계산 적용",
            },
            price_insight=price_insight,
            revenue_insight=revenue_insight,
            confidence="낮음" if not price else "보통",
            kamis_raw=kamis_result,
        )

    # ── 8. 응답 조합 ──
    price_val = parsed.get("predicted_price_per_kg") or kamis_result.get("price") or 0
    yield_kg = parsed.get("predicted_yield_kg", 0)
    revenue_val = parsed.get("predicted_revenue", 0)
    price_insight = (parsed.get("price_insight") or "").strip()
    revenue_insight = (parsed.get("revenue_insight") or "").strip()
    if len(price_insight) < 20 or len(revenue_insight) < 20:
        fb_price, fb_revenue = _build_rule_based_insights(
            crop_name=crop_name,
            standard_crop=standard_crop,
            mapping_note=mapping_note,
            area_sqm=area_sqm,
            price=int(price_val) if price_val else 0,
            final_yield=float(yield_kg) if yield_kg else area_sqm * avg_yield * penalty,
            revenue=int(revenue_val) if revenue_val else 0,
            penalty=penalty,
            sowing_month=sowing_month,
            has_price=bool(price_val),
        )
        if len(price_insight) < 20:
            price_insight = fb_price
        if len(revenue_insight) < 20:
            revenue_insight = fb_revenue

    return RevenuePredictionResponse(
        crop_name=crop_name,
        area_sqm=area_sqm,
        predicted_yield_kg=parsed.get("predicted_yield_kg", 0),
        predicted_price_per_kg=parsed.get("predicted_price_per_kg", 0),
        predicted_revenue=parsed.get("predicted_revenue", 0),
        yield_factors=parsed.get("yield_factors", {}),
        price_insight=price_insight,
        revenue_insight=revenue_insight,
        confidence=parsed.get("confidence", "보통"),
        kamis_raw=kamis_result,
    )
