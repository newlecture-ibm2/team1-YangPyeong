from pydantic import BaseModel

class ReasonRequest(BaseModel):
    farm_details: str
    crop_name: str
    crop_category: str

class ReasonResponse(BaseModel):
    ai_reason: str

class DiagnoseResponse(BaseModel):
    diagnosis: str
