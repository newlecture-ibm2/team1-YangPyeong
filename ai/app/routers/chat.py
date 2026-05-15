"""
챗봇 라우터.
기존 LLM 직접 호출 방식에서 MAS 오케스트레이터 경유 방식으로 전환되었습니다.
외부 인터페이스(ChatRequest/ChatResponse)는 변경 없이 유지합니다.
"""
import logging
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage

router = APIRouter(prefix="/api", tags=["chat"])
logger = logging.getLogger(__name__)


class HistoryItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    userId: int = 0
    roomId: int = 0
    category: str = "general"
    message: str
    metadata: Optional[dict] = None
    history: Optional[list[HistoryItem]] = None


class ChatResponse(BaseModel):
    reply: str


# 오케스트레이터 싱글톤 (서버 시작 후 첫 요청 시 1회 컴파일)
_orchestrator = None

def _get_orchestrator():
    global _orchestrator
    if _orchestrator is None:
        from app.agents import get_main_orchestrator
        _orchestrator = get_main_orchestrator()
    return _orchestrator


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    logger.info("챗봇 요청 수신 [userId=%s, category=%s]", request.userId, request.category)

    try:
        orchestrator = _get_orchestrator()

        # ── 프론트 히스토리 → LangChain 메시지 변환 ──
        messages = []
        if request.history:
            for h in request.history[-10:]:  # 최근 10턴만 유지
                if h.role == "user":
                    messages.append(HumanMessage(content=h.content))
                else:
                    messages.append(AIMessage(content=h.content))

        # 현재 질문 추가
        messages.append(HumanMessage(content=request.message))

        # ── 오케스트레이터 호출 ──
        knowledge = request.metadata.get("knowledge", "") if request.metadata else ""
        
        result = await orchestrator.ainvoke({
            "messages": messages,
            "user_id": request.userId,
            "farm_id": 0,
            "next_node": "",
            "current_focus": "",
            "knowledge": knowledge,
        })

        reply = result["messages"][-1].content
        return ChatResponse(reply=reply)

    except Exception as e:
        logger.error("챗봇 응답 생성 실패: %s", e, exc_info=True)
        return ChatResponse(reply="죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
