import logging
from fastapi import APIRouter, HTTPException
from app.models.farm_agent import FarmAgentChatRequest, FarmAgentChatResponse
from app.agents.farm_agent import get_farm_agent

router = APIRouter(prefix="/api/farm-agent", tags=["farm-agent"])
logger = logging.getLogger(__name__)

@router.post("/chat", response_model=FarmAgentChatResponse)
async def farm_agent_chat(request: FarmAgentChatRequest) -> FarmAgentChatResponse:
    """
    농장 관리 전문가 에이전트와 대화합니다.
    농장 ID를 바탕으로 상태, 날씨, 재배 이력을 조회하여 답변합니다.
    """
    logger.info("Farm Agent 요청 수신 [farmId=%s]", request.farmId)
    
    try:
        agent = get_farm_agent()
        
        # 에이전트 입력 구성 (농장 ID 컨텍스트 포함)
        input_message = {
            "messages": [
                ("user", f"내 농장 ID는 {request.farmId}야. {request.message}")
            ]
        }
        
        # 에이전트 실행 (최종 결과까지 대기)
        result = await agent.ainvoke(input_message)
        
        # 메시지 히스토리에서 마지막 AI 답변 추출
        messages = result.get("messages", [])
        if not messages:
            raise HTTPException(status_code=500, detail="에이전트로부터 응답을 받지 못했습니다.")
            
        last_message = messages[-1]
        
        # 도구 호출 정보 추출 (디버깅 및 UI 표시용)
        tool_calls = []
        for msg in messages:
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    tool_calls.append({
                        "name": tc["name"],
                        "args": tc["args"]
                    })
        
        return FarmAgentChatResponse(
            reply=last_message.content,
            toolCalls=tool_calls if tool_calls else None
        )
        
    except Exception as e:
        logger.error("Farm Agent 실행 중 오류 발생: %s", e)
        raise HTTPException(
            status_code=500, 
            detail={"code": "E-AI-FARM-001", "message": f"에이전트 실행 오류: {str(e)}"}
        )
