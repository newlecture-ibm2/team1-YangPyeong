import logging
from typing import Dict, Any, List
from sqlalchemy import text
from langchain_core.tools import tool
from app.db import get_db_session

logger = logging.getLogger(__name__)

@tool
async def search_policies(keyword: str = "", region: str = "") -> List[Dict[str, Any]]:
    """
    주어진 키워드나 지역을 바탕으로 정책(policy_data)을 검색합니다.
    사용자가 특정 작물이나 지역의 지원금, 보조금, 혜택, 정책을 찾을 때 이 도구를 호출하세요.
    """
    session = get_db_session()
    if not session:
        return [{"error": "DB 연결 실패"}]
        
    try:
        query_str = "SELECT id, title, category, target, support_amount, region_code FROM policy_data WHERE deleted_at IS NULL"
        params = {}
        
        if keyword:
            query_str += " AND (title LIKE :kw OR target LIKE :kw OR category LIKE :kw)"
            params["kw"] = f"%{keyword}%"
            
        # 간단한 텍스트 기반 검색 (실제로는 region_code 매핑 필요)
        if region:
            if region == "양평군":
                query_str += " AND region_code = '41830'"
            elif region.isdigit():
                query_str += " AND region_code = :region"
                params["region"] = region
            # 그 외의 지역명은 필터 조건을 아예 걸지 않음 (혹은 전체검색)
            
        query_str += " LIMIT 10"
        
        stmt = text(query_str)
        result = session.execute(stmt, params)
        
        policies = []
        for row in result:
            policies.append({
                "id": getattr(row, "id", None),
                "title": getattr(row, "title", ""),
                "category": getattr(row, "category", ""),
                "target": getattr(row, "target", ""),
                "support_amount": getattr(row, "support_amount", "")
            })
            
        return policies
    except Exception as e:
        logger.error(f"정책 검색 실패: {e}")
        return [{"error": str(e)}]
    finally:
        session.close()
