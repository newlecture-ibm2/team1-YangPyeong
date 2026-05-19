from typing import Annotated, TypedDict, List, Union, Literal
import json
import re

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import ToolNode
from app.agents.farm_agent import get_farm_agent
from app.agents.balance_agent import get_balance_agent
from app.agents.policy_agent import get_policy_agent
from app.agents.gov_agent import gov_agent_ainvoke
from app.agents.shop_agent import get_shop_agent
from app.agents.community_agent import get_community_agent
from app.agents.general_agent import get_general_agent
# 공통 인프라 (app.agents.shared) — 모든 도메인 에이전트가 재사용
from app.agents.shared import (
    split_actions,            # [ACTION:{...}] 토큰 파싱
    extract_agent_output,     # ReAct 응답 안전 추출
    extract_product_attrs,    # NL → 가격/재고/명사 추출 (도메인 fallback 공용)
)
from app.llm import get_llm
import logging

logger = logging.getLogger(__name__)

from langgraph.graph.message import add_messages


def _accumulate_actions(state: "AgentState", new_actions: list[dict]) -> list[dict]:
    """state의 기존 pending_actions에 새 액션들을 누적."""
    return [*(state.get("pending_actions") or []), *new_actions]


# ── MAS 상태 정의 ──
class AgentState(TypedDict, total=False):
    messages: Annotated[List[BaseMessage], add_messages]  # 리듀서 추가
    next_node: str
    farm_id: int
    user_id: int
    current_focus: str
    pending_actions: list[dict]  # Shop Agent 등이 누적하는 프론트 액션
    skip_synthesis: bool          # True이면 Synthesizer 재가공 없이 원본 응답 그대로 반환

# ── 오케스트레이터 노드 (Router) ──
ROUTER_SYSTEM_PROMPT = """당신은 사용자 질문의 의도를 분석하여 필요한 전문 에이전트들을 선택하는 라우터입니다.
질문이 복합적이라면 **쉼표(,)로 구분하여 여러 개**를 선택하세요. 영어로만 반환하고 부연 설명은 하지 마세요.

카테고리:
- blocked_guard: 특정 농가 명단, 개인정보, 내부 행정 자료 등 비공개 데이터 요청
- policy_agent: 보조금, 지원금, 정책, 공문, 신청 관련 질문
- balance_agent: 농산물 가격, 수익 분석, 시장 경제, 공급/수요 관련 질문
- farm_agent: 특정 농장 상태, 면적, 재배 이력, 날씨, 토양, 병해충 관련 질문
- gov_agent: 지역(양평군 등) 수급 현황, 위험도, 과잉/부족 분석, 대체 작물 추천
- shop_agent: 장터/상점/장바구니/주문/판매 모든 행위 — 페이지 이동, 상품 검색, 장바구니 담기,
  바로 주문, 상품 등록/관리, 자동 입력, 내 상품/주문/판매주문 조회
- community_agent: 농사 노하우, Q&A, 다른 농업인 경험담, 커뮤니티 검색 관련 질문
- general_chat: 위 어디에도 해당하지 않는 일반 농업 상담 또는 비농업 질문

예시:
"내 농장 면적 알려줘" → farm_agent
"감자 보조금이랑 요즘 가격 어때?" → policy_agent, balance_agent
"양평군 배추 위험도 분석해줘" → gov_agent
"다른 농가에서 감자 탄저병 어떻게 방제해?" → community_agent
"커뮤니티에 배추 재배 팁 있어?" → community_agent
"장터로 이동해줘" / "장바구니 보여줘" / "내 주문 보여줘" → shop_agent
"사과 장바구니에 담아줘" / "배추 바로 주문해줘" → shop_agent
"상품 등록할래" / "배추 등록할 건데 내용 채워줘" → shop_agent
"내가 등록한 상품 뭐 있어?" / "주문 들어온 거 뭐 있어?" → shop_agent
"안녕 할아버지!" → general_chat"""

