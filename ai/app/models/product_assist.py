"""
상품 AI 어시스트 요청/응답 Pydantic 스키마.
상품 설명 자동 생성, 전체 필드 자동 채우기 등에 사용합니다.
"""
from pydantic import BaseModel, Field


# ── 설명 생성 (기존) ──

class DescriptionRequest(BaseModel):
    """상품 설명 생성 요청."""
    product_name: str = Field(..., description="상품명 (예: 유기농 상추 500g)")
    category_name: str = Field(..., description="카테고리명 (예: 채소)")


class DescriptionResponse(BaseModel):
    """상품 설명 생성 응답."""
    status: str = Field("ok", description="ok | error")
    description: str | None = Field(None, description="AI가 생성한 상품 설명 (500자 이내)")
    error: str | None = Field(None, description="에러 메시지")


# ── 전체 자동 채우기 (신규) ──

class AutofillRequest(BaseModel):
    """상품 전체 필드 자동 채우기 요청."""
    product_name: str = Field(..., description="상품명 (예: 유기농 상추 500g)")


class AutofillData(BaseModel):
    """AI가 생성한 상품 정보."""
    category_name: str = Field(..., description="DB에서 매칭된 카테고리명")
    price: int = Field(..., description="추천 가격 (원)")
    stock: int = Field(..., description="추천 초기 재고")
    description: str = Field(..., description="AI가 생성한 상품 설명")


class AutofillResponse(BaseModel):
    """상품 전체 필드 자동 채우기 응답."""
    status: str = Field("ok", description="ok | error")
    data: AutofillData | None = Field(None, description="AI가 생성한 상품 정보")
    error: str | None = Field(None, description="에러 메시지")
