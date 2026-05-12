"""
수익 예측 요청/응답 모델
"""

from pydantic import BaseModel, Field
from typing import Optional


class RevenuePredictionRequest(BaseModel):
    """수익 예측 요청"""
    crop_name: str = Field(..., description="작물명")
    area_sqm: float = Field(..., description="재배 면적 (㎡)")
    sowing_month: Optional[int] = Field(None, description="파종 월 (1~12). 미입력 시 현재 월 사용")
    actual_yield_kg: Optional[float] = Field(None, description="사용자 입력 실제 수확량 (kg). 입력 시 예측 대신 사용")
    weather_context: Optional[str] = Field(None, description="기상 정보 텍스트 (선택)")
    farm_id: Optional[int] = Field(None, description="농장 ID (선택)")
    kamis_price: Optional[dict] = Field(None, description="Backend에서 조회한 KAMIS 캐시 데이터 (선택)")


class RevenuePredictionResponse(BaseModel):
    """수익 예측 응답"""
    crop_name: str = Field(..., description="작물명")
    area_sqm: float = Field(..., description="재배 면적 (㎡)")
    predicted_yield_kg: float = Field(..., description="예측/실제 수확량 (kg)")
    predicted_price_per_kg: int = Field(..., description="예측 시세 (원/kg)")
    predicted_revenue: int = Field(..., description="예상 수익 (원)")
    yield_factors: dict = Field(default_factory=dict, description="수확량 영향 요인 분석")
    price_insight: str = Field("", description="시세 전망 인사이트")
    revenue_insight: str = Field("", description="수익 종합 인사이트")
    confidence: str = Field("보통", description="예측 신뢰도")
    kamis_raw: Optional[dict] = Field(None, description="KAMIS 원본 시세 데이터")
