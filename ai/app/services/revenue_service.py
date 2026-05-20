"""
수익 예측 AI 서비스
KAMIS 실시간 시세 + 환경 요인 + LLM Agent를 결합하여 예상 수익을 계산합니다.
"""
import logging
from typing import Any, Optional
from app.llm import get_llm
from app.agents.tools.kamis_tool import (
    fetch_kamis_price,
    get_planting_penalty,
    get_average_yield_per_sqm,
    OPTIMAL_SOWING_PERIODS,
)
from app.prompts.revenue_prompt import build_revenue_prediction_prompt
from app.models.revenue import RevenuePredictionRequest, RevenuePredictionResponse
from app.utils.revenue_parse import (
    extract_revenue_json,
    is_revenue_parse_incomplete,
    salvage_revenue_fields,
)
from app.utils.kamis_resolve import resolve_standard_crop_name

logger = logging.getLogger(__name__)
_INSIGHT_MIN_LEN = 20
_REVENUE_LLM_MAX_TOKENS = 4096

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

def _default_yield_factors(penalty: float, used_rule_fallback: bool) -> dict[str, str]:
    if used_rule_fallback:
        return {
            "planting_time_impact": f"파종 시기 보정 {penalty:.0%} 적용",
            "weather_impact": "기상 데이터 분석 불가",
            "overall_adjustment": "AI JSON 파싱 실패로 규칙 기반 계산 적용",
        }
    return {
        "planting_time_impact": f"파종 시기 보정 {penalty:.0%}를 반영했습니다.",
        "weather_impact": "제공된 기상 정보를 수확량 추정에 반영했습니다.",
        "overall_adjustment": "KAMIS 시세·평년 단수·재배 면적을 종합해 산출했습니다.",
    }

def _kamis_price_int(kamis_result: dict) -> int:
    return int(kamis_result.get("price") or 0)

def _resolve_numeric_fields(
    *,
    parsed: dict,
    kamis_result: dict,
    area_sqm: float,
    avg_yield: float,
    penalty: float,
    actual_yield_kg: Optional[float],
) -> tuple[float, int, int]:
    kamis_price = _kamis_price_int(kamis_result)
    default_yield = area_sqm * avg_yield * penalty
    yield_kg = parsed.get("predicted_yield_kg")
    if not yield_kg or float(yield_kg) <= 0:
        yield_kg = actual_yield_kg if actual_yield_kg else default_yield
    else:
        yield_kg = float(yield_kg)
    price_kg = parsed.get("predicted_price_per_kg") or 0
    if not price_kg or int(price_kg) <= 0:
        price_kg = kamis_price
    else:
        price_kg = int(price_kg)
    revenue = parsed.get("predicted_revenue") or 0
    if not revenue or int(revenue) <= 0:
        revenue = int(yield_kg * price_kg) if price_kg else 0
    else:
        revenue = int(revenue)
    return round(float(yield_kg), 1), price_kg, revenue

