from typing import Annotated, TypedDict, List, Union, Literal
import json
import re

# pyrefly: ignore [missing-import]
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
# pyrefly: ignore [missing-import]
from langgraph.graph import StateGraph, END, START
# pyrefly: ignore [missing-import]
from langgraph.prebuilt import ToolNode
from app.agents.farm_agent import get_farm_agent
from app.agents.balance_agent import get_balance_agent
from app.agents.policy_agent import get_policy_agent
from app.agents.gov_agent import gov_agent_ainvoke
from app.agents.shop_agent import get_shop_agent
from app.agents.community_agent import get_community_agent
from app.agents.general_agent import get_general_agent
from app.agents.guidance_agent import get_guidance_agent
from app.agents.recommend_agent import get_recommend_agent
from app.agents.account_agent import get_account_agent
# 공통 인프라 (app.agents.shared) — 모든 도메인 에이전트가 재사용
from app.agents.shared import (
    split_actions,            # [ACTION:{...}] 토큰 파싱
    extract_agent_output,     # ReAct 응답 안전 추출
    extract_product_attrs,    # NL → 가격/재고/명사 추출 (도메인 fallback 공용)
)
from app.llm import get_llm
import logging

logger = logging.getLogger(__name__)

# pyrefly: ignore [missing-import]
from langgraph.graph.message import add_messages


def _reduce_list(left: list | None, right: list | None) -> list:
    return (left or []) + (right or [])

def _reduce_dict(left: dict | None, right: dict | None) -> dict:
    res = (left or {}).copy()
    res.update(right or {})
    return res

def _reduce_bool(left: bool | None, right: bool | None) -> bool:
    return bool(left) or bool(right)

# ── MAS 상태 정의 ──
class AgentState(TypedDict, total=False):
    messages: Annotated[List[BaseMessage], add_messages]  # 리듀서 추가
    next_node: str
    farm_id: int
    user_id: int
    user_role: str
    current_focus: str
    pending_actions: Annotated[list[dict], _reduce_list]  # 리듀서 추가
    skip_synthesis: Annotated[bool, _reduce_bool]         # 리듀서 추가 (병렬 노드 동시 업데이트 허용)
    routed_agents: list[str]      # 라우팅된 에이전트 목록 (Synthesizer 우회 판단용)
    analysis_context: Annotated[dict, _reduce_dict]       # 리듀서 추가

# ── 오케스트레이터 노드 (Router) ──
ROUTER_SYSTEM_PROMPT = """당신은 사용자 질문의 의도를 분석하여 적합한 전문 에이전트를 선택하는 라우터입니다.

## 규칙
1. 질문이 여러 도메인에 걸치면 **쉼표(,)로 구분하여 복수 선택**하세요.
2. 영어 카테고리명만 반환하세요. 부연 설명은 하지 마세요.
3. 확신이 없으면 general_chat을 포함시키세요.
4. "작물 등록", "심을 거 등록" 같은 표현이 농장 토양·재배 맥락과 함께 나오면 farm_agent를 반드시 포함하세요. 장터 상품 판매 맥락일 때만 shop_agent를 선택하세요.

## 카테고리 판단 기준
- blocked_guard: 특정 농가 명단, 개인정보, 내부 행정 자료 등 비공개 데이터 요청
- policy_agent: 보조금, 지원금, 정책, 공문, 신청, 혜택, 지원 사업
- balance_agent: 농산물 시세, 가격 동향, 수익 분석, 시장 경제, 공급/수요, 도매가, 수급 분석, 수익 전망
- farm_agent: 내 농장 상태, 면적, 재배 이력, 날씨, 토양, 병해충, 작물 관리법, 작물 재배 추천
- gov_agent: 지역(양평군 등) 수급 현황, 위험도 분석, 과잉/부족, 대체 작물 추천
- shop_agent: 장터/상점/장바구니/주문/판매 모든 행위 — 페이지 이동, 상품 검색, 장바구니 담기,
  바로 주문, 상품 등록/관리, 자동 입력, 내 상품/판매주문 조회 (장터 주문·판매)
- guidance_agent: 농장·재배 처음 시작 가이드, 온보딩, 작물 추천/수익 화면 **이동 안내** (데이터 조회 X)
- recommend_agent: **AI 작물 추천 데이터** — 추천 작물, 초보/맞춤 작물, 돈 되는 작물, 순위, 비교, 점수, 분석 이력

## 판단 예시
"내 농장 면적 알려줘" → farm_agent
"처음인데 어떻게 시작해?" / "나 이제 뭐해?" / "추천 화면으로 가줘" → guidance_agent (온보딩/이동)
"작물 추천해줘" / "나 초보인데 뭐 키울까" / "돈 되는 작물" / "1등 작물 뭐야" / "추천 순위" → recommend_agent
"로그인하고 싶어" / "test@a.com 가입됐어?" → account_agent
"내 주문" / "구매 내역" → account_agent
"내가 쓴 글" → account_agent
"감자 보조금이랑 요즘 가격 어때?" → policy_agent, balance_agent
"양평군 배추 위험도 분석해줘" → gov_agent
"다른 농가에서 감자 탄저병 어떻게 방제해?" → community_agent
"커뮤니티에 배추 재배 팁 있어?" → community_agent
"상품 등록" → shop_agent
"장터에 뭐 팔고 있어?" → shop_agent
"사과 장바구니에 담아줘" → shop_agent
"토마토 심는 시기랑 관련 보조금 알려줘" → farm_agent, policy_agent
"요즘 배추 심으면 돈 될까?" → balance_agent, farm_agent
"안녕하세요!" → general_chat
"커뮤니티에 배추 재배 팁 있어?" → community_agent
"내 농장 흙 상태에 맞는 작물 추천해줘" → farm_agent, recommend_agent
"양평군 쌀 수급 현황이랑 관련 지원 정책 알려줘" → gov_agent, policy_agent
"감자 심으려는데 보조금이랑 시세 전망 같이 알려줘" → farm_agent, policy_agent, balance_agent

## 추천 + 다른 도메인 복합 질문 예시
"감자랑 배추 비교해줘" → recommend_agent
"요즘 돈 되는 작물 추천해주고 시세도 알려줘" → recommend_agent, balance_agent
"내가 키우는 배추 수확 다 했고, 다음 시즌에 뭐 심을까?" → farm_agent, recommend_agent
"추천 작물 중 보조금 있는 거" → recommend_agent, policy_agent
"추천 작물 장터에 팔고 싶어" → recommend_agent, shop_agent"""

