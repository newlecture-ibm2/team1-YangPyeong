from typing import Annotated, TypedDict, List, Union, Literal
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import ToolNode
from app.agents.farm_agent import get_farm_agent
from app.agents.balance_agent import get_balance_agent
from app.agents.policy_agent import get_policy_agent
from app.agents.gov_agent import GovAgent
from app.models.gov import GovChatRequest
import logging

logger = logging.getLogger(__name__)

# ── MAS 상태 정의 ──
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], "대화 메시지 히스토리"]
    next_node: str
    farm_id: int
    user_id: int
    current_focus: str  # 에이전트의 페르소나를 강화할 메타데이터

# ── 오케스트레이터 노드 (Router) ──
def router_node(state: AgentState):
    """질문의 의도를 분석하여 적절한 전문 에이전트로 라우팅합니다."""
    last_message = state["messages"][-1].content
    
    # 0. 비공개/행정 전용 가드 (가장 먼저 검사)
    blocked_keywords = ["특정 농가", "농가별", "명단", "개인정보", "지원금 받은", "담당자", "내부", "행정용"]
    if any(keyword in last_message for keyword in blocked_keywords):
        return "blocked_guard"

    # 1. 정책/지원금 관련 질문 -> Policy Agent
    policy_keywords = ["지원", "보조금", "정책", "공문", "신청"]
    if any(keyword in last_message for keyword in policy_keywords):
        return "policy_agent"
        
    # 2. 경제/가격/수익 분석 질문 -> Balance Agent (우선순위 높임)
    balance_keywords = ["가격", "돈", "수익", "시장", "비싸다", "공급", "경제"]
    if any(keyword in last_message for keyword in balance_keywords):
        return "balance_agent"

    # 3. 개별 농장/재배 관련 질문 -> Farm Agent
    farm_keywords = ["내 농장", "농장", "재배 이력", "수확", "날씨", "토양", "병해충", "내 작물", "면적"]
    if any(keyword in last_message for keyword in farm_keywords):
        return "farm_agent"

    # 4. 지자체 수급/위험도/지역 현황 분석 -> Gov Agent
    gov_keywords = ["수급", "위험", "위험도", "과잉", "부족", "경고", "밸런스", "지역 현황", "현재 상황", "요약", "양평군", "대체"]
    if any(keyword in last_message for keyword in gov_keywords):
        return "gov_agent"
    
    return "general_chat"

# ── 에이전트 노드 래퍼 ──
async def call_balance_agent(state: AgentState):
    """Balance Agent 서브 그래프 호출"""
    agent = get_balance_agent()
    # 경제 분석 맥락 메타데이터 주입
    response = await agent.ainvoke({**state, "current_focus": "economic_analysis"})
    return {"messages": [response["messages"][-1]]}

async def call_farm_agent(state: AgentState):
    """Farm Agent 서브 그래프 호출"""
    agent = get_farm_agent()
    # 오케스트레이터의 상태를 에이전트에게 전달
    response = await agent.ainvoke(state)
    return {"messages": [response["messages"][-1]]}

async def call_policy_agent(state: AgentState):
    """Policy Agent 서브 그래프 호출"""
    agent = get_policy_agent()
    response = await agent.ainvoke({"messages": state["messages"]})
    return {"messages": [response["messages"][-1]]}

async def call_blocked_guard(state: AgentState):
    """행정 전용/개인정보 데이터 접근 차단"""
    msg = "해당 내용은 지자체 전용 화면에서 확인해야 하는 정보입니다. 공개 챗봇에서는 지역 단위 수급 현황만 안내할 수 있습니다."
    return {"messages": [AIMessage(content=msg)]}

async def call_gov_agent(state: AgentState):
    """Gov Agent 서브 그래프 호출 (통합 챗봇용 래퍼)"""
    try:
        message = state["messages"][-1].content
        agent = GovAgent()
        request = GovChatRequest(
            message=message,
            user_role="FARMER"  # 일반 사용자 관점으로 제한
        )
        response = await agent.run(request)
        return {"messages": [AIMessage(content=response.answer)]}
    except Exception:
        logger.exception("[Orchestrator] GovAgent call failed")
        return {"messages": [AIMessage(content="지역 수급 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")]}

# ── 통합 그래프 구성 ──
def get_main_orchestrator():
    workflow = StateGraph(AgentState)
    
    # 노드 추가
    workflow.add_node("farm_agent", call_farm_agent)
    workflow.add_node("balance_agent", call_balance_agent)
    workflow.add_node("policy_agent", call_policy_agent)
    workflow.add_node("gov_agent", call_gov_agent)
    workflow.add_node("blocked_guard", call_blocked_guard)
    
    # 조건부 라우팅 적용
    workflow.add_conditional_edges(START, router_node, {
        "blocked_guard": "blocked_guard",
        "balance_agent": "balance_agent",
        "farm_agent": "farm_agent",
        "policy_agent": "policy_agent",
        "gov_agent": "gov_agent",
        "general_chat": "farm_agent" # 기본 fallback
    })
    
    workflow.add_edge("balance_agent", END)
    workflow.add_edge("farm_agent", END)
    workflow.add_edge("policy_agent", END)
    workflow.add_edge("gov_agent", END)
    workflow.add_edge("blocked_guard", END)
    
    return workflow.compile()
