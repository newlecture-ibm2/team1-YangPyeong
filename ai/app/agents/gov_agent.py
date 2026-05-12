"""
지자체 분석 전용 AI Agent.
"""
import re
import logging
from sqlalchemy import text
from app.db import get_db_session
from app.models.gov import (
    GovChatRequest, GovChatResponse, ExtractedEntities, 
    IntentType, GraphContext, PolicySummary, CropRiskSummary, 
    AlternativeCropSummary, GraphSource
)
from app.agents.tools.gov_graph_tool import GovGraphTool
from app.prompts.gov_prompt import build_final_prompt
from app.llm import get_llm

logger = logging.getLogger(__name__)

class GovAgent:
    def __init__(self):
        self.graph_tool = GovGraphTool()
        self.llm = get_llm()
        self._dict_cache = None

    def _classify_intent(self, message: str) -> IntentType:
        """우선순위 기반 Intent 분류"""
        if re.search(r"정책|지원|지원금|사업", message):
            return IntentType.POLICY_RECOMMEND
        if re.search(r"작물 추천|대신|대체|뭐 심", message):
            return IntentType.ALTERNATIVE_CROP
        if re.search(r"농장|이 농가", message):
            return IntentType.FARM_ANALYSIS
        if re.search(r"위험|과잉|부족|위험도", message):
            return IntentType.RISK_ANALYSIS
        if re.search(r"요약|상황|현황", message):
            return IntentType.REGION_SUMMARY
        return IntentType.GENERAL_ANALYSIS

    async def _extract_entities(self, message: str) -> ExtractedEntities:
        if self._dict_cache is None:
            self._dict_cache = {"REGION": [], "CROP": [], "FARM": []}
            query = text("SELECT entity_type, name FROM graph.graph_entity WHERE entity_type IN ('REGION', 'CROP', 'FARM')")
            session = get_db_session()
            if session:
                try:
                    result = session.execute(query)
                    temp_cache = {"REGION": set(), "CROP": set(), "FARM": set()}
                    for row in result:
                        temp_cache[getattr(row, 'entity_type')].add(getattr(row, 'name'))
                    # 길이 내림차순 정렬 (긴 이름부터 매칭)
                    self._dict_cache = {k: sorted(list(v), key=len, reverse=True) for k, v in temp_cache.items()}
                except Exception as e:
                    logger.error(f"[GovAgent] Entity Dictionary 로드 실패: {e}")
                    pass
                finally:
                    session.close()

        entities = ExtractedEntities()
        # 동의어 매칭
        if "양평군" not in message and "양평" in message:
            message = message.replace("양평", "양평군")
        if "배추값" in message:
            message = message.replace("배추값", "배추")

        # Greedy 매칭 (길이 내림차순이므로 안정적)
        for region in self._dict_cache["REGION"]:
            if region in message:
                entities.region = region
                break
        for crop in self._dict_cache["CROP"]:
            if crop in message:
                entities.crop = crop
                break
        for farm in self._dict_cache["FARM"]:
            if farm in message:
                entities.farm = farm
                break

        return entities

    def _build_context(self, intent: IntentType, entities: ExtractedEntities, graph_data: dict, user_role: str) -> GraphContext:
        ctx = GraphContext(
            intent=intent.value,
            user_role=user_role,
            target_region=entities.region,
            target_crop=entities.crop,
            target_farm=entities.farm
        )

        if not graph_data:
            return ctx

        ctx.supply_status = graph_data.get("supply_status")
        ctx.supply_ratio = graph_data.get("supply_ratio")
        
        for p in graph_data.get("related_policies", []):
            ctx.related_policies.append(PolicySummary(**p))
            
        for c in graph_data.get("risk_crops", []):
            ctx.risk_crops.append(CropRiskSummary(**c))
            
        for a in graph_data.get("recommended_crops", []):
            ctx.recommended_crops.append(AlternativeCropSummary(**a))
            
        for s in graph_data.get("sources", []):
            ctx.sources.append(GraphSource(**s))

        return ctx

    def _is_empty_context(self, ctx: GraphContext) -> bool:
        """컨텍스트에 실제 데이터가 비어있는지 확인"""
        if ctx.supply_status or ctx.supply_ratio:
            return False
        if ctx.related_policies or ctx.risk_crops or ctx.recommended_crops:
            return False
        if ctx.sources:
            return False
        return True

    async def run(self, request: GovChatRequest) -> GovChatResponse:
        try:
            intent = self._classify_intent(request.message)
            entities = await self._extract_entities(request.message)

            # 필수 엔티티 누락 시 Fallback 유도
            if intent == IntentType.REGION_SUMMARY and not entities.region:
                return GovChatResponse(intent=intent, entities=entities, answer="어느 지역의 현황을 요약해 드릴까요? (예: 양평군 현황 알려줘)")
            if intent == IntentType.RISK_ANALYSIS and not entities.region and not entities.crop:
                return GovChatResponse(intent=intent, entities=entities, answer="어느 지역이나 작물의 위험도를 조회할까요? (예: 양평군 배추 위험도)")
            if intent == IntentType.POLICY_RECOMMEND and not entities.region and not entities.crop:
                return GovChatResponse(intent=intent, entities=entities, answer="어떤 지역이나 작물의 정책을 찾으시나요? (예: 양평군 배추 지원 정책)")
            if intent == IntentType.ALTERNATIVE_CROP and not entities.crop:
                return GovChatResponse(intent=intent, entities=entities, answer="어떤 작물을 대체하고 싶으신가요? (예: 배추 대체 작물 알려줘)")
            if intent == IntentType.FARM_ANALYSIS and not entities.farm:
                return GovChatResponse(intent=intent, entities=entities, answer="분석할 농장 이름을 알려주세요.")

            graph_data = {}
            if intent == IntentType.RISK_ANALYSIS:
                graph_data = await self.graph_tool.get_risk_analysis(entities.region, entities.crop)
            elif intent == IntentType.REGION_SUMMARY:
                graph_data = await self.graph_tool.get_region_summary(entities.region)
            elif intent == IntentType.POLICY_RECOMMEND:
                graph_data = await self.graph_tool.get_related_policies(entities.region, entities.crop)
            elif intent == IntentType.ALTERNATIVE_CROP:
                graph_data = await self.graph_tool.get_alternative_crops(entities.region, entities.crop)
            elif intent == IntentType.FARM_ANALYSIS:
                graph_data = await self.graph_tool.get_farm_analysis(entities.farm)
            else:
                graph_data = await self.graph_tool.get_general_analysis(entities)

            # user_role 검증 (보안: 실제 운영 시에는 JWT/세션에서 주입된 값을 사용해야 함)
            safe_role = request.user_role.upper() if request.user_role else "GOV"
            if safe_role not in ["GOV", "FARMER", "ADMIN"]:
                safe_role = "GOV"
                
            context = self._build_context(intent, entities, graph_data, safe_role)

            # Graph 데이터가 전혀 없는 경우 LLM 호출을 건너뛰고 Fallback 반환
            if self._is_empty_context(context) and intent != IntentType.GENERAL_ANALYSIS:
                return GovChatResponse(
                    intent=intent,
                    entities=entities,
                    answer="현재 시스템(GraphRAG)에서 해당 조건에 일치하는 분석 근거를 찾지 못했습니다.\n(다른 작물이나 지역으로 다시 질문해 주세요.)",
                    graph_summary=context.model_dump(exclude_none=True)
                )

            prompt = build_final_prompt(request.message, context)
            answer = await self.llm.generate(prompt, temperature=0.1)

            return GovChatResponse(
                intent=intent,
                entities=entities,
                answer=answer,
                graph_summary=context.model_dump(exclude_none=True)
            )

        except Exception as e:
            logger.error(f"[GovAgent] 에러 발생: {e}", exc_info=True)
            return GovChatResponse(
                intent=None,
                entities=None,
                answer=f"AI 분석 중 오류가 발생했습니다.\n본 분석은 농가 지도를 위한 참고용입니다.",
                error=str(e)
            )

_gov_agent_instance = None

def get_gov_agent() -> GovAgent:
    global _gov_agent_instance
    if _gov_agent_instance is None:
        _gov_agent_instance = GovAgent()
    return _gov_agent_instance