def _assemble_response(
    *,
    crop_name: str,
    area_sqm: float,
    parsed: dict,
    kamis_result: dict,
    standard_crop: Optional[str],
    mapping_note: Optional[str],
    avg_yield: float,
    penalty: float,
    sowing_month: Optional[int],
    actual_yield_kg: Optional[float],
    used_rule_fallback: bool = False,
) -> RevenuePredictionResponse:
    kamis_price = _kamis_price_int(kamis_result)
    yield_kg, price_kg, revenue = _resolve_numeric_fields(
        parsed=parsed,
        kamis_result=kamis_result,
        area_sqm=area_sqm,
        avg_yield=avg_yield,
        penalty=penalty,
        actual_yield_kg=actual_yield_kg,
    )
    price_insight = (parsed.get("price_insight") or "").strip()
    revenue_insight = (parsed.get("revenue_insight") or "").strip()
    if len(price_insight) < _INSIGHT_MIN_LEN or len(revenue_insight) < _INSIGHT_MIN_LEN:
        fb_price, fb_revenue = _build_rule_based_insights(
            crop_name=crop_name,
            standard_crop=standard_crop,
            mapping_note=mapping_note,
            area_sqm=area_sqm,
            price=price_kg,
            final_yield=yield_kg,
            revenue=revenue,
            penalty=penalty,
            sowing_month=sowing_month,
            has_price=bool(price_kg),
        )
        if len(price_insight) < _INSIGHT_MIN_LEN:
            price_insight = fb_price
        if len(revenue_insight) < _INSIGHT_MIN_LEN:
            revenue_insight = fb_revenue
    yield_factors = parsed.get("yield_factors") or {}
    if not isinstance(yield_factors, dict) or not yield_factors:
        yield_factors = _default_yield_factors(penalty, used_rule_fallback)
    confidence = (parsed.get("confidence") or "").strip()
    if not confidence:
        confidence = "낮음" if not price_kg else ("보통" if used_rule_fallback else "보통")
    if used_rule_fallback and not price_kg:
        confidence = "낮음"
    return RevenuePredictionResponse(
        crop_name=crop_name,
        area_sqm=area_sqm,
        predicted_yield_kg=yield_kg,
        predicted_price_per_kg=price_kg,
        predicted_revenue=revenue,
        yield_factors=yield_factors,
        price_insight=price_insight,
        revenue_insight=revenue_insight,
        confidence=confidence,
        kamis_raw=kamis_result,
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
) -> str:
    price = kamis_result.get("price")
    price_note = f"{price:,}원/kg" if price is not None else "조회 실패"
    weather_line = (weather_context or "").strip()[:800]
    weather_block = f"\n기상(발췌): {weather_line}\n" if weather_line else ""
    default_yield = round(area_sqm * avg_yield * penalty, 1)
    default_revenue = int(default_yield * (price or 0)) if price else 0
    return f"""수익 예측 JSON만 출력하세요. 마크다운·코드펜스 금지.
각 문자열 필드는 120자 이내로 짧게 작성하세요.

{{
  "predicted_yield_kg": {default_yield},
  "predicted_price_per_kg": {int(price or 0)},
  "predicted_revenue": {default_revenue},
  "yield_factors": {{
    "planting_time_impact": "<80자 이내>",
    "weather_impact": "<80자 이내>",
    "overall_adjustment": "<50자 이내>"
  }},
  "price_insight": "<시세 2문장>",
  "revenue_insight": "<수익 2문장>",
  "confidence": "보통"
}}

컨텍스트: 작물={crop_name}, 면적={area_sqm}㎡, KAMIS={price_note}, 페널티={penalty:.0%}, 파종월={sowing_month}, 실수확={actual_yield_kg}
{weather_block}
숫자는 위 기본값을 기준으로 합리적으로 조정하되 predicted_revenue = yield × price를 맞추세요.
"""

async def _generate_revenue_llm(
    llm: Any, prompt: str, *, temperature: float
) -> str:
    return await llm.generate_json(
        prompt,
        temperature=temperature,
        max_tokens=_REVENUE_LLM_MAX_TOKENS,
    )

def _merge_parsed_best(
    current: dict, candidate: dict, *, kamis_price: int
) -> dict:
    if not candidate:
        return current
    if is_revenue_parse_incomplete(current, kamis_price=kamis_price):
        return candidate
    if is_revenue_parse_incomplete(candidate, kamis_price=kamis_price):
        return current
    return candidate if _score(candidate) >= _score(current) else current


