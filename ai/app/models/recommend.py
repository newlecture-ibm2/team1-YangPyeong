from pydantic import BaseModel

class ReasonRequest(BaseModel):
    farm_details: str
    crop_name: str
    crop_category: str

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
