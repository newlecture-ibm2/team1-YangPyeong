from langchain_core.messages import SystemMessage
from langgraph.prebuilt import create_react_agent
from app.llm import get_llm
from app.agents.tools.policy_search import search_policies

POLICY_AGENT_SYSTEM_PROMPT = """
당신은 'FarmBalance 정책 지원 전문가' 에이전트입니다.
사용자(농업인 등)가 농업 지원금, 보조금, 혜택, 정책 등에 대해 질문하면 친절하게 답변해 줍니다.

[지침]
1. 사용자가 특정 작물이나 혜택에 대한 정책을 찾을 때 'search_policies' 도구를 사용하여 관련 정책을 검색하세요.
2. 정책 내용(지원 금액, 대상 등)을 설명할 때는 명확하고 이해하기 쉽게 요약해서 전달하세요.
3. 검색 결과가 없으면, 조건을 넓혀서 검색하거나 솔직하게 현재 조건에 맞는 데이터가 없음을 안내하세요.
4. 양평군 지역의 농업인에게 실질적인 도움이 되는 조언을 제공하세요.
"""

def get_policy_agent():
    """Policy Agent 인스턴스를 생성하여 반환합니다."""
    llm_provider = get_llm("gemini")
    chat_model = llm_provider.get_chat_model(temperature=0.1)
    
    tools = [search_policies]
    
    agent = create_react_agent(
        model=chat_model,
        tools=tools,
        prompt=POLICY_AGENT_SYSTEM_PROMPT
    )
    return agent