# 유효한 라우팅 대상 목록
VALID_ROUTES = {
    "blocked_guard", "policy_agent", "balance_agent",
    "farm_agent", "gov_agent", "shop_agent", "community_agent", "general_chat"
}

# ════════════════════════════════════════════════════════════════════
# 도메인 라우팅 레지스트리 — 팀원이 새 도메인 추가 시 이 dict 두 개만 수정
# ════════════════════════════════════════════════════════════════════
#
# DOMAIN_FORCE_KEYWORDS:
#   사용자 메시지에 포함되면 LLM 라우터 없이 즉시 해당 에이전트로 보낼 키워드 집합.
#   라우터 LLM의 오판을 방지하는 안전장치.
#
# DOMAIN_CONTEXT_INDICATORS:
#   직전 봇 응답에 이 단어가 있으면 "해당 도메인 대화 중"으로 판단.
#   사용자가 "그래", "응", "1번" 같은 짧은 후속 답변을 했을 때 멀티턴 컨텍스트로 라우팅.
#
# 새 도메인 추가 절차:
#   1) 두 dict에 키 추가 (key = router 카테고리 이름, value = 키워드 set/tuple)
#   2) ROUTER_SYSTEM_PROMPT 카테고리 설명에 한 줄 추가
#   3) VALID_ROUTES 에 추가
#   4) call_{domain}_agent 래퍼 + graph 노드/엣지 등록
# ────────────────────────────────────────────────────────────────────

DOMAIN_FORCE_KEYWORDS: dict[str, set[str]] = {
    "shop_agent": {
        # 장바구니
        "장바구니", "장바구니에", "장바구니로", "장바구니 보여", "장바구니보여",
        # 담기/넣기/구매
        "담아줘", "담아 줘", "담아줄", "담아줄래", "담아봐",
        "넣어줘", "넣어 줘", "넣어줄", "넣어줄래",
        "바로구매", "바로 구매", "결제하기", "구매하기", "살래", "살게",
        # 장터/상점
        "장터", "장터로", "장터에", "상점", "쇼핑",
        # 주문
        "주문할게", "주문해줘", "주문 해줘", "주문하기", "내 주문",
        "판매주문", "판매 주문",
        # 상품/작물 등록 관련
        "상품 등록", "상품등록", "등록한 상품",
        "판매중인", "판매 중인",
        "작물 등록", "작물등록", "작물 등록할", "작물등록할",
        "심을 거 등록", "심을거 등록",
        # 메뉴/목록
        "메뉴", "메뉴가", "메뉴는", "메뉴를",
        "뭐있어", "뭐 있어", "뭐있냐", "뭐 있냐", "뭐있나", "뭐 있나",
        "뭐팔아", "뭐 팔아", "뭐파냐", "뭐팔고",
        "어떤 상품", "어떤상품", "어떤 거 팔",
        "상품 뭐", "상품뭐",
    },
    # 예시: 팀원이 새 도메인 추가 시
    # "livestock_agent": {"가축", "축산", "소 등록", "출하", ...},
    # "farm_agent": {"내 농장", "농장 면적", "가용면적", ...},
}

DOMAIN_CONTEXT_INDICATORS: dict[str, tuple[str, ...]] = {
    "shop_agent": (
        "id=", "productId=", "장바구니", "담아", "담았", "장터",
        "상품", "주문", "결제", "[ACTION:", "PRODUCT_LIST",
    ),
    # 예시:
    # "livestock_agent": ("가축", "출하", "사료", "축사", ...),
}


def force_route(message: str) -> str | None:
    """메시지에 도메인 키워드가 있으면 해당 라우트 이름 반환. 없으면 None.

    여러 도메인 키워드가 매칭되면 dict 등록 순서대로 첫 번째 도메인 반환.
    """
    lower = message.lower()
    for route_name, kws in DOMAIN_FORCE_KEYWORDS.items():
        if any(kw in lower for kw in kws):
            return route_name
    return None


