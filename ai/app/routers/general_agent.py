import logging
from fastapi import APIRouter, HTTPException
from app.models.general_agent import GeneralAgentChatRequest, GeneralAgentChatResponse
from app.agents.general_agent import get_general_agent

router = APIRouter(prefix="/api/general-agent", tags=["general-agent"])
logger = logging.getLogger(__name__)

@router.post("/chat", response_model=GeneralAgentChatResponse)
async def general_agent_chat(request: GeneralAgentChatRequest) -> GeneralAgentChatResponse:
    """
    양평이 할아버지(일반 상담) 에이전트와 대화합니다.
    """
    logger.info("General Agent 요청 수신 [message=%s]", request.message[:20])
    
    try:
        agent = get_general_agent()
        
        # 에이전트 입력 구성
        input_message = {
            "messages": [
                ("user", request.message)
            ]
        }
        
        # 에이전트 실행
        result = await agent.ainvoke(input_message)
        
        # 메시지 히스토리에서 마지막 AI 답변 추출
        messages = result.get("messages", [])
        if not messages:
            raise HTTPException(status_code=500, detail="에이전트로부터 응답을 받지 못했습니다.")
            
        last_message = messages[-1]
        
        return GeneralAgentChatResponse(
            reply=last_message.content
        )
        
    except Exception as e:
        logger.error("General Agent 실행 중 오류 발생: %s", e)
        raise HTTPException(
            status_code=500, 
            detail={"code": "E-AI-GENERAL-001", "message": f"에이전트 실행 오류: {str(e)}"}
        )
