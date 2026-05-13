from fastapi import APIRouter, Depends, HTTPException
import logging
from app.models.gov import GovChatRequest, GovChatResponse
from app.agents.gov_agent import GovAgent
from app.agents.gov_react_agent import get_gov_react_agent
from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/local-gov",
    tags=["Local Gov AI"]
)


async def _run_classic(request: GovChatRequest) -> GovChatResponse:
    """기존 GovAgent 수동 파이프라인으로 요청을 처리합니다."""
    agent = GovAgent()
    return await agent.run(request)


async def _run_react(request: GovChatRequest) -> GovChatResponse:
    """
    ReAct Gov Agent로 요청을 처리하고 GovChatResponse로 감쌉니다.
    ReAct 에이전트는 messages만 반환하므로 프론트가 기대하는 구조에 맞춰 변환합니다.
    """
    agent = get_gov_react_agent()
    result = await agent.ainvoke({
        "messages": [("user", request.message)]
    })

    messages = result.get("messages", [])
    react_answer = messages[-1].content if messages else "응답을 생성하지 못했습니다."

    return GovChatResponse(
        intent=None,
        entities=None,
        answer=react_answer,
        graph_summary={
            "agent_mode": "react",
            "fallback": False,
        }
    )


@router.post("/chat", response_model=GovChatResponse)
async def gov_chat(request: GovChatRequest):
    """
    지자체 전용 GraphRAG AI 분석 엔드포인트.

    GOV_AGENT_MODE 설정에 따라 에이전트를 선택합니다:
    - classic (기본): 기존 GovAgent 수동 파이프라인
    - react: ReAct 기반 실험용 에이전트 (실패 시 classic fallback)
    """
    settings = get_settings()
    mode = settings.GOV_AGENT_MODE.lower()

    # ── classic 모드 (기본) ──
    if mode != "react":
        logger.info("[GovChat] agent_mode=classic")
        try:
            response = await _run_classic(request)
            logger.info("[GovChat] classic response completed")
            return response
        except Exception as e:
            logger.error(f"GovAgent 호출 실패: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="AI 분석 서버 오류가 발생했습니다.")

    # ── react 모드 ──
    logger.info("[GovChat] agent_mode=react")
    try:
        response = await _run_react(request)
        logger.info("[GovChat] react response completed")
        return response
    except Exception as e:
        # react 실패 → classic fallback
        logger.exception(f"[GovChat] react agent failed, fallback to classic: {e}")
        try:
            response = await _run_classic(request)
            # fallback 성공 시 graph_summary에 표시
            response.graph_summary = {
                "agent_mode": "classic",
                "fallback": True,
                "fallback_reason": "react_agent_failed",
            }
            logger.info("[GovChat] classic fallback response completed")
            return response
        except Exception as fallback_err:
            logger.error(f"GovAgent classic fallback도 실패: {fallback_err}", exc_info=True)
            raise HTTPException(status_code=500, detail="AI 분석 서버 오류가 발생했습니다.")