# ── 멀티턴 컨텍스트 라우팅 ──
# "그래", "응", "1번" 처럼 직전 대화에 의존하는 짧은 답변은
# 라우터 LLM이 보지 못한 컨텍스트(직전 봇 응답)를 활용해 라우팅한다.
_SHORT_AFFIRM = {
    "응", "웅", "ㅇ", "ㅇㅇ", "ㅇㅋ", "네", "넵", "옙", "예",
    "그래", "그래요", "맞아", "맞아요", "좋아", "좋아요",
    "yes", "y", "ok", "okay", "오케이",
}
_SHORT_NEG = {
    "아니", "아니요", "아니야", "노", "no", "n", "ㄴ", "ㄴㄴ", "취소",
}


def is_short_followup(message: str) -> bool:
    """이전 대화 의존성이 큰 짧은 답변인지 판단."""
    cleaned = message.strip().lower()
    for ch in "?!.,~ \"'":
        cleaned = cleaned.replace(ch, "")
    if not cleaned:
        return False
    if cleaned in _SHORT_AFFIRM or cleaned in _SHORT_NEG:
        return True
    # 짧은 숫자 답변 (예: "1", "2번")
    if len(cleaned) <= 3 and any(c.isdigit() for c in cleaned):
        return True
    return False


def last_bot_domain(messages: list) -> str | None:
    """직전 AI 메시지가 어느 도메인 응답이었는지 추측. 매칭 안되면 None.

    DOMAIN_CONTEXT_INDICATORS dict의 각 키워드와 매칭하여
    가장 먼저 매칭되는 도메인을 반환.
    """
    # 마지막 항목(현재 user) 제외하고 역순 탐색
    for m in reversed(messages[:-1]):
        if isinstance(m, AIMessage):
            content = m.content or ""
            for route_name, indicators in DOMAIN_CONTEXT_INDICATORS.items():
                if any(ind in content for ind in indicators):
                    return route_name
            return None
        if isinstance(m, HumanMessage):
            # AI 응답 전에 다른 user 메시지가 있으면 컨텍스트 끊긴 것
            return None
    return None


async def router_node(state: AgentState) -> List[str]:
    """LLM 기반으로 질문의 의도를 분석하여 하나 이상의 에이전트로 라우팅합니다.

    우선순위:
      1. 멀티턴 컨텍스트 — 짧은 답변("그래", "응", "1번") + 직전 봇이 특정 도메인
      2. 키워드 force routing — DOMAIN_FORCE_KEYWORDS 매칭
      3. LLM 라우팅 — Groq로 분류
      4. fallback — general_chat
    """
    last_message = state["messages"][-1].content

    # 1. 멀티턴 컨텍스트 라우팅
    if is_short_followup(last_message):
        prev_domain = last_bot_domain(state["messages"])
        if prev_domain:
            logger.info("[Router] 멀티턴 컨텍스트 → %s ('%s')", prev_domain, last_message[:30])
            return [prev_domain]

    # 2. 키워드 선제 라우팅 (LLM 오판 방지)
    if (forced := force_route(last_message)):
        logger.info("[Router] 키워드 매칭 → %s ('%s')", forced, last_message[:40])
        return [forced]

    try:
        llm = get_llm("groq")
        chat_model = llm.get_chat_model(temperature=0)

        response = await chat_model.ainvoke([
            SystemMessage(content=ROUTER_SYSTEM_PROMPT),
            HumanMessage(content=last_message),
        ])

        # 쉼표로 구분된 결과를 리스트로 변환
        raw_routes = [r.strip().lower() for r in response.content.split(",")]
        routes = [r for r in raw_routes if r in VALID_ROUTES]

        if routes:
            logger.info("[Router] LLM → %s ('%s')", routes, last_message[:30])
            return routes

        return ["general_chat"]

    except Exception:
        logger.exception("[Router] LLM 라우팅 실패 → general_chat으로 fallback")
        return ["general_chat"]

