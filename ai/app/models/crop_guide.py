from pydantic import BaseModel, Field


class CropGuideRequest(BaseModel):
    farm_id: int | None = None
    crop_id: int | None = None
    crop_name: str
    crop_category: str = "채소류"
    advice_type: str = "NEW_RECOMMEND"
    experience_level: str = "novice"
    farm_name: str | None = None
    farm_address: str | None = None
    soil_ph: float | None = None
    soil_type: str | None = None
    organic_matter: float | None = None
    sowing_period: str | None = None
    harvest_period: str | None = None
    optimal_temp: str | None = None
    growth_days: int | None = None
    difficulty: int | None = None
    pests: list[str] = Field(default_factory=list)
    farm_details: str | None = None


class CropGuideTopic(BaseModel):
    icon: str
    title: str
    content: list[str]


class CropGuideResponse(BaseModel):
    crop_name: str
    topics: list[CropGuideTopic]
