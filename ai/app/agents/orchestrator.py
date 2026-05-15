from typing import Annotated, TypedDict, List, Union, Literal
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import ToolNode
from app.agents.farm_agent import get_farm_agent
from app.agents.balance_agent import get_balance_agent
from app.agents.policy_agent import get_policy_agent
from app.agents.gov_agent import gov_agent_ainvoke
from app.agents.shop_agent import get_shop_agent
from app.agents.community_agent import get_community_agent
from app.agents.general_agent import get_general_agent
from app.llm import get_llm
import logging

logger = logging.getLogger(__name__)

from langgraph.graph.message import add_messages

# ── MAS 상태 정의 ──
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]  # 리듀서 추가
    next_node: str
    farm_id: int
    user_id: int
    current_focus: str

# ── 오케스트레이터 노드 (Router) ──
ROUTER_SYSTEM_PROMPT = """당신은 사용자 질문의 의도를 분석하여 필요한 전문 에이전트들을 선택하는 라우터입니다.
질문이 복합적이라면 **쉼표(,)로 구분하여 여러 개**를 선택하세요. 영어로만 반환하고 부연 설명은 하지 마세요.

카테고리:
- blocked_guard: 특정 농가 명단, 개인정보, 내부 행정 자료 등 비공개 데이터 요청
- policy_agent: 보조금, 지원금, 정책, 공문, 신청 관련 질문
- balance_agent: 농산물 가격, 수익 분석, 시장 경제, 공급/수요 관련 질문
- farm_agent: 특정 농장 상태, 면적, 재배 이력, 날씨, 토양, 병해충 관련 질문
- gov_agent: 지역(양평군 등) 수급 현황, 위험도, 과잉/부족 분석, 대체 작물 추천
- shop_agent: 상품 등록, 판매, 상점, 마켓, 자동 입력 관련 질문
- community_agent: 농사 노하우, Q&A, 다른 농업인 경험담, 커뮤니티 검색 관련 질문
- general_chat: 위 어디에도 해당하지 않는 일반 농업 상담 또는 비농업 질문

예시:
"내 농장 면적 알려줘" → farm_agent
"감자 보조금이랑 요즘 가격 어때?" → policy_agent, balance_agent
"양평군 배추 위험도 분석해줘" → gov_agent
"다른 농가에서 감자 탄저병 어떻게 방제해?" → community_agent
"커뮤니티에 배추 재배 팁 있어?" → community_agent
"안녕 할아버지!" → general_chat"""

# 유효한 라우팅 대상 목록
VALID_ROUTES = {
    "blocked_guard", "policy_agent", "balance_agent",
    "farm_agent", "gov_agent", "shop_agent", "community_agent", "general_chat"
}

async def router_node(state: AgentState) -> List[str]:
    """LLM 기반으로 질문의 의도를 분석하여 하나 이상의 에이전트로 라우팅합니다."""
    last_message = state["messages"][-1].content

    try:
        llm = get_llm("groq")
        chat_model = llm.get_chat_model(temperature=0)

        response = await chat_model.ainvoke([
            SystemMessage(content=ROUTER_SYSTEM_PROMPT),
            HumanMessage(content=last_message),
        ])

        # 쉼표로 구분된 결과를 리스트로 변환
        raw_routes = [r.strip().lower() for r in response.content.split(",")]
        routes = [r for r in raw_routes if r in VALID_ROUTES]

        if routes:
            logger.info("[Router] '%s' → %s", last_message[:30], routes)
            return routes

        return ["general_chat"]

    except Exception:
        logger.exception("[Router] LLM 라우팅 실패 → general_chat으로 fallback")
        return ["general_chat"]

# ── 에이전트 노드 래퍼 ──
async def call_balance_agent(state: AgentState):
    """Balance Agent 서브 그래프 호출"""
    try:
        agent = get_balance_agent()
        # 경제 분석 맥락 메타데이터 주입
        response = await agent.ainvoke({**state, "current_focus": "economic_analysis"})
        return {"messages": [response["messages"][-1]]}
    except Exception:
        logger.exception("[Orchestrator] BalanceAgent call failed")
        return {"messages": [AIMessage(content="수급 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")]}

