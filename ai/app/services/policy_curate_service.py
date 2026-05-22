"""
AI Top 5 큐레이션 서비스.
룰 기반 후보 중 LLM이 최종 Top 5를 선정하고 aiReason을 생성합니다.
"""
import json
import logging
from typing import Any

from app.llm import get_llm

logger = logging.getLogger(__name__)


async def curate_top5(request_data: dict) -> dict:
    """
    룰 기반 후보 정책 목록에서 AI가 Top 5를 선정합니다.

    Args:
        request_data: {
            "profile": { "name", "regionName", "totalArea", "crops", "farmCount" },
            "candidatePolicies": [{ "policyId", "title", "category", "matchScore", "reasons", ... }]
        }

    Returns:
        { "topPicks": [{ "policyId", "rank", "aiReason" }] }
    """
    profile = request_data.get("profile", {})
    candidates = request_data.get("candidatePolicies", [])

    if not candidates:
        return {"topPicks": []}

    # 후보가 5개 이하면 전부 선택
    if len(candidates) <= 5:
        return {
            "topPicks": [
                {
                    "policyId": c.get("policyId"),
                    "rank": idx + 1,
                    "aiReason": " ".join(c.get("reasons", []))
                }
                for idx, c in enumerate(candidates)
            ]
        }

    llm = get_llm("gemini")

    # 후보 정책 요약 (LLM 토큰 절약 — 핵심 정보만 전달)
    candidate_summary = ""
    for idx, c in enumerate(candidates):
        candidate_summary += (
            f"{idx+1}. [ID:{c.get('policyId')}] {c.get('title')} "
            f"(룰점수:{c.get('matchScore')}점, "
            f"등급:{c.get('gradeLabel','')}, "
            f"카테고리:{c.get('category','')}, "
            f"지원금:{c.get('supportAmount','')}, "
            f"마감:{c.get('applyEnd','미정')}, "
            f"기관:{c.get('organization','')}"
            f")\n"
        )

    prompt = f"""당신은 양평군 농업 정책 추천 보조 AI입니다.

아래 농업인 프로필과 후보 정책 목록을 보고,
후보 정책 중 이 농업인에게 우선적으로 보여줄 Top 5를 선택하세요.

중요 규칙:
- 반드시 제공된 candidatePolicies 안에서만 선택하세요.
- DB에 없는 정책을 새로 만들거나 추측하지 마세요.
- policyId를 그대로 반환하세요.
- 룰 기반 점수를 무시하지 말고, 점수가 높은 정책을 우선 고려하세요.
- 단, 점수가 비슷하다면 지역 적합도, 작물 적합도, 신청 가능성, 대상자 조건, 설명의 구체성을 비교해 우선순위를 정하세요.
- 선정 이유는 사용자가 이해하기 쉬운 한국어로 작성하세요.
- 과장하지 말고, 확인 가능한 조건만 근거로 사용하세요.

농업인 프로필:
- 이름: {profile.get('name', '농업인')}
- 지역: {profile.get('regionName', '미상')}
- 작물: {', '.join(profile.get('crops', []))}
- 농장 수: {profile.get('farmCount', 0)}개
- 총 면적: {profile.get('totalArea', 0)}㎡

후보 정책 ({len(candidates)}건):
{candidate_summary}

응답은 반드시 아래 JSON 형식만 출력하세요 (마크다운 코드블록 없이):
{{
  "topPicks": [
    {{
      "policyId": 123,
      "rank": 1,
      "aiReason": "양평군 지역 조건과 청년농 대상 조건이 모두 맞고, 신청 가능한 정책이라 우선 추천합니다."
    }}
  ]
}}"""

    try:
        response_text = await llm.generate(prompt)

        # JSON 파싱 (마크다운 코드블록 제거)
        cleaned = response_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

        data = json.loads(cleaned.strip())

        # policyId 유효성 검증 — 후보에 없는 ID 제거
        valid_ids = {c.get("policyId") for c in candidates}
        validated_picks = [
            pick for pick in data.get("topPicks", [])
            if pick.get("policyId") in valid_ids
        ]

        # rank 재정렬
        for idx, pick in enumerate(validated_picks[:5]):
            pick["rank"] = idx + 1

        logger.info(
            "[curate_top5] AI Top 5 선정 완료: %d건 (후보 %d건 중)",
            len(validated_picks[:5]), len(candidates)
        )
        return {"topPicks": validated_picks[:5]}

    except Exception as e:
        logger.error("[curate_top5] AI 큐레이션 실패: %s", e)
        # 폴백: 룰 기반 상위 5개 그대로 반환
        return {
            "topPicks": [
                {
                    "policyId": c.get("policyId"),
                    "rank": idx + 1,
                    "aiReason": " ".join(c.get("reasons", []))
                }
                for idx, c in enumerate(candidates[:5])
            ]
        }
