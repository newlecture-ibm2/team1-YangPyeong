"""
Farm Agent: 농장 데이터 및 재배 기술 지원 전문가
"""
import os
import logging
from typing import Annotated, TypedDict, List
# pyrefly: ignore [missing-import]
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
# pyrefly: ignore [missing-import]
from langgraph.graph import StateGraph, END, START
# pyrefly: ignore [missing-import]
from langgraph.prebuilt import ToolNode

from app.llm import get_llm
from app.agents.tools.farm_tools import (
    get_farm_status,
    get_cultivation_history,
    get_farm_weather
)
from app.agents.tools.nongsaro_tools import get_nongsaro_disaster
# pyrefly: ignore [missing-import]
from app.agents.tools.rag_search_tool import search_rag_documents_tool


logger = logging.getLogger(__name__)

# ── 에이전트 프롬프트 정의 ──
FARM_AGENT_SYSTEM_PROMPT = """
당신은 '양평군 농사 전문가' 에이전트입니다. 
당신의 주 업무는 농업인들에게 자신의 농장 데이터를 바탕으로 실무적인 조언을 제공하고, 전문적인 농사 지식을 안내하는 것입니다.

[지침]
1. 사용자가 자신의 농장 상태(면적, 가용 면적 등)를 물으면 'get_farm_status' 도구를 사용하세요.
2. 과거 재배 이력이 궁금해하거나 이전 기록을 참고해야 할 때는 'get_cultivation_history' 도구를 사용하세요.
3. 현재 날씨나 그에 따른 방제/생육 가이드가 필요하면 'get_farm_weather' 도구를 사용하세요.
4. 가뭄, 폭염, 장마 등 기상 재해 예방 및 대응법이 필요하다면 'get_nongsaro_disaster' 도구를 사용하세요.
5. 사용자가 물어본 농업 지식이나 기상, 재배 관련 정보가 DB나 API에 없다면 'search_rag_documents_tool' 도구를 사용하여 추가 매뉴얼을 찾아보세요.
6. 사용자가 비료 추천을 요청할 경우, 전달받은 컨텍스트(`soil_info`)에 토양 정보(pH, 유기물 함량 등)가 있다면 추가적인 도구 호출 없이 당신이 가진 농업 전문 지식을 활용하여 알맞은 비료(밑거름, 웃거름, 석회비료 등)나 개량 방법을 즉시 조언하세요. 
7. 만약 토양 정보가 없다면 가까운 농업기술센터에서 토양 검사를 받도록 권유하세요.
8. 답변 시에는 항상 친절하고 전문적인 어조를 유지하며, 양평군의 지역적 특성을 고려하세요.
9. 데이터가 부족하거나 도구 호출 결과가 비어있을 경우, 추측하지 말고 솔직하게 정보가 없음을 알리세요. 단, 비료 추천 등 명시적으로 허용된 경우 전문 지식을 활용하세요.
10. 면적은 항상 m2(제곱미터) 단위를 기본으로 설명하되, 필요시 평수 환산(1평 ≒ 3.3m2)을 곁들여주면 좋습니다.

[답변 형식 — 반드시 지키세요]
- 기본적으로 **짧고 핵심만**(4~6줄) 전달하세요. 상세 설명이 필요한 질문(재배법, 품종 비교 등)은 늘려도 되지만 반드시 불릿·번호로 구조화하세요.
- 긴 설명은 줄바꿈·불릿(•)으로 나눠주세요. 한 덩어리 텍스트 금지.
- 핵심 수치(면적, 작물명, 시기 등)를 **굵게** 표시하세요.
- 개발/내부 용어를 절대 쓰지 마세요: DB→'기록', 농사로→'공식 재배 정보', API/시스템/에이전트→생략.
- 100% 한국어(한글)로만 답변. 영어·한자 절대 금지.
"""

def get_farm_agent(farm_id: int = 0, analysis_context: dict | None = None):
    """Farm Agent 인스턴스를 생성하여 반환합니다."""
    # 분석 능력이 좋은 모델을 사용합니다.
    llm = get_llm()
    tools = [
        get_farm_status, 
        get_cultivation_history, 
        get_farm_weather,
        get_nongsaro_disaster,
        search_rag_documents_tool
    ]
    # pyrefly: ignore [missing-import]
    from langgraph.prebuilt import create_react_agent
    
    def farm_agent_prompt(state) -> list:
        base_prompt = FARM_AGENT_SYSTEM_PROMPT
        if farm_id:
            base_prompt += f"\n\n[현재 로그인된 사용자 정보]\n- 사용자의 농장 ID: {farm_id}\n※ 도구 호출 시 이 농장 ID를 인자로 사용하세요. 사용자에게 농장 ID를 묻지 마세요."
            
            # ContextResolver가 주입한 토양 정보가 있다면 프롬프트에 추가
            context = analysis_context or {}
            soil_info = context.get("soil_info")
            if soil_info:
                base_prompt += f"\n- 농장 토양 정보: {soil_info}\n※ 이 정보를 바탕으로 비료/개량제를 추천하세요."
        else:
            base_prompt += "\n\n[현재 로그인된 사용자 정보]\n- 현재 사용자는 등록된 농장(farm_id)이 없습니다.\n※ 만약 사용자가 '내 농장 상태', '내 재배 이력' 등 본인의 특정 농장 데이터를 요구하는 질문을 한다면, 농장 ID를 묻지 말고 '농장 등록을 먼저 진행해 주세요'라고 안내하세요.\n※ 단, 일반적인 농사 지식(예: 고구마 심는 법, 품종 추천 등)을 묻는 질문에는 농장 유무와 상관없이 도구를 사용하여 정상적으로 답변하세요."
            
        logger.info("[FarmAgent] Generated base_prompt with soil_info: %s", "YES" if "농장 토양 정보" in base_prompt else "NO")
        return [SystemMessage(content=base_prompt)] + state["messages"]

    return create_react_agent(
        model=llm.get_chat_model(temperature=0.1),
        tools=tools,
        prompt=farm_agent_prompt
    )
