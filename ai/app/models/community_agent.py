from pydantic import BaseModel
from typing import Optional, List

class CommunityAgentChatRequest(BaseModel):
    """Community Agent 대화 요청 모델"""
    message: str
    userId: Optional[int] = 0

class CommunityAgentChatResponse(BaseModel):
    """Community Agent 대화 응답 모델"""
    reply: str
    toolCalls: Optional[List[dict]] = None
