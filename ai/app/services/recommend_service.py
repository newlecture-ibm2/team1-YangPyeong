import logging
import json
import re
from fastapi import UploadFile

from app.llm import get_llm
from app.llm.gemini import GeminiLLM
from app.models.recommend import ReasonRequest, ReasonResponse, DiagnoseResponse, WeightsRequest, WeightsResponse

logger = logging.getLogger(__name__)

def _extract_json(text: str) -> dict:
    match = re.search(r"```json\s*([\s\S]*?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return {}

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
    parsed = _extract_json(response_text)
    
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
    prompt = (
        f"다음 농장 정보를 바탕으로 '{req.crop_name}'({req.crop_category}) 작물이 "
        f"왜 추천되었는지 3문장 이내로 전문적이고 친절하게 설명해줘.\n"
        f"농장 정보: {req.farm_details}"
    )
    
    llm = get_llm("gemini")
    response_text = await llm.generate(prompt)
    return ReasonResponse(ai_reason=response_text)

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
