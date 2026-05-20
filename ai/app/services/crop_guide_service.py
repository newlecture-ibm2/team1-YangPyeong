import logging

from app.llm import get_llm
from app.llm.gemini import GeminiLLM
from app.models.crop_guide import CropGuideRequest, CropGuideResponse
from app.utils.crop_guide_parse import default_tips_title, parse_crop_guide_response

logger = logging.getLogger(__name__)

_GUIDE_MAX_TOKENS = 8192


def _experience_instruction(level: str) -> str:
    if level == "experienced":
        return (
            "농부는 이 작물을 재배 중이거나 과거에 재배·수확 경험이 있습니다. "
            "'재배 경험자·전문가 꿀팁' 섹션은 수량·품질·출하 최적화, 기록·미세 조정 중심으로 작성하세요."
        )
    return (
        "농부는 이 작물을 처음 재배하거나 아직 파종 전입니다. "
        "'초보 농부 실패 방지 꿀팁' 섹션은 흔한 실수(❌)와 반드시 지킬 것(✅)을 구체적으로 작성하세요."
    )


def _build_prompt(req: CropGuideRequest) -> str:
    level = (req.experience_level or "novice").strip().lower()
    if level not in ("experienced", "novice"):
        level = "novice"
    tips_title = default_tips_title(level)

    pests_block = ""
    if req.pests:
        pests_block = (
            "\n[카드에 표시된 주요 병해충 — 병해충 섹션에서 반드시 각 항목을 【이름】 형식으로 다루세요]\n"
            + ", ".join(req.pests)
            + "\n"
        )

    farm_block = req.farm_details or ""
    if not farm_block and req.farm_name:
        farm_block = f"농장명: {req.farm_name}"
        if req.soil_ph is not None:
            farm_block += f", pH {req.soil_ph}"
        if req.soil_type:
            farm_block += f", 토성 {req.soil_type}"
        if req.organic_matter is not None:
            farm_block += f", 유기물 {req.organic_matter}%"

    crop_facts = []
    if req.sowing_period:
        crop_facts.append(f"파종 시기: {req.sowing_period}")
    if req.harvest_period:
        crop_facts.append(f"수확 시기: {req.harvest_period}")
    if req.optimal_temp:
        crop_facts.append(f"적정 온도: {req.optimal_temp}")
    if req.growth_days:
        crop_facts.append(f"생육 기간: 약 {req.growth_days}일")
    if req.difficulty:
        crop_facts.append(f"난이도(1~5): {req.difficulty}")

    return f"""당신은 한국 농업 현장 컨설턴트입니다.
아래 농장·작물 정보를 바탕으로 재배 전문 가이드북 본문을 작성하세요.

[작물] {req.crop_name} ({req.crop_category})
[조언 유형] {req.advice_type}
[독자 수준] {level} — {_experience_instruction(level)}
[작물 재배 요약] {", ".join(crop_facts) if crop_facts else "정보 제한적"}
{pests_block}
[농장 정보]
{farm_block}

[출력 형식 — 반드시 JSON만, 다른 텍스트 금지]
{{
  "crop_name": "{req.crop_name}",
  "topics": [
    {{
      "icon": "🌍",
      "title": "토양·수분 정밀 관리",
      "content": ["문장1", "문장2", "문장3", "문장4"]
    }},
    {{
      "icon": "🐛",
      "title": "주요 병해충 정밀 대책",
      "content": ["【병해충명】 증상·예방·방제 ...", "..."]
    }},
    {{
      "icon": "{'🎯' if level == 'experienced' else '🚫'}",
      "title": "{tips_title}",
      "content": ["❌ ...", "✅ ...", "..."]
    }},
    {{
      "icon": "📦",
      "title": "수확 후 관리·출하",
      "content": ["...", "..."]
    }}
  ]
}}

[작성 규칙]
- topics는 정확히 4개, 각 content는 4~6개의 짧은 한국어 문장(배열 요소).
- 농장 pH·토성·재배 현황을 1회 이상 구체적으로 인용하세요.
- 농약은 구체 농약명·희석배수 대신 예방·예찰·안전사용 기준·기술센터 상담을 권장하세요.
- 병해충이 목록에 있으면 각각 【이름】으로 시작하는 항목을 포함하세요.
- JSON 이외의 설명, 마크다운 코드블록 없이 순수 JSON만 출력하세요.
"""


async def generate_crop_detailed_guide(req: CropGuideRequest) -> CropGuideResponse:
    level = (req.experience_level or "novice").strip().lower()
    if level not in ("experienced", "novice"):
        level = "novice"

    prompt = _build_prompt(req)
    llm = get_llm("gemini")

    raw: str
    if isinstance(llm, GeminiLLM):
        raw = await llm.generate_json(prompt, temperature=0.25, max_tokens=_GUIDE_MAX_TOKENS)
    else:
        raw = await llm.generate(
            prompt + "\n\n반드시 위 스키마의 JSON만 출력하세요.",
            temperature=0.25,
            max_tokens=_GUIDE_MAX_TOKENS,
        )

    parsed = parse_crop_guide_response(raw, req.crop_name, level)
    if parsed is None:
        logger.warning("재배 가이드 파싱 실패, 재시도: crop=%s", req.crop_name)
        retry = await llm.generate(
            prompt + "\n\n[재요청] 이전 응답이 잘못되었습니다. topics 4개, content 각 4문장 이상인 유효한 JSON만 다시 출력하세요.",
            temperature=0.2,
            max_tokens=_GUIDE_MAX_TOKENS,
        )
        parsed = parse_crop_guide_response(retry, req.crop_name, level)

    if parsed is None:
        raise ValueError("AI 재배 가이드 JSON 생성에 실패했습니다.")

    return CropGuideResponse(**parsed)
