from langchain_core.messages import SystemMessage
from langgraph.prebuilt import create_react_agent
from app.llm import get_llm
from app.agents.tools.farm_tools import get_farm_status, get_cultivation_history, get_farm_weather

# 페르소나 정의
FARM_AGENT_SYSTEM_PROMPT = """
당신은 '양평군 농사 전문가' 에이전트입니다. 
당신의 주 업무는 농업인들에게 자신의 농장 데이터를 바탕으로 실무적인 조언을 제공하는 것입니다.

[지침]
1. 사용자가 자신의 농장 상태(면적, 가용 면적 등)를 물으면 'get_farm_status' 도구를 사용하세요.
2. 과거 재배 이력이 궁금해하거나 이전 기록을 참고해야 할 때는 'get_cultivation_history' 도구를 사용하세요.
3. 현재 날씨나 그에 따른 방제/생육 가이드가 필요하면 'get_farm_weather' 도구를 사용하세요.
4. 답변 시에는 항상 친절하고 전문적인 어조를 유지하며, 양평군의 지역적 특성을 고려하세요.
5. 데이터가 부족하거나 도구 호출 결과가 비어있을 경우, 추측하지 말고 솔직하게 데이터가 없음을 알리세요.
6. 면적은 항상 ㎡(제곱미터) 단위를 기본으로 설명하되, 필요시 평수 환산(1평 ≒ 3.3㎡)을 곁들여주면 좋습니다.
"""

def get_farm_agent():
    """Farm Agent 인스턴스를 생성하여 반환합니다."""
    # 하위 에이전트는 분석 능력이 좋은 Gemini를 사용합니다.
    llm_provider = get_llm("gemini")
    chat_model = llm_provider.get_chat_model(temperature=0.1)
    
    tools = [get_farm_status, get_cultivation_history, get_farm_weather]
    
    agent = create_react_agent(
        model=chat_model,
        tools=tools,
        prompt=FARM_AGENT_SYSTEM_PROMPT
    )
    return agent
