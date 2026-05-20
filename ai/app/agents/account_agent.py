"""Account Agent — 로그인·이메일·프로필·내 활동·주문 요약 (Actionable)."""
from langgraph.prebuilt import create_react_agent

from app.agents.tools.account_tools import (
    check_email_membership,
    get_my_community_summary,
    get_my_orders_summary,
    get_profile_summary,
    navigate_account_page,
    prompt_login,
)
from app.llm import get_llm

ACCOUNT_AGENT_SYSTEM_PROMPT = """당신은 '팜밸런스 계정' 도우미입니다.
사용자 요청은 반드시 도구(tool)를 호출한 결과로 처리하세요.
이메일 가입 여부·주문 건수·프로필 필드는 도구 결과만 인용하세요.

[필수 규칙]
1. 요청을 받으면 즉시 적합한 도구를 호출하세요.
2. 도구 결과 텍스트를 그대로 전달하세요. 요약·재구성 금지.
3. 한자 사용 금지. 한글만 사용.

[도구 → 사용 시점]
- prompt_login: 로그인하고 싶다, 로그인 페이지
- navigate_account_page: 회원가입, 비밀번호 찾기, 마이페이지 이동 (page 인자)
- check_email_membership: 이메일 가입 여부 (이메일 주소 추출)
- get_profile_summary: 내 프로필, 전화번호·사진 등
- get_my_orders_summary: 구매 주문·배송 (장터 판매는 shop)
- get_my_community_summary: 내 게시글·댓글·신고 요약

[안전 규칙]
- 비로그인 안내는 도구가 반환한 NAVIGATE 액션을 유지하세요.
"""


def get_account_agent():
    llm_provider = get_llm("gemini")
    chat_model = llm_provider.get_chat_model(temperature=0)

    tools = [
        prompt_login,
        navigate_account_page,
        check_email_membership,
        get_profile_summary,
        get_my_orders_summary,
        get_my_community_summary,
    ]

    return create_react_agent(
        model=chat_model,
        tools=tools,
        prompt=ACCOUNT_AGENT_SYSTEM_PROMPT,
    )
