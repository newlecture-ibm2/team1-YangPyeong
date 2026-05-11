import pytest
from unittest.mock import AsyncMock, MagicMock
from app.agents.gov_agent import GovAgent
from app.models.gov import GovChatRequest, IntentType

@pytest.fixture
def mock_agent():
    agent = GovAgent()
    
    # Mock LLM
    agent.llm = AsyncMock()
    agent.llm.generate.return_value = "Mocked LLM Response"
    
    # Mock Graph Tool
    agent.graph_tool = AsyncMock()
    
    # Mock Entity Dictionary
    agent._dict_cache = {
        "REGION": ["양평군"],
        "CROP": ["배추"],
        "FARM": ["양평 농장"]
    }
    return agent

def test_intent_classification(mock_agent):
    assert mock_agent._classify_intent("지원금 알려줘") == IntentType.POLICY_RECOMMEND
    assert mock_agent._classify_intent("대체 작물 추천") == IntentType.ALTERNATIVE_CROP
    assert mock_agent._classify_intent("위험도 확인") == IntentType.RISK_ANALYSIS
    assert mock_agent._classify_intent("현재 상황 요약") == IntentType.REGION_SUMMARY

@pytest.mark.asyncio
async def test_user_role_sanitize(mock_agent):
    # Invalid user_role
    req = GovChatRequest(message="양평군 배추 정책 알려줘", user_role="INVALID")
    
    mock_agent.graph_tool.get_related_policies.return_value = {
        "related_policies": [{"title": "테스트 정책", "support_amount": "100만원"}]
    }
    
    res = await mock_agent.run(req)
    # The role should fallback to GOV internally. We check graph_summary.
    assert res.graph_summary["user_role"] == "GOV"

@pytest.mark.asyncio
async def test_empty_context_no_llm_call(mock_agent):
    req = GovChatRequest(message="양평군 배추 위험도", user_role="GOV")
    
    # Return empty graph data
    mock_agent.graph_tool.get_risk_analysis.return_value = {}
    
    res = await mock_agent.run(req)
    
    # LLM should not be called
    mock_agent.llm.generate.assert_not_called()
    assert "일치하는 분석 근거를 찾지 못했습니다" in res.answer

@pytest.mark.asyncio
async def test_alternative_crop_missing_entity(mock_agent):
    req = GovChatRequest(message="대체 작물 추천해줘") # crop 누락
    
    res = await mock_agent.run(req)
    
    # Missing entity logic
    assert "어떤 작물을 대체하고 싶으신가요" in res.answer
    mock_agent.llm.generate.assert_not_called()

@pytest.mark.asyncio
async def test_region_only_risk_analysis(mock_agent):
    req = GovChatRequest(message="양평군 위험도 알려줘")
    
    mock_agent.graph_tool.get_risk_analysis.return_value = {
        "risk_crops": [{"crop": "배추", "status": "위험"}]
    }
    
    res = await mock_agent.run(req)
    mock_agent.graph_tool.get_risk_analysis.assert_called_with("양평군", None)
    mock_agent.llm.generate.assert_called_once()
    assert res.entities.region == "양평군"
    assert res.entities.crop is None

@pytest.mark.asyncio
async def test_crop_only_risk_analysis(mock_agent):
    req = GovChatRequest(message="배추 위험도 알려줘")
    
    mock_agent.graph_tool.get_risk_analysis.return_value = {
        "risk_crops": [{"crop": "양평군", "status": "위험"}]
    }
    
    res = await mock_agent.run(req)
    mock_agent.graph_tool.get_risk_analysis.assert_called_with(None, "배추")
    mock_agent.llm.generate.assert_called_once()
    assert res.entities.region is None
    assert res.entities.crop == "배추"

@pytest.mark.asyncio
async def test_policy_recommend_crop_only(mock_agent):
    req = GovChatRequest(message="배추 지원금 알려줘")
    
    mock_agent.graph_tool.get_related_policies.return_value = {
        "related_policies": [{"title": "배추 지원"}]
    }
    
    res = await mock_agent.run(req)
    mock_agent.graph_tool.get_related_policies.assert_called_with(None, "배추")
    mock_agent.llm.generate.assert_called_once()
    assert res.entities.region is None
    assert res.entities.crop == "배추"
