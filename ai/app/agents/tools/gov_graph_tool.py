"""
GraphRAG-lite 기반 PostgreSQL 데이터 탐색 도구.
graph.graph_entity / graph.graph_relation 참조.

읍면 단위 조회 시 REGION_HAS_CROP이 없으면
PARENT_OF relation을 통해 상위 군(양평군) 레벨로 자동 fallback합니다.
"""
import logging
from sqlalchemy import text
from app.db import get_db_session
from app.models.gov import ExtractedEntities

logger = logging.getLogger(__name__)

class GovGraphTool:

    # ──────────────────────────────────────────────
    # 헬퍼: 읍면 → 상위 군 fallback
    # ──────────────────────────────────────────────
    def _resolve_region_with_fallback(self, session, region: str) -> list[str]:
        """주어진 지역명으로 REGION_HAS_CROP이 존재하는지 확인.
        없으면 PARENT_OF relation을 통해 상위 지역을 찾아 반환합니다.
        
        Returns: [원래 지역, 상위 지역(있다면)] — 순서대로 시도할 지역명 리스트
        """
        # 1. 원래 지역명에 REGION_HAS_CROP이 있는지 확인
        check_query = text("""
            SELECT COUNT(*) as cnt
            FROM graph.graph_entity reg
            JOIN graph.graph_relation rhc ON rhc.from_entity_id = reg.id 
                AND rhc.relation_type = 'REGION_HAS_CROP'
            WHERE reg.name = :region
        """)
        result = session.execute(check_query, {"region": region})
        row = result.fetchone()
        if row and row.cnt > 0:
            return [region]

        # 2. PARENT_OF를 타고 상위 지역 조회 (예: 양평군 → PARENT_OF → 용문면)
        parent_query = text("""
            SELECT parent.name as parent_name
            FROM graph.graph_entity child
            JOIN graph.graph_relation po ON po.to_entity_id = child.id 
                AND po.relation_type = 'PARENT_OF'
            JOIN graph.graph_entity parent ON parent.id = po.from_entity_id
            WHERE child.name = :region
            LIMIT 1
        """)
        result = session.execute(parent_query, {"region": region})
        parent_row = result.fetchone()
        if parent_row:
            logger.info("[GovGraphTool] 읍면 '%s' → 상위 '%s'로 fallback", region, parent_row.parent_name)
            return [region, parent_row.parent_name]

        # 3. PARENT_OF도 없으면 양평군 하드 fallback
        logger.info("[GovGraphTool] '%s'의 상위 지역 미발견 → '양평군' 하드 fallback", region)
        return [region, "양평군"]

    async def get_risk_analysis(self, region: str | None, crop: str | None) -> dict:
        if not region and not crop:
            return {}

        session = get_db_session()
        if not session:
            return {}
        try:
            if region and crop:
                # 읍면 fallback 적용
                regions_to_try = self._resolve_region_with_fallback(session, region)
                for try_region in regions_to_try:
                    query = text("""
                        SELECT reg.name as region, c.name as crop, 
                               rhc.properties->>'balance_status' as status, 
                               rhc.properties->>'supply_ratio' as ratio
                        FROM graph.graph_entity reg
                        JOIN graph.graph_relation rhc ON rhc.from_entity_id = reg.id AND rhc.relation_type = 'REGION_HAS_CROP'
                        JOIN graph.graph_entity c ON c.id = rhc.to_entity_id
                        WHERE reg.name = :region AND c.name = :crop;
                    """)
                    result = session.execute(query, {"region": try_region, "crop": crop})
                    row = result.fetchone()
                    if row:
                        return {
                            "supply_status": row.status, 
                            "supply_ratio": float(row.ratio) if row.ratio else None,
                            "sources": [{"type": "GRAPH_DB", "description": f"수급 위험도 데이터 ({region} → {try_region} - {crop})"}]
                        }

            elif region:
                regions_to_try = self._resolve_region_with_fallback(session, region)
                for try_region in regions_to_try:
                    query = text("""
                        SELECT reg.name as region, c.name as crop, 
                               rhc.properties->>'balance_status' as status, 
                               rhc.properties->>'supply_ratio' as ratio
                        FROM graph.graph_entity reg
                        JOIN graph.graph_relation rhc ON rhc.from_entity_id = reg.id AND rhc.relation_type = 'REGION_HAS_CROP'
                        JOIN graph.graph_entity c ON c.id = rhc.to_entity_id
                        WHERE reg.name = :region
                        ORDER BY CASE WHEN rhc.properties->>'balance_status' IN ('EXCESS_WARN', 'EXCESS_CAUTION', 'SHORT_WARN', 'SHORT_CAUTION') THEN 1 ELSE 2 END
                        LIMIT 10;
                    """)
                    result = session.execute(query, {"region": try_region})
                    risk_crops = [{"crop": getattr(row, 'crop'), "status": getattr(row, 'status'), "ratio": float(getattr(row, 'ratio')) if getattr(row, 'ratio') else None} for row in result.fetchall()]
                    if risk_crops:
                        return {
                            "risk_crops": risk_crops,
                            "sources": [{"type": "GRAPH_DB", "description": f"{region} 수급 위험 작물 데이터 ({try_region} 기준)"}]
                        }

            elif crop:
                query = text("""
                    SELECT reg.name as region, c.name as crop, 
                           rhc.properties->>'balance_status' as status, 
                           rhc.properties->>'supply_ratio' as ratio
                    FROM graph.graph_entity reg
                    JOIN graph.graph_relation rhc ON rhc.from_entity_id = reg.id AND rhc.relation_type = 'REGION_HAS_CROP'
                    JOIN graph.graph_entity c ON c.id = rhc.to_entity_id
                    WHERE c.name = :crop
                    LIMIT 10;
                """)
                result = session.execute(query, {"crop": crop})
                regional_status = [{"region": getattr(row, 'region'), "status": getattr(row, 'status'), "ratio": float(getattr(row, 'ratio')) if getattr(row, 'ratio') else None} for row in result.fetchall()]
                if regional_status:
                    return {
                        "risk_crops": [{"crop": r["region"], "status": r["status"], "ratio": r["ratio"]} for r in regional_status],
                        "sources": [{"type": "GRAPH_DB", "description": f"{crop} 지역별 수급 현황 데이터"}]
                    }
        finally:
            session.close()
        return {}

    async def get_region_summary(self, region: str) -> dict:
        if not region:
            return {}
        
        session = get_db_session()
        if not session:
            return {}
        try:
            regions_to_try = self._resolve_region_with_fallback(session, region)
            for try_region in regions_to_try:
                query = text("""
                    SELECT c.name as crop, 
                           rhc.properties->>'balance_status' as status, 
                           rhc.properties->>'supply_ratio' as ratio
                    FROM graph.graph_entity reg
                    JOIN graph.graph_relation rhc ON rhc.from_entity_id = reg.id AND rhc.relation_type = 'REGION_HAS_CROP'
                    JOIN graph.graph_entity c ON c.id = rhc.to_entity_id
                    WHERE reg.name = :region
                    ORDER BY CASE WHEN rhc.properties->>'balance_status' IN ('EXCESS_WARN', 'EXCESS_CAUTION', 'SHORT_WARN', 'SHORT_CAUTION') THEN 1 ELSE 2 END
                    LIMIT 10;
                """)
                result = session.execute(query, {"region": try_region})
                risk_crops = [{"crop": getattr(row, 'crop'), "status": getattr(row, 'status'), "ratio": float(getattr(row, 'ratio')) if getattr(row, 'ratio') else None} for row in result.fetchall()]
                
                if risk_crops:
                    return {
                        "risk_crops": risk_crops,
                        "sources": [{"type": "GRAPH_DB", "description": f"{region} 지역 수급 요약 데이터 ({try_region} 기준)"}]
                    }
            return {}
        finally:
            session.close()

    async def get_related_policies(self, region: str | None, crop: str | None) -> dict:
        if not region and not crop:
            return {}
            
        session = get_db_session()
        if not session:
            return {}
        try:
            if region and crop:
                regions_to_try = self._resolve_region_with_fallback(session, region)
                for try_region in regions_to_try:
                    query = text("""
                        SELECT p.name as policy_title, p.properties->>'support_amount' as amount, p.properties->>'category' as category
                        FROM graph.graph_entity c
                        JOIN graph.graph_relation tc ON tc.to_entity_id = c.id AND tc.relation_type = 'TARGETS_CROP'
                        JOIN graph.graph_entity p ON p.id = tc.from_entity_id
                        JOIN graph.graph_relation sup ON sup.from_entity_id = p.id AND sup.relation_type = 'SUPPORTS'
                        JOIN graph.graph_entity reg ON reg.id = sup.to_entity_id
                        WHERE c.name = :crop AND reg.name = :region
                        LIMIT 5;
                    """)
                    result = session.execute(query, {"crop": crop, "region": try_region})
                    policies = [{"title": getattr(row, 'policy_title'), "support_amount": getattr(row, 'amount'), "category": getattr(row, 'category')} for row in result.fetchall()]
                    
                    if policies:
                        return {
                            "related_policies": policies,
                            "sources": [{"type": "GRAPH_DB", "description": f"{region}의 {crop} 관련 지원 정책 ({try_region} 기준)"}]
                        }

            if crop:
                query = text("""
                    SELECT p.name as policy_title, p.properties->>'support_amount' as amount, p.properties->>'category' as category
                    FROM graph.graph_entity c
                    JOIN graph.graph_relation tc ON tc.to_entity_id = c.id AND tc.relation_type = 'TARGETS_CROP'
                    JOIN graph.graph_entity p ON p.id = tc.from_entity_id
                    WHERE c.name = :crop
                    LIMIT 5;
                """)
                result = session.execute(query, {"crop": crop})
                policies = [{"title": getattr(row, 'policy_title'), "support_amount": getattr(row, 'amount'), "category": getattr(row, 'category')} for row in result.fetchall()]
                if policies:
                    return {
                        "related_policies": policies,
                        "sources": [{"type": "GRAPH_DB", "description": f"{crop} 관련 공통 지원 정책"}]
                    }
                    
            elif region:
                regions_to_try = self._resolve_region_with_fallback(session, region)
                for try_region in regions_to_try:
                    query = text("""
                        SELECT p.name as policy_title, p.properties->>'support_amount' as amount, p.properties->>'category' as category
                        FROM graph.graph_entity reg
                        JOIN graph.graph_relation sup ON sup.to_entity_id = reg.id AND sup.relation_type = 'SUPPORTS'
                        JOIN graph.graph_entity p ON p.id = sup.from_entity_id
                        WHERE reg.name = :region
                        LIMIT 5;
                    """)
                    result = session.execute(query, {"region": try_region})
                    policies = [{"title": getattr(row, 'policy_title'), "support_amount": getattr(row, 'amount'), "category": getattr(row, 'category')} for row in result.fetchall()]
                    if policies:
                        return {
                            "related_policies": policies,
                            "sources": [{"type": "GRAPH_DB", "description": f"{region} 지역 지원 정책 ({try_region} 기준)"}]
                        }
        finally:
            session.close()
        return {}

    async def get_alternative_crops(self, region: str | None, crop: str | None) -> dict:
        if not crop:
            return {}
        
        session = get_db_session()
        if not session:
            return {}
        try:
            if region:
                regions_to_try = self._resolve_region_with_fallback(session, region)
                for try_region in regions_to_try:
                    query = text("""
                        SELECT c_alt.name as alt_crop
                        FROM graph.graph_entity c_origin
                        JOIN graph.graph_relation sf1 ON sf1.to_entity_id = c_origin.id AND sf1.relation_type = 'SUITED_FOR'
                        JOIN graph.graph_entity env ON env.id = sf1.from_entity_id
                        JOIN graph.graph_relation sf2 ON sf2.from_entity_id = env.id AND sf2.relation_type = 'SUITED_FOR'
                        JOIN graph.graph_entity c_alt ON c_alt.id = sf2.to_entity_id
                        JOIN graph.graph_relation rhc ON rhc.to_entity_id = c_alt.id AND rhc.relation_type = 'REGION_HAS_CROP'
                        JOIN graph.graph_entity reg ON reg.id = rhc.from_entity_id
                        WHERE c_origin.name = :crop AND c_alt.name != :crop
                          AND reg.name = :region
                          AND rhc.properties->>'balance_status' IN ('SHORT_WARN', 'SHORT_CAUTION', 'BALANCED')
                        LIMIT 3;
                    """)
                    result = session.execute(query, {"crop": crop, "region": try_region})
                    alt_crops = [{"crop": getattr(row, 'alt_crop'), "reason": "유사한 재배 환경 및 수급 안정(부족/적정)"} for row in result.fetchall()]
                    if alt_crops:
                        return {
                            "recommended_crops": alt_crops,
                            "sources": [{"type": "GRAPH_DB", "description": f"{region} 수급 기반 {crop} 대체 작물 ({try_region} 기준)"}]
                        }

            query = text("""
                SELECT c_alt.name as alt_crop
                FROM graph.graph_entity c_origin
                JOIN graph.graph_relation sf1 ON sf1.to_entity_id = c_origin.id AND sf1.relation_type = 'SUITED_FOR'
                JOIN graph.graph_entity env ON env.id = sf1.from_entity_id
                JOIN graph.graph_relation sf2 ON sf2.from_entity_id = env.id AND sf2.relation_type = 'SUITED_FOR'
                JOIN graph.graph_entity c_alt ON c_alt.id = sf2.to_entity_id
                WHERE c_origin.name = :crop AND c_alt.name != :crop
                LIMIT 3;
            """)
            result = session.execute(query, {"crop": crop})
            alt_crops = [{"crop": getattr(row, 'alt_crop'), "reason": "유사한 재배 환경"} for row in result.fetchall()]
            if alt_crops:
                return {
                    "recommended_crops": alt_crops,
                    "sources": [{"type": "GRAPH_DB", "description": f"{crop} 유사 재배 환경 대체 작물"}]
                }
        finally:
            session.close()
        return {}

    async def get_farm_analysis(self, farm_name: str) -> dict:
        if not farm_name:
            return {}
            
        query = text("""
            SELECT c.name as crop, r.properties->>'score' as score
            FROM graph.graph_entity f
            JOIN graph.graph_relation r ON r.to_entity_id = f.id AND r.relation_type = 'RECOMMENDED_FOR'
            JOIN graph.graph_entity c ON c.id = r.from_entity_id
            WHERE f.name = :farm_name AND f.entity_type = 'FARM'
            LIMIT 3;
        """)
        
        session = get_db_session()
        if not session:
            return {}
        try:
            result = session.execute(query, {"farm_name": farm_name})
            crops = [{"crop": getattr(row, 'crop'), "reason": f"AI 추천 점수: {getattr(row, 'score')}"} for row in result.fetchall()]
            if crops:
                return {
                    "recommended_crops": crops,
                    "sources": [{"type": "GRAPH_DB", "description": f"{farm_name} 농장 추천 작물 데이터"}]
                }
            return {}
        finally:
            session.close()

    async def get_general_analysis(self, entities: ExtractedEntities) -> dict:
        session = get_db_session()
        if not session:
            return {}
        try:
            if entities.region:
                query = text("""
                    SELECT count(f.id) as farm_count
                    FROM graph.graph_entity f
                    JOIN graph.graph_relation r ON r.from_entity_id = f.id AND r.relation_type = 'LOCATED_IN'
                    JOIN graph.graph_entity reg ON reg.id = r.to_entity_id
                    WHERE f.entity_type = 'FARM' AND reg.name = :region
                """)
                result = session.execute(query, {"region": entities.region})
                row = result.fetchone()
                if row and row.farm_count is not None and row.farm_count > 0:
                    return {
                        "region_farm_count": row.farm_count,
                        "sources": [{"type": "GRAPH_DB", "description": f"{entities.region} 농장 개수 = {row.farm_count}개"}]
                    }
                
                # 읍면에 LOCATED_IN이 없으면 전체 분포도 반환
                query_all = text("""
                    SELECT reg.name as region, count(f.id) as farm_count
                    FROM graph.graph_entity f
                    JOIN graph.graph_relation r ON r.from_entity_id = f.id AND r.relation_type = 'LOCATED_IN'
                    JOIN graph.graph_entity reg ON reg.id = r.to_entity_id
                    WHERE f.entity_type = 'FARM'
                    GROUP BY reg.name
                    ORDER BY farm_count DESC
                """)
                result_all = session.execute(query_all)
                distribution = [f"{row.region} {row.farm_count}개" for row in result_all.fetchall()]
                if distribution:
                    return {
                        "sources": [{"type": "GRAPH_DB", "description": f"양평군 지역별 농가 분포: {', '.join(distribution)}"}]
                    }
            else:
                query = text("""
                    SELECT reg.name as region, count(f.id) as farm_count
                    FROM graph.graph_entity f
                    JOIN graph.graph_relation r ON r.from_entity_id = f.id AND r.relation_type = 'LOCATED_IN'
                    JOIN graph.graph_entity reg ON reg.id = r.to_entity_id
                    WHERE f.entity_type = 'FARM'
                    GROUP BY reg.name
                    ORDER BY farm_count DESC
                """)
                result = session.execute(query)
                distribution = [f"{row.region} {row.farm_count}개" for row in result.fetchall()]
                if distribution:
                    return {
                        "sources": [{"type": "GRAPH_DB", "description": f"양평군 지역별 농가 분포: {', '.join(distribution)}"}]
                    }
            return {}
        finally:
            session.close()
