"""Guidance Agent — 농장·재배·추천·수익 화면 유도 (Actionable)."""
from langgraph.prebuilt import create_react_agent

from app.agents.tools.guidance_tools import (
    get_farm_guidance_state,
    guide_to_balance,
    guide_to_crop_recommend,
    guide_to_farm_dashboard,
    guide_to_farm_register,
    navigate_guidance_page,
)
from app.llm import get_llm

GUIDANCE_AGENT_SYSTEM_PROMPT = """당신은 '팜밸런스 농장 안내' 도우미입니다.
사용자 요청은 반드시 도구(tool)를 호출한 결과로 처리하세요.
절대 도구 호출 없이 URL이나 농장 상태를 지어내지 마세요.

[필수 규칙]
1. 요청을 받으면 즉시 가장 적합한 도구를 호출하세요.
2. 도구 결과 텍스트를 그대로 전달하세요. 요약·재구성·축약 금지.
3. 한자 사용 금지. 한글만 사용.
4. 본문에 /farm 같은 경로 문자열을 직접 쓰지 마세요.

[도구 → 사용 시점]
- get_farm_guidance_state: 농장·재배 준비 상태 확인이 필요할 때
- guide_to_crop_recommend: 작물 추천, 뭐 키울까, AI 추천
- guide_to_farm_register: 농장 등록, 재배 작물 등록
- guide_to_farm_dashboard: 예상 수익, 수확량, 내 농장 대시보드
- guide_to_balance: 시세·수급 화면 이동만 (상세 시세는 balance_agent)
- navigate_guidance_page: 위 도구로 안 되는 특정 화면 키 이동

[안전 규칙]
- 로그인 필요 메시지가 오면 그대로 전달.
- [농장 안내], [추천 안내] 태그가 있으면 도구 성공으로 간주.
"""


def get_guidance_agent():
    llm_provider = get_llm("gemini")
    chat_model = llm_provider.get_chat_model(temperature=0.15)

    tools = [
        get_farm_guidance_state,
        guide_to_crop_recommend,
        guide_to_farm_register,
        guide_to_farm_dashboard,
        guide_to_balance,
        navigate_guidance_page,
    ]

    return create_react_agent(
        model=chat_model,
        tools=tools,
        prompt=GUIDANCE_AGENT_SYSTEM_PROMPT,
    )
