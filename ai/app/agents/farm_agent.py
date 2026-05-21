"""
Farm Agent: 농장 데이터 및 재배 기술 지원 전문가
"""
import os
import logging
from typing import Annotated, TypedDict, List
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import ToolNode

from app.llm import get_llm
from app.agents.tools.farm_tools import (
    get_farm_status,
    get_cultivation_history,
    get_farm_weather
)
from app.agents.tools.nongsaro_tools import (
    get_nongsaro_schedule,
    get_nongsaro_variety,
    get_nongsaro_disaster
)

logger = logging.getLogger(__name__)

# ── 에이전트 프롬프트 정의 ──
FARM_AGENT_SYSTEM_PROMPT = """
당신은 '양평군 농사 전문가' 에이전트입니다. 
당신의 주 업무는 농업인들에게 자신의 농장 데이터를 바탕으로 실무적인 조언을 제공하고, 전문적인 농사 지식을 안내하는 것입니다.

[지침]
1. 사용자가 자신의 농장 상태(면적, 가용 면적 등)를 물으면 'get_farm_status' 도구를 사용하세요.
2. 과거 재배 이력이 궁금해하거나 이전 기록을 참고해야 할 때는 'get_cultivation_history' 도구를 사용하세요.
3. 현재 날씨나 그에 따른 방제/생육 가이드가 필요하면 'get_farm_weather' 도구를 사용하세요.
4. **특정 작물의 월별 농작업 일정(무엇을 해야 하는지 등)이 궁금하다면 'get_nongsaro_schedule' 도구를 사용하세요.**
5. **작물의 품종 추천이나 특성 정보가 필요하다면 'get_nongsaro_variety' 도구를 사용하세요.**
6. **가뭄, 폭염, 장마 등 기상 재해 대응법이 필요하다면 'get_nongsaro_disaster' 도구를 사용하세요.**
7. 답변 시에는 항상 친절하고 전문적인 어조를 유지하며, 양평군의 지역적 특성을 고려하세요.
8. 데이터가 부족하거나 도구 호출 결과가 비어있을 경우, 추측하지 말고 솔직하게 데이터가 없음을 알리세요.
9. 면적은 항상 m2(제곱미터) 단위를 기본으로 설명하되, 필요시 평수 환산(1평 ≒ 3.3m2)을 곁들여주면 좋습니다.
"""

def get_farm_agent():
    """Farm Agent 인스턴스를 생성하여 반환합니다."""
    # 분석 능력이 좋은 모델을 사용합니다.
    llm = get_llm()
    tools = [
        get_farm_status, 
        get_cultivation_history, 
        get_farm_weather,
        get_nongsaro_schedule,
        get_nongsaro_variety,
        get_nongsaro_disaster
    ]
    from langgraph.prebuilt import create_react_agent
    from langchain_core.messages import SystemMessage
    
    def farm_agent_prompt(state) -> list:
        from langchain_core.messages import SystemMessage
        base_prompt = FARM_AGENT_SYSTEM_PROMPT
        farm_id = state.get("farm_id")
        if farm_id:
            base_prompt += f"\n\n[현재 로그인된 사용자 정보]\n- 사용자의 농장 ID: {farm_id}\n※ 도구 호출 시 이 농장 ID를 인자로 사용하세요. 사용자에게 농장 ID를 묻지 마세요."
        else:
            base_prompt += "\n\n[현재 로그인된 사용자 정보]\n- 현재 사용자는 등록된 농장(farm_id)이 없습니다.\n※ 만약 사용자가 '내 농장 상태', '내 재배 이력' 등 본인의 특정 농장 데이터를 요구하는 질문을 한다면, 농장 ID를 묻지 말고 '농장 등록을 먼저 진행해 주세요'라고 안내하세요.\n※ 단, 일반적인 농사 지식(예: 고구마 심는 법, 품종 추천 등)을 묻는 질문에는 농장 유무와 상관없이 도구를 사용하여 정상적으로 답변하세요."
        return [SystemMessage(content=base_prompt)] + state["messages"]

    return create_react_agent(
        model=llm.get_chat_model(temperature=0.1),
        tools=tools,
        prompt=farm_agent_prompt
    )