# ════════════════════════════════════════════════════════════════════
# 에이전트 노드 래퍼들
# ────────────────────────────────────────────────────────────────────
# 모든 래퍼는 extract_agent_output() 으로 액션 토큰을 자동 추출한다.
# 도구가 ACTION 토큰을 반환하지 않으면 actions=[] 가 되어 기존 동작과 동일.
# 도구에 ACTION을 추가하기만 하면 자동으로 프론트에 전달됨 (하위 호환 보장).
#
# skip_synthesis 옵션:
#   - True: Synthesizer 우회 — 도구 응답을 사용자에게 그대로 전달
#   - False(default): Synthesizer가 할아버지 말투로 재가공
#   액션 출력이 중요한 도메인은 True 권장.
# ════════════════════════════════════════════════════════════════════

def _agent_node_response(
    response_messages: list,
    state: AgentState,
    skip_synthesis: bool = False,
    default_text: str = "",
) -> dict:
    """ReAct 에이전트 응답 → orchestrator state 반환값 변환.

    모든 도메인 에이전트의 call_xxx 래퍼가 동일한 응답 처리 패턴을 따르도록
    공통화한 헬퍼. 직접 사용하지 않고 call_xxx 래퍼 안에서 호출.
    """
    out = extract_agent_output(response_messages, default_text=default_text)
    text = out.text or default_text or response_messages[-1].content if response_messages else ""

    result = {"messages": [AIMessage(content=text)]}
    if out.actions:
        result["pending_actions"] = _accumulate_actions(state, out.actions)
    if skip_synthesis:
        result["skip_synthesis"] = True
    return result


async def call_balance_agent(state: AgentState):
    """Balance Agent — 가격·수익·시장 분석."""
    try:
        agent = get_balance_agent()
        # 경제 분석 맥락 메타데이터 주입
        response = await agent.ainvoke({**state, "current_focus": "economic_analysis"})
        return _agent_node_response(response["messages"], state)
    except Exception:
        logger.exception("[Orchestrator] BalanceAgent call failed")
        return {"messages": [AIMessage(content="수급 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")]}


async def call_farm_agent(state: AgentState):
    """Farm Agent — 농장 상태·재배 이력·날씨."""
    try:
        agent = get_farm_agent()
        response = await agent.ainvoke(state)
        return _agent_node_response(response["messages"], state)
    except Exception:
        logger.exception("[Orchestrator] FarmAgent call failed")
        return {"messages": [AIMessage(content="농장 데이터 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")]}


async def call_policy_agent(state: AgentState):
    """Policy Agent — 보조금·지원금·정책."""
    try:
        agent = get_policy_agent()
        response = await agent.ainvoke({"messages": state["messages"]})
        return _agent_node_response(response["messages"], state)
    except Exception:
        logger.exception("[Orchestrator] PolicyAgent call failed")
        return {"messages": [AIMessage(content="정책 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")]}

# 자연어 attribute 추출(_extract_product_attrs)은 app.agents.shared.nl_extract 로 이동.
# 도메인 fallback에서 `extract_product_attrs(text)` 함수를 직접 사용한다.


