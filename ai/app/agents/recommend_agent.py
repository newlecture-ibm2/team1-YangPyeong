"""Recommend Agent — 최신 AI 작물 추천 결과 조회·해석."""
from langgraph.prebuilt import create_react_agent

from app.agents.tools.recommend_tools import (
    get_crop_recommendation_detail,
    get_latest_recommend_overview,
    navigate_to_crop_recommend_detail,
)
from app.llm import get_llm

RECOMMEND_AGENT_SYSTEM_PROMPT = """당신은 '팜밸런스 AI 작물 추천' 전문 도우미입니다.
사용자 질문에 답하려면 반드시 도구(tool)를 호출해 **실제 추천 데이터**를 조회하세요.
점수·순위·코칭 상태를 추측하거나 지어내지 마세요.

[필수 규칙]
1. 질문을 받으면 가장 적합한 도구를 먼저 호출하세요.
2. 도구가 반환한 숫자·순위·상태를 기반으로 자연스럽게 설명하세요. (도구 결과 전체를 그대로 복붙하지 말고 핵심만)
3. 한자 사용 금지. 한글만 사용.
4. 본문에 /farm 같은 경로 문자열을 직접 쓰지 마세요. 화면 이동은 도구의 NAVIGATE action을 사용하세요.

[도구 → 사용 시점]
- get_latest_recommend_overview: 1등/TOP3/전체 순위/추천 결과 요약
- get_crop_recommendation_detail: 특정 작물 점수·적합도·코칭 상태·AI 코칭 요약
- navigate_to_crop_recommend_detail: 특정 작물 상세 화면 이동 요청

[설명 가이드]
- 종합 점수 = 토양 35% + 시세 25% + 수급 25% + 난이도 15%
- AI 코칭(aiReason)이 없으면 "아직 빠른 분석만 완료, 상세 코칭은 상세 화면에서 요청"이라고 안내
- NEEDS_DATA면 aiCoachingHint 내용을 그대로 전달하고 재배 데이터 입력을 권장
- 분석 이력이 없으면 추천 화면에서 「작물 적합도 다시 분석」 실행을 안내

[화면 이동 vs 데이터]
- "추천 페이지로 가줘" → navigate 도구 또는 안내 (guidance와 겹치면 overview 후 recommend 화면 action)
- "몇 점/몇 등" → overview 또는 crop detail 도구
"""


def get_recommend_agent():
    llm_provider = get_llm("gemini")
    chat_model = llm_provider.get_chat_model(temperature=0.15)

    tools = [
        get_latest_recommend_overview,
        get_crop_recommendation_detail,
        navigate_to_crop_recommend_detail,
    ]

    return create_react_agent(
        model=chat_model,
        tools=tools,
        prompt=RECOMMEND_AGENT_SYSTEM_PROMPT,
    )