async def call_farm_agent(state: AgentState):
    """Farm Agent 서브 그래프 호출"""
    try:
        agent = get_farm_agent()
        # 오케스트레이터의 상태를 에이전트에게 전달
        response = await agent.ainvoke(state)
        return {"messages": [response["messages"][-1]]}
    except Exception:
        logger.exception("[Orchestrator] FarmAgent call failed")
        return {"messages": [AIMessage(content="농장 데이터 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")]}

async def call_policy_agent(state: AgentState):
    """Policy Agent 서브 그래프 호출"""
    try:
        agent = get_policy_agent()
        response = await agent.ainvoke({"messages": state["messages"]})
        return {"messages": [response["messages"][-1]]}
    except Exception:
        logger.exception("[Orchestrator] PolicyAgent call failed")
        return {"messages": [AIMessage(content="정책 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")]}

async def call_shop_agent(state: AgentState):
    """Shop Agent 서브 그래프 호출"""
    try:
        agent = get_shop_agent()
        response = await agent.ainvoke({"messages": state["messages"]})
        return {"messages": [response["messages"][-1]]}
    except Exception:
        logger.exception("[Orchestrator] ShopAgent call failed")
        return {"messages": [AIMessage(content="상점 기능 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")]}

async def call_community_agent(state: AgentState):
    """Community Agent 서브 그래프 호출"""
    try:
        agent = get_community_agent()
        response = await agent.ainvoke({"messages": state["messages"]})
        return {"messages": [response["messages"][-1]]}
    except Exception:
        logger.exception("[Orchestrator] CommunityAgent call failed")
        return {"messages": [AIMessage(content="커뮤니티 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")]}

async def call_blocked_guard(state: AgentState):
    """행정 전용/개인정보 데이터 접근 차단"""
    msg = "해당 내용은 지자체 전용 화면에서 확인해야 하는 정보입니다. 공개 챗봇에서는 지역 단위 수급 현황만 안내할 수 있습니다."
    return {"messages": [AIMessage(content=msg)]}

async def call_gov_agent(state: AgentState):
    """Gov Agent 호출 (ainvoke 호환 래퍼 경유)"""
    try:
        result = await gov_agent_ainvoke({"messages": state["messages"]})
        return {"messages": [result["messages"][-1]]}
    except Exception:
        logger.exception("[Orchestrator] GovAgent call failed")
        return {"messages": [AIMessage(content="지역 수급 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")]}

async def call_general_agent(state: AgentState):
    """General Agent (양평이 할아버지) 호출"""
    try:
        agent = get_general_agent()
        response = await agent.ainvoke({"messages": state["messages"]})
        return {"messages": [response["messages"][-1]]}
    except Exception:
        logger.exception("[Orchestrator] GeneralAgent call failed")
        return {"messages": [AIMessage(content="허허, 잠시 머리가 멍해졌구만. 다시 한번 물어보게나.")]}

# ── 답변 합성 노드 (Synthesizer) ──
SYNTHESIZER_SYSTEM_PROMPT = """당신은 '양평이 할아버지'입니다. 
여러 전문 에이전트들이 조사해온 정보들을 바탕으로, 사용자에게 하나의 따뜻하고 친절한 답변으로 통합해서 들려주세요.

지침:
1. 각 에이전트의 핵심 정보를 빠짐없이 포함하되, 말투는 정겨운 할아버지 톤으로 통일하세요.
2. 정보가 서로 겹친다면 자연스럽게 연결하세요.
3. 사용자를 '우리 젊은이' 또는 '손주'처럼 대하며 다정하게 조언하세요.
4. "에이전트가 말하길..." 같은 표현은 쓰지 말고, 할아버지가 직접 알아보고 말해주는 것처럼 하세요.
5. 답변 중 한자(漢字)는 절대 사용하지 말고, 정겨운 한글 말투로만 작성하세요. (예: 農事 -> 농사)"""

