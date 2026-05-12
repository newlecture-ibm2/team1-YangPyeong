from langchain_core.messages import SystemMessage
from langgraph.prebuilt import create_react_agent
from app.llm import get_llm
from app.agents.tools.farm_tools import (
    get_farm_status,
    get_cultivation_history,
    get_farm_weather
)

# [농장 전문가 페르소나 정의]
FARM_AGENT_SYSTEM_PROMPT = """
당신은 '양평군 농업 전문가' 에이전트입니다. 
양평군 농민들의 농장 상태를 분석하고, 재배 이력과 실시간 기상 정보를 바탕으로 최적의 재배 가이드를 제공합니다.

[핵심 임무]
1. 사용자의 농장 상태(get_farm_status)를 먼저 파악하세요.
2. 과거 재배 이력(get_cultivation_history)을 참고하여 작물 추천이나 문제 해결책을 제시하세요.
3. 현재 농장의 실시간 날씨(get_farm_weather)를 확인하여 농작물 관리 팁을 주어야 합니다.
4. 모든 답변은 양평군 지역 특색을 고려해야 하며, 친절하고 전문적인 어조를 유지하세요.

[답변 가이드라인]
- 농장 ID(farmId)가 필요한 경우, 시스템 컨텍스트에서 확인하거나 사용자에게 정중히 물어보세요.
- 날씨 정보가 나쁠 경우(서리, 폭염 등) 긴급 대응 요령을 반드시 포함하세요.
- 데이터 조회 실패 시, '데이터를 불러오는 중 잠시 지연이 발생했다'고 전문적으로 응대하세요.
"""

def get_farm_agent():
    """Farm Agent 인스턴스를 생성하여 반환합니다."""
    # 유연한 상담을 위해 temperature를 약간 부여합니다.
    llm_provider = get_llm("gemini")
    chat_model = llm_provider.get_chat_model(temperature=0.1)
    
    tools = [get_farm_status, get_cultivation_history, get_farm_weather]
    
    agent = create_react_agent(
        model=chat_model,
        tools=tools,
        prompt=FARM_AGENT_SYSTEM_PROMPT
    )
    return agent
