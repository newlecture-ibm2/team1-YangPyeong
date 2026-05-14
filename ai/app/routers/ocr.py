from fastapi import APIRouter, UploadFile, File, HTTPException
import logging
from app.models.ocr import DocumentOcrResponse
from app.services.ocr_service import OcrService

router = APIRouter(prefix="/ocr", tags=["OCR"])
logger = logging.getLogger(__name__)

@router.post("/farm-document", response_model=DocumentOcrResponse)
async def analyze_farm_document(file: UploadFile = File(...)):
    """
    농장 등록 증명서(토지대장, 농업경영체 등록 확인서, 농지대장)를 OCR로 분석합니다.
    """
    if not file.content_type in ["image/jpeg", "image/png", "application/pdf"]:
        return DocumentOcrResponse(
            isValid=False,
            errorMessage="지원하지 않는 파일 형식입니다. JPG, PNG 또는 PDF 파일만 업로드 가능합니다."
        )

    try:
        file_bytes = await file.read()
        service = OcrService()
        return await service.extract_document_info(file_bytes, file.content_type)
    except Exception as e:
        logger.error(f"농장 문서 OCR 처리 실패: {e}")
        raise HTTPException(
            status_code=500,
            detail="문서 처리 중 오류가 발생했습니다."
        )
