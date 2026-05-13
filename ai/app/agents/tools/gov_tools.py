"""
GovGraphTool 메서드를 LangGraph/ReAct @tool 함수로 감싸는 래퍼 모듈.

목적:
  - 기존 GovGraphTool(클래스 메서드) 로직을 일절 변경하지 않고,
    LangGraph create_react_agent의 도구(tool)로 재사용할 수 있는 얇은 래퍼 제공.
  - Phase 3에서 gov_agent를 ReAct 기반으로 전환할 때 이 도구들을 그대로 바인딩하면 됨.

사용법:
  from app.agents.tools.gov_tools import get_gov_tools
  tools = get_gov_tools()
  agent = create_react_agent(model=chat_model, tools=tools, prompt=PROMPT)
"""
import logging
from typing import Optional
from langchain_core.tools import tool
from app.agents.tools.gov_graph_tool import GovGraphTool

logger = logging.getLogger(__name__)

# 싱글톤 GovGraphTool 인스턴스 (도구 함수들이 공유)
_graph_tool = GovGraphTool()


@tool
async def query_region_crop_risk(region: Optional[str] = None, crop: Optional[str] = None) -> dict:
    """
    특정 지역/작물의 수급 위험도(과잉·부족·적정 상태)를 조회합니다.
    사용자가 '양평군 배추 위험도', '과잉 작물', '부족 품목' 등을 물을 때 사용합니다.
    region과 crop 중 하나 이상은 반드시 지정해야 합니다.
    """
    try:
        result = await _graph_tool.get_risk_analysis(region, crop)
        if not result:
            return {"success": False, "message": f"'{region or '전체'} / {crop or '전체'}' 조건에 해당하는 수급 위험도 데이터가 없습니다."}
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"[query_region_crop_risk] 실패: {e}")
        return {"success": False, "message": f"수급 위험도 조회 중 오류: {str(e)}"}


@tool
async def query_region_summary(region: str) -> dict:
    """
    특정 지역의 전체 작물 수급 현황을 요약 조회합니다.
    사용자가 '양평군 현재 수급 상황', '양평군 현황 요약', '양평군 작물 현황' 등을 물을 때 사용합니다.
    """
    try:
        result = await _graph_tool.get_region_summary(region)
        if not result:
            return {"success": False, "message": f"'{region}' 지역의 수급 요약 데이터가 없습니다."}
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"[query_region_summary] 실패: {e}")
        return {"success": False, "message": f"지역 요약 조회 중 오류: {str(e)}"}


@tool
async def query_related_policies(region: Optional[str] = None, crop: Optional[str] = None) -> dict:
    """
    특정 지역/작물과 관련된 지원 정책(보조금, 지원사업 등)을 조회합니다.
    사용자가 '양평군 배추 지원 정책', '보조금 정책', '지원 사업' 등을 물을 때 사용합니다.
    region과 crop 중 하나 이상은 반드시 지정해야 합니다.
    """
    try:
        result = await _graph_tool.get_related_policies(region, crop)
        if not result:
            return {"success": False, "message": f"'{region or '전체'} / {crop or '전체'}' 조건에 해당하는 관련 정책이 없습니다."}
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"[query_related_policies] 실패: {e}")
        return {"success": False, "message": f"관련 정책 조회 중 오류: {str(e)}"}


@tool
async def query_alternative_crops(region: Optional[str] = None, crop: Optional[str] = None) -> dict:
    """
    특정 작물의 대체 작물을 유사한 재배 환경 및 수급 안정성 기준으로 추천합니다.
    사용자가 '배추 대신 뭘 심을까', '대체 작물 추천', '배추 말고 다른 작물' 등을 물을 때 사용합니다.
    crop 파라미터는 필수입니다.
    """
    try:
        result = await _graph_tool.get_alternative_crops(region, crop)
        if not result:
            return {"success": False, "message": f"'{crop or '미지정'}' 작물의 대체 작물 데이터가 없습니다."}
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"[query_alternative_crops] 실패: {e}")
        return {"success": False, "message": f"대체 작물 조회 중 오류: {str(e)}"}


@tool
async def query_farm_analysis(farm_name: str) -> dict:
    """
    특정 농장의 AI 추천 작물 및 분석 결과를 조회합니다.
    사용자가 '○○농장 분석', '이 농장에 뭘 심으면 좋을까' 등을 물을 때 사용합니다.
    """
    try:
        result = await _graph_tool.get_farm_analysis(farm_name)
        if not result:
            return {"success": False, "message": f"'{farm_name}' 농장의 분석 데이터가 없습니다."}
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"[query_farm_analysis] 실패: {e}")
        return {"success": False, "message": f"농장 분석 조회 중 오류: {str(e)}"}


def get_gov_tools() -> list:
    """
    GovAgent 관련 LangGraph @tool 함수 목록을 반환합니다.

    Phase 3에서 gov_agent를 ReAct 기반으로 전환할 때:
        from app.agents.tools.gov_tools import get_gov_tools
        agent = create_react_agent(model=chat_model, tools=get_gov_tools(), prompt=GOV_PROMPT)
    """
    return [
        query_region_crop_risk,
        query_region_summary,
        query_related_policies,
        query_alternative_crops,
        query_farm_analysis,
    ]
