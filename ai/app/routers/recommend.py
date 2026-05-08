import logging
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel

from app.llm import get_llm
from app.llm.gemini import GeminiLLM

router = APIRouter(prefix="/api/v1/recommend", tags=["Recommend"])
logger = logging.getLogger(__name__)

class ReasonRequest(BaseModel):
    farm_details: str
    crop_name: str
    crop_category: str

class ReasonResponse(BaseModel):
    ai_reason: str

class DiagnoseResponse(BaseModel):
    diagnosis: str

@router.post("/reason", response_model=ReasonResponse)
async def generate_reason(req: ReasonRequest):
    logger.info(f"추천 사유 생성 요청: {req.crop_name}")
    prompt = (
        f"다음 농장 정보를 바탕으로 '{req.crop_name}'({req.crop_category}) 작물이 "
        f"왜 추천되었는지 3문장 이내로 전문적이고 친절하게 설명해줘.\n"
        f"농장 정보: {req.farm_details}"
    )
    
    # 분석/추천용은 gemini를 사용
    llm = get_llm("gemini")
    try:
        response_text = await llm.generate(prompt)
        return ReasonResponse(ai_reason=response_text)
    except Exception as e:
        logger.error(f"추천 사유 생성 실패: {e}")
        raise HTTPException(status_code=500, detail="AI 처리 중 오류가 발생했습니다.")

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

    prompt = "이 작물 사진을 보고, 어떤 작물인지 그리고 어떤 병해충 증상이 있는지, 어떻게 조치해야 하는지 농업 전문가로서 진단해줘. 500자 이내로 답변해줘."
    
    # 이미지 분석은 Gemini의 멀티모달 기능 사용
    llm = get_llm("gemini")
    if isinstance(llm, GeminiLLM):
        try:
            model = llm._get_model()
            content = [
                prompt,
                {"mime_type": image.content_type, "data": image_bytes}
            ]
            response = await model.generate_content_async(content)
            return DiagnoseResponse(diagnosis=response.text)
        except Exception as e:
            logger.error(f"이미지 진단 실패: {e}")
            raise HTTPException(status_code=500, detail="AI 이미지 진단 중 오류가 발생했습니다.")
    else:
        logger.error(f"현재 설정된 LLM({type(llm)})은 이미지 진단을 지원하지 않습니다.")
        raise HTTPException(status_code=501, detail="현재 설정된 LLM은 이미지 진단을 지원하지 않습니다.")