async def _parse_llm_revenue(
    *,
    llm: Any,
    raw_response: str,
    crop_name: str,
    area_sqm: float,
    kamis_result: dict,
    penalty: float,
    avg_yield: float,
    sowing_month: Optional[int],
    actual_yield_kg: Optional[float],
    weather_context: Optional[str],
) -> dict:
    kamis_price = _kamis_price_int(kamis_result)
    parsed = extract_revenue_json(raw_response)
    logger.info("수익 예측 1차 파싱 키: %s", list(parsed.keys()) if parsed else [])

    if not is_revenue_parse_incomplete(parsed, kamis_price=kamis_price):
        return parsed

    salvaged = salvage_revenue_fields(raw_response)
    parsed = _merge_parsed_best(parsed, salvaged, kamis_price=kamis_price)
    if not is_revenue_parse_incomplete(parsed, kamis_price=kamis_price):
        logger.info("수익 예측 잘린 응답 필드 복구 성공")
        return parsed

    repair_prompt = _build_revenue_json_repair_prompt(
        crop_name=crop_name,
        area_sqm=area_sqm,
        kamis_result=kamis_result,
        penalty=penalty,
        avg_yield=avg_yield,
        sowing_month=sowing_month,
        actual_yield_kg=actual_yield_kg,
        weather_context=weather_context,
    )
    raw_retry = ""
    try:
        raw_retry = await _generate_revenue_llm(
            llm, repair_prompt, temperature=0.0
        )
        logger.info("수익 예측 LLM JSON 재시도 응답 길이: %s", len(raw_retry))
        retry_parsed = extract_revenue_json(raw_retry)
        logger.info(
            "수익 예측 재시도 파싱 키: %s",
            list(retry_parsed.keys()) if retry_parsed else [],
        )
        parsed = _merge_parsed_best(parsed, retry_parsed, kamis_price=kamis_price)
        if not is_revenue_parse_incomplete(parsed, kamis_price=kamis_price):
            return parsed
        retry_salvaged = salvage_revenue_fields(raw_retry)
        parsed = _merge_parsed_best(parsed, retry_salvaged, kamis_price=kamis_price)
    except Exception as e:
        logger.warning("수익 예측 LLM JSON 재시도 실패: %s", e)

    return parsed

def _score(parsed: dict) -> int:
    score = 0
    if parsed.get("price_insight"):
        score += 4
    if parsed.get("revenue_insight"):
        score += 4
    if parsed.get("predicted_yield_kg"):
        score += 2
    if parsed.get("predicted_price_per_kg"):
        score += 2
    if parsed.get("predicted_revenue"):
        score += 2
    return score

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
    raw_response = await _generate_revenue_llm(llm, prompt, temperature=0.2)
    logger.info(f"LLM 원본 응답 길이: {len(raw_response)}")
    # ── 7. JSON 파싱 (불완전 시 1회 재생성) ──
    parsed = await _parse_llm_revenue(
        llm=llm,
        raw_response=raw_response,
        crop_name=crop_name,
        area_sqm=area_sqm,
        kamis_result=kamis_result,
        penalty=penalty,
        avg_yield=avg_yield,
        sowing_month=sowing_month,
        actual_yield_kg=actual_yield_kg,
        weather_context=req.weather_context,
    )
    kamis_price = _kamis_price_int(kamis_result)
    if is_revenue_parse_incomplete(parsed, kamis_price=kamis_price):
        logger.error(
            "LLM JSON 파싱 불완전(재시도 포함). 응답 앞부분: %s",
            raw_response[:500],
        )
        # 숫자·인사이트는 KAMIS·규칙 기반으로 보강 (빈 parsed로도 화면에 표시 가능)
        return _assemble_response(
            crop_name=crop_name,
            area_sqm=area_sqm,
            parsed=parsed,
            kamis_result=kamis_result,
            standard_crop=standard_crop,
            mapping_note=mapping_note,
            avg_yield=avg_yield,
            penalty=penalty,
            sowing_month=sowing_month,
            actual_yield_kg=actual_yield_kg,
            used_rule_fallback=True,
        )
    # ── 8. 응답 조합 (KAMIS·규칙 기반으로 빈 필드 보강) ──
    return _assemble_response(
        crop_name=crop_name,
        area_sqm=area_sqm,
        parsed=parsed,
        kamis_result=kamis_result,
        standard_crop=standard_crop,
        mapping_note=mapping_note,
        avg_yield=avg_yield,
        penalty=penalty,
        sowing_month=sowing_month,
        actual_yield_kg=actual_yield_kg,
        used_rule_fallback=False,
    )