# ── shop_agent LLM 실패 시 키워드 → 도구 직접 호출 fallback ──
# Gemini가 짧은/복잡한 user 메시지에 종종 빈 AIMessage(tool_calls 없음)를 반환하는
# 알려진 동작에 대한 안전망. 매칭 안되면 None 반환.
async def _shop_keyword_fallback(user_message: str) -> tuple[str, list[dict]] | None:
    from app.agents.tools.shop_tools import (
        list_shop_menu, navigate_to, clarify_crop_register, autofill_product_info,
    )

    lower = user_message.lower()

    # ── '작물 등록' 모호성 — 항상 가장 먼저 체크 ──
    # "작물 등록" 키워드는 농장 작물 vs 판매 상품 두 가지 의미가 있으므로
    # 어떤 등록 키워드보다 먼저 매칭하여 CLARIFY로 분기.
    crop_register_kws = ("작물 등록", "작물등록", "작물 등록할", "작물등록할",
                         "심을 거 등록", "심을거 등록")
    if any(kw in lower for kw in crop_register_kws):
        result = await clarify_crop_register.ainvoke({})
        return split_actions(result)

    # ── 상품 자동 채우기 — "배추 등록할건데 8800원에 100개" 같은 패턴 ──
    # "채워줘", "팔건데", "등록할" + 작물명(+가격/재고) 패턴
    autofill_signal_kws = ("채워줘", "채워 줘", "채워주세요", "채워달라",
                           "팔건데", "팔 건데", "팔려고", "팔려구",
                           "등록할", "등록 할", "등록하고", "등록하려")
    if any(kw in lower for kw in autofill_signal_kws):
        attrs = extract_product_attrs(user_message)
        product_name = attrs.pop("product_name", None)
        if product_name:
            logger.info("[ShopFallback] autofill 매칭: name=%s, attrs=%s", product_name, attrs)
            result = await autofill_product_info.ainvoke({
                "product_name": product_name,
                **attrs,
            })
            return split_actions(result)

    # 메뉴/상품 목록 키워드
    menu_kws = ("메뉴", "뭐있어", "뭐 있어", "뭐가 있", "뭐가있", "뭐 있었", "뭐있었",
                "뭐 팔", "뭐팔", "보여줘", "보여 줘",
                "어떤 상품", "상품 목록", "상품뭐", "뭐있냐", "뭐 있냐", "뭐가 있냐",
                "있었지", "팔고있", "팔고 있", "팔아")
    if any(kw in lower for kw in menu_kws):
        result = await list_shop_menu.ainvoke({})
        return split_actions(result)

    # 페이지 이동 키워드 (작물 등록은 위에서 이미 처리됨)
    nav_map = [
        (("장바구니",), "cart"),
        (("내 주문", "내주문", "주문 내역", "주문내역"), "my_orders"),
        (("상품 등록", "상품등록", "판매 등록", "판매등록"), "seller_register"),
        (("내 상품", "내상품", "등록한 상품", "판매중인 상품"), "seller_products"),
        (("판매 주문", "판매주문", "들어온 주문"), "seller_orders"),
        (("장터", "쇼핑", "상점"), "shop_home"),
    ]
    for kws, target in nav_map:
        if any(kw in lower for kw in kws):
            result = await navigate_to.ainvoke({"target": target})
            return split_actions(result)

    # ── CLARIFY 후속 처리 ──
    # 사용자가 clarify_crop_register의 옵션을 선택해서 들어온 경우
    if "장터에 판매 상품으로 등록" in user_message or "shop_product" in lower:
        result = await navigate_to.ainvoke({"target": "seller_register"})
        return split_actions(result)
    if "내 농장에 작물 등록" in user_message or "farm_crop" in lower:
        return ("내 농장 작물 등록 기능은 곧 준비됩니다. 조금만 기다려주세요!", [])

    return None


