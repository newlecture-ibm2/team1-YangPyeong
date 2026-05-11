"""
수익 예측 API 라우터
AI Agent를 활용하여 KAMIS 실시간 시세 기반 예상 수익을 계산합니다.
"""

import logging
from fastapi import APIRouter, HTTPException

from app.models.revenue import RevenuePredictionRequest, RevenuePredictionResponse
from app.services import revenue_service

router = APIRouter(prefix="/api/revenue", tags=["Revenue Prediction"])
logger = logging.getLogger(__name__)


@router.post("/predict", response_model=RevenuePredictionResponse)
async def predict_revenue(req: RevenuePredictionRequest):
    """
    작물 수익 예측 API
    
    - KAMIS 실시간 도매 시세 조회
    - 파종 시기/기후/토양 기반 수확량 예측
    - AI Agent가 종합 분석 후 인사이트 생성
    """
    logger.info(f"수익 예측 요청: {req.crop_name}, {req.area_sqm}㎡")
    try:
        result = await revenue_service.predict_revenue(req)
        return result
    except Exception as e:
        logger.error(f"수익 예측 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"수익 예측 중 오류가 발생했습니다: {str(e)}")
