from typing import Annotated, TypedDict, List, Union, Literal
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import ToolNode
from app.agents.farm_agent import get_farm_agent
# from app.agents.gov_agent import get_gov_agent # GovAgent는 현재 클래스 기반이므로 추후 어댑터 필요

# ── MAS 상태 정의 ──
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], "대화 메시지 히스토리"]
    next_node: str
    farm_id: int
    user_id: int

# ── 오케스트레이터 노드 (Router) ──
def router_node(state: AgentState):
    """질문의 의도를 분석하여 적절한 전문 에이전트로 라우팅합니다."""
    last_message = state["messages"][-1].content
    
    # 1. 농장/재배 관련 질문 -> Farm Agent
    if any(keyword in last_message for keyword in ["농장", "작물", "심을", "면적", "날씨", "이력", "수확"]):
        return "farm_agent"
    
    # 2. 정책/지원금 관련 질문 -> Policy Agent (준비 중)
    if any(keyword in last_message for keyword in ["정책", "지원", "보조금", "공문"]):
        return "policy_agent"
    
    return "general_chat"

# ── 에이전트 노드 래퍼 ──
async def call_farm_agent(state: AgentState):
    """Farm Agent 서브 그래프 호출"""
    agent = get_farm_agent()
    # 오케스트레이터의 상태를 에이전트에게 전달
    response = await agent.ainvoke({"messages": state["messages"]})
    return {"messages": [response["messages"][-1]]}

# ── 통합 그래프 구성 ──
def get_main_orchestrator():
    workflow = StateGraph(AgentState)
    
    # 노드 추가
    workflow.add_node("farm_agent", call_farm_agent)
    # workflow.add_node("policy_agent", call_policy_agent) # 추후 추가
    
    # 시작점 설정
    workflow.add_edge(START, "farm_agent") # 현재는 farm_agent로 바로 연결 (추후 조건부 라우팅 적용)
    
    workflow.add_edge("farm_agent", END)
    
    return workflow.compile()