async def call_shop_agent(state: AgentState):
    """Shop Agent 서브 그래프 호출.

    공통 인프라 활용:
      - extract_agent_output: 마지막 AIMessage + 모든 ToolMessage에서 본문·액션 안전 추출
      - _shop_keyword_fallback: LLM이 도구 호출 실패 시 키워드 기반 도구 직접 호출
      - skip_synthesis=True: Synthesizer 재가공 우회 (도구 응답 그대로 전달)
    """
    try:
        agent = get_shop_agent()
        response = await agent.ainvoke({"messages": state["messages"]})
        all_msgs = response["messages"]

        # ① ReAct 응답에서 본문·액션 추출 (AI message + ToolMessage 보완 포함)
        out = extract_agent_output(all_msgs, default_text="")
        cleaned = out.text
        merged_actions = list(out.actions)

        # ② LLM이 본문도 도구도 비웠으면 → 키워드 fallback
        if not cleaned and not merged_actions:
            last_human = next(
                (m for m in reversed(all_msgs) if isinstance(m, HumanMessage)), None
            )
            if last_human and last_human.content:
                logger.info("[ShopAgent] LLM 빈 응답 → 키워드 fallback: '%s'", last_human.content[:40])
                fallback = await _shop_keyword_fallback(last_human.content)
                if fallback:
                    cleaned, fb_actions = fallback
                    # 중복 제거 병합
                    seen = {json.dumps(a, sort_keys=True, ensure_ascii=False) for a in merged_actions}
                    for a in fb_actions:
                        key = json.dumps(a, sort_keys=True, ensure_ascii=False)
                        if key not in seen:
                            seen.add(key)
                            merged_actions.append(a)
                    logger.info("[ShopAgent] fallback 성공: actions=%s", [a.get("type") for a in fb_actions])

        # ③ 최종 fallback 문구
        if not cleaned:
            cleaned = "요청하신 작업을 처리했어요."

        logger.info("[ShopAgent] 최종 reply='%s', actions=%s",
                    cleaned[:80], [a.get("type") for a in merged_actions])

        return {
            "messages": [AIMessage(content=cleaned)],
            "pending_actions": _accumulate_actions(state, merged_actions),
            "skip_synthesis": True,
        }
    except Exception:
        logger.exception("[Orchestrator] ShopAgent call failed")
        return {
            "messages": [AIMessage(content="상점 기능 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")],
            "skip_synthesis": True,
        }

async def call_community_agent(state: AgentState):
    """Community Agent — 커뮤니티 검색·노하우."""
    try:
        agent = get_community_agent()
        response = await agent.ainvoke({"messages": state["messages"]})
        return _agent_node_response(response["messages"], state)
    except Exception:
        logger.exception("[Orchestrator] CommunityAgent call failed")
        return {"messages": [AIMessage(content="커뮤니티 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")]}


async def call_blocked_guard(state: AgentState):
    """행정 전용/개인정보 데이터 접근 차단."""
    msg = "해당 내용은 지자체 전용 화면에서 확인해야 하는 정보입니다. 공개 챗봇에서는 지역 단위 수급 현황만 안내할 수 있습니다."
    return {"messages": [AIMessage(content=msg)]}


async def call_gov_agent(state: AgentState):
    """Gov Agent — 지역 수급·위험도 분석."""
    try:
        result = await gov_agent_ainvoke({"messages": state["messages"]})
        return _agent_node_response(result["messages"], state)
    except Exception:
        logger.exception("[Orchestrator] GovAgent call failed")
        return {"messages": [AIMessage(content="지역 수급 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")]}


async def call_general_agent(state: AgentState):
    """General Agent — 양평이 할아버지 일반 상담."""
    try:
        agent = get_general_agent()
        response = await agent.ainvoke({"messages": state["messages"]})
        return _agent_node_response(response["messages"], state)
    except Exception:
        logger.exception("[Orchestrator] GeneralAgent call failed")
        return {"messages": [AIMessage(content="허허, 잠시 머리가 멍해졌구만. 다시 한번 물어보게나.")]}

# ── 답변 합성 노드 (Synthesizer) ──
SYNTHESIZER_SYSTEM_PROMPT = """당신은 '양평이 할아버지'입니다.
전문 에이전트들이 조사해온 정보를 바탕으로, 사용자에게 하나의 따뜻하고 간결한 답변으로 통합해 들려주세요.

지침:
1. **질문에서 물어본 내용만** 답하세요. 묻지 않은 정보는 추가하지 마세요.
2. **3문장 이내**로 핵심만 간결하게 전달하세요. 절대 길게 늘어놓지 마세요.
3. 사용자를 '우리 젊은이' 또는 '손주'처럼 대하며 다정하게 조언하세요.
4. "에이전트가 말하길..." 같은 표현은 쓰지 말고, 할아버지가 직접 알아보고 말해주는 것처럼 하세요.
5. 한자(漢字)는 절대 사용하지 말고, 정겨운 한글 말투로만 작성하세요. (예: 農事 -> 농사)"""

