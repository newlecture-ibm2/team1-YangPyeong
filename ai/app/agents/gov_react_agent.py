"""
실험용 ReAct 기반 Gov Agent.

목적:
  - 기존 GovAgent(수동 파이프라인)와 **병렬 공존**하는 실험용 에이전트.
  - farm_agent, policy_agent와 동일한 LangGraph/ReAct 구조.
  - Phase 2에서 만든 get_gov_tools()를 그대로 사용.
  - 운영 경로(/api/local-gov/chat)에는 연결하지 않음.

사용법 (실험/테스트 전용):
    from app.agents.gov_react_agent import get_gov_react_agent

    agent = get_gov_react_agent()
    result = await agent.ainvoke({"messages": [("user", "양평군 배추 위험도 알려줘")]})
    print(result["messages"][-1].content)

주의:
  - 이 에이전트는 GovChatResponse(intent/entities/graph_summary)를 반환하지 않습니다.
  - 기존 GovAgent.run()처럼 Intent 분류 → Entity 추출 → Fallback 유도를 하지 않습니다.
  - LLM이 스스로 도구를 선택하여 답변을 생성하는 ReAct 패턴입니다.
  - 운영 전환 시에는 GovChatResponse 호환 후처리 래퍼가 별도로 필요합니다.
"""
from langgraph.prebuilt import create_react_agent
from app.llm import get_llm
from app.agents.tools.gov_tools import get_gov_tools

# ── 시스템 프롬프트 ──
GOV_REACT_PROMPT = """당신은 'FarmBalance 수급 분석 전문가' 에이전트입니다.
양평군을 비롯한 지역의 농업 수급 현황, 위험도, 정책, 대체 작물을 분석합니다.

[지침]
1. 사용자가 특정 지역/작물의 수급 위험도(과잉·부족)를 물으면 'query_region_crop_risk' 도구를 사용하세요.
2. 지역 전체 현황 요약을 요청하면 'query_region_summary' 도구를 사용하세요.
3. 지원 정책/보조금을 물으면 'query_related_policies' 도구를 사용하세요.
4. 대체 작물 추천을 물으면 'query_alternative_crops' 도구를 사용하세요.
5. 특정 농장 분석을 요청하면 'query_farm_analysis' 도구를 사용하세요.
6. 답변은 항상 친절하고 전문적인 어조를 유지하며, 양평군의 지역적 특성을 고려하세요.
7. 데이터가 없거나 도구 호출 결과가 비어있으면 추측하지 말고 솔직하게 안내하세요.
8. 답변 마지막에 "본 분석은 농가 지도를 위한 참고용입니다."를 반드시 포함하세요.
"""


def get_gov_react_agent():
    """
    실험용 ReAct 기반 Gov Agent를 생성하여 반환합니다.

    farm_agent, policy_agent와 동일한 구조:
    - create_react_agent() 사용
    - ainvoke({"messages": [...]}) 호환
    - LLM이 도구를 자동 선택

    Returns:
        ainvoke 가능한 LangGraph compiled graph
    """
    llm_provider = get_llm("gemini")
    chat_model = llm_provider.get_chat_model(temperature=0.1)

    tools = get_gov_tools()

    agent = create_react_agent(
        model=chat_model,
        tools=tools,
        prompt=GOV_REACT_PROMPT,
    )
    return agent
