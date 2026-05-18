from fastapi import APIRouter
from app.models.admin import (
    ShopAuditBatchRequest, ShopAuditBatchResponse,
    ModerationBatchRequest, ModerationBatchResponse
)
from app.services.admin_service import AdminService

router = APIRouter(prefix="/api/admin", tags=["admin"])
admin_service = AdminService()

@router.post("/audit-shop-batch", response_model=ShopAuditBatchResponse)
async def audit_shop_batch(request: ShopAuditBatchRequest):
    """
    상점 신규 상품 목록을 AI가 일괄 심사합니다.
    """
    return await admin_service.audit_shop_batch(request)

@router.post("/moderate-post-batch", response_model=ModerationBatchResponse)
async def moderate_post_batch(request: ModerationBatchRequest):
    """
    커뮤니티 게시글 목록을 AI가 일괄 심사하여 스팸 여부를 판단합니다.
    """
    return await admin_service.moderate_post_batch(request)
