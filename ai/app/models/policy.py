"""
정책 분석 요청/응답 Pydantic 스키마.
"""
from pydantic import BaseModel, Field


class PolicyAnalyzeRequest(BaseModel):
    """정책 분석 요청."""
    source: str = Field(..., description="수집 소스 (GOV24, NONGSARO 등)")
    external_id: str = Field(..., description="외부 정책 고유 ID")
    raw: dict | None = Field(None, description="API 응답 JSON 원본")
    text: str | None = Field(None, description="텍스트 원본 (크롤링/PDF 등)")
    source_url: str | None = Field(None, description="원문 링크 URL")


class PolicyAnalyzeResult(BaseModel):
    """정규화된 정책 분석 결과."""
    title: str = Field(..., description="정책명")
    organization: str | None = Field(None, description="지원기관")
    region_code: str | None = Field(None, description="지역코드 (4자리)")
    category: str = Field(..., description="보조금|교육|임대|검정|세금|융자|기타")
    target: str | None = Field(None, description="지원대상")
    content_summary: str | None = Field(None, description="지원내용 요약 (200자 이내)")
    support_amount: str | None = Field(None, description="지원금액/규모")
    apply_start: str | None = Field(None, description="신청 시작일 (yyyy-MM-dd)")
    apply_end: str | None = Field(None, description="신청 마감일 (yyyy-MM-dd)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="분석 신뢰도 (0.00~1.00)")
    warnings: list[str] = Field(default_factory=list, description="분석 중 발생한 경고 메시지")


class PolicyAnalyzeResponse(BaseModel):
    """정책 분석 API 응답."""
    status: str = Field("ok", description="ok | error")
    source: str
    external_id: str
    result: PolicyAnalyzeResult | None = None
    error: str | None = None