async def synthesizer_node(state: AgentState):
    """여러 에이전트의 답변을 취합하여 최종 응답을 생성합니다."""
    # 만약 에이전트가 한 명이고 그게 general_agent라면 추가 합성 없이 그대로 반환
    # (하지만 통일성을 위해 항상 합성을 거치는 것이 톤 유지에 유리함)
    
    try:
        llm = get_llm("groq")
        chat_model = llm.get_chat_model(temperature=0.5)

        # 시스템 메시지 + 이전 대화 + 에이전트들의 답변들 취합
        agent_responses = "\n\n".join([msg.content for msg in state["messages"] if isinstance(msg, AIMessage)])
        
        prompt = [
            SystemMessage(content=SYNTHESIZER_SYSTEM_PROMPT),
            HumanMessage(content=f"사용자 질문: {state['messages'][0].content}\n\n조사된 정보들:\n{agent_responses}")
        ]

        response = await chat_model.ainvoke(prompt)
        # 기존 에이전트들의 개별 답변은 지우고 최종 합성 답변만 메시지에 추가
        return {"messages": [response]}
        
    except Exception:
        logger.exception("[Orchestrator] Synthesizer failed")
        return {"messages": [AIMessage(content="허허, 정보를 모으다 보니 좀 꼬였구만. 핵심만 말하자면 이렇다네... (오류 발생으로 마지막 답변만 전달)")]}

# ── 통합 그래프 구성 ──
def get_main_orchestrator():
    workflow = StateGraph(AgentState)
    
    # 노드 추가
    workflow.add_node("farm_agent", call_farm_agent)
    workflow.add_node("balance_agent", call_balance_agent)
    workflow.add_node("policy_agent", call_policy_agent)
    workflow.add_node("shop_agent", call_shop_agent)
    workflow.add_node("community_agent", call_community_agent)
    workflow.add_node("gov_agent", call_gov_agent)
    workflow.add_node("blocked_guard", call_blocked_guard)
    workflow.add_node("general_agent", call_general_agent)
    workflow.add_node("synthesizer", synthesizer_node)  # 답변 합성 노드
    
    # 조건부 라우팅 적용 (복수 선택 가능)
    workflow.add_conditional_edges(START, router_node, {
        "blocked_guard": "blocked_guard",
        "balance_agent": "balance_agent",
        "farm_agent": "farm_agent",
        "policy_agent": "policy_agent",
        "shop_agent": "shop_agent",
        "community_agent": "community_agent",
        "gov_agent": "gov_agent",
        "general_chat": "general_agent",
    })
    
    # 모든 에이전트는 답변 합성 노드로 집결
    workflow.add_edge("balance_agent", "synthesizer")
    workflow.add_edge("farm_agent", "synthesizer")
    workflow.add_edge("policy_agent", "synthesizer")
    workflow.add_edge("shop_agent", "synthesizer")
    workflow.add_edge("community_agent", "synthesizer")
    workflow.add_edge("gov_agent", "synthesizer")
    workflow.add_edge("general_agent", "synthesizer")
    workflow.add_edge("blocked_guard", "synthesizer")
    
    # 최종 답변 반환
    workflow.add_edge("synthesizer", END)
    
    return workflow.compile()
    
    # 모든 에이전트는 답변 합성 노드로 집결
    workflow.add_edge("balance_agent", "synthesizer")
    workflow.add_edge("farm_agent", "synthesizer")
    workflow.add_edge("policy_agent", "synthesizer")
    workflow.add_edge("shop_agent", "synthesizer")
    workflow.add_edge("community_agent", "synthesizer")
    workflow.add_edge("gov_agent", "synthesizer")
    workflow.add_edge("general_agent", "synthesizer")
    workflow.add_edge("blocked_guard", "synthesizer")
    
    # 최종 답변 반환
    workflow.add_edge("synthesizer", END)
    
    return workflow.compile()
