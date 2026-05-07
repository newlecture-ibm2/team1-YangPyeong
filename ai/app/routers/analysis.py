from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

class PredictYieldRequest(BaseModel):
    crop_id: int
    area: float
    cultivation_type: str

class PredictYieldResponse(BaseModel):
    predicted_yield: float

@router.post("/predict-yield", response_model=PredictYieldResponse)
async def predict_yield(request: PredictYieldRequest):
    service = AnalysisService()
    yield_val = await service.predict_yield(
        request.crop_id, 
        request.area, 
        request.cultivation_type
    )
    return PredictYieldResponse(predicted_yield=yield_val)
