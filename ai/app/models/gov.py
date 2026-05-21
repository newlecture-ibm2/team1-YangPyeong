from enum import Enum
from typing import Any
from pydantic import BaseModel, Field

class IntentType(str, Enum):
    POLICY_RECOMMEND = "POLICY_RECOMMEND"
    ALTERNATIVE_CROP = "ALTERNATIVE_CROP"
    FARM_ANALYSIS = "FARM_ANALYSIS"
    RISK_ANALYSIS = "RISK_ANALYSIS"
    REGION_SUMMARY = "REGION_SUMMARY"
    GENERAL_ANALYSIS = "GENERAL_ANALYSIS"

class ExtractedEntities(BaseModel):
    region: str | None = None
    crop: str | None = None
    farm: str | None = None

class GovChatRequest(BaseModel):
    message: str = Field(..., description="사용자 자연어 입력")
    user_role: str | None = Field(default="GOV", description="사용자 역할 (GOV, FARMER, ADMIN) - 향후 GraphAnalysis 확장용")

class PolicySummary(BaseModel):
    title: str
    category: str | None = None
    support_amount: str | None = None

class CropRiskSummary(BaseModel):
    crop: str
    status: str
    ratio: float | None = None

class AlternativeCropSummary(BaseModel):
    crop: str
    reason: str | None = None

class GraphSource(BaseModel):
    type: str = "GRAPH_DB"
    description: str

class GraphContext(BaseModel):
    intent: str
    user_role: str | None = "GOV" # 확장 포인트: FARMER, ADMIN 분기용
    target_region: str | None = None
    target_crop: str | None = None
    target_farm: str | None = None
    region_farm_count: int | None = None
    supply_status: str | None = None
    supply_ratio: float | None = None
    related_policies: list[PolicySummary] = Field(default_factory=list)
    risk_crops: list[CropRiskSummary] = Field(default_factory=list)
    recommended_crops: list[AlternativeCropSummary] = Field(default_factory=list)
    sources: list[GraphSource] = Field(default_factory=list)

class GovChatResponse(BaseModel):
    intent: IntentType | None = None
    entities: ExtractedEntities | None = None
    answer: str
    graph_summary: dict | None = None
    error: str | None = None
