import httpx
import logging
from langchain_core.tools import tool
from sqlalchemy import text
from app.config import settings
from app.db import get_db_session

logger = logging.getLogger(__name__)

# 백엔드 내부 통신 설정 (settings 싱글톤 활용 — farm_tools와 동일 패턴)
BACKEND_INTERNAL_URL = settings.BACKEND_INTERNAL_URL
AI_SECRET_KEY = settings.AI_INTERNAL_SECRET_KEY
HEADERS = {"X-AI-Internal-Key": AI_SECRET_KEY}

@tool
async def get_market_price(crop_name: str) -> dict:
    """
    특정 작물의 현재 시장 도매 시세(KAMIS 기준)를 조회합니다.
    사용자가 '적정 판매가', '얼마가 좋을까', '가격', '시세' 등을 물어볼 때 반드시 사용하세요.
    """
    session = get_db_session()
    if session is None:
        return {"status": "error", "message": "데이터베이스 접근 실패로 시세를 조회할 수 없습니다."}
    try:
        # 유사어 처리를 위해 정확한 이름이 아니면 % 매칭할 수도 있지만 일단 정확/포함 매칭
        query = text("""
            SELECT price, unit, price_date 
            FROM crop_price_cache 
            WHERE crop_name LIKE :crop_name 
            ORDER BY price_date DESC, id DESC 
            LIMIT 1
        """)
        row = session.execute(query, {"crop_name": f"%{crop_name}%"}).fetchone()
        session.close()
        
        if row:
            wholesale_price = row[0]
            # 도매가 대비 약 40% 마진을 더한 소매 추천가 계산 (100원 단위 반올림)
            retail_price = round((wholesale_price * 1.4) / 100) * 100
            
            return {
                "status": "success",
                "data": {
                    "crop_name": crop_name,
                    "wholesale_price": wholesale_price,
                    "retail_price_recommendation": retail_price,
                    "unit": row[1],
                    "price_date": str(row[2]),
                    "message": f"현재 {crop_name}의 도매 시세는 {wholesale_price}원/{row[1]} 입니다. 소매 추천 판매가는 {retail_price}원/{row[1]} 입니다."
                }
            }
        return {"status": "not_found", "message": f"'{crop_name}'의 현재 실시간 시세 데이터가 없습니다."}
    except Exception as e:
        if session:
            session.close()
        logger.error(f"get_market_price 실패 ({crop_name}): {e}")
        return {"status": "error", "message": "시세 데이터베이스 조회 중 오류가 발생했습니다."}


@tool
async def get_all_crops_balance(year: int = None) -> dict:
    """
    양평군 내 모든 주요 작물의 거시적 수급 분석 현황을 조회합니다.
    전체적인 시장 불균형이나 위기 작물을 식별할 때 사용합니다.
    """
    url = f"{BACKEND_INTERNAL_URL}/api/balance"
    params = {"year": year} if year else {}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=HEADERS, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                return {"status": "success", "data": data.get("data", [])}
            else:
                return {
                    "status": "error", 
                    "reason": "데이터 서버 응답 지연",
                    "message": "현재 양평군 전체 수급 통계 서버에 일시적인 지연이 발생하여 실시간 정보를 가져올 수 없습니다."
                }
    except Exception as e:
        logger.error(f"get_all_crops_balance 실패: {e}")
        return {
            "status": "error", 
            "reason": "네트워크 연결 문제",
            "message": "시장 데이터 분석 시스템과의 연결이 원활하지 않습니다. 축적된 통계 데이터 기반으로 분석이 필요합니다."
        }

@tool
async def get_crop_balance_detail(crop_name: str, year: int = None) -> dict:
    """
    특정 작물의 미시적 상세 수급 수치(공급량, 수요량, 수급 비율)를 조회합니다.
    정밀한 분석 수치($$Balance Ratio$$)를 도출할 때 사용합니다.
    """
    url = f"{BACKEND_INTERNAL_URL}/api/balance/{crop_name}"
    params = {"year": year} if year else {}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=HEADERS, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                result = data.get("data", {})
                if not result:
                    return {
                        "status": "not_found",
                        "message": f"'{crop_name}' 품목은 현재 실시간 유통 데이터가 집계되지 않고 있습니다."
                    }
                return {"status": "success", "data": result}
            else:
                return {
                    "status": "error",
                    "reason": "품목 데이터 조회 실패",
                    "message": f"현재 '{crop_name}' 품목의 상세 분석 지표를 불러오는 과정에서 기술적 제약이 발생했습니다."
                }
    except Exception as e:
        logger.error(f"get_crop_balance_detail 실패 ({crop_name}): {e}")
        return {
            "status": "error",
            "message": "데이터 분석기 엔진과의 통신이 일시적으로 중단되었습니다."
        }

@tool
async def get_crop_supply_trend(crop_name: str) -> dict:
    """
    특정 작물의 시계열 수급 추이 데이터를 조회합니다.
    작년 대비 현재의 수급 불균형 심화 정도를 분석할 때 필수적으로 사용합니다.
    """
    url = f"{BACKEND_INTERNAL_URL}/api/balance/{crop_name}/trend"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=HEADERS, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                return {"status": "success", "data": data.get("data", [])}
            else:
                return {
                    "status": "error",
                    "reason": "시계열 데이터 부재",
                    "message": f"'{crop_name}' 품목의 과거 3년 통계 데이터가 현재 시스템에 존재하지 않아 시계열 분석이 제한됩니다."
                }
    except Exception as e:
        logger.error(f"get_crop_supply_trend 실패 ({crop_name}): {e}")
        return {
            "status": "error",
            "message": "과거 통계 데이터 저장소에 접근하는 중 오류가 발생했습니다."
        }
