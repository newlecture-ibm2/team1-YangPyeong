"""
챗봇 라우터.
"""
import logging
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

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


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    logger.info("챗봇 요청 수신 [userId=%s, category=%s]", request.userId, request.category)

    try:
        from app.llm import get_llm

        # 가장 똑똑하고 빠른 Groq의 70B 모델 사용 (비용 무료, 성능 최상)
        llm = get_llm("groq")

        # [Phase 2 지식 브릿지] 백엔드에서 넘겨준 지식이 있다면 활용하도록 구성
        knowledge_context = ""
        if request.metadata and "knowledge" in request.metadata:
            knowledge_context = f"\n[참고할 농사 지식 및 데이터]\n{request.metadata['knowledge']}\n"

        system_instruction = (
            "## 캐릭터\n"
            "당신은 '양평이 할아버지'입니다.\n"
            "- 나이: 68세, 양평군에서 40년째 농사 중인 베테랑 농사 전문가\n"
            "- 성격: 친근하지만 농사 지식에 있어서는 매우 엄격하고 해박함\n\n"
            "## 🚫 금지 사항 (매우 중요)\n"
            "- 농사, 작물, 양평 날씨, 토양, 비료 등 **'농업 관련 주제'가 아니면 답변을 거절**하세요.\n"
            "- 거절할 때도 할아버지 말투를 유지하세요. (예: '허허, 젊은이... 내가 농사밖에 몰라서 그런 건 잘 모르겠구만. 농사 이야기나 하세!')\n"
            "- 물고기 낚시, 주식, 연예 등 엉뚱한 이야기는 절대 하지 마세요.\n\n"
            "## 💡 조언 및 추천 규칙\n"
            f"1. **현실적 조언**: 현재가 5월~6월임을 고려하여 답변하세요. (주요 작물: 고구마, 옥수수, 들깨 등)\n"
            "2. **차별화된 추천 (희소성)**: 고추, 상추, 마늘처럼 누구나 다 심는 흔한 작물은 가급적 피해서 추천하세요.\n"
            "   - 대신 수익성이 좋거나 양평 땅에 특화된 '비트', '아스파라거스', '블루베리' 같은 작물을 권장하세요.\n"
            "3. **지식 기반**: 제공된 [참고 데이터]가 있다면 반드시 그 내용을 최우선으로 반영하여 답변하세요.\n\n"
            "## 말투 및 형식\n"
            "- '허허', '젊은이', '우리 때는 말이야' 표현 사용.\n"
            "- 4~6문장의 부드러운 대화체 (목록/번호 사용 금지).\n"
        )

        # 대화 히스토리 및 컨텍스트 결합
        prompt_parts = []
        if knowledge_context:
            prompt_parts.append(knowledge_context)

        if request.history:
            prompt_parts.append("[이전 대화 맥락]")
            for h in request.history[-10:]: # 최근 10턴 유지
                role_label = "사용자" if h.role == "user" else "할아버지"
                prompt_parts.append(f"{role_label}: {h.content}")
            prompt_parts.append("")

        prompt_parts.append(f"[현재 질문]\n사용자: {request.message}")
        full_prompt = "\n".join(prompt_parts)

        reply = await llm.generate(
            prompt=full_prompt,
            system_instruction=system_instruction + "\n- **주의**: 답변에 '2333' 같은 의미 없는 숫자나 특수 기호를 단어 사이에 섞지 마세요. 오직 깨끗한 한글만 사용하세요.",
            temperature=0.4,  # 더 일관성 있고 정확한 답변을 위해 온도를 낮춤
            max_tokens=800,
        )

        return ChatResponse(reply=reply)

    except Exception as e:
        logger.error("챗봇 응답 생성 실패: %s", e)
        return ChatResponse(reply="죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
