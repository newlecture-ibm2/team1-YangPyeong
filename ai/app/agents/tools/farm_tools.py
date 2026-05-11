from langchain_core.tools import tool
import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# 백엔드 URL 및 보안 키 로드 (settings 싱글톤 활용)
# BACKEND_URL 예: http://localhost:8080
BACKEND_URL = settings.BACKEND_INTERNAL_URL
AI_SECRET_KEY = settings.AI_INTERNAL_SECRET_KEY
HEADERS = {"X-AI-Internal-Key": AI_SECRET_KEY}

@tool
async def get_farm_status(farm_id: int):
    """
    특정 농장의 전체 면적, 현재 재배 중인 작물 목록 및 '가용 면적(availableArea)'을 조회합니다. 
    새로운 작물을 심을 수 있는지 판단하거나 현재 농장 점유 상태를 파악할 때 필수적으로 사용해야 합니다.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{BACKEND_URL}/api/internal/farms/{farm_id}/agent-summary", headers=HEADERS)
            if response.status_code != 200:
                return {"error": f"백엔드 오류: {response.status_code}"}
            return response.json().get('data', {}).get('farmStatus')
    except Exception as e:
        logger.error(f"get_farm_status 실패: {e}")
        return {"error": str(e)}

@tool
async def get_cultivation_history(farm_id: int):
    """
    농장의 과거 재배 및 수확 이력을 시간순(최신순)으로 조회합니다. 
    사용자가 과거에 무엇을 심었는지 묻거나, 이전 수확 시기를 바탕으로 다음 계획을 추천할 때 유용합니다.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{BACKEND_URL}/api/internal/farms/{farm_id}/agent-summary", headers=HEADERS)
            if response.status_code != 200:
                return {"error": f"백엔드 오류: {response.status_code}"}
                
            history_list = response.json().get('data', {}).get('cultivationHistory', [])
            
            if not history_list:
                return "최근 재배 이력이 없습니다."
                
            # AI가 문맥을 파악하기 좋게 텍스트 포맷팅
            return "\n".join([
                f"- {h['date']}: {h['cropName']} {h['action']} ({h['amount']}{h['unit']})" 
                for h in history_list
            ])
    except Exception as e:
        logger.error(f"get_cultivation_history 실패: {e}")
        return {"error": str(e)}

@tool
async def get_farm_weather(farm_id: int):
    """
    현재 농장 위치(양평군)의 실시간 기상 데이터(온도, 상태)와 AI 생육 가이드를 가져옵니다. 
    오늘의 농사 작업 권장 여부나 기상 악화에 따른 주의사항을 안내할 때 사용합니다.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{BACKEND_URL}/api/internal/farms/{farm_id}/agent-summary", headers=HEADERS)
            if response.status_code != 200:
                return {"error": f"백엔드 오류: {response.status_code}"}
            return response.json().get('data', {}).get('weatherContext')
    except Exception as e:
        logger.error(f"get_farm_weather 실패: {e}")
        return {"error": str(e)}
