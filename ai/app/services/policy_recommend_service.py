import logging
from app.llm import get_llm
import json

logger = logging.getLogger(__name__)

async def generate_recommend_reasons(request_data: dict) -> dict:
    farmer_id = request_data.get("farmer_id")
    profile = request_data.get("profile", {})
    graph_relations = request_data.get("graph_relations", [])
    candidate_policies = request_data.get("candidate_policies", [])
    
    if not candidate_policies:
        return {"reasons": []}
    
    # AI 프롬프트 작성
    llm = get_llm("gemini")
    
    prompt = f"""
당신은 'FarmBalance 초개인화 정책 추천 AI'입니다.
농업인의 프로필, 지식 그래프(GraphRAG)의 관계 데이터, 그리고 1차 필터링된 정책 후보들이 주어집니다.
각 정책이 이 농업인에게 왜 적합한지, 어떤 연관성이 있는지 "자연스럽고 설득력 있는 2~3문장의 추천 사유(matchReason)"를 작성하세요.
단순 검색결과가 아니라 농업인의 상황을 이해하고 맞춤형으로 제안하는 느낌을 줘야 합니다.

[농업인 프로필]
이름: {profile.get('name')}
거주지역: {profile.get('regionName')}
농장면적: {profile.get('totalArea')}㎡
재배작물: {', '.join(profile.get('crops', []))}

[그래프 관계 데이터 (Graph Relations)]
{json.dumps(graph_relations, ensure_ascii=False, indent=2)}

[정책 후보군]
"""
    for idx, p in enumerate(candidate_policies):
        prompt += f"{idx+1}. 정책ID: {p.get('policyId')}, 제목: {p.get('title')}, 범주: {p.get('category')}, 지원금: {p.get('supportAmount')}\n"
    
    prompt += """
---
위 데이터를 바탕으로 각 정책ID별로 'matchReason'과 'matchScore'(0~100)를 JSON 형식으로 반환하세요.
출력 형식 (JSON ONLY):
{
  "reasons": [
    {
      "policyId": 123,
      "matchScore": 95,
      "matchReason": "현재 양평군에서 배추를 재배 중이시며..."
    }
  ]
}
"""
    
    try:
        response_text = await llm.generate(prompt)
        # JSON 파싱 (마크다운 코드 블록 제거)
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]
            
        data = json.loads(response_text.strip())
        return data
    except Exception as e:
        logger.error(f"[generate_recommend_reasons] AI 생성 실패: {e}")
        return {"reasons": []}