# 유효한 라우팅 대상 목록
VALID_ROUTES = {
    "blocked_guard", "policy_agent", "balance_agent",
    "farm_agent", "gov_agent", "shop_agent", "community_agent",
    "guidance_agent", "recommend_agent", "account_agent", "general_chat",
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
  # account · guidance — shop보다 먼저 매칭 (구체 키워드 우선)
    "account_agent": {
        "로그인", "로그인하고", "로그인해", "회원가입", "비밀번호",
        "내 프로필", "프로필 수정", "프로필 사진",
        "내 주문", "내주문", "구매 내역", "구매내역", "주문 내역", "주문내역",
        "내가 쓴 글", "내 댓글", "신고 내역",
        "가입되어", "가입됐", "이메일로 가입", "탈퇴",
        "계정 복구",
    },
    "guidance_agent": {
        "재배 작물", "재배작물", "재배 등록", "재배등록",
        "농장 등록", "농장등록", "농장 등록할",
        "농장 추가", "농장추가",
        "내 농장 대시보드", "농장 대시보드",
        "수다방", "수다방 이동", "커뮤니티 이동", "커뮤니티로",
        "추천 화면", "추천 페이지", "추천화면",
        # 신규 추가 (온보딩)
        "뭐 해야", "뭐해야", "뭐부터", "어떻게 시작", "가이드", "처음인데", "나 이제 뭐해",
    },
    "recommend_agent": {
        # 기본 추천 질의 (Guidance/Balance에서 이관)
        "추천 작물", "작물 추천", "추천작물", "작물추천", "추천해",
        "뭐 심", "뭐심", "뭘 심", "뭘심", "뭐 키울", "뭘 키울", "어떤 작물",
        # 기존
        "추천 결과", "추천 순위", "추천순위", "몇 등", "몇등", "몇 점", "몇점",
        "top3", "top 3", "1등", "2등", "3등", "적합도", "종합 점수", "종합점수",
        "왜 추천", "추천 이유", "코칭 상태", "ai 코칭", "코칭 가능",
        "재배 중 작물", "등록 작물 점수",
        # 신규 추가 - 순위/비교
        "top5", "top 5", "top10", "top 10", "4등", "5등",
        "상위 작물", "하위 작물", "꼴등",
        # 신규 추가 - 비교
        "뭐가 나아", "뭐가 더 좋아", "뭐가 낫지", "비교해줘", "vs",
        "어떤 게 좋아", "차이가 뭐야",
        # 신규 추가 - 점수 기준
        "토양 점수", "시세 점수", "수급 점수", "난이도 점수",
        "토양 적합", "시세 전망 점수",
        # 신규 추가 - 분석 이력
        "분석 언제", "마지막 분석", "재분석", "다시 분석",
        "분석 결과", "분석 시각",
        "지난번", "이전 추천", "점수 올랐어", "달라진 거", "과거 분석",
        # 신규 추가 - 다음 시즌
        "다음 시즌", "다음시즌", "내년에 뭐", "윤작",
        # 신규 추가 - 맞춤 표현
        "나한테 맞는 작물", "내 땅에 맞는", "이 땅에 뭐",
        "어떤 작물이 좋", "좋은 작물",
        # 신규 추가 - 페르소나 및 핵심 키워드
        "초보 농부", "초보자", "처음 심기 좋은",
        "돈 되는 작물", "돈되는", "수익 많이 나는", "수익 높은",
        "코칭해줘", "코칭 해줘", "맞춤 작물",
    },
    "shop_agent": {
        # 장바구니
        "장바구니", "장바구니에", "장바구니로", "장바구니 보여", "장바구니보여",
        # 담기/넣기/구매
        "담아줘", "담아 줘", "담아줄", "담아줄래", "담아봐",
        "넣어줘", "넣어 줘", "넣어줄", "넣어줄래",
        "바로구매", "바로 구매", "결제하기", "구매하기", "살래", "살게",
        "바로 결제", "바로결제", "그걸로 결제", "이걸로 결제",
        "그걸로 주문", "이걸로 주문", "그걸로 구매", "이걸로 구매",
        # 장터/상점
        "장터", "장터로", "장터에", "상점", "쇼핑",
        # 주문
        "주문할게", "주문해줘", "주문 해줘", "주문하기",
        "판매주문", "판매 주문",
        # 상품 등록 관련 (작물 등록은 farm_agent 영역이므로 제외)
        "상품 등록", "상품등록", "등록한 상품",
        "판매중인", "판매 중인",
        # 메뉴/목록
        "메뉴", "메뉴가", "메뉴는", "메뉴를",
        "뭐있어", "뭐 있어", "뭐있냐", "뭐 있냐", "뭐있나", "뭐 있나",
        "뭐팔아", "뭐 팔아", "뭐파냐", "뭐팔고",
        "어떤 상품", "어떤상품", "어떤 거 팔",
        "상품 뭐", "상품뭐",
        # 취소
        "주문 취소", "주문취소", "취소해줘", "취소해 줘", "취소할래", "취소할게",
        # 장바구니/상품 상세
        "내 장바구니", "장바구니 확인", "장바구니 조회",
        "상품 상세", "상세 보여", "상세보기", "상세 정보", "상품 정보",
        # 상품 상세 화면 이동 ("상추 상세설명으로 이동해달라고" 패턴)
        "상세설명", "상세 설명", "상세화면", "상세 화면", "상세페이지", "상세 페이지",
        # 판매자 상품 수정/삭제/상태변경
        "가격 바꿔", "가격 변경", "가격 수정", "가격을 바꿔", "가격으로 바꿔",
        "재고 바꿔", "재고 변경", "재고 수정", "재고를 바꿔", "재고로 바꿔",
        "상품 수정", "상품 삭제", "상품 지워", "상품 지워줘", "숨김 처리", "숨기기",
        "판매중으로", "다시 판매", "품절 처리", "상태 변경", "상태 바꿔",
        # 판매자 주문 상태 변경
        "접수 확인", "접수확인", "주문 접수", "주문접수",
        "발송 처리", "발송처리", "발송 완료", "배송 시작", "배송시작",
        "주문 거절", "주문거절", "거절해줘", "거절 처리",
    },
    "policy_agent": {
        "보조금", "지원금", "정책", "지원 사업", "혜택", "신청", "공고",
    },
    "balance_agent": {
        "시세", "가격", "수익", "수급", "공급", "수요", "전망", "돈 될까",
        "도매가", "시장", "예상 수익", "수확량", "수익 분석", "수익분석",
    },
    "farm_agent": {
        "내 농장", "토양", "흙", "면적", "재배 이력", "날씨", "기후", "병해충", "작물 관리",
        "농장 면적", "가용면적", "작물 심", "파종", "비료", "물 주기",
        "수확 다 했어", "수확 다했어", "수확 끝", "수확완료",
    },
    "gov_agent": {
        "양평군", "읍면별", "지역별", "농가 분포", "위험도", "과잉", "부족",
        "단월면", "양동면", "강하면", "용문면", "양서면", "지평면",
        "개군면", "청운면", "양평읍",
    },
}

DOMAIN_CONTEXT_INDICATORS: dict[str, tuple[str, ...]] = {
    "account_agent": (
        "프로필", "이메일 확인", "주문 요약", "내 활동",
        "/mypage", "로그인", "회원가입",
    ),
    "guidance_agent": (
        "추천 안내", "농장 안내", "등록 안내", "재배 작물",
        "/farm/recommend", "/farm/register", "AI 작물 추천",
    ),
    "recommend_agent": (
        "추천 결과", "종합", "점", "코칭", "TOP", "토양", "수급", "시세",
        "적합도", "분석 모드", "AI 코칭",
        # 신규 추가
        "순위", "가중합", "PLAN", "MANAGE", "MIXED",
        "재배 중 코칭", "신규 추천", "다음 시즌",
        "비교", "지난번", "과거", "맞춤", "수익", "초보",
    ),
    "shop_agent": (
        "id=", "productId=", "장바구니", "담아", "담았", "장터",
        "상품", "주문", "결제", "[ACTION:", "PRODUCT_LIST",
        "진행할까요", "진행하면 되겠죠", "담아드릴까요",  # 상품 확인 질문 패턴
    ),
}


