from pydantic import BaseModel
from typing import Optional, List, Any

class FarmAgentChatRequest(BaseModel):
    """Farm Agent 대화 요청 모델"""
    farmId: int
    message: str

class FarmAgentChatResponse(BaseModel):
    """Farm Agent 대화 응답 모델"""
    reply: str
    toolCalls: Optional[List[dict]] = None
