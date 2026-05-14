import json
import logging
from langchain_core.tools import tool
from app.services.product_assist_service import autofill_product
from app.models.product_assist import AutofillData

logger = logging.getLogger(__name__)

@tool
async def navigate_to_register_page() -> str:
    """
    상품 등록, 판매 시작, 내 작물 팔기 등 사용자가 상품을 등록하길 원할 때 호출합니다.
    이 도구를 호출한 후에는 반환값을 참조하여 사용자에게 상품 등록 페이지로 안내하는 액션(Action)을 생성해야 합니다.
    """
    payload = {
        "type": "NAVIGATE",
        "url": "/mypage/seller/register"
    }
    return f"[ACTION:{json.dumps(payload, ensure_ascii=False)}]"


@tool
async def autofill_product_info(product_name: str) -> str:
    """
    사용자가 특정 상품(예: 옥수수, 상추)의 정보를 알아서 채워달라고 요청할 때 호출합니다.
    상품명(product_name)을 입력하면, AI가 카테고리, 추천 가격, 초기 재고, 상세 설명을 자동으로 생성합니다.
    생성된 데이터는 프론트엔드의 폼을 채우기 위한 액션(Action)으로 변환되어야 합니다.
    """
    try:
        data: AutofillData = await autofill_product(product_name)
        
        payload = {
            "type": "FILL_FORM",
            "payload": {
                "name": product_name,
                "price": data.price,
                "stock": data.stock,
                "categoryName": data.category_name,
                "description": data.description,
                "isKamisApplied": data.is_kamis_applied,
                "kamisUnit": data.kamis_unit
            }
        }
        return f"[ACTION:{json.dumps(payload, ensure_ascii=False)}]"
    except Exception as e:
        logger.error(f"[ShopTool] autofill_product_info 에러: {e}")
        return f"상품 정보를 자동으로 채우는 중 오류가 발생했습니다: {str(e)}"
