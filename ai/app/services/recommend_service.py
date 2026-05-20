import logging

from fastapi import UploadFile

from app.llm import get_llm
from app.llm.gemini import GeminiLLM
from app.models.recommend import (
    ReasonRequest,
    ReasonResponse,
    DiagnoseResponse,
    WeightsRequest,
    WeightsResponse,
    BatchReasonRequest,
    BatchReasonResponse,
    BatchReasonItem,
)
from app.utils.json_utils import extract_json
from app.utils.recommend_reason_parse import (
    align_reasons_to_crops,
    is_placeholder_reason,
    normalize_reason_text,
    parse_batch_reasons_response,
)

logger = logging.getLogger(__name__)

_REASON_MAX_TOKENS = 4096
_MIN_REASON_CHARS = 200


def _reason_writing_guidelines() -> str:
    return (
        "\n\n[작성 규칙 — 반드시 준수]\n"
        "- **5~7문장**, 총 **400~600자** 분량의 한국어 평문으로 작성하세요.\n"
        "- (1) 토양·필지 환경 적합성 (2) 시세·수익 전망 (3) 지역 수급·판로 (4) 재배·관리 실행 포인트를 "
        "각각 1문장 이상 포함하세요.\n"
        "- 농장 정보의 면적·pH·재배 현황·관리 이력 중 **2가지 이상**을 구체적으로 인용하세요.\n"
        "- 과장·투자 권유는 피하고, 현장 농업 컨설턴트 말투로 친절하게 작성하세요."
    )


def _reason_instruction(advice: str, *, is_current_crop: bool, recommend_mode: str) -> str:
    if advice == "IN_SEASON_COACHING":
        return (
            "이미 재배 중인 작물입니다. 올해 수확까지 시비·관수·병해충·수확 시기·품질 관리를 "
            "구체적으로 조언하세요. 다른 작물로 갈아엎으라고 하지 마세요."
        )
    if advice == "PLANNED_CROP":
        return (
            "재배 예정이지만 아직 파종 전입니다. 파종 전 토양 준비·적기·초기 관리·기상 리스크를 "
            "단계별로 안내하세요."
        )
    if advice == "NEXT_SEASON":
        return (
            "다음 시즌 전환 검토용 참고 작물입니다. 현재 재배와의 윤작·수익·리스크 관점에서 "
            "왜 참고할 만한지 설명하세요."
        )
    if is_current_crop and recommend_mode in ("MANAGE", "MIXED"):
        return (
            "이미 재배 중인 작물입니다. 올해 수확까지의 관리·시장 출하·품질 포인트를 "
            "구체적으로 조언하세요. 갈아엎기를 권하지 마세요."
        )
    return (
        "신규 추천 작물입니다. 토양 적합성·시세·수급·재배 난이도를 근거로 "
        "왜 이 농장에 적합한지 설득력 있게 설명하세요."
    )


def _build_single_reason_prompt(req: ReasonRequest, mismatch: str) -> str:
    advice = req.advice_type or "NEW_RECOMMEND"
    instruction = _reason_instruction(
        advice,
        is_current_crop=req.is_current_crop,
        recommend_mode=req.recommend_mode or "PLAN",
    )
    if advice == "PLANNED_CROP":
        return (
            f"농장은 '{req.crop_name}'({req.crop_category}) 재배를 **예정**했지만 아직 파종·관리 이력이 거의 없습니다.\n"
            f"{instruction} '이미 심었다'고 가정하지 마세요.{mismatch}\n"
            f"농장 정보:\n{req.farm_details}{_reason_writing_guidelines()}"
        )
    if advice == "IN_SEASON_COACHING" or (
        req.is_current_crop and req.recommend_mode in ("MANAGE", "MIXED")
    ):
        return (
            f"당신은 농업 컨설턴트입니다. 농장은 이미 '{req.crop_name}'({req.crop_category})을 재배 중입니다.\n"
            f"{instruction}{mismatch}\n"
            f"토양이 다른 작물에 더 맞다면 다음 시즌 전환만 짧게 언급하세요.\n"
            f"농장 정보:\n{req.farm_details}{_reason_writing_guidelines()}"
        )
    if advice == "NEXT_SEASON":
        return (
            f"'{req.crop_name}'({req.crop_category})은 **다음 시즌·전환 검토용** 참고 작물입니다.\n"
            f"{instruction}{mismatch}\n"
            f"농장 정보:\n{req.farm_details}{_reason_writing_guidelines()}"
        )
    return (
        f"다음 농장 정보를 바탕으로 '{req.crop_name}'({req.crop_category}) 작물이 "
        f"{instruction}\n"
        f"농장 정보: {req.farm_details}{mismatch}{_reason_writing_guidelines()}"
    )


def _with_writing_guidelines(prompt: str) -> str:
    if "[작성 규칙" in prompt:
        return prompt
    return prompt + _reason_writing_guidelines()


async def _generate_reason_text_llm(prompt: str) -> str:
    """단건·자연어 사유 — JSON 모드는 빈/잘못된 스키마를 유발하므로 평문 생성만 사용."""
    llm = get_llm("gemini")
    full_prompt = _with_writing_guidelines(prompt)
    text = normalize_reason_text(
        await llm.generate(full_prompt, temperature=0.3, max_tokens=_REASON_MAX_TOKENS)
    )
    if len(text) >= _MIN_REASON_CHARS:
        return text
    retry_prompt = (
        full_prompt
        + "\n\n[재요청] 이전 답변이 너무 짧았습니다. **6문장 이상, 450자 이상**으로 "
        "위 규칙을 모두 반영해 다시 작성하세요."
    )
    retry = normalize_reason_text(
        await llm.generate(retry_prompt, temperature=0.35, max_tokens=_REASON_MAX_TOKENS)
    )
    return retry if len(retry) > len(text) else text


