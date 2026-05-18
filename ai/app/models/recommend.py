from pydantic import BaseModel

class ReasonRequest(BaseModel):
    farm_details: str
    crop_name: str
    crop_category: str
    recommend_mode: str = "PLAN"
    advice_type: str = "NEW_RECOMMEND"
    is_current_crop: bool = False
    soil_mismatch: str | None = None

class ReasonResponse(BaseModel):
    ai_reason: str

class BatchReasonItem(BaseModel):
    """배치 사유 생성 요청의 개별 작물 항목"""
    crop_name: str
    crop_category: str
    advice_type: str = "NEW_RECOMMEND"
    is_current_crop: bool = False
    soil_mismatch: str | None = None

class BatchReasonRequest(BaseModel):
    """여러 작물의 추천 사유를 한 번의 LLM 호출로 생성하기 위한 배치 요청"""
    farm_details: str
    recommend_mode: str = "PLAN"
    items: list[BatchReasonItem]

class BatchReasonResponse(BaseModel):
    """배치 사유 생성 응답 — 각 작물명을 키로 하는 사유 맵"""
    reasons: dict[str, str]

class DiagnoseResponse(BaseModel):
    diagnosis: str

class WeightsRequest(BaseModel):
    farm_details: str

class WeightsResponse(BaseModel):
    w_soil: float
    w_price: float
    w_supply: float
    w_difficulty: float
    reasoning: str

