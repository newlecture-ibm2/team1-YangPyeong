from app.llm import get_llm
import logging

logger = logging.getLogger(__name__)

class AnalysisService:
    async def predict_yield(self, crop_id: int, area: float, cultivation_type: str) -> float:
        """
        작물, 면적, 재배 유형을 기반으로 예상 수확량을 예측합니다.
        현재는 수식 기반의 베이스라인 모델을 적용하며, 추후 ML 모델로 교체 가능합니다.
        """
        try:
            # 베이스라인 수식: 면적 * 단위당 수확량(가정값) * 유형별 가중치
            # 실제 서비스에서는 DB에서 작물별 yield_per_sqm을 가져와야 함
            base_yield_per_sqm = 4.5  # 예: 1㎡당 4.5kg
            
            # 재배 유형별 가중치 (씨앗 < 종자 < 모종)
            type_weights = {
                "SEED": 0.8,
                "SEEDLING": 1.0,
                "SAPLING": 1.2
            }
            weight = type_weights.get(cultivation_type.upper(), 1.0)
            
            predicted_yield = area * base_yield_per_sqm * weight
            
            logger.info(f"Predicted yield for crop {crop_id}: {predicted_yield} kg")
            return round(predicted_yield, 2)
            
        except Exception as e:
            logger.error(f"Yield prediction failed: {e}")
            return 0.0
