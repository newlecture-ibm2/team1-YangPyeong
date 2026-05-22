from pydantic import BaseModel
from typing import Optional

class BalanceAgentAnalysisRequest(BaseModel):
    """수급 분석 에이전트 요청 모델"""
    cropName: str
    year: Optional[int] = None
    townName: Optional[str] = None
    townRatio: Optional[float] = None
    townStatus: Optional[str] = None

class BalanceAgentAnalysisResponse(BaseModel):
    """수급 분석 에이전트 응답 모델"""
    reply: str
    status: str
