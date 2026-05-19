from fastapi import APIRouter
from app.models.admin import (
    ShopAuditBatchRequest, ShopAuditBatchResponse,
    ModerationBatchRequest, ModerationBatchResponse,
    CommentModerationBatchRequest, CommentModerationBatchResponse
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

@router.post("/moderate-comment-batch", response_model=CommentModerationBatchResponse)
async def moderate_comment_batch(request: CommentModerationBatchRequest):
    """
    커뮤니티 댓글 목록을 AI가 일괄 심사하여 스팸 여부를 판단합니다.
    """
    return await admin_service.moderate_comment_batch(request)

@router.post("/sync-rag")
async def sync_rag_data():
    """
    PostgreSQL의 RAG 문서를 ChromaDB 벡터 스토어와 동기화합니다.
    """
    return await admin_service.sync_rag_data()
