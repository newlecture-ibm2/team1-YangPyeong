"""
챗봇 라우터.
LangGraph MAS 오케스트레이터 + Actionable Agent (액션 토큰 반환).

응답 스키마: { reply: string, actions: ChatAction[] }
"""
import logging
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage

from app.agents.orchestrator import split_actions
from app.agents.shared.action_token import split_pending_intent
from app.agents.shared import slot_resolver, tool_dispatcher
from app.models.chat import ChatAction, ChatResponse, PendingIntent
from app.utils.backend_client import user_jwt_ctx
import base64
import json
import httpx
import os

# 도메인 슬롯 추출기 등록 (서버 시작 시 1회)
def _register_domain_extractors():
    from app.agents.tools import shop_slot_extractors
    shop_slot_extractors.register()
    # 다른 도메인은 가이드 참고 후 여기에 추가
    # from app.agents.tools import farm_slot_extractors; farm_slot_extractors.register()

_register_domain_extractors()

router = APIRouter(prefix="/api", tags=["chat"])
logger = logging.getLogger(__name__)


class HistoryItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    userId: int = 0
    roomId: int = 0
    category: str = "general"
    message: str
    metadata: Optional[dict] = None
    history: Optional[list[HistoryItem]] = None
    pending_intent: Optional[PendingIntent] = None  # 다중 턴 슬롯 채우기 컨텍스트


# 오케스트레이터 싱글톤 (서버 시작 후 첫 요청 시 1회 컴파일)
_orchestrator = None


async def _handle_pending_intent(pending: PendingIntent, user_message: str) -> ChatResponse:
    """다중 턴 슬롯 채우기 처리.

    1) 사용자 메시지에서 부족한 슬롯 추출 시도
    2) 모두 채워졌으면 도구 호출
    3) 아직 부족하면 다음 슬롯 질문
    """
    # 슬롯 추출 시도
    updated = await slot_resolver.resolve_pending(pending, user_message)

    if slot_resolver.is_complete(updated):
        # 모든 슬롯 완성 → 도구 호출
        logger.info("[PendingIntent] %s 슬롯 완성 → 도구 호출: %s",
                    updated.tool, updated.filled)
        result_text = await tool_dispatcher.invoke(updated.tool, **updated.filled)
        # 결과에서 PendingIntent / 액션 토큰 추출
        result_text, _ = split_pending_intent(result_text)
        cleaned, actions = split_actions(result_text)
        validated_actions: list[ChatAction] = []
        for a in actions:
            try:
                validated_actions.append(ChatAction(**a))
            except Exception:
                pass
        return ChatResponse(
            reply=cleaned or "요청을 처리했어요.",
            actions=validated_actions,
            pending_intent=None,
        )

    # 아직 부족 → 다음 슬롯 질문
    prompt = slot_resolver.next_prompt(updated)
    return ChatResponse(reply=prompt, actions=[], pending_intent=updated)


