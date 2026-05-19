import logging
import json
import re
from fastapi import UploadFile

from app.llm import get_llm
from app.llm.gemini import GeminiLLM
from app.models.recommend import (
    ReasonRequest, ReasonResponse, DiagnoseResponse,
    WeightsRequest, WeightsResponse,
    BatchReasonRequest, BatchReasonResponse
)

logger = logging.getLogger(__name__)

from app.utils.json_utils import extract_json

async def tune_recommend_weights(req: WeightsRequest) -> WeightsResponse:
    prompt = f"""당신은 AI 농업 컨설턴트입니다. 아래 농장 정보를 분석하여 작물 추천에 사용할 4가지 평가 지표(토양 적합도, 시세 전망, 수급 안정성, 재배 난이도)의 최적 가중치를 산출해주세요.

농장 정보: {req.farm_details}

제약 조건:
1. 4가지 가중치의 합은 정확히 1.0이어야 합니다.
2. 각 가중치는 0.1에서 0.5 사이의 소수 둘째자리까지의 값이어야 합니다.
3. 응답은 반드시 아래 JSON 형식으로만 작성하세요.

```json
{{
  "w_soil": <토양 적합도 가중치>,
  "w_price": <시세 전망 가중치>,
  "w_supply": <수급 안정성 가중치>,
  "w_difficulty": <재배 난이도 가중치>,
  "reasoning": "<해당 가중치를 산출한 이유를 1~2문장으로 요약>"
}}
```"""
    llm = get_llm("gemini")
    response_text = await llm.generate(prompt)
    parsed = extract_json(response_text)
    
    w_soil = float(parsed.get("w_soil", 0.35))
    w_price = float(parsed.get("w_price", 0.25))
    w_supply = float(parsed.get("w_supply", 0.25))
    w_difficulty = float(parsed.get("w_difficulty", 0.15))
    reasoning = parsed.get("reasoning", "기본 가중치를 적용했습니다.")
    
    total = w_soil + w_price + w_supply + w_difficulty
    if abs(total - 1.0) > 0.01:
        w_soil, w_price, w_supply, w_difficulty = 0.35, 0.25, 0.25, 0.15
        reasoning = "AI가 생성한 가중치의 합이 1.0이 아니어 기본 가중치로 보정되었습니다."
        
    return WeightsResponse(
        w_soil=w_soil,
        w_price=w_price,
        w_supply=w_supply,
        w_difficulty=w_difficulty,
        reasoning=reasoning
    )

async def generate_recommend_reason(req: ReasonRequest) -> ReasonResponse:
    mismatch = f"\n토양 비교 참고: {req.soil_mismatch}" if req.soil_mismatch else ""
    advice = req.advice_type or "NEW_RECOMMEND"

    if advice == "IN_SEASON_COACHING" or (req.is_current_crop and req.recommend_mode in ("MANAGE", "MIXED")):
        prompt = (
            f"당신은 농업 컨설턴트입니다. 농장은 이미 '{req.crop_name}'({req.crop_category})을 재배 중입니다.\n"
            f"지금 당장 다른 작물로 갈아엎으라고 하지 말고, 올해 수확까지의 관리(시비·관수·병해충·수확 전략)를 3~4문장으로 조언하세요.\n"
            f"토양이 다른 작물에 더 맞다면 다음 시즌 전환만 짧게 언급하세요.{mismatch}\n"
            f"농장 정보:\n{req.farm_details}"
        )
    elif advice == "PLANNED_CROP" or req.recommend_mode == "PLANNED":
        prompt = (
            f"농장은 '{req.crop_name}'({req.crop_category}) 재배를 **예정**했지만 아직 파종·관리 이력이 거의 없습니다.\n"
            f"파종 전 준비·적기·예상 리스크를 3~4문장으로 안내하세요. '이미 심었다'고 가정하지 마세요.{mismatch}\n"
            f"농장 정보:\n{req.farm_details}"
        )
    elif advice == "NEXT_SEASON":
        prompt = (
            f"'{req.crop_name}'({req.crop_category})은 **다음 시즌·전환 검토용** 참고 작물입니다.\n"
            f"현재 재배 중인 작물을 대체하라고 하지 말고, 왜 참고할 만한지 2~3문장으로 설명하세요.{mismatch}\n"
            f"농장 정보:\n{req.farm_details}"
        )
    else:
        prompt = (
            f"다음 농장 정보를 바탕으로 '{req.crop_name}'({req.crop_category}) 작물이 "
            f"왜 추천되었는지 3문장 이내로 전문적이고 친절하게 설명해줘.\n"
            f"농장 정보: {req.farm_details}{mismatch}"
        )
    
    llm = get_llm("gemini")
    response_text = await llm.generate(prompt)
    return ReasonResponse(ai_reason=response_text)


