"""
수익 예측 AI Agent용 시스템 프롬프트
"""


def build_revenue_prediction_prompt(context: dict) -> str:
    """
    수익 예측을 위한 AI Agent 프롬프트를 생성합니다.
    
    context 필수 키:
      - crop_name: 작물명
      - area_sqm: 재배 면적 (㎡)
      - kamis_price: KAMIS 시세 정보 (dict)
      - planting_penalty: 파종 시기 페널티 (0~1)
      - avg_yield_per_sqm: 평년 단수 (kg/㎡)
      - sowing_month: 파종 월
      - actual_yield_kg: 사용자 입력 실제 수확량 (kg, optional)
      - weather_context: 현재 기상 정보 (optional)
    """
    crop_name = context.get("crop_name", "알 수 없음")
    area_sqm = context.get("area_sqm", 0)
    kamis_price = context.get("kamis_price", {})
    planting_penalty = context.get("planting_penalty", 1.0)
    avg_yield = context.get("avg_yield_per_sqm", 1.0)
    sowing_month = context.get("sowing_month")
    actual_yield = context.get("actual_yield_kg")
    weather = context.get("weather_context")
    optimal_period = context.get("optimal_sowing_period", "정보 없음")
    resolved_crop = context.get("resolved_kamis_crop")
    mapping_note = context.get("mapping_note")

    mapping_section = ""
    if resolved_crop and resolved_crop != crop_name:
        mapping_section = f"\n- KAMIS 표준 품목: {resolved_crop}"
    if mapping_note:
        mapping_section += f"\n- {mapping_note}"

    # 기본 수확량 산출
    base_yield = area_sqm * avg_yield
    adjusted_yield = base_yield * planting_penalty

    price_info = ""
    if "price" in kamis_price:
        price_info = f"현재 도매 시세: {kamis_price['price']:,}원/kg (기준일: {kamis_price.get('date', '오늘')})"
    else:
        price_info = (
            f"시세 조회 실패: {kamis_price.get('error', '알 수 없음')}. "
            "시세 숫자가 없어도 재배 면적·파종 시기·유사 품목 수급을 바탕으로 "
            "price_insight·revenue_insight 각각 2~3문장으로 작성하세요."
        )

    yield_section = ""
    if actual_yield is not None:
        yield_section = f"""
## 수확량 정보
- 사용자 입력 실제 수확량: {actual_yield:,.1f} kg (이 값을 기준으로 수익을 계산해주세요)
- 참고: AI 예측 수확량은 {adjusted_yield:,.1f} kg이었습니다."""
    else:
        yield_section = f"""
## 수확량 예측 정보
- 재배 면적: {area_sqm:,.1f} ㎡
- 평년 단수: {avg_yield:.2f} kg/㎡
- 기본 예측 수확량 (면적 × 평년 단수): {base_yield:,.1f} kg
- 파종 시기 보정 계수: {planting_penalty:.0%}
  → 파종 월: {sowing_month}월 / 최적 파종 시기: {optimal_period}
  → {'✅ 적기 파종' if planting_penalty >= 0.95 else '⚠️ 비적기 파종으로 수확량 감소 예상'}
- 보정 후 예측 수확량: {adjusted_yield:,.1f} kg"""

    weather_section = ""
    if weather:
        weather_section = f"""
## 기상 정보 (양평군 기준)
{weather}
→ 기상 조건이 수확량에 미치는 영향도 분석에 포함해주세요."""

    prompt = f"""당신은 대한민국 농업 경제 전문가입니다. 아래 데이터를 기반으로 농가의 예상 수익을 분석해주세요.

# 분석 대상
- 작물: {crop_name}{mapping_section}
- 재배 면적: {area_sqm:,.1f} ㎡ ({area_sqm / 3.3058:,.0f} 평)
- {price_info}
{yield_section}
{weather_section}

# 분석 요청사항
아래 필드 구조를 따른 순수 JSON 한 덩어리만 출력하세요. 마크다운·코드펜스·앞뒤 설명 금지.

예시 구조(플레이스홀더를 실제 값으로 채움):
{{
  "predicted_yield_kg": <최종 예측 수확량 (kg, 소수점 1자리)>,
  "predicted_price_per_kg": <예측 시세 (원/kg, 정수)>,
  "predicted_revenue": <예상 수익 (원, 정수)>,
  "yield_factors": {{
    "planting_time_impact": "<파종 시기가 수확량에 미치는 영향 설명 (1~2문장)>",
    "weather_impact": "<기상 조건이 수확량에 미치는 영향 설명 (1~2문장)>",
    "overall_adjustment": "<총체적 보정 설명 (1문장)>"
  }},
  "price_insight": "<시세 전망 인사이트 (2~3문장, 현재 시세 동향과 향후 전망 포함)>",
  "revenue_insight": "<수익 종합 인사이트 (2~3문장, 핵심 수익 전망과 농가에 도움이 되는 조언)>",
  "confidence": "<예측 신뢰도: '높음' | '보통' | '낮음'>"
}}

중요: 
1. 실제 수확량이 입력된 경우 그 값을 predicted_yield_kg에 그대로 사용하세요.
2. 수익 = 수확량(kg) × 시세(원/kg) 공식을 기본으로 하되, 유통 비용(약 20~30%)을 고려한 실수령액도 revenue_insight에 언급해주세요.
3. 파종 시기가 최적기가 아니면 구체적으로 어떤 영향이 있는지 설명해주세요.
4. 한국 농업 현실을 반영하여 실용적인 조언을 포함해주세요.
"""
    return prompt
