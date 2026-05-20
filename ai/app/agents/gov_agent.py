"""
지자체 분석 전용 AI Agent.

수동 파이프라인 구조:
  사용자 질문 → 정규화 → Intent 분류 → Entity 추출 → 검증
  → GraphTool 조회 → Context 빌드 → Fallback 판정 → LLM 응답

NOTE: 안정성과 예측 가능성을 우선하여 ReAct Agent가 아닌
      명시적 파이프라인 구조를 유지합니다.
"""
# orchestrator ainvoke 호환용
from langchain_core.messages import HumanMessage, AIMessage
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

# ── Intent 분류 패턴 (우선순위 순서) ──
# 새로운 Intent 추가 시 이 리스트에 튜플 한 줄만 추가합니다.
INTENT_PATTERNS: list[tuple[IntentType, re.Pattern]] = [
    (IntentType.RISK_ANALYSIS,    re.compile(r"위험|과잉|부족|수급|추이|계절|비교|문제")),
    (IntentType.POLICY_RECOMMEND, re.compile(r"정책|지원|지원금|사업")),
    (IntentType.ALTERNATIVE_CROP, re.compile(r"작물 추천|대신|대체|뭐 심")),
    (IntentType.FARM_ANALYSIS,    re.compile(r"AI 추천|이 농가|특정 농장|농가 분석")),
    (IntentType.REGION_SUMMARY,   re.compile(r"현황|상황|요약|지표|보고")),
    (IntentType.GENERAL_ANALYSIS, re.compile(r"지역별|읍면별|읍/면|분포|개수|농가 수|몇 개|몇개|많은|적은|목록|전체")),
]

# ── 동의어 사전 (정규화용) ──
# 새로운 동의어 추가 시 이 리스트에 튜플 한 줄만 추가합니다.
SYNONYM_MAP: list[tuple[str, str]] = [
    ("양평", "양평군"),
    ("배추값", "배추"),
    ("고추값", "고추"),
    ("쌀값", "쌀"),
]


