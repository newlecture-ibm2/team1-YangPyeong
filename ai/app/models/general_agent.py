from pydantic import BaseModel
from typing import Optional

class GeneralAgentChatRequest(BaseModel):
    """General Agent 대화 요청 모델"""
    message: str
    userId: Optional[int] = 0

class GeneralAgentChatResponse(BaseModel):
    """General Agent 대화 응답 모델"""
    reply: str
