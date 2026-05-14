import logging
from fastapi import APIRouter, File, UploadFile, HTTPException

from app.models.recommend import ReasonRequest, ReasonResponse, DiagnoseResponse, WeightsRequest, WeightsResponse
from app.services import recommend_service

router = APIRouter(prefix="/api/recommend", tags=["Recommend"])
logger = logging.getLogger(__name__)

@router.post("/reason", response_model=ReasonResponse)
async def generate_reason(req: ReasonRequest):
    logger.info(f"추천 사유 생성 요청: {req.crop_name}")
    try:
        return await recommend_service.generate_recommend_reason(req)
    except Exception as e:
        logger.error(f"추천 사유 생성 실패: {e}")
        raise HTTPException(status_code=500, detail="AI 처리 중 오류가 발생했습니다.")

@router.post("/weights", response_model=WeightsResponse)
async def tune_weights(req: WeightsRequest):
    logger.info(f"가중치 튜닝 요청: {req.farm_details}")
    try:
        return await recommend_service.tune_recommend_weights(req)
    except Exception as e:
        logger.error(f"가중치 튜닝 실패: {e}")
        raise HTTPException(status_code=500, detail="가중치 튜닝 중 오류가 발생했습니다.")

@router.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose_image(image: UploadFile = File(...)):
    logger.info(f"이미지 진단 요청: {image.filename} ({image.content_type})")
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")
        
    try:
        image_bytes = await image.read()
    except Exception as e:
        logger.error(f"이미지 읽기 실패: {e}")
        raise HTTPException(status_code=400, detail="이미지 읽기에 실패했습니다.")

    try:
        return await recommend_service.diagnose_crop_image(image, image_bytes)
    except ValueError as ve:
        raise HTTPException(status_code=501, detail=str(ve))
    except Exception as e:
        logger.error(f"이미지 진단 실패: {e}")
        raise HTTPException(status_code=500, detail="AI 이미지 진단 중 오류가 발생했습니다.")
