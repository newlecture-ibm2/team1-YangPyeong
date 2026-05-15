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