async def _generate_reason_batch_llm(prompt: str) -> str:
    llm = get_llm("gemini")
    if isinstance(llm, GeminiLLM):
        return await llm.generate_json(prompt, temperature=0.2, max_tokens=_REASON_MAX_TOKENS)
    return await llm.generate(prompt, temperature=0.2, max_tokens=_REASON_MAX_TOKENS)


async def _reason_for_item(req: BatchReasonRequest, item: BatchReasonItem) -> str:
    mismatch = f"\n토양 비교 참고: {item.soil_mismatch}" if item.soil_mismatch else ""
    single = ReasonRequest(
        farm_details=req.farm_details,
        crop_name=item.crop_name,
        crop_category=item.crop_category,
        recommend_mode=req.recommend_mode,
        advice_type=item.advice_type or "NEW_RECOMMEND",
        is_current_crop=item.is_current_crop,
        soil_mismatch=item.soil_mismatch,
    )
    prompt = _build_single_reason_prompt(single, mismatch)
    text = normalize_reason_text(await _generate_reason_text_llm(prompt))
    if text:
        return text
    logger.warning("개별 추천 사유 LLM 응답 없음: crop=%s", item.crop_name)
    return ""


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
        reasoning=reasoning,
    )


async def generate_recommend_reason(req: ReasonRequest) -> ReasonResponse:
    mismatch = f"\n토양 비교 참고: {req.soil_mismatch}" if req.soil_mismatch else ""
    prompt = _build_single_reason_prompt(req, mismatch)
    text = normalize_reason_text(await _generate_reason_text_llm(prompt))
    if not text:
        logger.warning("단건 추천 사유 LLM 응답 없음: crop=%s", req.crop_name)
    return ReasonResponse(ai_reason=text)


async def generate_batch_reasons(req: BatchReasonRequest) -> BatchReasonResponse:
    if not req.items:
        return BatchReasonResponse(reasons={})

    crop_names = [item.crop_name for item in req.items]
    crop_lines = []
    for idx, item in enumerate(req.items, 1):
        mismatch = f" (토양 비교: {item.soil_mismatch})" if item.soil_mismatch else ""
        advice = item.advice_type or "NEW_RECOMMEND"
        instruction = _reason_instruction(
            advice,
            is_current_crop=item.is_current_crop,
            recommend_mode=req.recommend_mode or "PLAN",
        )
        crop_lines.append(
            f'{idx}. crop_name="{item.crop_name}", category={item.crop_category}{mismatch}\n'
            f"   조건: {instruction}"
        )

    keys_json = ",\n".join(
        f'  "{name}": "<5~7문장·400자 이상 한국어 사유>"' for name in crop_names
    )
    prompt = f"""당신은 농업 컨설턴트입니다. 아래 농장·작물 목록에 맞는 추천 사유를 JSON 객체 하나로만 출력하세요.

농장 정보:
{req.farm_details}

작물 목록:
{chr(10).join(crop_lines)}

규칙:
1. 최상위 키는 반드시 아래 작물명 문자열과 **완전히 동일**해야 합니다.
2. 각 값은 해당 작물 조건에 맞는 **5~7문장, 400~600자** 한국어 문자열입니다.
3. 각 사유에 토양·시세·수급·실행 팁을 골고루 포함하고, 농장 정보 수치를 2회 이상 인용하세요.
4. 마크다운·코드펜스·설명 문장 없이 JSON만 출력하세요.

{{
{keys_json}
}}"""

    reasons: dict[str, str] = {}
    try:
        raw = await _generate_reason_batch_llm(prompt)
        reasons = parse_batch_reasons_response(raw, crop_names)
        reasons = {
            name: normalize_reason_text(reason)
            for name, reason in reasons.items()
            if normalize_reason_text(reason)
        }
        logger.info(
            "배치 추천 사유 파싱: 요청 %d건, 매칭 %d건, 응답길이 %d",
            len(crop_names),
            len(reasons),
            len(raw),
        )
        if len(reasons) < len(crop_names):
            logger.warning("배치 추천 사유 일부 미매칭. 응답 앞부분: %s", raw[:400])
    except Exception as e:
        logger.warning("배치 추천 사유 LLM 실패: %s", e)

    for item in req.items:
        existing = reasons.get(item.crop_name, "")
        if existing and not is_placeholder_reason(existing):
            continue
        try:
            filled = await _reason_for_item(req, item)
            if filled:
                reasons[item.crop_name] = filled
                logger.info("배치 미매칭 → 개별 사유 생성: %s", item.crop_name)
        except Exception as e:
            logger.error("개별 사유 생성 실패 crop=%s: %s", item.crop_name, e)

    return BatchReasonResponse(reasons=reasons)


async def diagnose_crop_image(image: UploadFile, image_bytes: bytes) -> DiagnoseResponse:
    prompt = "이 작물 사진을 보고, 어떤 작물인지 그리고 어떤 병해충 증상이 있는지, 어떻게 조치해야 하는지 농업 전문가로서 진단해줘. 500자 이내로 답변해줘."

    llm = get_llm("gemini")
    if isinstance(llm, GeminiLLM):
        model = llm._get_model()
        content = [
            prompt,
            {"mime_type": image.content_type, "data": image_bytes},
        ]
        response = await model.generate_content_async(content)
        return DiagnoseResponse(diagnosis=response.text)
    logger.error("현재 설정된 LLM(%s)은 이미지 진단을 지원하지 않습니다.", type(llm))
    raise ValueError("현재 설정된 LLM은 이미지 진단을 지원하지 않습니다.")