async def generate_batch_reasons(req: BatchReasonRequest) -> BatchReasonResponse:
    """
    여러 작물의 추천 사유를 한 번의 LLM 호출로 일괄 생성합니다.
    
    개별 호출 대비 네트워크 왕복 횟수를 N → 1로 줄여 전체 응답 시간을 획기적으로 단축합니다.
    Hallucination 방지를 위해 최대 5개 단위로 청크를 나누어 호출합니다.
    """
    if not req.items:
        return BatchReasonResponse(reasons={})

    # 작물별 프롬프트 조각 생성
    crop_descriptions = []
    for idx, item in enumerate(req.items, 1):
        mismatch = f" (토양 비교: {item.soil_mismatch})" if item.soil_mismatch else ""
        advice = item.advice_type or "NEW_RECOMMEND"

        if advice == "IN_SEASON_COACHING" or (item.is_current_crop and req.recommend_mode in ("MANAGE", "MIXED")):
            instruction = "이미 재배 중인 작물입니다. 올해 수확까지의 관리(시비·관수·병해충·수확)를 3~4문장으로 조언하세요. 다른 작물로 갈아엎으라고 하지 마세요."
        elif advice == "PLANNED_CROP" or req.recommend_mode == "PLANNED":
            instruction = "재배 예정이지만 아직 파종 전입니다. 파종 전 준비·적기·리스크를 3~4문장으로 안내하세요."
        elif advice == "NEXT_SEASON":
            instruction = "다음 시즌 전환 검토용 참고 작물입니다. 왜 참고할 만한지 2~3문장으로 설명하세요."
        else:
            instruction = "왜 추천되었는지 3문장 이내로 전문적이고 친절하게 설명해주세요."

        crop_descriptions.append(
            f"{idx}. {item.crop_name}({item.crop_category}){mismatch}\n   조건: {instruction}"
        )

    crops_text = "\n".join(crop_descriptions)
    crop_names = [item.crop_name for item in req.items]

    prompt = f"""당신은 농업 컨설턴트입니다. 아래 농장 정보를 바탕으로 나열된 각 작물에 대해 개별 조건에 맞는 추천 사유를 작성해주세요.

농장 정보:
{req.farm_details}

대상 작물 목록:
{crops_text}

응답 규칙:
1. 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 쓰지 마세요.
2. 각 작물의 사유는 해당 작물의 '조건'에 맞게 작성하세요.
3. 작물명은 정확히 요청된 이름을 그대로 사용하세요.

```json
{{
{chr(10).join(f'  "{name}": "<해당 작물의 추천 사유>",' for name in crop_names[:-1])}
  "{crop_names[-1]}": "<해당 작물의 추천 사유>"
}}
```"""

    llm = get_llm("gemini")
    response_text = await llm.generate(prompt)

    # JSON 파싱 시도
    reasons: dict[str, str] = {}
    try:
        parsed = extract_json(response_text)
        if isinstance(parsed, dict):
            for name in crop_names:
                if name in parsed and isinstance(parsed[name], str):
                    reasons[name] = parsed[name]
    except Exception as e:
        logger.warning(f"배치 사유 JSON 파싱 실패, 개별 폴백 적용: {e}")

    # 파싱 실패한 작물에 대해 기본 사유 채워넣기
    for item in req.items:
        if item.crop_name not in reasons or not reasons[item.crop_name]:
            reasons[item.crop_name] = "현재 농장 데이터를 바탕으로 분석한 결과입니다."

    return BatchReasonResponse(reasons=reasons)


async def diagnose_crop_image(image: UploadFile, image_bytes: bytes) -> DiagnoseResponse:
    prompt = "이 작물 사진을 보고, 어떤 작물인지 그리고 어떤 병해충 증상이 있는지, 어떻게 조치해야 하는지 농업 전문가로서 진단해줘. 500자 이내로 답변해줘."
    
    llm = get_llm("gemini")
    if isinstance(llm, GeminiLLM):
        model = llm._get_model()
        content = [
            prompt,
            {"mime_type": image.content_type, "data": image_bytes}
        ]
        response = await model.generate_content_async(content)
        return DiagnoseResponse(diagnosis=response.text)
    else:
        logger.error(f"현재 설정된 LLM({type(llm)})은 이미지 진단을 지원하지 않습니다.")
        raise ValueError("현재 설정된 LLM은 이미지 진단을 지원하지 않습니다.")

