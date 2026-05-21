"""
농사로(Nongsaro) DB 조회 도구 모음
- 농작업 일정, 품종 정보, 재해 대응 가이드를 PostgreSQL에서 직접 조회합니다.
"""
from langchain_core.tools import tool
import logging
from sqlalchemy import text
from app.db import get_db_session

logger = logging.getLogger(__name__)


@tool
async def get_nongsaro_schedule(crop_keyword: str, month: int = None):
    """
    농사로 DB에서 특정 작물의 월별 농작업 일정을 조회합니다.
    사용자가 특정 작물의 재배법, 심는 법, 농작업 일정을 물을 때 반드시 사용하세요.
    crop_keyword에는 사용자가 질문한 작물명(예: 고구마, 감자, 벼 등)을 정확히 추출해서 입력하세요.
    month를 입력하지 않으면 해당 작물의 전체 연간 일정을 조회합니다.
    조회 후에는 결과를 바탕으로 사용자에게 답변하고, 절대로 동일한 인자로 이 도구를 반복 호출하지 마세요.
    """
    session = None
    try:
        session = get_db_session()
        if session is None:
            return "DB 연결이 설정되지 않았습니다."

        query = """
            SELECT start_month, start_period, end_month, end_period,
                   operation_name, farm_work_type, info_type_name
            FROM nongsaro_farm_schedules
            WHERE farm_work_type LIKE :keyword
        """
        params = {"keyword": f"%{crop_keyword}%"}

        if month:
            query += " AND start_month = :month"
            params["month"] = month

        query += " ORDER BY start_month, start_period LIMIT 20"

        result = session.execute(text(query), params).fetchall()

        if not result:
            return f"'{crop_keyword}'에 대한 농작업 일정 정보를 찾을 수 없습니다."

        lines = []
        for row in result:
            period_str = f"{row[0]}월 {row[1]}순 ~ {row[2]}월 {row[3]}순"
            lines.append(f"[{period_str}] {row[5]} - {row[4]} ({row[6]})")
        return "\n".join(lines)

    except Exception as e:
        logger.error(f"get_nongsaro_schedule error: {e}")
        return f"일정 조회 중 오류가 발생했습니다: {str(e)}"
    finally:
        if session:
            session.close()


@tool
async def get_nongsaro_variety(crop_keyword: str):
    """
    농사로 DB에서 특정 작물의 품종 정보 및 특성을 조회합니다.
    사용자가 '추천 감자 품종 알려줘' 또는 '상추 품종 특징이 뭐야?'라고 물을 때 사용합니다.
    crop_keyword에는 작물명(감자, 상추, 벼 등)을 입력합니다.
    """
    session = None
    try:
        session = get_db_session()
        if session is None:
            return "DB 연결이 설정되지 않았습니다."

        query = """
            SELECT variety_name, crop_name, characteristics,
                   breeding_inst, breeding_year
            FROM nongsaro_varieties
            WHERE crop_name LIKE :keyword
            LIMIT 5
        """
        result = session.execute(text(query), {"keyword": f"%{crop_keyword}%"}).fetchall()

        if not result:
            return f"'{crop_keyword}'에 대한 품종 정보를 찾을 수 없습니다."

        lines = []
        for row in result:
            inst = row[3] or "정보없음"
            year = row[4] or "정보없음"
            chars = (row[2] or "특성 정보 없음").replace("\r\n", " ").replace("\r", " ")[:200]
            lines.append(f"- {row[0]} (육성: {inst}, {year}년)\n  특성: {chars}")
        return f"'{crop_keyword}' 관련 품종 정보:\n" + "\n".join(lines)

    except Exception as e:
        logger.error(f"get_nongsaro_variety error: {e}")
        return f"품종 조회 중 오류가 발생했습니다: {str(e)}"
    finally:
        if session:
            session.close()


@tool
async def get_nongsaro_disaster(disaster_keyword: str = None):
    """
    농사로 DB에서 기상 재해 예방 및 대응 가이드를 조회합니다.
    사용자가 '가뭄 대비 어떻게 해?' 또는 '폭염 시 농작물 관리법'을 물을 때 사용합니다.
    disaster_keyword에는 재해 유형(가뭄, 폭염, 홍수, 저온, 호우 등)을 입력합니다.
    가능한 재해 유형: 가뭄, 홍수해, 저온해(동해), 호우, 재해예방, 고온해(폭염)
    """
    session = None
    try:
        session = get_db_session()
        if session is None:
            return "DB 연결이 설정되지 않았습니다."

        query = "SELECT title, disaster_type FROM nongsaro_disaster_prevention"
        params = {}
        if disaster_keyword:
            query += " WHERE disaster_type LIKE :keyword OR title LIKE :keyword"
            params["keyword"] = f"%{disaster_keyword}%"

        query += " ORDER BY created_at DESC LIMIT 5"
        result = session.execute(text(query), params).fetchall()

        if not result:
            return "관련된 재해 대응 정보를 찾을 수 없습니다."

        lines = [f"- [{row[1]}] {row[0]}" for row in result]
        return "재해 대응 가이드:\n" + "\n".join(lines)

    except Exception as e:
        logger.error(f"get_nongsaro_disaster error: {e}")
        return f"재해 정보 조회 중 오류가 발생했습니다: {str(e)}"
    finally:
        if session:
            session.close()
