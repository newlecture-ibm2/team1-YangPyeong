import logging
from fastapi import UploadFile

from app.llm import get_llm
from app.llm.gemini import GeminiLLM
from app.models.recommend import ReasonRequest, ReasonResponse, DiagnoseResponse

logger = logging.getLogger(__name__)

async def generate_recommend_reason(req: ReasonRequest) -> ReasonResponse:
    prompt = (
        f"다음 농장 정보를 바탕으로 '{req.crop_name}'({req.crop_category}) 작물이 "
        f"왜 추천되었는지 3문장 이내로 전문적이고 친절하게 설명해줘.\n"
        f"농장 정보: {req.farm_details}"
    )
    
    llm = get_llm("gemini")
    response_text = await llm.generate(prompt)
    return ReasonResponse(ai_reason=response_text)

async def diagnose_crop_image(image: UploadFile, image_bytes: bytes) -> DiagnoseResponse:
    prompt = "이 작물 사진을 보고, 어떤 작물인지 그리고 어떤 병해충 증상이 있는지, 어떻게 조치해야 하는지 농업 전문가로서 진단해줘. 500자 이내로 답변해줘."
    
    llm = get_llm("gemini")
    if isinstance(llm, GeminiLLM):
        model = llm._get_model()
        content = [
            prompt,
            {"mime_type": image.content_type, "data": image_bytes}
        ]
        response = await model.generate_content_async(content)
        return DiagnoseResponse(diagnosis=response.text)
    else:
        logger.error(f"현재 설정된 LLM({type(llm)})은 이미지 진단을 지원하지 않습니다.")
        raise ValueError("현재 설정된 LLM은 이미지 진단을 지원하지 않습니다.")
