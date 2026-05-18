import logging
from fastapi import APIRouter, HTTPException
from app.models.community_agent import CommunityAgentChatRequest, CommunityAgentChatResponse
from app.agents.community_agent import get_community_agent

router = APIRouter(prefix="/api/community-agent", tags=["community-agent"])
logger = logging.getLogger(__name__)

@router.post("/chat", response_model=CommunityAgentChatResponse)
async def community_agent_chat(request: CommunityAgentChatRequest) -> CommunityAgentChatResponse:
    """
    커뮤니티 지식 전문가 에이전트와 대화합니다.
    게시판 데이터를 검색하여 농업 지식을 답변합니다.
    """
    logger.info("Community Agent 요청 수신 [message=%s]", request.message[:20])
    
    try:
        agent = get_community_agent()
        
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
        
        # 도구 호출 정보 추출
        tool_calls = []
        for msg in messages:
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    tool_calls.append({
                        "name": tc["name"],
                        "args": tc["args"]
                    })
        
        return CommunityAgentChatResponse(
            reply=last_message.content,
            toolCalls=tool_calls if tool_calls else None
        )
        
    except Exception as e:
        logger.error("Community Agent 실행 중 오류 발생: %s", e)
        raise HTTPException(
            status_code=500, 
            detail={"code": "E-AI-COMMUNITY-001", "message": f"에이전트 실행 오류: {str(e)}"}
        )