def force_routes(message: str) -> list[str]:
    """메시지에 매칭되는 모든 도메인 키워드를 찾아 복수 라우트 목록을 반환.

    중복 제거하며 VALID_ROUTES에 포함된 것만 반환.
    매칭 없으면 빈 리스트.
    """
    lower = message.lower()
    matched: list[str] = []
    seen: set[str] = set()
    for route_name, kws in DOMAIN_FORCE_KEYWORDS.items():
        if route_name not in seen and any(kw in lower for kw in kws):
            if route_name in VALID_ROUTES:
                matched.append(route_name)
                seen.add(route_name)
    return matched


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
      3. LLM 라우팅 — Gemini로 분류
      4. fallback — general_chat
    """
    last_message = state["messages"][-1].content

    # 1. 멀티턴 컨텍스트 라우팅
    if is_short_followup(last_message):
        prev_domain = last_bot_domain(state["messages"])
        if prev_domain:
            logger.info("[Router] 멀티턴 컨텍스트 → %s ('%s')", prev_domain, last_message[:30])
            return [prev_domain]

    # 1.5 컨텍스트 참조어 감지 — "이 상품이 뭔데?" 처럼 짧은 긍정어는 아니지만
    # 직전 대화를 가리키는 표현이 있으면 직전 도메인으로 라우팅
    _CONTEXT_REF_WORDS = (
        "이 상품", "그 상품", "이 물건",
        "이게 뭐", "이거 뭐", "그거 뭐",
        "그걸로", "이걸로", "그것으로", "이것으로",  # "좋아 그걸로 결제" 패턴
    )
    if any(ref in last_message for ref in _CONTEXT_REF_WORDS):
        prev_domain = last_bot_domain(state["messages"])
        if prev_domain:
            logger.info("[Router] 컨텍스트 참조어 감지 → %s ('%s')", prev_domain, last_message[:30])
            return [prev_domain]

    # 2. 키워드 선제 라우팅 (LLM 오판 방지) — 복수 매칭 지원
    forced = force_routes(last_message)
    if forced:
        logger.info("[Router] 키워드 매칭 → %s ('%s')", forced, last_message[:40])
        return forced

    try:
        llm = get_llm()
        chat_model = llm.get_chat_model(temperature=0)

        prompt = [SystemMessage(content=ROUTER_SYSTEM_PROMPT)]
        
        # 직전 봇 메시지가 있다면 문맥 파악을 위해 추가
        prev_ai = next(
            (m.content for m in reversed(state["messages"][:-1]) if isinstance(m, AIMessage)), 
            None
        )
        if prev_ai:
            prompt.append(AIMessage(content=prev_ai))
            
        prompt.append(HumanMessage(content=last_message))

        response = await chat_model.ainvoke(prompt)

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
        result["pending_actions"] = out.actions
    if skip_synthesis:
        result["skip_synthesis"] = True
    return result


def _agent_error_response(domain_label: str) -> dict:
    """에이전트 호출 실패 시 통일된 에러 응답을 생성합니다.

    [AGENT_ERROR] 접두사를 붙여서 Synthesizer가 부분 실패를 인식하고
    성공한 다른 에이전트 결과를 우선 활용할 수 있도록 합니다.
    """
    logger.exception("[Orchestrator] %s 에이전트 호출 실패", domain_label)
    return {
        "messages": [AIMessage(
            content=f"[AGENT_ERROR:{domain_label}] 일부 실시간 {domain_label} 데이터 연결이 원활하지 않습니다."
        )]
    }


async def call_balance_agent(state: AgentState):
    """Balance Agent — 가격·수익·시장 분석."""
    try:
        agent = get_balance_agent()
        # 경제 분석 맥락 메타데이터 주입
        response = await agent.ainvoke({**state, "current_focus": "economic_analysis"})
        return _agent_node_response(response["messages"], state)
    except Exception:
        return _agent_error_response("수급 분석")


async def call_farm_agent(state: AgentState):
    """Farm Agent — 농장 상태·재배 이력·날씨."""
    try:
        farm_id = state.get("farm_id", 0)
        agent = get_farm_agent(farm_id)
        response = await agent.ainvoke(state)
        return _agent_node_response(response["messages"], state)
    except Exception as e:
        logger.exception(f"[Farm Agent Error] {e}")
        return _agent_error_response("농장 데이터 조회")


async def call_policy_agent(state: AgentState):
    """Policy Agent — 보조금·지원금·정책."""
    try:
        agent = get_policy_agent(state.get("analysis_context"))
        response = await agent.ainvoke({"messages": state["messages"]})
        return _agent_node_response(response["messages"], state)
    except Exception:
        return _agent_error_response("정책 검색")

# 자연어 attribute 추출(_extract_product_attrs)은 app.agents.shared.nl_extract 로 이동.
# 도메인 fallback에서 `extract_product_attrs(text)` 함수를 직접 사용한다.


# ── shop_agent LLM 실패 시 키워드 → 도구 직접 호출 fallback ──
# Gemini가 짧은/복잡한 user 메시지에 종종 빈 AIMessage(tool_calls 없음)를 반환하는
# 알려진 동작에 대한 안전망. 매칭 안되면 None 반환.
async def _shop_keyword_fallback(
    user_message: str,
    all_msgs: list | None = None,
) -> tuple[str, list[dict]] | None:
    from app.agents.tools.shop_tools import (  # noqa: PLC0415
        list_shop_menu, navigate_to, clarify_crop_register, autofill_product_info,
        get_my_cart, cancel_order, get_product_detail, buy_selected_from_cart,
        update_product, delete_product, change_product_status, update_seller_order_status,
        list_my_products, list_my_orders, get_my_product_status,
        update_cart_qty, remove_from_cart, track_my_order,
    )

    lower = user_message.lower()

    # ── 0순위: '작물 등록' 모호성 — 항상 가장 먼저 체크 ──
    crop_register_kws = ("작물 등록", "작물등록", "작물 등록할", "작물등록할",
                         "심을 거 등록", "심을거 등록")
    if any(kw in lower for kw in crop_register_kws):
        result = await clarify_crop_register.ainvoke({})
        return split_actions(result)

    # ── 0.5순위: 내 판매 상품 목록 / 내 주문 내역 조회 ──
    # "내가 상품 뭐 등록했지?", "내 판매 상품 뭐있어?" 등 — menu_kws(장터 전체) 보다 반드시 앞에.
    my_products_kws = (
        "내가 등록한", "내가 올린", "내가 판매", "내가 팔고",
        "등록했지", "등록했어", "뭐 등록", "뭐등록",
        "등록한 상품", "등록한상품",
        "등록한게", "등록한 게", "등록한건", "등록한 건",   # "등록한게 뭐냐고" 패턴
        "내 판매 상품", "내판매상품", "내 등록 상품", "내등록상품",
        "내 상품 뭐", "내상품뭐", "내 상품 목록", "내상품목록",
        "판매중인 상품 뭐", "내가 뭐 팔",
        # "나 지금 뭐팔고있지?", "내가 뭐팔고있어?" 패턴 — menu_kws "팔고있" 보다 먼저 체크
        "뭐팔고있지", "뭐 팔고있지", "뭐팔고있어", "뭐 팔고있어",
        "나 뭐팔", "나 지금 뭐팔", "내가 뭐팔",
    )
    # 조합 패턴: ("나"/"내가") + ("팔고"/"팔아"/"팔고있") → 내 판매 상품 목록
    _is_my_selling = (
        ("나 " in lower or "내가 " in lower or lower.startswith("나ㅣ") or "나지금" in lower)
        and any(v in lower for v in ("팔고있", "팔고 있", "팔고있지", "팔아", "팔고있어"))
    )
    if any(kw in lower for kw in my_products_kws) or _is_my_selling:
        logger.info("[ShopFallback] list_my_products: '%s'", user_message[:40])
        result = await list_my_products.ainvoke({})
        return split_actions(result)

    my_orders_kws = (
        "내가 주문한", "내 주문 뭐", "내주문뭐", "주문했지", "주문했어",
        "뭐 주문했", "뭐주문했", "주문 내역 뭐", "내 주문 목록",
    )
    if any(kw in lower for kw in my_orders_kws):
        logger.info("[ShopFallback] list_my_orders: '%s'", user_message[:40])
        result = await list_my_orders.ainvoke({})
        return split_actions(result)

    # ── 0.7순위: 내 상품 상태/정보 조회 ──
    # "배추 팔수있어?", "딸기 상태 어때?", "딸기 가격이랑 재고 몇에 올렸어?" 등
    # 본인 등록 상품의 상태·가격·재고·판매량을 묻는 패턴 — 공개 장터 검색 전에 반드시 체크.
    # (공개 API는 검수중(PENDING) 상품을 반환하지 않아 "못찾았어요" 오류 발생)
    my_product_status_kws = (
        "팔수있", "팔 수 있", "판매가능", "판매 가능",
        "팔아도 돼", "팔아도돼", "팔수있어", "팔수있나", "팔수있는거야",
        "팔수있는건가", "팔 수있어", "팔 수있나",
        "검수중인지", "검수 중인지", "검수 완료", "검수됐어", "검수됐나",
        "상태가 어때", "상태어때", "상태 어때", "상태 알려", "현재 상태",
        "몇개팔려", "몇 개 팔려", "얼마나 팔려", "팔려써", "팔렸어", "몇개팔렸",
        "얼마에 올렸", "몇에 올렸", "얼마로 올렸", "몇으로 올렸",
        "내가 설정한", "설정한 가격", "설정한 재고",
    )
    # 비연속 조합 패턴: "올렸고/올렸어" + "가격/재고" → 내 상품 정보 조회
    _is_my_product_info = (
        any(v in lower for v in ("올렸고", "올렸어", "올렸는지", "올렸냐", "설정했", "등록했어요"))
        and any(kw in lower for kw in ("가격", "재고", "상품"))
    )
    if any(kw in lower for kw in my_product_status_kws) or _is_my_product_info:
        attrs = extract_product_attrs(user_message)
        product_name = attrs.get("product_name")
        if product_name:
            logger.info("[ShopFallback] get_my_product_status: name=%s", product_name)
            result = await get_my_product_status.ainvoke({"product_name": product_name})
            return split_actions(result)
        else:
            # 상품명 없으면 전체 목록 반환
            logger.info("[ShopFallback] get_my_product_status: 상품명 미지정 → list_my_products")
            result = await list_my_products.ainvoke({})
            return split_actions(result)

    # ── 1순위: 장바구니 조회 ──
    # "뭐있어", "보여줘" 같은 일반 조회 키워드보다 반드시 먼저 체크해야 함.
    # "장바구니에 뭐있어?" → list_shop_menu 가 아닌 get_my_cart 호출.
    cart_inquiry_kws = ("장바구니에 뭐", "장바구니 뭐", "장바구니 확인", "장바구니 조회",
                        "내 장바구니", "장바구니 보여", "장바구니에 있", "장바구니 있")
    if any(kw in lower for kw in cart_inquiry_kws):
        result = await get_my_cart.ainvoke({})
        return split_actions(result)

    # ── 1.2순위: 장바구니 항목 삭제 ──
    # "장바구니에서 배추 빼줘", "사과 장바구니에서 지워줘" 등.
    import re as _re_cart
    # 단순 노이즈 단어 (상품명이 아닌 일반 명사)
    _CART_NOISE_WORDS = ("장바구니의", "장바구니에서", "장바구니에", "장바구니",
                          "지금", "그니까", "그러니까", "아 ", " 아", "이제", "좀", "다시",
                          "물량", "수량", "재고", "개수")
    # 1글자 상품명 동작 동사
    _CART_VERBS = ("빼", "지워", "삭제", "바꿔", "수정", "변경", "늘려", "줄여",
                    "올려", "내려", "담아", "추가", "넣어")

    async def _extract_product_in_cart_context(msg: str) -> str | None:
        """장바구니 컨텍스트 메시지에서 상품명 추출.
        1) 노이즈 단어 제거 후 표준 추출 시도
        2) 실패하면 1글자 한글 단어를 잡되, 실제 장바구니 항목과 매칭 확인"""
        cleaned = msg
        for noise in _CART_NOISE_WORDS:
            cleaned = cleaned.replace(noise, " ")
        cleaned = _re_cart.sub(r"\s+", " ", cleaned).strip()
        # 1차: 표준 추출 (2글자 이상)
        name = extract_product_attrs(cleaned).get("product_name")
        if name:
            return name
        # 2차: 1글자 한글 후보들을 추출하여 실제 장바구니와 매칭
        candidates = _re_cart.findall(r"[가-힣]+", cleaned)
        # 동사·숫자·노이즈가 아닌 1-2글자 후보
        candidates = [c for c in candidates
                      if c and not any(v in c for v in _CART_VERBS)
                      and c not in ("개로", "개", "그래", "응", "맞아")]
        if not candidates:
            return None
        # 장바구니에서 실제로 매칭되는 후보 찾기
        try:
            from app.utils.backend_client import call_backend as _cb, BackendError as _BE  # noqa: PLC0415
            cart_data = await _cb("GET", "/api/shop/cart")
            cart_items = cart_data if isinstance(cart_data, list) else (cart_data.get("data") or [])
        except Exception:
            cart_items = []
        for cand in candidates:
            for item in cart_items:
                pname = (item.get("product") or {}).get("name", "") or ""
                if cand in pname:
                    return cand
        # 최후 fallback: 첫 후보 반환 (1글자라도)
        return candidates[0] if candidates else None

    cart_remove_kws = ("장바구니에서 빼", "장바구니에서 지워", "장바구니에서 삭제",
                       "장바구니 빼", "장바구니 지워", "장바구니 삭제")
    _is_cart_remove = (
        any(kw in lower for kw in cart_remove_kws) or
        ("장바구니" in lower and any(v in lower for v in ("빼줘", "빼 줘", "지워", "삭제")))
    )
    if _is_cart_remove:
        product_name = await _extract_product_in_cart_context(user_message)
        if not product_name:
            return ("어떤 상품을 장바구니에서 빼드릴까요?\n예) '장바구니에서 배추 빼줘'", [])
        logger.info("[ShopFallback] remove_from_cart: name=%s", product_name)
        result = await remove_from_cart.ainvoke({"product_name": product_name})
        return split_actions(result)

    # ── 1.3순위: 장바구니 수량 변경 ──
    # "배추 장바구니 3개로 바꿔줘", "장바구니에서 사과 5개로 늘려줘" 등.
    _is_cart_qty_update = (
        "장바구니" in lower
        and any(v in lower for v in ("바꿔", "수정", "변경", "늘려", "줄여", "올려", "내려"))
        and "개" in lower
    )
    if _is_cart_qty_update:
        product_name = await _extract_product_in_cart_context(user_message)
        # 수량은 원본 메시지에서 추출 (장바구니 제거 후에도 "N개"는 남음)
        from app.agents.shared.nl_extract import extract_stock as _ext_stock  # noqa: PLC0415
        stock = _ext_stock(user_message)
        if not product_name:
            return ("어떤 상품 수량을 바꿀까요?\n예) '배추 장바구니 3개로 바꿔줘'", [])
        if stock is None:
            return (
                f"'{product_name}' 장바구니 수량을 몇 개로 바꿀까요?\n"
                f"예) '{product_name} 장바구니 3개로 바꿔줘'",
                [],
            )
        logger.info("[ShopFallback] update_cart_qty: name=%s, qty=%s", product_name, stock)
        result = await update_cart_qty.ainvoke({"product_name": product_name, "quantity": stock})
        return split_actions(result)

    # ── 1.5순위: 장바구니에서 선택 상품만 결제 ──
    # "거기서 쌀이랑 감자만 주문해줘" 처럼 직전 장바구니 조회 후 일부만 선택 결제하는 패턴.
    # 반드시 cart_inquiry_kws(장바구니 조회)보다 뒤, menu_kws(전체 메뉴)보다 앞에 위치.
    select_buy_kws = ("거기서", "그중에", "그 중에", "중에서", "거기에서", "그것들 중",
                      "만 주문", "만 결제", "만 사", "만 구매", "만 담아")
    select_buy_connectors = ("이랑", "랑", "하고", "그리고", "과", "와")
    # "~만 주문/결제" + 접속사(이랑·랑·하고 등)가 있거나 "거기서/그중에" 패턴이면 선택 결제
    has_select_buy = (
        any(kw in lower for kw in select_buy_kws) or
        (any(conn in lower for conn in select_buy_connectors) and
         any(kw in lower for kw in ("주문", "결제", "구매", "사줘")))
    )
    if has_select_buy:
        # 사용자 메시지에서 상품명 부분 추출: "거기서 쌀이랑 감자만 주문해줘" → "쌀이랑 감자"
        import re as _re
        # "거기서/그중에 + 상품명들 + 만/을/를 + 동사" 패턴에서 상품명 추출
        m = _re.search(
            r"(?:거기서|그중에|그 중에|중에서|거기에서|장바구니에서|장바구니에서)\s*(.+?)(?:만|을|를)?\s*(?:주문|결제|구매|사줘|사줄|주문해|결제해)",
            lower
        )
        if not m:
            # fallback: 조사/동사 제거 후 전체에서 추출
            raw = _re.sub(r"(거기서|그중에|그 중에|중에서|거기에서|장바구니에서|만 주문해줘|만 결제해줘|만 사줘|주문해줘|결제해줘|해줘|줘)", "", lower).strip()
            keywords_for_tool = raw if raw else user_message
        else:
            keywords_for_tool = m.group(1).strip()
        logger.info("[ShopFallback] buy_selected_from_cart: keywords=%r", keywords_for_tool)
        result = await buy_selected_from_cart.ainvoke({"keywords": keywords_for_tool})
        return split_actions(result)

    # ── 1.8순위: 판매자 주문 상태 변경 ──
    seller_order_action_kws = (
        "접수 확인", "접수확인", "주문 접수", "주문접수",
        "발송 처리", "발송처리", "발송 완료", "배송 시작", "배송시작",
        "주문 거절", "주문거절", "거절해줘", "거절 처리",
    )
    if any(kw in lower for kw in seller_order_action_kws):
        import re as _re
        m = _re.search(r"ord-\d+-[a-z0-9]+", lower)
        order_num = m.group(0).upper() if m else None
        if any(kw in lower for kw in ("거절", "거절해", "거절처리", "주문 거절", "주문거절")):
            api_action = "cancel"
        elif any(kw in lower for kw in ("발송", "배송 시작", "배송시작")):
            api_action = "ship"
        else:
            api_action = "advance"
        args: dict = {"action": api_action}
        if order_num:
            args["order_number"] = order_num
        logger.info("[ShopFallback] update_seller_order_status: %s", args)
        result = await update_seller_order_status.ainvoke(args)
        return split_actions(result)

    # ── 1.9순위: 판매자 상품 수정/삭제/상태변경 ──
    # "가격 바꿔", "재고 수정", "숨김 처리" 등 — 반드시 메뉴/목록 체크보다 먼저.
    product_manage_kws = (
        "가격 바꿔", "가격 변경", "가격 수정", "가격을 바꿔", "가격으로 바꿔",
        "재고 바꿔", "재고 변경", "재고 수정", "재고를 바꿔", "재고로 바꿔",
        "상품 수정", "숨김 처리", "숨기기", "판매중으로", "다시 판매", "품절 처리",
    )
    product_delete_kws = ("상품 삭제", "상품 지워", "상품 지워줘", "삭제해줘", "삭제 해줘")

    # 비연속 패턴: "배추 재고 15개로 바꿔줘" — 연속 키워드엔 안 걸리지만 의미는 수정
    _change_verbs = ("바꿔", "수정해", "변경해", "올려", "내려", "낮춰", "높여", "바꾸", "수정")
    _has_field_update = (
        ("재고" in lower and any(v in lower for v in _change_verbs))
        or ("가격" in lower and any(v in lower for v in _change_verbs))
        or (("설명" in lower or "상품설명" in lower) and any(v in lower for v in _change_verbs))
        or any(kw in lower for kw in ("개로 바꿔", "원으로 바꿔", "개로 수정", "원으로 수정",
                                       "개로 변경", "원으로 변경"))
    )

    if any(kw in lower for kw in product_delete_kws):
        attrs = extract_product_attrs(user_message)
        product_name = attrs.get("product_name") or user_message
        logger.info("[ShopFallback] delete_product: name=%s", product_name)
        result = await delete_product.ainvoke({"product_name": product_name})
        return split_actions(result)

    if any(kw in lower for kw in product_manage_kws) or _has_field_update:
        attrs = extract_product_attrs(user_message)
        product_name = attrs.pop("product_name", None)

        # ── 상품명 추출 실패 → 재질문 ──
        if not product_name:
            if "재고" in lower:
                return ("재고를 바꿀 상품명을 알려주세요.\n예) '배추 재고 20개로 바꿔줘'", [])
            if "가격" in lower:
                return ("가격을 바꿀 상품명을 알려주세요.\n예) '토마토 가격 8000원으로 바꿔줘'", [])
            return ("수정할 상품명을 함께 말씀해 주세요.\n예) '배추 가격 5000원으로 바꿔줘'", [])

        # status 변경인지 field 수정인지 판단
        if any(kw in lower for kw in ("숨김", "숨기기")):
            result = await change_product_status.ainvoke({"product_name": product_name, "status": "INACTIVE"})
        elif any(kw in lower for kw in ("판매중으로", "다시 판매", "판매 중으로")):
            result = await change_product_status.ainvoke({"product_name": product_name, "status": "ACTIVE"})
        elif "품절" in lower:
            result = await change_product_status.ainvoke({"product_name": product_name, "status": "SOLDOUT"})
        else:
            import re as _re
            # 설명 변경: 따옴표 또는 "로 바꿔" 앞 텍스트에서 추출
            _desc_value: str | None = None
            if "설명" in lower and any(v in lower for v in _change_verbs):
                _quoted = _re.search(r'["\'""](.+?)["\'""]', user_message)
                if _quoted:
                    _desc_value = _quoted.group(1)
                else:
                    # 따옴표 없으면 "설명을 X로" / "설명 X로" 패턴 시도
                    _m = _re.search(r'설명\s*(?:을|을\s+)?\s*(.+?)(?:\s*로\s*바꿔|\s*로\s*수정|\s*로\s*변경|$)', user_message)
                    if _m:
                        _desc_value = _m.group(1).strip()

            # 가격/재고 수정 — 값이 누락되면 재질문
            if "재고" in lower and "stock" not in attrs:
                return (
                    f"'{product_name}' 재고를 몇 개로 바꿔드릴까요?\n"
                    f"예) '{product_name} 재고 20개로 바꿔줘'",
                    [],
                )
            if "가격" in lower and "price" not in attrs:
                return (
                    f"'{product_name}' 가격을 얼마로 바꿔드릴까요?\n"
                    f"예) '{product_name} 가격 8000원으로 바꿔줘'",
                    [],
                )
            if "설명" in lower and any(v in lower for v in _change_verbs) and not _desc_value:
                return (
                    f"'{product_name}' 상품 설명을 어떻게 바꿔드릴까요?\n"
                    f"예) '{product_name} 상품 설명을 \"새로운 설명\"으로 바꿔줘'",
                    [],
                )
            if "stock" not in attrs and "price" not in attrs and not _desc_value:
                return (
                    f"'{product_name}' 상품의 어떤 정보를 수정할까요?\n"
                    "• 가격: '[상품명] 가격 [금액]원으로 바꿔줘'\n"
                    "• 재고: '[상품명] 재고 [수량]개로 바꿔줘'\n"
                    "• 설명: '[상품명] 상품 설명을 \"새 설명\"으로 바꿔줘'",
                    [],
                )
            invoke_args: dict = {"product_name": product_name}
            if "price" in attrs: invoke_args["price"] = attrs["price"]
            if "stock" in attrs: invoke_args["stock"] = attrs["stock"]
            if _desc_value: invoke_args["description"] = _desc_value
            logger.info("[ShopFallback] update_product: %s", invoke_args)
            result = await update_product.ainvoke(invoke_args)
        return split_actions(result)

    # ── 1.95순위: 배송 추적 조회 ──
    # "배송 어디까지 왔어?", "딸기 배송 조회", "ORD-XXX 배송 현황" 등.
    tracking_kws = ("배송 조회", "배송조회", "배송 추적", "배송추적", "배송 어디",
                    "배송 현황", "어디까지 왔", "어디까지왔", "택배 어디", "송장 조회")
    if any(kw in lower for kw in tracking_kws):
        import re as _re
        m = _re.search(r"ord-\d+-[a-z0-9]+", lower)
        order_num = m.group(0).upper() if m else None
        # 상품명 추출 (주문번호 없을 때만)
        kw_extract = None
        if not order_num:
            attrs = extract_product_attrs(user_message)
            kw_extract = attrs.get("product_name")
        args = {}
        if order_num: args["order_number"] = order_num
        if kw_extract: args["keyword"] = kw_extract
        logger.info("[ShopFallback] track_my_order: %s", args)
        result = await track_my_order.ainvoke(args)
        return split_actions(result)

    # ── 2순위: 주문 취소 ──
    cancel_kws = ("주문 취소", "주문취소", "취소해줘", "취소해 줘", "취소할래", "취소할게",
                  "취소 해줘", "취소하고 싶", "취소해달라고", "취소한다니까")
    if any(kw in lower for kw in cancel_kws) or (("주문" in lower or "상품" in lower) and "취소" in lower):
        import re as _re
        m = _re.search(r"ord-\d+-[a-z0-9]+", lower)
        order_num = m.group(0).upper() if m else None
        
        # 키워드 추출 시도 (취소와 무관한 단어들 제거)
        kw_extract = lower
        for k in cancel_kws:
            kw_extract = kw_extract.replace(k, "")
        kw_extract = kw_extract.replace("아니", "").replace("주문", "").replace("상품", "").replace("해줘", "").strip()
        
        logger.info("[ShopFallback] cancel_order: order_number=%s, keyword=%s", order_num, kw_extract)
        
        args = {}
        if order_num: args["order_number"] = order_num
        elif kw_extract: args["keyword"] = kw_extract
            
        result = await cancel_order.ainvoke(args)
        return split_actions(result)

    # ── 3순위: 상품 상세 조회 ──
    detail_kws = ("상세 보여", "상세보여", "상세 정보", "상세정보", "상품 정보", "상품정보",
                  "상세 알려", "상세알려", "상세 조회", "상세보기",
                  "상세설명", "상세 설명", "상세화면", "상세 화면", "상세페이지", "상세 페이지")
    if any(kw in lower for kw in detail_kws):
        attrs = extract_product_attrs(user_message)
        product_name = attrs.get("product_name")
        result = await get_product_detail.ainvoke(
            {"product_name": product_name} if product_name else {}
        )
        return split_actions(result)

    # ── 4순위: 상품 자동 채우기 ──
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

    # ── 5순위: 장터 메뉴/상품 목록 ──
    # ⚠️ 반드시 장바구니 체크(1순위) 이후에 위치해야 함.
    #    "장바구니에 뭐있어"의 "뭐있어" 가 여기서 걸리면 안 됨.
    menu_kws = ("메뉴", "뭐있어", "뭐 있어", "뭐가 있", "뭐가있", "뭐 있었", "뭐있었",
                "뭐 팔", "뭐팔", "보여줘", "보여 줘",
                "어떤 상품", "상품 목록", "상품뭐", "뭐있냐", "뭐 있냐", "뭐가 있냐",
                "있었지", "팔고있", "팔고 있", "팔아")
    if any(kw in lower for kw in menu_kws):
        result = await list_shop_menu.ainvoke({})
        return split_actions(result)

    # ── 6순위: 페이지 이동 ──
    nav_map = [
        (("장바구니",), "cart"),
        (("내 주문", "내주문", "주문 내역", "주문내역"), "my_orders"),
        (("상품 등록", "상품등록", "판매 등록", "판매등록"), "seller_register"),
        (("내 상품", "내상품", "등록한 상품", "판매중인 상품"), "seller_products"),
        (("판매 주문", "판매주문", "들어온 주문"), "seller_orders"),
        (("장터", "쇼핑", "상점"), "shop_home"),
    ]
    for kws, target in nav_map:
        # "상품 등록"이 nav 키워드이지만, "상품 등록한게 뭐야" 처럼 조회 의도가 있는 경우 제외
        # (0.5순위에서 my_products_kws로 이미 처리됐어야 하지만 혹시 통과했을 때 방어)
        if target == "seller_register" and any(
            exc in lower for exc in ("등록한게", "등록한 게", "등록했지", "등록했어", "등록한거", "등록한 거")
        ):
            continue
        if any(kw in lower for kw in kws):
            result = await navigate_to.ainvoke({"target": target})
            return split_actions(result)

    # ── CLARIFY 후속 처리 ──
    if "장터에 판매 상품으로 등록" in user_message or "shop_product" in lower:
        result = await navigate_to.ainvoke({"target": "seller_register"})
        return split_actions(result)
    if "내 농장에 작물 등록" in user_message or "farm_crop" in lower:
        from app.agents.tools.guidance_tools import guide_to_farm_register
        result = await guide_to_farm_register.ainvoke({})
        return split_actions(result)

    # ── 멀티턴 컨텍스트 감지 ──
    # Gemini가 "진짜 절라게 맛있는 토매로우 말하는거야" 같은 명확화 메시지에 빈 응답을 낼 때,
    # 이전 AI 메시지에서 pending 의도를 추론해 현재 메시지를 상품명으로 사용한다.
    if all_msgs:
        pending_intent = _detect_pending_seller_intent(all_msgs)
        if pending_intent:
            # 현재 메시지를 상품명으로 사용 (조사/동사 후처리)
            import re as _re
            product_name_guess = _re.sub(
                r"(말하는거야|말하는 거야|말하는거|거야|이야|이잖아|잖아|인데|말이야|그거야|그걸|그걸로|해줘|삭제|수정|바꿔|변경)$",
                "", user_message.strip()
            ).strip()
            if len(product_name_guess) >= 2:
                logger.info(
                    "[ShopFallback] 멀티턴 컨텍스트 감지: intent=%s, product_name=%r",
                    pending_intent, product_name_guess,
                )
                if pending_intent == "product_delete":
                    result = await delete_product.ainvoke({"product_name": product_name_guess})
                    return split_actions(result)
                elif pending_intent == "product_update":
                    result = await update_product.ainvoke({"product_name": product_name_guess})
                    return split_actions(result)
                elif pending_intent == "product_status":
                    # 상태 변경은 어떤 상태로 바꿀지 모르므로 수정 페이지로 안내
                    result = await update_product.ainvoke({"product_name": product_name_guess})
                    return split_actions(result)
                elif pending_intent == "seller_order":
                    result = await update_seller_order_status.ainvoke({"order_number": product_name_guess})
                    return split_actions(result)

    # ── 최종: 완전히 매칭 안 됐을 때 → 의도 추론 기반 안내 반환 ──
    # None 대신 도움말 문구를 반환해 프론트가 "요청하신 작업을 처리했어요." 를 보이지 않도록 한다.
    hint = _guess_shop_intent_hint(lower)
    if hint:
        logger.info("[ShopFallback] 의도 추론 안내: %r", hint[:60])
        return (hint, [])

    return None


def _guess_shop_intent_hint(lower: str) -> str | None:
    """키워드 fallback 완전 미매칭 시 사용자 의도를 추론해 재시도 안내 문구 반환.

    Returns:
        사용자에게 보낼 안내 문자열 or None (완전히 모르는 경우)
    """
    change_verbs = ("바꿔", "수정", "변경", "바꿔줘", "수정해줘", "고쳐", "올려", "내려")
    has_change = any(v in lower for v in change_verbs)

    # 재고 수정 의도 — 수량 누락
    if has_change and "재고" in lower:
        return (
            "재고를 바꾸시려면 상품명과 수량을 함께 알려주세요.\n"
            "예) '배추 재고 20개로 바꿔줘'"
        )
    # 가격 수정 의도 — 금액 누락
    if has_change and "가격" in lower:
        return (
            "가격을 바꾸시려면 상품명과 금액을 함께 알려주세요.\n"
            "예) '토마토 가격 8000원으로 바꿔줘'"
        )
    # 수정 의도이지만 대상 불명
    if has_change:
        return (
            "어떤 상품의 어떤 정보를 바꿀지 알려주세요.\n"
            "예) '배추 가격 5000원으로 바꿔줘' / '토마토 재고 30개로 바꿔줘'"
        )
    # 삭제 의도
    if any(v in lower for v in ("삭제", "지워", "없애")):
        return (
            "삭제하실 상품명을 함께 말씀해 주세요.\n"
            "예) '배추 상품 삭제해줘'"
        )
    # 주문 취소 의도
    if "취소" in lower:
        return (
            "취소하실 상품명 또는 주문번호를 함께 말씀해 주세요.\n"
            "예) '딸기 주문 취소해줘' / 'ORD-001 취소해줘'"
        )
    # 내 판매 상품 조회 의도
    if any(v in lower for v in ("등록", "팔고", "판매중", "내 상품", "내상품")):
        return (
            "내가 등록한 판매 상품 목록을 보시려면 이렇게 말씀해 주세요.\n"
            "예) '내가 등록한 상품 보여줘' / '내 판매 상품 목록'"
        )
    # 검색 의도
    if any(v in lower for v in ("검색", "찾아", "알려", "있어")):
        return (
            "찾으시는 상품명을 말씀해 주세요.\n"
            "예) '사과 검색해줘' / '채소 상품 뭐있어?'"
        )
    return None


def _detect_pending_seller_intent(msgs: list) -> str | None:
    """이전 AI 메시지에서 미완료 판매자 상품/주문 의도를 추론한다.

    Returns:
        "product_delete" | "product_update" | "product_status" | "seller_order" | None
    """
    # 최근 AI 메시지 최대 3개를 역순으로 검사
    ai_contents = [
        str(m.content or "")
        for m in reversed(msgs)
        if hasattr(m, "type") and m.type == "ai"
    ][:3]

    for content in ai_contents:
        lower_c = content.lower()
        # "못 찾았어요" + 상품 목록 언급 → 직전 조작 의도 추론
        if "찾지 못했어요" in content or "찾을 수 없어요" in content or "못 찾았어요" in content:
            if "삭제" in lower_c or "delete" in lower_c:
                return "product_delete"
            if "수정" in lower_c or "update" in lower_c or "변경" in lower_c:
                return "product_update"
            if "상태" in lower_c:
                return "product_status"
            # 키워드 없어도 상품 목록이 언급됐으면 상품 관련 의도 존재
            if "등록 상품" in content or "상품명" in content:
                return "product_delete"  # 가장 흔한 케이스를 기본값으로
        # 주문 관련 미완료
        if ("못 찾았어요" in content or "찾지 못했어요" in content) and "주문" in lower_c:
            return "seller_order"

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

        # 마지막 사용자 메시지 — fallback 및 최종 안내 문구 생성에 공통 사용
        last_human = next(
            (m for m in reversed(all_msgs) if isinstance(m, HumanMessage)), None
        )

        # ② LLM이 본문도 도구도 비웠으면 → 키워드 fallback
        if not cleaned and not merged_actions:
            if last_human and last_human.content:
                logger.info("[ShopAgent] LLM 빈 응답 → 키워드 fallback: '%s'", last_human.content[:40])
                fallback = await _shop_keyword_fallback(last_human.content, all_msgs=all_msgs)
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

        # ③ 최종 fallback — 아무것도 매칭/처리 안 됐을 때 의미 있는 안내
        if not cleaned:
            raw_req = (last_human.content if last_human and last_human.content else "").strip()
            hint = _guess_shop_intent_hint(raw_req.lower()) if raw_req else None
            if hint:
                cleaned = hint
            else:
                preview = raw_req[:20] + ("…" if len(raw_req) > 20 else "")
                cleaned = (
                    f"'{preview}' 요청을 이해하지 못했어요. 아래처럼 말씀해 주시면 바로 도와드릴게요.\n\n"
                    "• 상품 재고 수정: '배추 재고 20개로 바꿔줘'\n"
                    "• 상품 가격 수정: '토마토 가격 8000원으로 바꿔줘'\n"
                    "• 상품 삭제: '감자 상품 삭제해줘'\n"
                    "• 장바구니 확인: '내 장바구니 보여줘'\n"
                    "• 주문 취소: '딸기 주문 취소해줘'"
                )
            logger.warning("[ShopAgent] fallback 미매칭 — 안내 응답 반환: '%s'", cleaned[:60])

        logger.info("[ShopAgent] 최종 reply='%s', actions=%s",
                    cleaned[:80], [a.get("type") for a in merged_actions])

        return {
            "messages": [AIMessage(content=cleaned)],
            "pending_actions": merged_actions,
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
        return _agent_error_response("커뮤니티 검색")


async def call_blocked_guard(state: AgentState):
    """행정 전용/개인정보 데이터 접근 차단."""
    msg = "해당 내용은 지자체 전용 화면에서 확인해야 하는 정보입니다. 공개 챗봇에서는 지역 단위 수급 현황만 안내할 수 있습니다."
    return {"messages": [AIMessage(content=msg)]}


async def call_gov_agent(state: AgentState):
    """Gov Agent — 지역 수급·위험도 분석."""
    try:
        result = await gov_agent_ainvoke({
            "messages": state["messages"],
            "user_role": state.get("user_role"),
        })
        return _agent_node_response(result["messages"], state)
    except Exception:
        return _agent_error_response("지역 수급 분석")


async def call_general_agent(state: AgentState):
    """General Agent (농업 컨설턴트) 호출"""
    try:
        agent = get_general_agent()
        response = await agent.ainvoke({"messages": state["messages"]})
        return _agent_node_response(response["messages"], state)
    except Exception:
        return _agent_error_response("일반 상담")


async def call_guidance_agent(state: AgentState):
    """Guidance Agent — 추천·재배·농장 화면 유도."""
    try:
        agent = get_guidance_agent()
        response = await agent.ainvoke({"messages": state["messages"]})
        return _agent_node_response(
            response["messages"],
            state,
            skip_synthesis=True,
            default_text="농장 안내를 준비하지 못했어요. 잠시 후 다시 시도해 주세요.",
        )
    except Exception:
        logger.exception("[Orchestrator] GuidanceAgent call failed")
        return {
            "messages": [AIMessage(content="농장 안내 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")],
            "skip_synthesis": True,
        }


async def call_recommend_agent(state: AgentState):
    """Recommend Agent — 최신 AI 작물 추천 결과 조회·해석."""
    try:
        agent = get_recommend_agent()
        response = await agent.ainvoke({"messages": state["messages"]})
        result = _agent_node_response(
            response["messages"],
            state,
            skip_synthesis=True,
            default_text="추천 결과를 불러오지 못했어요. AI 작물 추천 화면에서 분석을 실행했는지 확인해 주세요.",
        )
        
        # 추천 결과에서 작물명 추출 → analysis_context에 저장
        text = result["messages"][-1].content if result.get("messages") else ""
        if "1위" in text or "1등" in text or "추천 작물" in text:
            import re
            # "1위 감자", "1등 배추" 등의 패턴에서 작물명 추출
            m = re.search(r"(?:1[위등]|추천 작물(?:은|로)?)\s*([가-힣]+)", text)
            if m:
                ctx = {}
                ctx["recommended_crop"] = m.group(1)
                result["analysis_context"] = ctx
                logger.info("[RecommendAgent] Extracted recommended_crop: %s", m.group(1))
                
        return result
    except Exception:
        logger.exception("[Orchestrator] RecommendAgent call failed")
        return {
            "messages": [AIMessage(content="추천 결과 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")],
            "skip_synthesis": True,
        }


async def call_account_agent(state: AgentState):
    """Account Agent — 로그인·프로필·주문·내 활동."""
    try:
        agent = get_account_agent()
        response = await agent.ainvoke({"messages": state["messages"]})
        return _agent_node_response(
            response["messages"],
            state,
            skip_synthesis=True,
            default_text="계정 안내를 준비하지 못했어요. 잠시 후 다시 시도해 주세요.",
        )
    except Exception:
        logger.exception("[Orchestrator] AccountAgent call failed")
        return {
            "messages": [AIMessage(content="계정 안내 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")],
            "skip_synthesis": True,
        }

# ── 답변 합성 노드 (Synthesizer) ──
# Fallback/오류 응답 필터링을 위한 패턴
_FALLBACK_PATTERNS = (
    "다시 시도해", "다시 질문해", "정보를 입력해",
    "어느 지역", "어떤 지역이나 작물", "어떤 작물을 대체",
    "분석할 농장 이름을",
    "찾지 못했습니다", "일치하는 분석 근거를 찾지",
)

# [AGENT_ERROR:xxx] 접두사가 있으면 부분 실패로 판별
_AGENT_ERROR_PREFIX = "[AGENT_ERROR:"


def _is_fallback_response(text: str) -> bool:
    """에이전트가 분석 실패/엔티티 누락 시 반환하는 안내 문구인지 판별."""
    if not text or len(text.strip()) < 10:
        return True
    if text.startswith(_AGENT_ERROR_PREFIX):
        return True
    return any(p in text for p in _FALLBACK_PATTERNS)


def _extract_error_domains(messages: list) -> list[str]:
    """[AGENT_ERROR:도메인] 접두사에서 실패한 도메인명 추출."""
    domains = []
    for msg in messages:
        if hasattr(msg, 'content') and msg.content.startswith(_AGENT_ERROR_PREFIX):
            # [AGENT_ERROR:수급 분석] → "수급 분석"
            end = msg.content.find(']')
            if end > 0:
                domains.append(msg.content[len(_AGENT_ERROR_PREFIX):end])
    return domains


SYNTHESIZER_SYSTEM_PROMPT = """당신은 양평군 농업 전문 컨설턴트 매니저입니다.
여러 전문 분석팀의 조사 결과를 종합하여, 사용자에게 전문적이고 실용적인 종합 컨설팅 보고서를 작성합니다.

