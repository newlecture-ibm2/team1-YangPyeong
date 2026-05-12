from typing import Annotated, TypedDict, List, Union
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, END, START
from app.agents.farm_agent import get_farm_agent
from app.agents.balance_agent import get_balance_agent

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
    
    # 1. 경제/수급/시장 관련 질문 -> Balance Agent (확장된 키워드)
    if any(keyword in last_message for keyword in ["수급", "공급", "가격", "돈", "수익", "시장", "비싸다", "현황"]):
        return "balance_agent"
    
    # 2. 내 농장/재배 관련 질문 -> Farm Agent
    if any(keyword in last_message for keyword in ["내 농장", "심을", "면적", "날씨", "이력", "수확"]):
        return "farm_agent"
    
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
    response = await agent.ainvoke(state)
    return {"messages": [response["messages"][-1]]}

# ── 통합 그래프 구성 ──
def get_main_orchestrator():
    workflow = StateGraph(AgentState)
    
    # 노드 추가
    workflow.add_node("farm_agent", call_farm_agent)
    workflow.add_node("balance_agent", call_balance_agent)
    
    # 시작점 설정 (추후 팀 전체 작업 시 router_node 연동)
    workflow.add_edge(START, "balance_agent") 
    
    workflow.add_edge("balance_agent", END)
    workflow.add_edge("farm_agent", END)
    
    return workflow.compile()
