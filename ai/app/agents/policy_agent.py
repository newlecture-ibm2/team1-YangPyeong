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
5. [현재 사용자 농장 정보]가 있으면, 사용자에게 작물/지역을 되묻지 말고 해당 정보를 바탕으로 즉시 검색하세요.
"""

def get_policy_agent(analysis_context: dict = None):
    """Policy Agent 인스턴스를 생성하여 반환합니다."""
    llm_provider = get_llm("gemini")
    chat_model = llm_provider.get_chat_model(temperature=0.1)
    
    tools = [search_policies]
    
    # analysis_context가 있으면 사용자 농장 정보를 프롬프트에 주입
    prompt = POLICY_AGENT_SYSTEM_PROMPT
    if analysis_context:
        crops = analysis_context.get("active_crops", [])
        crop_text = ", ".join(crops) if crops else analysis_context.get("target_crop", "")
        region = analysis_context.get("target_region", "양평군")
        farm_name = analysis_context.get("farm_name", "")
        
        if crop_text or region:
            prompt += f"\n[현재 사용자 농장 정보]\n"
            if farm_name:
                prompt += f"- 농장명: {farm_name}\n"
            if crop_text:
                prompt += f"- 재배 작물: {crop_text}\n"
            prompt += f"- 지역: {region}\n"
            prompt += "사용자가 '내 농장', '내 작물', '내 지역' 등을 언급하면 위 정보를 우선 반영하여 검색하세요.\n"
            prompt += "예: 재배 작물이 '방울토마토, 고구마'이면 search_policies(keyword='방울토마토')와 search_policies(keyword='고구마')를 각각 호출하세요."

    agent = create_react_agent(
        model=chat_model,
        tools=tools,
        prompt=prompt
    )
    return agent