def _get_orchestrator():
    global _orchestrator
    if _orchestrator is None:
        from app.agents import get_main_orchestrator
        _orchestrator = get_main_orchestrator()
    return _orchestrator


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    logger.info("챗봇 요청 수신 [userId=%s, category=%s]", request.userId, request.category)

    # ── 사용자 JWT를 ContextVar에 주입 (도구가 백엔드 호출 시 자동 사용) ──
    jwt = (request.metadata or {}).get("jwt") if request.metadata else None
    token = user_jwt_ctx.set(jwt)

    try:
        # ── PendingIntent 처리 (다중 턴 슬롯 채우기) ──
        if request.pending_intent:
            return await _handle_pending_intent(request.pending_intent, request.message)

        orchestrator = _get_orchestrator()

        # ── 프론트 히스토리 → LangChain 메시지 변환 ──
        # 첫 user 메시지 이전의 AIMessage(환영 메시지 등)는 제외
        # → Gemini 등 일부 LLM은 대화가 assistant로 시작하면 빈 응답을 반환함
        messages = []
        history = request.history or []
        first_user_idx = next(
            (i for i, h in enumerate(history) if h.role == "user"), None
        )
        if first_user_idx is not None:
            for h in history[first_user_idx:][-10:]:  # 첫 user부터 최근 10턴
                if h.role == "user":
                    messages.append(HumanMessage(content=h.content))
                else:
                    messages.append(AIMessage(content=h.content))

        # 현재 질문 추가 (히스토리 마지막이 동일한 user 메시지면 중복 제거)
        if not (messages and isinstance(messages[-1], HumanMessage) and messages[-1].content == request.message):
            messages.append(HumanMessage(content=request.message))

        # ── JWT에서 role 및 farmId 추출 (서명 검증은 Spring Security가 이미 수행) ──
        user_role = "USER"
        farm_id = 0
        if jwt:
            try:
                payload_b64 = jwt.split(".")[1]
                payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
                payload_json = base64.b64decode(payload_b64).decode("utf-8")
                payload_dict = json.loads(payload_json)
                user_role = payload_dict.get("role", "USER")
                farm_id = payload_dict.get("farmId", 0)
            except Exception as e:
                logger.warning("[Chat] JWT 파싱 실패: %s", e)
            
            # JWT에 farmId가 없거나 0이면 백엔드 API에서 조회
            if farm_id == 0:
                try:
                    backend_url = os.getenv("BACKEND_URL", "http://backend:8080")
                    async with httpx.AsyncClient() as client:
                        res = await client.get(
                            f"{backend_url}/api/farms", 
                            headers={"Authorization": f"Bearer {jwt}"},
                            timeout=3.0
                        )
                        if res.status_code == 200:
                            data_block = res.json().get("data", [])
                            if data_block and len(data_block) > 0:
                                farm_id = data_block[0].get("id", 0)
                except Exception as e:
                    logger.warning("[Chat] 백엔드 농장 정보 조회 실패: %s", e)

        # ── 오케스트레이터 호출 ──
        result = await orchestrator.ainvoke({
            "messages": messages,
            "user_id": request.userId,
            "user_role": user_role,
            "farm_id": farm_id,
            "next_node": "",
            "current_focus": "",
            "pending_actions": [],
        })

        # ── 응답 가공: 텍스트 + 액션 + PendingIntent 분리 ──
        final_text = result["messages"][-1].content or ""
        # PendingIntent 토큰 먼저 추출 (액션 토큰과 형식 다름)
        final_text, pending_intent_obj = split_pending_intent(final_text)
        cleaned_reply, inline_actions = split_actions(final_text)

        # state["pending_actions"]에 누적된 액션 + Synthesizer 통과 후 남은 인라인 액션
        pending = result.get("pending_actions") or []
        all_actions = [*pending, *inline_actions]

        # ChatAction으로 검증 (잘못된 페이로드는 제외)
        validated_actions: list[ChatAction] = []
        for a in all_actions:
            try:
                validated_actions.append(ChatAction(**a))
            except Exception as e:
                logger.warning("[Chat] 잘못된 액션 페이로드 무시: %s — %s", a, e)

        # PendingIntent 검증
        validated_pending: Optional[PendingIntent] = None
        if pending_intent_obj:
            try:
                validated_pending = PendingIntent(**pending_intent_obj)
            except Exception as e:
                logger.warning("[Chat] 잘못된 PendingIntent 무시: %s — %s", pending_intent_obj, e)

        return ChatResponse(
            reply=cleaned_reply or "요청을 처리했어요.",
            actions=validated_actions,
            pending_intent=validated_pending,
        )

    except Exception as e:
        logger.error("챗봇 응답 생성 실패: %s", e, exc_info=True)
        return ChatResponse(
            reply="죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            actions=[],
        )
    finally:
        # ContextVar 정리 (다음 요청에 누수되지 않도록)
        user_jwt_ctx.reset(token)


# ════════════════════════════════════════════════════════════════════
# SSE 스트리밍 엔드포인트 — 에이전트 진행 상황 실시간 전달
# ════════════════════════════════════════════════════════════════════
from fastapi.responses import StreamingResponse


# 에이전트 노드 이름 → 사용자 친화적 한국어 레이블 매핑
_NODE_LABELS: dict[str, str] = {
    "router": "질문 분석",
    "farm_agent": "농장 분석",
    "balance_agent": "시세·수익 분석",
    "policy_agent": "정책·보조금 탐색",
    "gov_agent": "수급 현황 분석",
    "shop_agent": "장터 처리",
    "community_agent": "커뮤니티 검색",
    "general_agent": "일반 상담",
    "blocked_guard": "접근 권한 확인",
    "synthesizer": "종합 보고서 작성",
}