async def synthesizer_node(state: AgentState):
    """여러 에이전트의 답변을 취합하여 최종 응답을 생성합니다.

    skip_synthesis=True 이면 마지막 AI 메시지를 그대로 반환합니다.
    (Shop Agent처럼 이미 완성된 응답을 할아버지 말투로 재가공하면 내용이 왜곡될 때 사용)
    """
    # Shop Agent 등이 합성 건너뛰기를 요청한 경우 — 원본 응답 그대로 반환
    if state.get("skip_synthesis"):
        last_ai = next(
            (m for m in reversed(state["messages"]) if isinstance(m, AIMessage)), None
        )
        if last_ai:
            return {"messages": [last_ai]}

    try:
        llm = get_llm("groq")
        chat_model = llm.get_chat_model(temperature=0.5)

        # 시스템 메시지 + 이전 대화 + 에이전트들의 답변들 취합
        agent_responses = "\n\n".join([msg.content for msg in state["messages"] if isinstance(msg, AIMessage)])
        
        prompt = [
            SystemMessage(content=SYNTHESIZER_SYSTEM_PROMPT),
            HumanMessage(content=f"사용자 질문: {state['messages'][0].content}\n\n조사된 정보들:\n{agent_responses}")
        ]

        response = await chat_model.ainvoke(prompt)
        # 기존 에이전트들의 개별 답변은 지우고 최종 합성 답변만 메시지에 추가
        return {"messages": [response]}
        
    except Exception:
        logger.exception("[Orchestrator] Synthesizer failed")
        return {"messages": [AIMessage(content="허허, 정보를 모으다 보니 좀 꼬였구만. 핵심만 말하자면 이렇다네... (오류 발생으로 마지막 답변만 전달)")]}

# ── 통합 그래프 구성 ──
def get_main_orchestrator():
    workflow = StateGraph(AgentState)
    
    # 노드 추가
    workflow.add_node("farm_agent", call_farm_agent)
    workflow.add_node("balance_agent", call_balance_agent)
    workflow.add_node("policy_agent", call_policy_agent)
    workflow.add_node("shop_agent", call_shop_agent)
    workflow.add_node("community_agent", call_community_agent)
    workflow.add_node("gov_agent", call_gov_agent)
    workflow.add_node("blocked_guard", call_blocked_guard)
    workflow.add_node("general_agent", call_general_agent)
    workflow.add_node("synthesizer", synthesizer_node)  # 답변 합성 노드
    
    # 조건부 라우팅 적용 (복수 선택 가능)
    workflow.add_conditional_edges(START, router_node, {
        "blocked_guard": "blocked_guard",
        "balance_agent": "balance_agent",
        "farm_agent": "farm_agent",
        "policy_agent": "policy_agent",
        "shop_agent": "shop_agent",
        "community_agent": "community_agent",
        "gov_agent": "gov_agent",
        "general_chat": "general_agent",
    })
    
    # 모든 에이전트는 답변 합성 노드로 집결
    workflow.add_edge("balance_agent", "synthesizer")
    workflow.add_edge("farm_agent", "synthesizer")
    workflow.add_edge("policy_agent", "synthesizer")
    workflow.add_edge("shop_agent", "synthesizer")
    workflow.add_edge("community_agent", "synthesizer")
    workflow.add_edge("gov_agent", "synthesizer")
    workflow.add_edge("general_agent", "synthesizer")
    workflow.add_edge("blocked_guard", "synthesizer")
    
    # 최종 답변 반환
    workflow.add_edge("synthesizer", END)

    return workflow.compile()