class GovAgent:
    def __init__(self) -> None:
        self.graph_tool = GovGraphTool()
        self.llm = get_llm()
        self._dict_cache: dict[str, list[str]] | None = None

    # ──────────────────────────────────────────────
    # 1. 메시지 정규화
    # ──────────────────────────────────────────────
    def _normalize_message(self, message: str) -> str:
        """동의어 치환을 통한 메시지 정규화."""
        normalized = message
        for short_form, canonical in SYNONYM_MAP:
            # "양평군"이 이미 포함된 경우 "양평"으로 중복 치환 방지
            if canonical not in normalized and short_form in normalized:
                normalized = normalized.replace(short_form, canonical)
        if normalized != message:
            logger.debug("[GovAgent] 메시지 정규화: '%s' → '%s'", message, normalized)
        return normalized

    # ──────────────────────────────────────────────
    # 2. Intent 분류
    # ──────────────────────────────────────────────
    def _classify_intent(self, message: str) -> IntentType:
        """상수 패턴 테이블 기반 우선순위 Intent 분류."""
        for intent, pattern in INTENT_PATTERNS:
            if pattern.search(message):
                logger.info("[GovAgent] Intent 분류: %s (패턴: %s)", intent.value, pattern.pattern)
                return intent
        logger.info("[GovAgent] Intent 분류: GENERAL_ANALYSIS (기본값)")
        return IntentType.GENERAL_ANALYSIS

    # ──────────────────────────────────────────────
    # 3. Entity Dictionary 캐시 로딩
    # ──────────────────────────────────────────────
    def _ensure_dict_cache(self) -> None:
        """Entity Dictionary를 DB에서 로드하여 메모리 캐시에 적재합니다.
        이미 캐시된 경우 아무 작업도 하지 않습니다.
        """
        if self._dict_cache is not None:
            return

        self._dict_cache = {"REGION": [], "CROP": [], "FARM": []}
        session = get_db_session()
        if not session:
            logger.warning("[GovAgent] DB 세션 획득 실패. Entity Dictionary를 빈 상태로 초기화.")
            return

        try:
            query = text(
                "SELECT entity_type, name FROM graph.graph_entity "
                "WHERE entity_type IN ('REGION', 'CROP', 'FARM')"
            )
            result = session.execute(query)
            temp: dict[str, set[str]] = {"REGION": set(), "CROP": set(), "FARM": set()}
            for row in result:
                temp[getattr(row, 'entity_type')].add(getattr(row, 'name'))

            # 길이 내림차순 정렬 (긴 이름부터 Greedy 매칭)
            self._dict_cache = {
                k: sorted(list(v), key=len, reverse=True)
                for k, v in temp.items()
            }
            logger.info(
                "[GovAgent] Entity Dictionary 로드 완료: REGION=%d, CROP=%d, FARM=%d",
                len(self._dict_cache["REGION"]),
                len(self._dict_cache["CROP"]),
                len(self._dict_cache["FARM"]),
            )
        except Exception as e:
            logger.error("[GovAgent] Entity Dictionary 로드 실패: %s", e)
        finally:
            session.close()

    # ──────────────────────────────────────────────
    # 4. Entity 추출
    # ──────────────────────────────────────────────
    async def _extract_entities(self, message: str) -> ExtractedEntities:
        """정규화된 메시지에서 Entity를 Greedy 매칭으로 추출합니다.
        DB 사전 매칭 실패 시 LLM NER을 2차 백업으로 시도합니다.
        """
        self._ensure_dict_cache()

        entities = ExtractedEntities()

        # 1차: Greedy 매칭 (길이 내림차순이므로 안정적)
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

        # 2차: DB 사전에서 추출 실패 시 LLM NER 백업 시도
        if not entities.region or not entities.crop:
            llm_entities = await self._llm_ner_fallback(message)
            if not entities.region and llm_entities.get("region"):
                entities.region = llm_entities["region"]
                logger.info("[GovAgent] LLM NER 백업으로 지역 추출: %s", entities.region)
            if not entities.crop and llm_entities.get("crop"):
                entities.crop = llm_entities["crop"]
                logger.info("[GovAgent] LLM NER 백업으로 작물 추출: %s", entities.crop)

        logger.info(
            "[GovAgent] Entity 추출: region=%s, crop=%s, farm=%s",
            entities.region, entities.crop, entities.farm,
        )
        return entities

    async def _llm_ner_fallback(self, message: str) -> dict[str, str | None]:
        """DB 사전 매칭 실패 시 LLM을 활용해 지역명과 작물명을 추론합니다."""
        try:
            ner_prompt = (
                "아래 문장에서 한국의 지역명(시/군/구)과 농작물명을 추출해주세요.\n"
                "반드시 아래 JSON 형식으로만 답하세요. 없으면 null로 답하세요.\n"
                '{"region": "양평군", "crop": "쌀"}\n\n'
                f"문장: {message}"
            )
            result_text = await self.llm.generate(ner_prompt, temperature=0)
            # JSON 파싱 시도
            import json as _json
            # LLM 응답에서 JSON 블록 추출
            text = result_text.strip()
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()
            parsed = _json.loads(text)
            return {
                "region": parsed.get("region"),
                "crop": parsed.get("crop"),
            }
        except Exception as e:
            logger.warning("[GovAgent] LLM NER 백업 실패: %s", e)
            return {"region": None, "crop": None}

    # ──────────────────────────────────────────────
    # 5. 필수 Entity 검증
    # ──────────────────────────────────────────────
    def _validate_required_entities(
        self, intent: IntentType, entities: ExtractedEntities
    ) -> str | None:
        """Intent에 필요한 Entity가 존재하는지 검증합니다.
        누락 시에도 기본값(양평군)을 자동 적용하여 분석을 시도합니다.
        검증 실패 시 fallback 안내 메시지를 반환합니다.
        검증 통과 시 None을 반환합니다.
        """
        # 지역이 필요한 Intent에서 지역이 없으면 기본값 '양평군' 적용
        needs_region = intent in (
            IntentType.REGION_SUMMARY, IntentType.RISK_ANALYSIS,
            IntentType.POLICY_RECOMMEND, IntentType.GENERAL_ANALYSIS,
        )
        if needs_region and not entities.region:
            entities.region = "양평군"
            logger.info("[GovAgent] 지역 미지정 → 기본값 '양평군' 자동 적용")

        if intent == IntentType.ALTERNATIVE_CROP and not entities.crop:
            return "어떤 작물을 대체하고 싶으신가요? (예: 배추 대체 작물 알려줘)"

        if intent == IntentType.FARM_ANALYSIS and not entities.farm:
            return "분석할 농장 이름을 알려주세요."

        return None

    # ──────────────────────────────────────────────
    # 6. GraphTool 조회
    # ──────────────────────────────────────────────
    async def _fetch_graph_data(
        self, intent: IntentType, entities: ExtractedEntities
    ) -> dict:
        """Intent에 매핑된 GraphTool 메서드를 호출하여 데이터를 가져옵니다."""
        logger.info("[GovAgent] Graph 조회 시작: intent=%s", intent.value)

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

        logger.info("[GovAgent] Graph 조회 완료: %d개 키 반환", len(graph_data))
        return graph_data

    # ──────────────────────────────────────────────
    # 7. Context 빌드
    # ──────────────────────────────────────────────
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
        ctx.region_farm_count = graph_data.get("region_farm_count")

        for p in graph_data.get("related_policies", []):
            ctx.related_policies.append(PolicySummary(**p))

        for c in graph_data.get("risk_crops", []):
            ctx.risk_crops.append(CropRiskSummary(**c))

        for a in graph_data.get("recommended_crops", []):
            ctx.recommended_crops.append(AlternativeCropSummary(**a))

        for s in graph_data.get("sources", []):
            ctx.sources.append(GraphSource(**s))

        return ctx

    # ──────────────────────────────────────────────
    # 8. Fallback 판정 (환각 방지 — 절대 제거 금지)
    # ──────────────────────────────────────────────
    def _is_empty_context(self, ctx: GraphContext) -> bool:
        """컨텍스트에 실제 데이터가 비어있는지 확인"""
        if ctx.supply_status or ctx.supply_ratio:
            return False
        if ctx.related_policies or ctx.risk_crops or ctx.recommended_crops:
            return False
        if ctx.sources:
            return False
        return True

    # ──────────────────────────────────────────────
    # 파이프라인 오케스트레이터
    # ──────────────────────────────────────────────
    async def run(self, request: GovChatRequest) -> GovChatResponse:
        try:
            # 1. 메시지 정규화
            normalized = self._normalize_message(request.message)

            # 2. Intent 분류
            intent = self._classify_intent(normalized)

            # 3. Entity 추출
            entities = await self._extract_entities(normalized)

            # 4. 필수 Entity 검증
            fallback_msg = self._validate_required_entities(intent, entities)
            if fallback_msg:
                logger.info("[GovAgent] 필수 Entity 누락 → Fallback 응답 반환")
                return GovChatResponse(intent=intent, entities=entities, answer=fallback_msg)

            # 5. Graph 데이터 조회
            graph_data = await self._fetch_graph_data(intent, entities)

            # 6. Context 빌드 + user_role 검증
            safe_role = request.user_role.upper() if request.user_role else "FARMER"
            if safe_role not in ("GOV", "FARMER", "ADMIN"):
                safe_role = "FARMER"
            context = self._build_context(intent, entities, graph_data, safe_role)

            # 7. Fallback 판정 (Graph 근거 없으면 LLM 호출 안 함)
            if self._is_empty_context(context) and intent != IntentType.GENERAL_ANALYSIS:
                logger.info("[GovAgent] Graph 근거 없음 → Fallback 응답 반환 (intent=%s)", intent.value)
                return GovChatResponse(
                    intent=intent,
                    entities=entities,
                    answer="현재 시스템(GraphRAG)에서 해당 조건에 일치하는 분석 근거를 찾지 못했습니다.\n(다른 작물이나 지역으로 다시 질문해 주세요.)",
                    graph_summary=context.model_dump(exclude_none=True)
                )

            # 8. LLM 응답 생성
            logger.info("[GovAgent] LLM 호출 시작 (intent=%s)", intent.value)
            prompt = build_final_prompt(request.message, context)
            answer = await self.llm.generate(prompt, temperature=0.1)

            return GovChatResponse(
                intent=intent,
                entities=entities,
                answer=answer,
                graph_summary=context.model_dump(exclude_none=True)
            )

        except Exception as e:
            logger.error("[GovAgent] 에러 발생: %s", e, exc_info=True)
            return GovChatResponse(
                intent=None,
                entities=None,
                answer="AI 분석 중 오류가 발생했습니다.\n본 분석은 농가 지도를 위한 참고용입니다.",
                error=str(e)
            )

