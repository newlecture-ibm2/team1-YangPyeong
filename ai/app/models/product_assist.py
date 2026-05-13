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


# ── 농장 재배 이력 컨텍스트 (Phase 7) ──

class HarvestSummary(BaseModel):
    """수확 이력 요약 정보."""
    harvest_date: str = Field(..., description="수확일 (YYYY-MM-DD)")
    yield_amount: float = Field(..., description="수확량")
    yield_unit: str = Field(..., description="단위 (g | kg | ton)")
    grade: str | None = Field(None, description="등급 (A | B | C)")


class FarmContext(BaseModel):
    """상품 등록 시 참조할 농장 재배 이력 컨텍스트."""
    farm_name: str = Field(..., description="농장명")
    address: str = Field("", description="농장 주소 (원산지 추출용)")
    soil_type: str | None = Field(None, description="토양 유형")
    organic_matter: float | None = Field(None, description="유기물 함량")
    crop_name: str = Field(..., description="재배 작물명")
    cultivation_area: float | None = Field(None, description="재배 면적 (㎡)")
    harvest_records: list[HarvestSummary] = Field(default_factory=list, description="수확 이력 목록")


# ── 전체 자동 채우기 ──

class AutofillRequest(BaseModel):
    """상품 전체 필드 자동 채우기 요청."""
    product_name: str = Field(..., description="상품명 (예: 유기농 상추 500g)")
    farm_context: FarmContext | None = Field(None, description="농장 재배 이력 컨텍스트 (없으면 추론 모드)")


class AutofillData(BaseModel):
    """AI가 생성한 상품 정보."""
    category_name: str = Field(..., description="DB에서 매칭된 카테고리명")
    price: int = Field(..., description="추천 가격 (원)")
    stock: int = Field(..., description="추천 초기 재고")
    description: str = Field(..., description="AI가 생성한 상품 설명")
    is_kamis_applied: bool = Field(False, description="KAMIS 시세 반영 여부")
    kamis_unit: str | None = Field(None, description="KAMIS 단위 (예: 1kg)")


class AutofillResponse(BaseModel):
    """상품 전체 필드 자동 채우기 응답."""
    status: str = Field("ok", description="ok | error")
    data: AutofillData | None = Field(None, description="AI가 생성한 상품 정보")
    error: str | None = Field(None, description="에러 메시지")


# ── 판매자 인사이트 (신규) ──

class SellerProductInfo(BaseModel):
    name: str = Field(..., description="상품명")
    price: int = Field(..., description="가격")
    stock: int = Field(..., description="재고")
    salesCount: int = Field(..., description="누적 판매량")
    status: str = Field(..., description="상태 (ACTIVE, SOLDOUT, INACTIVE 등)")


class InsightRequest(BaseModel):
    """판매자 인사이트 요청."""
    products: list[SellerProductInfo] = Field(..., description="판매자가 등록한 상품 목록")


class InsightResponse(BaseModel):
    """판매자 인사이트 응답."""
    status: str = Field("ok", description="ok | error")
    insight: str | None = Field(None, description="AI가 분석한 한 줄 요약 및 조언 (마크다운 포맷 가능)")
    error: str | None = Field(None, description="에러 메시지")
