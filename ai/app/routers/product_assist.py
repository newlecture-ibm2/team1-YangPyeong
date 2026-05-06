"""
상품 AI 어시스트 API 라우터.
POST /api/product-assist/description   — 설명만 생성
POST /api/product-assist/autofill      — 전체 필드 자동 채우기
"""
import logging

from fastapi import APIRouter, HTTPException

from app.models.product_assist import (
    AutofillRequest,
    AutofillResponse,
    DescriptionRequest,
    DescriptionResponse,
)
from app.services.product_assist_service import (
    autofill_product,
    generate_product_description,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/product-assist", tags=["product-assist"])


@router.post("/description", response_model=DescriptionResponse)
async def create_description(request: DescriptionRequest) -> DescriptionResponse:
    """
    상품명 + 카테고리를 받아 AI가 매력적인 상품 설명을 생성합니다.
    """
    if not request.product_name.strip():
        raise HTTPException(
            status_code=400,
            detail={
                "code": "E-AI-PRD-001",
                "message": "상품명은 필수입니다.",
            },
        )

    try:
        description = await generate_product_description(
            product_name=request.product_name.strip(),
            category_name=request.category_name.strip(),
        )
        return DescriptionResponse(
            status="ok",
            description=description,
        )
    except Exception as e:
        logger.error(f"[product-assist/description] 생성 실패: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "E-AI-PRD-002",
                "message": f"상품 설명 생성 중 오류가 발생했습니다: {str(e)}",
            },
        )


@router.post("/autofill", response_model=AutofillResponse)
async def autofill(request: AutofillRequest) -> AutofillResponse:
    """
    상품명만 입력하면 AI가 카테고리·가격·재고·설명을 자동으로 채워줍니다.
    카테고리는 DB의 product_categories 테이블에서 조회하여 정확하게 매칭합니다.
    """
    if not request.product_name.strip():
        raise HTTPException(
            status_code=400,
            detail={
                "code": "E-AI-PRD-003",
                "message": "상품명은 필수입니다.",
            },
        )

    try:
        result = await autofill_product(
            product_name=request.product_name.strip(),
        )
        return AutofillResponse(
            status="ok",
            data=result,
        )
    except Exception as e:
        logger.error(f"[product-assist/autofill] 생성 실패: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "E-AI-PRD-004",
                "message": f"상품 자동 채우기 중 오류가 발생했습니다: {str(e)}",
            },
        )
