"""
KAMIS(농산물유통정보) 도매 시세 조회 Tool
실제 API를 호출하여 작물별 최신 도매가격을 가져옵니다.
"""

import httpx
import logging
from datetime import datetime, timedelta
from typing import Optional

from app.utils.kamis_resolve import resolve_standard_crop_name

logger = logging.getLogger(__name__)

# ── KAMIS API 설정 ──
KAMIS_API_URL = "http://www.kamis.or.kr/service/price/xml.do"
KAMIS_CERT_KEY = "8291e7b2-28a1-469c-93ac-fba3ef05f174"
KAMIS_CERT_ID = "7941"

# 작물명 → KAMIS 품목코드 매핑 (공유 모듈에서 가져옴 — 순환 import 방지)
from app.utils.crop_codes import CROP_CODE_MAP  # noqa: F401  re-export

# 작물별 최적 파종 시기 (월 범위)
OPTIMAL_SOWING_PERIODS = {
    "벼": (4, 6), "쌀": (4, 6),
    "보리": (10, 11), "밀": (10, 11),
    "콩": (5, 6), "팥": (6, 7), "녹두": (6, 7),
    "감자": (3, 4), "고구마": (4, 5),
    "배추": (8, 9), "양배추": (3, 4), "시금치": (3, 4), "상추": (3, 5),
    "수박": (3, 4), "참외": (3, 4), "오이": (4, 5), "호박": (4, 5),
    "토마토": (3, 5), "딸기": (9, 10), "무": (8, 9), "당근": (3, 4),
    "고추": (4, 5), "풋고추": (4, 5), "마늘": (9, 10),
    "양파": (9, 10), "대파": (3, 4), "파": (3, 4), "생강": (4, 5),
    "사과": (3, 4), "배": (3, 4), "복숭아": (3, 4), "포도": (3, 4),
    "감귤": (3, 4), "감": (3, 4),
    "참깨": (5, 6), "땅콩": (4, 5),
}

# 작물별 평년 단수 (kg/㎡)
AVERAGE_YIELD_PER_SQM = {
    "벼": 0.6, "쌀": 0.6,
    "보리": 0.35, "밀": 0.3,
    "콩": 0.2, "팥": 0.15, "녹두": 0.12,
    "감자": 2.5, "고구마": 2.0,
    "배추": 5.0, "양배추": 4.0, "시금치": 1.5, "상추": 1.2,
    "수박": 3.0, "참외": 2.0, "오이": 3.5, "호박": 2.5,
    "토마토": 4.0, "딸기": 1.0, "무": 4.0, "당근": 2.5,
    "고추": 0.8, "풋고추": 1.0, "마늘": 1.0,
    "양파": 4.5, "대파": 2.0, "파": 2.0, "생강": 1.5,
    "사과": 2.0, "배": 2.5, "복숭아": 1.5, "포도": 1.8,
    "감귤": 3.0, "감": 1.5,
    "참깨": 0.08, "땅콩": 0.25,
    "느타리": 2.0, "표고버섯": 1.0,
}


def _standard_crop_name(crop_name: str) -> str:
    resolved = resolve_standard_crop_name(crop_name)
    return resolved.standard_name or crop_name


