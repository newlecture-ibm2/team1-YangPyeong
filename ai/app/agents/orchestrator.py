from typing import Annotated, TypedDict, List, Union, Literal
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import ToolNode
from app.agents.farm_agent import get_farm_agent
from app.agents.balance_agent import get_balance_agent
from app.agents.policy_agent import get_policy_agent
# from app.agents.gov_agent import get_gov_agent # GovAgent는 현재 클래스 기반이므로 추후 어댑터 필요

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
    
    # 1. 경제/수급/시장 관련 질문 -> Balance Agent
    if any(keyword in last_message for keyword in ["수급", "공급", "가격", "돈", "수익", "시장", "비싸다", "현황"]):
        return "balance_agent"
    
    # 2. 내 농장/재배 관련 질문 -> Farm Agent
    if any(keyword in last_message for keyword in ["내 농장", "심을", "면적", "날씨", "이력", "수확", "농장", "작물"]):
        return "farm_agent"
    
    # 3. 정책/지원금 관련 질문 -> Policy Agent
    if any(keyword in last_message for keyword in ["정책", "지원", "보조금", "공문"]):
        return "policy_agent"
    
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

# ── 통합 그래프 구성 ──
def get_main_orchestrator():
    workflow = StateGraph(AgentState)
    
    # 노드 추가
    workflow.add_node("farm_agent", call_farm_agent)
    workflow.add_node("balance_agent", call_balance_agent)
    workflow.add_node("policy_agent", call_policy_agent)
    
    # 조건부 라우팅 적용 (핵심!)
    workflow.add_conditional_edges(START, router_node, {
        "balance_agent": "balance_agent",
        "farm_agent": "farm_agent",
        "policy_agent": "policy_agent",
        "general_chat": "farm_agent" # 기본 fallback은 농장 에이전트로
    })
    
    workflow.add_edge("balance_agent", END)
    workflow.add_edge("farm_agent", END)
    workflow.add_edge("policy_agent", END)
    
    return workflow.compile()