## 핵심 지침
1. 수집된 정보 중 "다시 시도해주세요", "정보를 입력해주세요" 등의 분석 실패 메시지가 있다면 **완전히 무시**하고, 성공한 분석 결과만 활용하세요.
2. 성공한 분석이 하나도 없으면, "현재 시스템에서 해당 조건의 데이터를 확인하지 못했습니다. 질문을 더 구체적으로(예: 작물명, 지역명 포함) 해주시면 정확한 분석을 도와드리겠습니다."라고 안내하세요.
3. 여러 도메인의 결과가 있을 때는 아래 구조로 답변을 작성하세요:
   - **첫 줄(핵심 요약)**: 가장 중요한 결론을 한두 문장으로 요약
   - **상세 분석**: 각 도메인 분석 결과를 논리적으로 연결하여 서술
4. "에이전트가 말하길..." 같은 내부 용어를 절대 사용하지 마세요. 직접 분석한 것처럼 자연스럽게 전달하세요.
5. 100% 한국어(한글)로만 답변하세요. 한자(漢字) 사용 금지.
6. 전문적이면서도 따뜻한 존댓말로 답변하세요."""

async def synthesizer_node(state: AgentState):
    """여러 에이전트의 답변을 취합하여 최종 응답을 생성합니다.

    자동 우회 조건:
      1. skip_synthesis=True 이면서 단일 에이전트인 경우만 우회
         (복수 에이전트 라우팅 시에는 반드시 종합)
      2. 단일 에이전트만 라우팅된 경우 (재가공 불필요)
    """
    routed = state.get("routed_agents", [])
    is_multi = len(routed) >= 2

    # ① 명시적 우회 요청 — 단일 에이전트일 때만 허용
    if state.get("skip_synthesis") and not is_multi:
        last_ai = next(
            (m for m in reversed(state["messages"]) if isinstance(m, AIMessage)), None
        )
        if last_ai:
            logger.info("[Synthesizer] skip_synthesis 단일(%s) → 우회", routed)
            return {"messages": [last_ai]}

    # ② 단일 에이전트 라우팅 → 재가공 없이 그대로 반환
    if not is_multi:
        last_ai = next(
            (m for m in reversed(state["messages"]) if isinstance(m, AIMessage)), None
        )
        if last_ai:
            logger.info("[Synthesizer] 단일 에이전트(%s) → 우회", routed)
            return {"messages": [last_ai]}

    logger.info("[Synthesizer] 복수 에이전트 종합 시작: %s", routed)

    try:
        llm = get_llm("gemini")
        chat_model = llm.get_chat_model(temperature=0.5)

        # 에이전트 답변 수집 및 Fallback 필터링
        all_ai_msgs = [msg for msg in state["messages"] if isinstance(msg, AIMessage)]
        valid_responses = [msg.content for msg in all_ai_msgs if not _is_fallback_response(msg.content)]
        failed_domains = _extract_error_domains(all_ai_msgs)
        failed_count = len(all_ai_msgs) - len(valid_responses)

        if failed_count > 0:
            logger.info("[Synthesizer] %d개의 Fallback 응답 필터링됨 (유효: %d개, 실패 도메인: %s)",
                        failed_count, len(valid_responses), failed_domains)

        # 유효한 응답이 하나도 없으면 안내 메시지 반환 (CTA 아닌 일반 가이드)
        if not valid_responses:
            if failed_domains:
                warning = f"현재 {', '.join(failed_domains)} 데이터 연결이 원활하지 않습니다. "
            else:
                warning = ""
            return {"messages": [AIMessage(
                content=f"{warning}질문을 더 구체적으로(예: 작물명, 지역명 포함) 해주시면 "
                        "정확한 분석을 도와드리겠습니다."
            )]}

        agent_responses = "\n\n---\n\n".join(valid_responses)

        # 부분 실패 알림 (성공한 결과는 있지만 일부 에이전트가 실패)
        partial_warning = ""
        if failed_domains:
            partial_warning = (
                f"\n\n[부분 데이터 경고]\n"
                f"다음 분야의 실시간 데이터 연결이 원활하지 않아 해당 부분은 제한적입니다: "
                f"{', '.join(failed_domains)}\n"
                f"성공한 분석 결과를 중심으로 답변을 작성하되, 데이터 제한 사항은 간단히 언급하세요."
            )

        # 공유 컨텍스트 정보를 프롬프트에 첨부
        ctx = state.get("analysis_context", {})
        ctx_summary = ""
        if ctx:
            ctx_parts = []
            if ctx.get("target_crop"):
                ctx_parts.append(f"분석 대상 작물: {ctx['target_crop']}")
            if ctx.get("active_crops"):
                ctx_parts.append(f"재배 중인 작물: {', '.join(ctx['active_crops'])}")
            if ctx.get("target_region"):
                ctx_parts.append(f"분석 대상 지역: {ctx['target_region']}")
            if ctx.get("soil_info"):
                ctx_parts.append(f"토양 정보: {ctx['soil_info']}")
            if ctx_parts:
                ctx_summary = "\n\n[공유 분석 컨텍스트]\n" + "\n".join(ctx_parts)

        # 사용자의 원본 질문 추출 (첫 번째 HumanMessage)
        user_question = next(
            (m.content for m in state["messages"] if isinstance(m, HumanMessage)), ""
        )

        prompt = [
            SystemMessage(content=SYNTHESIZER_SYSTEM_PROMPT),
            HumanMessage(content=(
                f"사용자 질문: {user_question}{ctx_summary}{partial_warning}\n\n"
                f"전문 분석팀 조사 결과 ({len(valid_responses)}건):\n{agent_responses}"
            ))
        ]

        response = await chat_model.ainvoke(prompt)
        return {"messages": [response]}

    except Exception:
        logger.exception("[Orchestrator] Synthesizer failed")
        return {"messages": [AIMessage(content="죄송합니다, 정보를 정리하는 중 오류가 발생했습니다. 다시 시도해 주세요.")]}

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
    workflow.add_node("guidance_agent", call_guidance_agent)
    workflow.add_node("recommend_agent", call_recommend_agent)
    workflow.add_node("account_agent", call_account_agent)
    workflow.add_node("synthesizer", synthesizer_node)  # 답변 합성 노드

    # 라우팅 결과를 state에 기록 + ContextResolver (farm context 선조회)
    async def router_with_tracking(state: AgentState):
        routes = await router_node(state)

        # ── ContextResolver: farm_id가 있고 컨텍스트 의존 에이전트가 라우팅된 경우 ──
        # 병렬 dispatch 전에 농장 정보를 미리 조회하여 analysis_context에 채움
        # → policy_agent, balance_agent 등이 사용자의 작물/지역을 알 수 있게 됨
        analysis_context = state.get("analysis_context") or {}
        farm_id = state.get("farm_id", 0)
        context_needed = {"policy_agent", "balance_agent", "gov_agent", "farm_agent"}

        if farm_id > 0 and not analysis_context and any(r in context_needed for r in routes):
            try:
                import httpx as _httpx
                from app.config import get_settings as _gs
                _settings = _gs()
                async with _httpx.AsyncClient(timeout=3.0) as client:
                    res = await client.get(
                        f"{_settings.BACKEND_INTERNAL_URL.rstrip('/')}/api/internal/farms/{farm_id}/agent-summary",
                        headers={
                            "X-AI-Internal-Key": _settings.AI_INTERNAL_SECRET_KEY,
                            "X-AI-User-Id": str(state.get("user_id", 0)),
                        },
                    )
                    if res.status_code == 200:
                        data = res.json().get("data", {})
                        status = data.get("farmStatus", {})
                        active_crops = status.get("activeCrops", [])
                        if active_crops:
                            analysis_context["target_crop"] = active_crops[0]
                            analysis_context["active_crops"] = active_crops
                        analysis_context["farm_name"] = status.get("name", "")
                        analysis_context["target_region"] = "양평군"
                        logger.info("[ContextResolver] farm_id=%s → crops=%s", farm_id, active_crops)
            except Exception as e:
                logger.warning("[ContextResolver] farm context 조회 실패: %s", e)

        return {"routed_agents": routes, "analysis_context": analysis_context}

    workflow.add_node("router", router_with_tracking)
    workflow.add_edge(START, "router")

    def route_dispatch(state: AgentState) -> list[str]:
        return state.get("routed_agents", ["general_chat"])

    workflow.add_conditional_edges("router", route_dispatch, {
        "blocked_guard": "blocked_guard",
        "balance_agent": "balance_agent",
        "farm_agent": "farm_agent",
        "policy_agent": "policy_agent",
        "shop_agent": "shop_agent",
        "community_agent": "community_agent",
        "gov_agent": "gov_agent",
        "guidance_agent": "guidance_agent",
        "recommend_agent": "recommend_agent",
        "account_agent": "account_agent",
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
    workflow.add_edge("guidance_agent", "synthesizer")
    workflow.add_edge("recommend_agent", "synthesizer")
    workflow.add_edge("account_agent", "synthesizer")
    workflow.add_edge("blocked_guard", "synthesizer")
    
    # 최종 답변 반환
    workflow.add_edge("synthesizer", END)

    return workflow.compile()