async def fetch_kamis_price(crop_name: str) -> dict:
    """
    KAMIS API에서 특정 작물의 최근 도매 시세를 조회합니다.
    
    Returns:
        dict: { "price": int, "unit": str, "date": str, "crop_name": str }
        또는 에러 시 { "error": str }
    """
    resolved = resolve_standard_crop_name(crop_name)
    lookup_name = resolved.standard_name
    if not lookup_name:
        return {"error": f"'{crop_name}'에 대한 KAMIS 매핑 코드가 없습니다.", "crop_name": crop_name}

    item_code = CROP_CODE_MAP.get(lookup_name)
    if not item_code:
        return {"error": f"'{crop_name}'에 대한 KAMIS 매핑 코드가 없습니다.", "crop_name": crop_name}

    today = datetime.now()
    start_date = (today - timedelta(days=14)).strftime("%Y-%m-%d")
    end_date = today.strftime("%Y-%m-%d")

    # 품목부류코드 (품목코드 첫 자리 + 00)
    category_code = item_code[0] + "00"

    params = {
        "action": "periodProductList",
        "p_productclscode": "02",           # 도매
        "p_startday": start_date,
        "p_endday": end_date,
        "p_itemcategorycode": category_code,
        "p_itemcode": item_code,
        "p_productrankcode": "04",           # 상품 등급
        "p_countrycode": "1101",             # 서울
        "p_convert_kg_yn": "Y",              # 1kg 환산
        "p_cert_key": KAMIS_CERT_KEY,
        "p_cert_id": KAMIS_CERT_ID,
        "p_returntype": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(KAMIS_API_URL, params=params)
            response.raise_for_status()
            data = response.json()

        if "data" in data and "item" in data["data"]:
            items = data["data"]["item"]
            if isinstance(items, dict):
                items = [items]

            # 가장 최근 유효 가격 찾기
            for item in reversed(items):
                price_str = str(item.get("price", ""))
                if price_str and price_str != "-":
                    try:
                        price = int(price_str.replace(",", ""))
                        result = {
                            "price": price,
                            "unit": "1kg",
                            "date": item.get("day", end_date),
                            "crop_name": crop_name,
                            "resolved_crop_name": lookup_name,
                        }
                        if resolved.mapping_note:
                            result["mapping_note"] = resolved.mapping_note
                        return result
                    except ValueError:
                        continue

        return {"error": f"'{crop_name}' 시세 데이터를 찾을 수 없습니다.", "crop_name": crop_name}

    except Exception as e:
        logger.error(f"KAMIS API 호출 실패 ({crop_name}): {e}")
        return {"error": f"KAMIS API 호출 실패: {str(e)}", "crop_name": crop_name}


def get_planting_penalty(crop_name: str, sowing_month: Optional[int] = None) -> float:
    """
    파종 시기 대비 수확량 감소 페널티를 계산합니다.
    
    Returns:
        float: 1.0 (최적기) ~ 0.3 (최악의 시기)
    """
    if sowing_month is None:
        sowing_month = datetime.now().month

    standard = _standard_crop_name(crop_name)
    optimal_range = OPTIMAL_SOWING_PERIODS.get(standard) or OPTIMAL_SOWING_PERIODS.get(crop_name)
    if not optimal_range:
        return 0.8  # 데이터 없으면 기본 80%

    start_month, end_month = optimal_range

    # 최적 파종 시기 범위 내인지 확인
    if start_month <= end_month:
        if start_month <= sowing_month <= end_month:
            return 1.0
        # 인접 월(±1개월)이면 약간 감소
        if sowing_month == start_month - 1 or sowing_month == end_month + 1:
            return 0.85
        # 2개월 차이
        diff = min(
            abs(sowing_month - start_month),
            abs(sowing_month - end_month),
            abs(sowing_month - start_month + 12),
            abs(sowing_month - end_month + 12)
        )
        if diff <= 2:
            return 0.7
        elif diff <= 3:
            return 0.5
        else:
            return 0.3
    else:
        # 10~2월처럼 연도를 넘는 경우
        if sowing_month >= start_month or sowing_month <= end_month:
            return 1.0
        diff = min(
            abs(sowing_month - start_month),
            abs(sowing_month - end_month),
            abs(sowing_month - start_month + 12),
            abs(sowing_month - end_month + 12)
        )
        if diff <= 1:
            return 0.85
        elif diff <= 2:
            return 0.7
        elif diff <= 3:
            return 0.5
        else:
            return 0.3


def get_average_yield_per_sqm(crop_name: str) -> float:
    """작물별 평년 단수 (kg/㎡)를 반환합니다."""
    standard = _standard_crop_name(crop_name)
    return AVERAGE_YIELD_PER_SQM.get(standard, AVERAGE_YIELD_PER_SQM.get(crop_name, 1.0))
