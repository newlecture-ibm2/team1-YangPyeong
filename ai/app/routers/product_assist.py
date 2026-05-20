"""
상품 AI 어시스트 API 라우터.
POST /api/product-assist/description   — 설명만 생성
POST /api/product-assist/autofill      — 전체 필드 자동 채우기
POST /api/product-assist/insight       — 판매자 인사이트
GET  /api/product-assist/kamis-price   — KAMIS 1kg 시세 단건 조회 (LLM 호출 없음)
"""
import logging

from fastapi import APIRouter, HTTPException, Query

from app.models.product_assist import (
    AutofillRequest,
    AutofillResponse,
    DescriptionRequest,
    DescriptionResponse,
    InsightRequest,
    InsightResponse,
)
from app.services.product_assist_service import (
    _fetch_kamis_price,
    autofill_product,
    generate_product_description,
    generate_insight,
    infer_product_category,
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
    상품명(+ 선택적 재배 이력)을 입력하면 AI가 카테고리·가격·재고·설명을 자동으로 채워줍니다.
    카테고리는 DB의 product_categories 테이블에서 조회하여 정확하게 매칭합니다.
    farm_context가 있으면 실제 재배 이력 기반으로 더 정확한 결과를 생성합니다.
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
            farm_context=request.farm_context,
            existing_values=request.existing_values,
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


@router.get("/kamis-price")
async def get_kamis_price(
    crop_name: str = Query(..., alias="cropName", description="작물명 (예: 배추)"),
) -> dict:
    """KAMIS 1kg 단가 단건 조회 (LLM 호출 없음, DB 캐시 직조회).

    상품 등록 페이지가 진입 시점에 호출하여 가격을 자동 채우기 위한 가벼운 엔드포인트.

    Returns:
        - 매칭 성공: {"status": "ok", "data": {"crop_name", "price", "unit", "price_date"}}
        - 매칭 실패: {"status": "ok", "data": null}
    """
    if not crop_name.strip():
        raise HTTPException(
            status_code=400,
            detail={"code": "E-AI-PRD-006", "message": "cropName은 필수입니다."},
        )
    name = crop_name.strip()
    try:
        data = _fetch_kamis_price(name)
        category = infer_product_category(name)
        # KAMIS 매칭이 실패해도 카테고리는 반환할 수 있음
        if data:
            data["category_name"] = category
            return {"status": "ok", "data": data}
        if category:
            return {"status": "ok", "data": {"category_name": category, "crop_name": name}}
        return {"status": "ok", "data": None}
    except Exception as e:
        logger.error(f"[product-assist/kamis-price] 조회 실패: {e}")
        return {"status": "error", "data": None, "error": str(e)}


@router.post("/insight", response_model=InsightResponse)
async def create_insight(request: InsightRequest) -> InsightResponse:
    """
    판매자의 상품 데이터(목록, 판매량, 재고 등)를 받아
    AI가 분석한 인사이트를 반환합니다.
    """
    try:
        insight = await generate_insight(request)
        return InsightResponse(
            status="ok",
            insight=insight,
        )
    except Exception as e:
        logger.error(f"[product-assist/insight] 생성 실패: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "E-AI-PRD-005",
                "message": f"인사이트 생성 중 오류가 발생했습니다: {str(e)}",
            },
        )
