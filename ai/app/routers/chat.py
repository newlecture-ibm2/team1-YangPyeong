"""
챗봇 라우터.
백엔드(AgentRestAdapter)에서 /api/chat 으로 호출하는 엔드포인트입니다.
"""
import logging
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["chat"])

logger = logging.getLogger(__name__)


# ── 요청/응답 스키마 ──

class ChatRequest(BaseModel):
    """백엔드에서 전달하는 챗봇 요청"""
    userId: int
    roomId: int
    category: str
    message: str
    metadata: Optional[dict] = None


class ChatResponse(BaseModel):
    """백엔드가 기대하는 챗봇 응답"""
    reply: str


# ── 엔드포인트 ──

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    사용자 메시지를 LLM에 전달하고 응답을 반환합니다.
    추후 RAG, 에이전트 도구 체인 등을 이 서비스에 통합합니다.
    """
    logger.info(
        "챗봇 요청 수신 [userId=%s, roomId=%s, category=%s]",
        request.userId, request.roomId, request.category,
    )

    try:
        from app.llm import get_llm

        # 챗봇은 빠른 응답이 중요하므로 Groq 우선, 없으면 기본 Provider 사용
        try:
            llm = get_llm("groq")
        except Exception:
            logger.warning("Groq 사용 불가, 기본 Provider로 대체합니다.")
            llm = get_llm()

        system_instruction = (
            "당신은 양평군 농업인을 위한 친절한 AI 상담사입니다. "
            "작물 재배, 농업 정책, 수급 현황에 대해 쉽고 정확하게 답변합니다. "
            "고령 농업인도 이해할 수 있도록 쉬운 용어를 사용합니다."
        )

        reply = await llm.generate(
            prompt=request.message,
            system_instruction=system_instruction,
            temperature=0.7,
            max_tokens=1024,
        )

        return ChatResponse(reply=reply)

    except Exception as e:
        logger.error("챗봇 응답 생성 실패: %s", e)
        return ChatResponse(
            reply="죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        )
