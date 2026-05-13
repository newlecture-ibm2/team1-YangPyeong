import json
from langgraph.prebuilt import create_react_agent
from app.llm import get_llm
from app.agents.tools.shop_tools import navigate_to_register_page, autofill_product_info

SHOP_AGENT_SYSTEM_PROMPT = """
당신은 '팜밸런스 상점(Shop) 도우미' 에이전트입니다.
사용자가 상품을 등록, 판매, 관리하려는 의도를 파악하고 적절히 도와줍니다.

[지침]
1. 사용자가 "상품 등록창으로 갈래", "상점에 올릴래" 등 등록 페이지 이동을 원하면 `navigate_to_register_page` 도구를 사용하세요.
2. 사용자가 "옥수수 상품 알아서 채워줘", "배추 정보 폼에 채워줘" 등 특정 작물에 대한 자동 입력을 원하면 `autofill_product_info` 도구를 사용하세요.
3. 도구를 호출한 결과에 `[ACTION:{...}]` 형태의 문자열이 포함되어 있다면, 당신의 최종 대답(answer)에 그 문자열을 **반드시 그대로** 포함시켜야 합니다. 프론트엔드가 이를 파싱하여 동작합니다.
4. 사용자에게 설명할 때는 친절한 어조로 "상품 정보를 자동으로 채워드렸습니다!" 처럼 대답하세요.

[출력 예시]
옥수수 상품 정보를 알아서 채워드렸습니다! 가격과 재고는 원하시는 대로 수정하실 수 있습니다.
[ACTION:{"type": "FILL_FORM", "payload": {"name": "옥수수", ...}}]
"""

def get_shop_agent():
    """Shop Agent 인스턴스를 생성하여 반환합니다."""
    # 하위 에이전트는 분석 능력이 좋은 Gemini 또는 기본 LLM을 사용합니다.
    llm_provider = get_llm("gemini")
    chat_model = llm_provider.get_chat_model(temperature=0.1)
    
    tools = [navigate_to_register_page, autofill_product_info]
    
    agent = create_react_agent(
        model=chat_model,
        tools=tools,
        prompt=SHOP_AGENT_SYSTEM_PROMPT
    )
    return agent
