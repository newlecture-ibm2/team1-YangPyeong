from pydantic import BaseModel, Field
from typing import List

# --- 상점(Shop) 심사 모델 ---

class ShopAuditItem(BaseModel):
    product_id: int
    product_name: str
    category: str
    price: int
    description: str

class ShopAuditBatchRequest(BaseModel):
    items: List[ShopAuditItem]

class ShopAuditResult(BaseModel):
    product_id: int = Field(description="The ID of the product being audited")
    is_valid: bool = Field(description="True if the product is a valid agricultural/processed product, False if it is spam, scam, non-agricultural, or joke")
    reason: str = Field(description="Reason for the decision in Korean")

class ShopAuditBatchResponse(BaseModel):
    results: List[ShopAuditResult]

# --- 커뮤니티(Community) 심사 모델 ---

class ModerationItem(BaseModel):
    post_id: int
    title: str
    content: str

class ModerationBatchRequest(BaseModel):
    items: List[ModerationItem]

class ModerationResult(BaseModel):
    post_id: int = Field(description="The ID of the post being moderated")
    is_clean: bool = Field(description="True if the post is clean, False if it contains spam, gambling, illegal links, heavy profanity, or hate speech")
    reason: str = Field(description="Reason for the decision in Korean")

class ModerationBatchResponse(BaseModel):
    results: List[ModerationResult]

class CommentModerationItem(BaseModel):
    comment_id: int
    content: str

class CommentModerationBatchRequest(BaseModel):
    items: List[CommentModerationItem]

class CommentModerationResult(BaseModel):
    comment_id: int = Field(description="The ID of the comment being moderated")
    is_clean: bool = Field(description="True if the comment is clean, False if it contains spam, gambling, illegal links, heavy profanity, or hate speech")
    reason: str = Field(description="Reason for the decision in Korean")

class CommentModerationBatchResponse(BaseModel):
    results: List[CommentModerationResult]