_gov_agent_instance = None

def get_gov_agent() -> GovAgent:
    global _gov_agent_instance
    if _gov_agent_instance is None:
        _gov_agent_instance = GovAgent()
    return _gov_agent_instance


async def gov_agent_ainvoke(input_dict: dict) -> dict:
    """
    orchestrator에서 farm_agent/policy_agent와 동일한
    ainvoke({"messages": [...]}) 인터페이스로 GovAgent를 호출하기 위한 래퍼.

    내부적으로는 기존 GovAgent.run(GovChatRequest)을 그대로 사용합니다.
    """
    messages = input_dict.get("messages", [])
    last_msg = messages[-1] if messages else None

    if last_msg is None:
        return {"messages": [AIMessage(content="질문을 입력해 주세요.")]}

    # LangGraph 메시지 → 텍스트 추출
    if isinstance(last_msg, (HumanMessage, AIMessage)):
        user_text = last_msg.content
    elif isinstance(last_msg, tuple):
        user_text = last_msg[1]
    else:
        user_text = str(last_msg)

    # user_role: 외부 주입(기본값 제거)
    user_role = input_dict.get("user_role")

    agent = get_gov_agent()
    request = GovChatRequest(message=user_text, user_role=user_role)
    response = await agent.run(request)

    return {"messages": [AIMessage(content=response.answer)]}
