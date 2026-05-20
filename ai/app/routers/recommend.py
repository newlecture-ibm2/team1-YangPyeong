import logging
from fastapi import APIRouter, File, UploadFile, HTTPException

from app.models.recommend import (
    ReasonRequest, ReasonResponse, DiagnoseResponse,
    WeightsRequest, WeightsResponse,
    BatchReasonRequest, BatchReasonResponse
)
from app.models.crop_guide import CropGuideRequest, CropGuideResponse
from app.services import recommend_service
from app.services import crop_guide_service

router = APIRouter(prefix="/api/recommend", tags=["Recommend"])
logger = logging.getLogger(__name__)

@router.post("/crop-guide/generate", response_model=CropGuideResponse)
async def generate_crop_guide(req: CropGuideRequest):
    logger.info("재배 가이드 생성: crop=%s, exp=%s", req.crop_name, req.experience_level)
    try:
        return await crop_guide_service.generate_crop_detailed_guide(req)
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error("재배 가이드 생성 실패: %s", e)
        raise HTTPException(status_code=500, detail="AI 재배 가이드 생성 중 오류가 발생했습니다.")

@router.post("/reason", response_model=ReasonResponse)
async def generate_reason(req: ReasonRequest):
    logger.info(f"추천 사유 생성 요청: {req.crop_name}")
    try:
        return await recommend_service.generate_recommend_reason(req)
    except Exception as e:
        logger.error(f"추천 사유 생성 실패: {e}")
        raise HTTPException(status_code=500, detail="AI 처리 중 오류가 발생했습니다.")

@router.post("/reason/batch", response_model=BatchReasonResponse)
async def generate_batch_reasons(req: BatchReasonRequest):
    """여러 작물의 추천 사유를 한 번의 LLM 호출로 일괄 생성합니다."""
    logger.info(f"배치 추천 사유 생성 요청: {len(req.items)}건")
    try:
        return await recommend_service.generate_batch_reasons(req)
    except Exception as e:
        logger.error(f"배치 추천 사유 생성 실패: {e}")
        raise HTTPException(status_code=500, detail="AI 배치 처리 중 오류가 발생했습니다.")

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