# 스트리밍 이벤트로 추적할 노드 목록
_TRACKABLE_NODES = set(_NODE_LABELS.keys())


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest) -> StreamingResponse:
    """SSE 스트리밍 챗봇 엔드포인트.

    에이전트 노드별 진행 상황을 실시간으로 전달하고,
    최종 결과를 'result' 이벤트로 전송합니다.
    """
    logger.info("챗봇 스트리밍 요청 수신 [userId=%s, category=%s]", request.userId, request.category)

    jwt = (request.metadata or {}).get("jwt") if request.metadata else None

    async def event_generator():
        token = user_jwt_ctx.set(jwt)
        try:
            # PendingIntent 처리 (스트리밍에서는 즉시 결과 반환)
            if request.pending_intent:
                result = await _handle_pending_intent(request.pending_intent, request.message)
                yield f"event: result\ndata: {json.dumps(result.model_dump(), ensure_ascii=False)}\n\n"
                return

            orchestrator = _get_orchestrator()

            # 히스토리 변환 (기존 로직 재활용)
            messages: list = []
            history = request.history or []
            first_user_idx = next(
                (i for i, h in enumerate(history) if h.role == "user"), None
            )
            if first_user_idx is not None:
                for h in history[first_user_idx:][-10:]:
                    if h.role == "user":
                        messages.append(HumanMessage(content=h.content))
                    else:
                        messages.append(AIMessage(content=h.content))

            if not (messages and isinstance(messages[-1], HumanMessage)
                    and messages[-1].content == request.message):
                messages.append(HumanMessage(content=request.message))

            # JWT에서 role 및 farm_id 추출 (farm_id는 보통 백엔드에서 받아와야 함)
            user_role = "USER"
            farm_id = 0
            if jwt:
                try:
                    payload_b64 = jwt.split(".")[1]
                    payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
                    payload_json = base64.b64decode(payload_b64).decode("utf-8")
                    payload_dict = json.loads(payload_json)
                    user_role = payload_dict.get("role", "USER")
                    farm_id = payload_dict.get("farmId", 0)
                except Exception as e:
                    logger.warning("[ChatStream] JWT 파싱 실패: %s", e)
                
                # 백엔드에 직접 농장 목록을 요청하여 첫 번째 농장의 ID를 가져옴
                if farm_id == 0:
                    try:
                        import httpx
                        import os
                        backend_url = os.getenv("BACKEND_URL", "http://backend:8080")
                        async with httpx.AsyncClient() as client:
                            res = await client.get(
                                f"{backend_url}/api/farms",
                                headers={"Authorization": f"Bearer {jwt}"},
                                timeout=3.0
                            )
                            if res.status_code == 200:
                                data_block = res.json().get("data", [])
                                if data_block and len(data_block) > 0:
                                    farm_id = data_block[0].get("id", 0)
                    except Exception as e:
                        logger.warning("[ChatStream] 백엔드 농장 정보 조회 실패: %s", e)

            input_state = {
                "messages": messages,
                "user_id": request.userId,
                "user_role": user_role,
                "farm_id": farm_id,
                "next_node": "",
                "current_focus": "",
                "pending_actions": [],
                "analysis_context": {},
            }

            # 진행 중인 노드 추적
            active_nodes: set[str] = set()
            final_state: dict = {}

            async for event in orchestrator.astream_events(
                input_state, version="v2"
            ):
                kind = event.get("event", "")
                node_name = event.get("name", "")

                # 관심 노드의 시작/종료만 추적
                if node_name in _TRACKABLE_NODES:
                    if kind == "on_chain_start" and node_name not in active_nodes:
                        active_nodes.add(node_name)
                        label = _NODE_LABELS.get(node_name, node_name)
                        data = json.dumps(
                            {"node": node_name, "label": label, "status": "started"},
                            ensure_ascii=False,
                        )
                        yield f"event: node_status\ndata: {data}\n\n"

                    elif kind == "on_chain_end" and node_name in active_nodes:
                        active_nodes.discard(node_name)
                        label = _NODE_LABELS.get(node_name, node_name)
                        data = json.dumps(
                            {"node": node_name, "label": label, "status": "completed"},
                            ensure_ascii=False,
                        )
                        yield f"event: node_status\ndata: {data}\n\n"

                # 최종 상태 캡처 (synthesizer 또는 마지막 노드 종료 시)
                if kind == "on_chain_end" and event.get("data", {}).get("output"):
                    output = event["data"]["output"]
                    if isinstance(output, dict) and "messages" in output:
                        final_state = output

            # 최종 결과 조립 (기존 로직과 동일)
            if not final_state:
                # astream_events에서 final_state를 못 받은 경우 ainvoke로 폴백
                final_state = await orchestrator.ainvoke(input_state)

            final_text = final_state["messages"][-1].content or ""
            final_text, pending_intent_obj = split_pending_intent(final_text)
            cleaned_reply, inline_actions = split_actions(final_text)

            pending = final_state.get("pending_actions") or []
            all_actions = [*pending, *inline_actions]

            validated_actions: list[dict] = []
            for a in all_actions:
                try:
                    validated_actions.append(ChatAction(**a).model_dump())
                except Exception:
                    pass

            validated_pending: dict | None = None
            if pending_intent_obj:
                try:
                    validated_pending = PendingIntent(**pending_intent_obj).model_dump()
                except Exception:
                    pass

            result_data = {
                "reply": cleaned_reply or "요청을 처리했어요.",
                "actions": validated_actions,
                "pending_intent": validated_pending,
            }
            yield f"event: result\ndata: {json.dumps(result_data, ensure_ascii=False)}\n\n"

        except Exception as e:
            logger.error("챗봇 스트리밍 응답 생성 실패: %s", e, exc_info=True)
            error_data = {
                "reply": "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
                "actions": [],
                "pending_intent": None,
            }
            yield f"event: result\ndata: {json.dumps(error_data, ensure_ascii=False)}\n\n"
        finally:
            user_jwt_ctx.reset(token)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

