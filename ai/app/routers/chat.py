"""
챗봇 라우터.
LangGraph MAS 오케스트레이터 + Actionable Agent (액션 토큰 반환).

응답 스키마: { reply: string, actions: ChatAction[] }
"""
import logging
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage

from app.agents.orchestrator import split_actions
from app.models.chat import ChatAction, ChatResponse
from app.utils.backend_client import user_jwt_ctx

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

    # ── 사용자 JWT를 ContextVar에 주입 (도구가 백엔드 호출 시 자동 사용) ──
    jwt = (request.metadata or {}).get("jwt") if request.metadata else None
    token = user_jwt_ctx.set(jwt)

    try:
        orchestrator = _get_orchestrator()

        # ── 프론트 히스토리 → LangChain 메시지 변환 ──
        # 첫 user 메시지 이전의 AIMessage(환영 메시지 등)는 제외
        # → Gemini 등 일부 LLM은 대화가 assistant로 시작하면 빈 응답을 반환함
        messages = []
        history = request.history or []
        first_user_idx = next(
            (i for i, h in enumerate(history) if h.role == "user"), None
        )
        if first_user_idx is not None:
            for h in history[first_user_idx:][-10:]:  # 첫 user부터 최근 10턴
                if h.role == "user":
                    messages.append(HumanMessage(content=h.content))
                else:
                    messages.append(AIMessage(content=h.content))

        # 현재 질문 추가 (히스토리 마지막이 동일한 user 메시지면 중복 제거)
        if not (messages and isinstance(messages[-1], HumanMessage) and messages[-1].content == request.message):
            messages.append(HumanMessage(content=request.message))

        meta = request.metadata or {}
        farm_id = 0
        try:
            farm_id = int(meta.get("farmId") or meta.get("farm_id") or 0)
        except (TypeError, ValueError):
            farm_id = 0

        # ── 오케스트레이터 호출 ──
        result = await orchestrator.ainvoke({
            "messages": messages,
            "user_id": request.userId,
            "farm_id": farm_id,
            "next_node": "",
            "current_focus": "",
            "pending_actions": [],
        })

        # ── 응답 가공: 텍스트 + 액션 분리 ──
        final_text = result["messages"][-1].content or ""
        cleaned_reply, inline_actions = split_actions(final_text)

        # state["pending_actions"]에 누적된 액션 + Synthesizer 통과 후 남은 인라인 액션
        pending = result.get("pending_actions") or []
        all_actions = [*pending, *inline_actions]

        # ChatAction으로 검증 (잘못된 페이로드는 제외)
        validated_actions: list[ChatAction] = []
        for a in all_actions:
            try:
                validated_actions.append(ChatAction(**a))
            except Exception as e:
                logger.warning("[Chat] 잘못된 액션 페이로드 무시: %s — %s", a, e)

        return ChatResponse(reply=cleaned_reply or "요청을 처리했어요.", actions=validated_actions)

    except Exception as e:
        logger.error("챗봇 응답 생성 실패: %s", e, exc_info=True)
        return ChatResponse(
            reply="죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            actions=[],
        )
    finally:
        # ContextVar 정리 (다음 요청에 누수되지 않도록)
        user_jwt_ctx.reset(token)
