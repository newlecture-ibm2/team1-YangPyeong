from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any

class DocumentOcrResponse(BaseModel):
    isValid: bool = Field(..., description="정상적인 농장 등록 문서(토지대장 등)인지 여부")
    errorMessage: Optional[str] = Field(None, description="isValid가 false일 경우의 에러 메시지")
    documentType: Optional[str] = Field(None, description="어떤 문서인지 (예: 농업경영체 등록 확인서)")
    farmOwnerName: Optional[str] = Field(None, description="소유주 또는 임차인 성명")
    address: Optional[str] = Field(None, description="농장 소재지")
    area: Optional[str] = Field(None, description="전체 면적(숫자만)")
    documentIssueNumber: Optional[str] = Field(None, description="문서 발급/확인 번호")
    registrationNumber: Optional[str] = Field(None, description="조회용 메인 등록번호")
    pnuCode: Optional[str] = Field(None, description="토지 고유번호(PNU)")

    @field_validator('errorMessage', 'documentType', 'farmOwnerName', 'address', 'area', 'documentIssueNumber', 'registrationNumber', 'pnuCode', mode='before')
    @classmethod
    def coerce_to_string(cls, v: Any) -> Optional[str]:
        """AI가 숫자형 등으로 잘못 추출하더라도 Pydantic이 에러를 뱉지 않도록 문자열로 안전하게 형변환합니다."""
        if v is not None:
            return str(v)
        return v
