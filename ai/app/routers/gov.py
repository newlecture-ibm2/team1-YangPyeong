from fastapi import APIRouter, Depends, HTTPException
import logging
from app.models.gov import GovChatRequest, GovChatResponse
from app.agents.gov_agent import GovAgent

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/local-gov",
    tags=["Local Gov AI"]
)

@router.post("/chat", response_model=GovChatResponse)
async def gov_chat(request: GovChatRequest):
    """
    지자체 전용 GraphRAG AI 분석 엔드포인트
    """
    try:
        agent = GovAgent()
        response = await agent.run(request)
        return response
    except Exception as e:
        logger.error(f"GovAgent 호출 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="AI 분석 서버 오류가 발생했습니다.")
