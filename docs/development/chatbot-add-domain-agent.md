# 챗봇 에이전트 작업 가이드

> 챗봇 도메인 에이전트(shop / farm / balance / policy / community / gov / general)
> 를 **확장하거나 새로 만들 때** 따라야 하는 표준 절차.
> shop 도메인이 모든 패턴의 참고 템플릿입니다.

## 처리 흐름 (5초 요약)

```
사용자 메시지
  ↓
chat.py 라우터 (단일 진입점)
  ↓
orchestrator.router_node — 다음 우선순위로 도메인 결정
  ① 멀티턴 컨텍스트 — 짧은 답변("그래", "응") + 직전 봇 도메인
  ② 키워드 force routing — DOMAIN_FORCE_KEYWORDS 매칭
  ③ LLM 라우팅 — Groq로 분류
  ④ fallback — general_chat
  ↓
도메인 에이전트 (ReAct + Tools)
  ↓
@tool 함수 — 백엔드 API 호출, 결과 텍스트 + [ACTION:{...}] 토큰 반환
  ↓
call_{domain}_agent 래퍼 — extract_agent_output 으로 본문·액션 추출
  ↓
chat.py 응답 가공 — ChatResponse(reply, actions)
  ↓
프론트엔드 — 본문 표시 + 액션 디스패치 (NAVIGATE/TOAST/CLARIFY/...)
```

---

## 어떤 작업인가요?

| 하려는 작업 | 가야 할 섹션 |
|---|---|
| 기존 에이전트(shop/farm/...)에 새 도구 추가 | **PART 1** (아래 바로) |
| 기존 에이전트의 응답을 새 UI 카드로 표시 | **PART 1 §3** |
| 기존 도구 수정 (시그니처/동작 변경) | **PART 1 §7** |
| 동시 작업 충돌 방지 워크플로우 | **PART 1 §6** |
| 완전히 새로운 도메인 추가 (예: `livestock`) | **PART 2** (문서 하단) |

대부분 작업은 **PART 1**에 해당합니다. 새 도메인 추가(PART 2)는 가끔 있는 일.

---

# PART 1 — 기존 에이전트 확장하기

새 도메인을 만들지 않고 **기존 에이전트(shop / farm / balance / policy / community / gov / general)에 기능을 추가**하는 경우의 가이드.

## §1. 기존 에이전트 현황표

| 에이전트 | LLM | 구현 패턴 | 도구 추가 난이도 | 액션 출력 가능 | 비고 |
|---|---|---|---|---|---|
| `shop_agent` | gemini | ReAct + Tools | ⭐ 쉬움 | ✅ | 모범 참고 |
| `balance_agent` | gemini | ReAct + Tools | ⭐ 쉬움 | ✅ | shop과 동일 패턴 |
| `policy_agent` | gemini | ReAct + Tools | ⭐ 쉬움 | ✅ | shop과 동일 패턴 |
| `community_agent` | 기본 | ReAct + Tools | ⭐ 쉬움 | ✅ | shop과 동일 패턴 |
| `farm_agent` | 기본 | StateGraph 수동 (bind_tools) | ⭐⭐ 보통 | ✅ | tools 리스트에 추가 |
| `gov_agent` | 기본 | 클래스 기반 수동 파이프라인 | ⭐⭐⭐ 어려움 | ⚠️ | 도구 시스템 없음, 직접 처리 |
| `general_agent` | groq | StateGraph 단일 노드 + RAG | ⭐⭐ 보통 | ⚠️ | 도구 없이 LLM 응답만 |

> **모든 에이전트의 `call_xxx_agent` 래퍼는 `extract_agent_output()`을 사용**하므로,
> 도구가 `[ACTION:{...}]` 토큰을 반환하면 **자동으로 프론트에 전달**됩니다.

## §2. ReAct 기반 에이전트(shop / balance / policy / community)에 도구 추가

가장 흔한 케이스. **5분이면 끝납니다.**

### 절차

**① 도구 파일에 새 `@tool` 함수 추가**

예: `balance_agent`에 "이번 달 사과 수익 계산" 도구 추가

`ai/app/agents/tools/balance_tools.py`:
```python
from app.agents.shared import action_token, ensure_logged_in

@tool
async def get_monthly_revenue(crop_name: str, month: int) -> str:
    """특정 작물의 월별 수익(매출-비용)을 계산해 반환합니다."""
    if (msg := ensure_logged_in()):
        return msg
    try:
        data = await call_backend("GET", f"/api/revenue/monthly",
                                  params={"crop": crop_name, "month": month})
    except BackendError as e:
        return f"수익 조회 실패: {e.message}"
    return (
        f"{crop_name} {month}월 수익: {data['revenue']:,}원 "
        + action_token({"type": "NAVIGATE", "url": "/dashboard/revenue"})
    )
```

**② 에이전트에 도구 등록**

`ai/app/agents/balance_agent.py`:
```python
from app.agents.tools.balance_tools import (
    get_all_crops_balance,
    get_crop_balance_detail,
    get_crop_supply_trend,
    get_monthly_revenue,   # ← 추가
)

def get_balance_agent():
    # ...
    tools = [
        get_all_crops_balance,
        get_crop_balance_detail,
        get_crop_supply_trend,
        get_monthly_revenue,   # ← 추가
    ]
    # ...
```

**③ 시스템 프롬프트에 사용 시점 명시** (있으면 추가, 없으면 새로 작성)

```python
BALANCE_AGENT_PROMPT = """...
[도구 → 사용 시점]
- get_monthly_revenue: "사과 5월 수익 알려줘", "이번달 매출"
"""
```

**④ (선택) 라우팅 키워드 추가**

`ai/app/agents/orchestrator.py` 의 `DOMAIN_FORCE_KEYWORDS`:
```python
DOMAIN_FORCE_KEYWORDS = {
    "shop_agent": {...},
    "balance_agent": {       # ← 신규 추가하거나 기존 항목에 키워드 보강
        "수익", "매출", "이번달 수익", "월별 수익",
    },
}
```

**끝!** 래퍼는 이미 액션 자동 추출하므로 추가 작업 불필요.

### 도구 작성 체크리스트

- [ ] `@tool` 데코레이터 사용 (`langchain_core.tools`)
- [ ] **async** 함수
- [ ] docstring 첫 줄에 "언제 호출하는지" — LLM이 보고 선택
- [ ] 사용자 데이터 접근/수정 도구는 **반드시 `ensure_logged_in()`** 호출
- [ ] 백엔드 호출은 **`call_backend()`** 사용 (JWT 자동 전파)
- [ ] 응답 텍스트는 **한글만**, 한자 금지
- [ ] URL 경로(`/...`)는 **본문에 노출 금지** — `action_token()` 안에만 넣고 본문에는 "장터", "가축 페이지" 같은 한국어 라벨 사용
- [ ] 성공 메시지 앞에 `[XX 성공]` 같은 명확한 태그 — LLM이 성공/실패 구분하도록

## §3. 기존 에이전트의 응답을 새 UI 카드로 표시

예: balance_agent 응답을 "수익 카드"로 시각화

**① 액션 타입 추가** (PART 2 §5와 동일 절차)
- `ai/app/models/chat.py`: `"REVENUE_CARD"` 추가, `ChatRevenueCard` 모델
- `frontend/lib/chat-types.ts`: 미러링

**② 도구에서 액션 토큰 발행**:
```python
return (
    f"{crop_name} {month}월 수익은 {data['revenue']:,}원이에요. "
    + action_token({
        "type": "REVENUE_CARD",
        "revenue": data,
    })
)
```

**③ FarmBot.tsx에 렌더링 분기 추가** (PRODUCT_LIST 옆에):
```tsx
if (action.type === 'REVENUE_CARD' && action.revenue) {
  return <RevenueCard key={ai} data={action.revenue} />;
}
```

**④ (중요) balance_agent도 `skip_synthesis` 필요**

기본 동작은 Synthesizer가 응답을 변형합니다. 수익 같은 숫자가 변형되면 안 되므로
`call_balance_agent` 래퍼에서 `skip_synthesis=True`로 변경:

```python
async def call_balance_agent(state: AgentState):
    try:
        agent = get_balance_agent()
        response = await agent.ainvoke({**state, "current_focus": "economic_analysis"})
        return _agent_node_response(response["messages"], state, skip_synthesis=True)
        #                                                          ^^^^^^^^^^^^^^^^^^^^
    except Exception:
        # ...
```

## §4. StateGraph 패턴(farm_agent)에 도구 추가

`farm_agent`는 `create_react_agent` 대신 `bind_tools()` + 수동 StateGraph입니다.
도구 추가 자체는 동일하지만 등록 위치가 다릅니다.

```python
# ai/app/agents/farm_agent.py
from app.agents.tools.farm_tools import (
    get_farm_status, get_cultivation_history, get_farm_weather,
    get_my_pest_report,   # ← 새 도구
)

def get_farm_agent():
    llm = get_llm()
    tools = [
        get_farm_status, get_cultivation_history, get_farm_weather,
        get_my_pest_report,   # ← 추가
    ]
    llm_with_tools = llm.get_chat_model(temperature=0.1).bind_tools(tools)
    # ... StateGraph 구성은 그대로 ...
```

> `ToolNode`가 이미 모든 tools를 받으므로 그래프 수정 불필요.

## §5. general_agent 또는 gov_agent에 도구 추가

이 두 에이전트는 **현재 도구 시스템 없이 LLM 직접 호출**합니다.
도구를 추가하려면 ReAct 패턴으로 마이그레이션이 필요합니다.

**권장**: 새 도구가 필요하다면 **별도 도메인 에이전트로 분리**하세요.
예: gov_agent에 "정책 신청" 도구가 필요하다면 → `policy_agent`에 추가하거나 신규 도메인 생성(PART 2 참고).

기존 에이전트의 응답 품질 개선(프롬프트 수정 등)은 자유롭게 가능.

## §6. 충돌 방지 — 같은 파일을 여러 팀원이 수정할 때

`orchestrator.py`는 자주 충돌이 발생할 수 있는 파일입니다. 다음 위치는
주로 한 줄짜리 추가이므로 머지가 쉽지만, 동시 작업 시 주의:

| 위치 | 충돌 위험 | 해결 |
|---|---|---|
| `DOMAIN_FORCE_KEYWORDS` dict | 낮음 | 다른 key 추가는 충돌 없음 |
| `DOMAIN_CONTEXT_INDICATORS` dict | 낮음 | 동일 |
| `VALID_ROUTES` set | 낮음 | 라인 단위 머지 |
| `ROUTER_SYSTEM_PROMPT` | **중간** | 카테고리 추가 시 같은 위치 수정 가능성 |
| `get_main_orchestrator()` 그래프 노드 | 낮음 | 다른 도메인은 다른 줄 |
| 새 `call_xxx_agent` 함수 | 없음 | 새 함수 추가는 충돌 없음 |

**권장 워크플로우**:
1. 작업 전 `git pull origin stage` 으로 최신화
2. 기능 브랜치에서 작업 (`feature/livestock-agent`)
3. PR 올리기 전에 `git rebase origin/stage`
4. 충돌 시 위 표 참고 — 대부분 dict 항목 추가는 양쪽 모두 살리면 됨

## §7. 기존 도구 수정 (예: `add_to_cart` 동작 변경)

기존 도구를 수정할 때 체크할 곳:
1. **도구 함수 docstring** — 변경된 동작 반영
2. **에이전트 시스템 프롬프트** — 도구 사용 시점이 바뀌면 업데이트
3. **키워드 fallback** — `_shop_keyword_fallback` 같은 곳에서 도구를 직접 호출하면 동작 검증
4. **응답 텍스트 형식** — `[XX 성공]` 같은 태그를 제거하지 말 것 (LLM이 성공/실패 판단)

수정 후 항상 챗봇 시나리오 테스트:
- 정상 케이스
- 401 (비로그인) 케이스
- 백엔드 오류 케이스

---

# PART 2 — 새 도메인 에이전트 추가하기

완전히 새로운 도메인(예: `livestock`, `weather_alert` 등)을 만들 때.
PART 1보다 작업량이 큽니다 (6단계).

## 작업할 6개 파일 (체크리스트)

새 도메인 `livestock` 추가 시:

| # | 파일 | 작업 |
|---|---|---|
| 1 | `ai/app/agents/tools/livestock_tools.py` | **신규 작성** — `@tool` 함수들 |
| 2 | `ai/app/agents/livestock_agent.py` | **신규 작성** — `get_livestock_agent()` |
| 3 | `ai/app/agents/orchestrator.py` | **수정** — dict 등록 + 래퍼 + 그래프 노드 |
| 4 | `ai/app/models/chat.py` | (필요 시) 새 ActionType 추가 |
| 5 | `frontend/lib/chat-types.ts` | (필요 시) 위와 미러링 |
| 6 | `frontend/components/common/FarmBot/FarmBot.tsx` | (필요 시) 새 액션 UI 렌더링 |

1~3번은 필수, 4~6은 새 UI 액션 타입(예: 가축 카드 목록)이 있을 때만.

## 1단계 — 도구 작성

**파일**: `ai/app/agents/tools/livestock_tools.py`

```python
"""Livestock Tools — 챗봇이 축산 도메인 기능을 수행하기 위한 도구 모음."""
import logging
from langchain_core.tools import tool

from app.agents.shared import (
    action_token,             # [ACTION:{...}] 토큰 직렬화
    ensure_logged_in,         # JWT 가드
)
from app.utils.backend_client import BackendError, call_backend

logger = logging.getLogger(__name__)


@tool
async def get_my_livestock_status() -> str:
    """현재 사용자의 축산 농가 상태(가축 수, 출하 일정 등)를 조회합니다.

    이 docstring은 LLM이 도구를 선택할 때 보는 설명입니다.
    "언제 호출하는지" 한 줄로 명확하게.
    """
    # ① 로그인 필요 도구는 무조건 가드부터
    if (msg := ensure_logged_in()):
        return msg

    # ② 백엔드 호출 (JWT는 ContextVar로 자동 첨부됨)
    try:
        data = await call_backend("GET", "/api/livestock/me")
    except BackendError as e:
        if e.status_code == 401:
            return ensure_logged_in()  # 만료된 토큰 케이스
        return f"축산 데이터 조회에 실패했어요. ({e.message})"

    # ③ 응답: 한국어 본문 + 액션 토큰
    return (
        f"현재 보유 가축: {data.get('summary', '정보 없음')}. "
        + action_token({"type": "NAVIGATE", "url": "/livestock/dashboard"})
    )


@tool
async def register_livestock(
    animal_name: str,
    count: int = 1,
) -> str:
    """가축을 신규 등록합니다. animal_name과 count 필수."""
    if (msg := ensure_logged_in()):
        return msg

    try:
        await call_backend(
            "POST", "/api/livestock",
            json_body={"animalName": animal_name, "count": int(count)},
        )
    except BackendError as e:
        return f"가축 등록에 실패했어요. ({e.message})"

    return (
        f"[가축 등록 성공] {animal_name} {count}마리 등록했어요. "
        + action_token({"type": "TOAST", "level": "success", "message": "가축 등록 완료"})
        + action_token({"type": "NAVIGATE", "url": "/livestock/dashboard"})
    )
```

> 도구 작성 체크리스트는 **PART 1 §2** 참고.

## 2단계 — 에이전트 작성

**파일**: `ai/app/agents/livestock_agent.py`

```python
"""Livestock Agent — 챗봇 액션형 에이전트."""
from langgraph.prebuilt import create_react_agent

from app.agents.tools.livestock_tools import (
    get_my_livestock_status,
    register_livestock,
)
from app.llm import get_llm


LIVESTOCK_AGENT_SYSTEM_PROMPT = """당신은 '팜밸런스 축산' 도우미입니다.
사용자 요청은 반드시 도구(tool)를 호출한 결과로 처리하세요.
절대 도구 호출 없이 답변을 만들지 마세요.

[필수 규칙]
1. 사용자 요청 → 즉시 적합한 도구 호출
2. 도구 결과 텍스트를 그대로 사용자에게 전달 (요약·재구성 금지)
3. 한자 사용 금지, 한글만 사용
4. 추측 금지 — 도구 결과에 없는 정보는 만들지 않음

[도구 → 사용 시점]
- get_my_livestock_status: "내 축산 농가 상태", "내 가축 얼마나 있어"
- register_livestock: "가축 등록", "소 등록할래" (animal_name, count 추출)

[안전 규칙]
- register_livestock 결과에 "[가축 등록 성공]" 문구가 있으면 성공, 없으면 실패
- 실패 메시지는 변경하지 말고 그대로 전달
- 401 오류면 "로그인 필요" 안내
"""


def get_livestock_agent():
    """Livestock Agent 인스턴스를 반환."""
    llm_provider = get_llm("groq")   # 또는 "gemini" — 아래 선택 가이드 참고
    chat_model = llm_provider.get_chat_model(temperature=0.1)

    tools = [
        get_my_livestock_status,
        register_livestock,
    ]

    return create_react_agent(
        model=chat_model,
        tools=tools,
        prompt=LIVESTOCK_AGENT_SYSTEM_PROMPT,
    )
```

### LLM 선택 가이드

| 모델 | 장점 | 단점 |
|---|---|---|
| `groq` | tool calling 안정적, 빠름 | 답변 어휘가 다소 거침 |
| `gemini` | 한국어 자연스러움 | 짧은 입력에서 빈 응답 종종 발생 → 키워드 fallback 필수 |

**액션형(도구 호출 위주) 에이전트는 `groq` 권장.**
일반 상담형은 `gemini`도 무난.

## 3단계 — 오케스트레이터 등록 (가장 중요!)

**파일**: `ai/app/agents/orchestrator.py`

### 3-1. import 추가

```python
from app.agents.livestock_agent import get_livestock_agent
```

### 3-2. `ROUTER_SYSTEM_PROMPT`에 카테고리 한 줄 추가

```python
ROUTER_SYSTEM_PROMPT = """...
카테고리:
- ...
- livestock_agent: 축산·가축 관련 (가축 등록, 상태 조회, 출하 계획 등)
- general_chat: 위 어디에도 해당하지 않는 일반 농업 상담 또는 비농업 질문
..."""
```

### 3-3. `VALID_ROUTES` set에 추가

```python
VALID_ROUTES = {
    "blocked_guard", "policy_agent", "balance_agent",
    "farm_agent", "gov_agent", "shop_agent", "community_agent",
    "livestock_agent",   # ← 추가
    "general_chat",
}
```

### 3-4. **`DOMAIN_FORCE_KEYWORDS` dict에 항목 추가** (핵심)

```python
DOMAIN_FORCE_KEYWORDS: dict[str, set[str]] = {
    "shop_agent": {...},
    "livestock_agent": {           # ← 추가
        "가축", "축산", "소 등록", "돼지", "닭", "오리",
        "출하", "사료", "축사", "가축 상태",
    },
}
```

여기에 추가하면 **`force_route()` 가 자동으로 인식**합니다.
별도 함수를 만들 필요 없음.

### 3-5. **`DOMAIN_CONTEXT_INDICATORS` dict에 항목 추가** (멀티턴용)

```python
DOMAIN_CONTEXT_INDICATORS: dict[str, tuple[str, ...]] = {
    "shop_agent": (...),
    "livestock_agent": (           # ← 추가
        "가축", "축산", "출하", "사료", "축사",
    ),
}
```

이제 "내 가축 보여줘" → "1번 출하" 같은 짧은 후속 답변도
**`last_bot_domain()` 가 자동으로 livestock으로 라우팅**합니다.

### 3-6. 에이전트 호출 래퍼 추가

```python
async def call_livestock_agent(state: AgentState):
    """Livestock Agent 호출 — shop_agent와 동일 패턴."""
    try:
        agent = get_livestock_agent()
        response = await agent.ainvoke({"messages": state["messages"]})
        all_msgs = response["messages"]

        # 공통 추출 — 마지막 AIMessage + ToolMessage 보완 + 액션 병합
        out = extract_agent_output(all_msgs, default_text="")
        cleaned = out.text
        merged_actions = list(out.actions)

        # (선택) LLM이 도구 호출도 안 했으면 키워드 fallback
        # → _livestock_keyword_fallback 별도 작성 시에만 추가

        if not cleaned:
            cleaned = "요청하신 작업을 처리했어요."

        return {
            "messages": [AIMessage(content=cleaned)],
            "pending_actions": _accumulate_actions(state, merged_actions),
            "skip_synthesis": True,  # Synthesizer 재가공 우회 — 도구 응답 보존
        }
    except Exception:
        logger.exception("[Orchestrator] LivestockAgent call failed")
        return {
            "messages": [AIMessage(content="축산 기능 처리 중 오류가 났어요. 잠시 후 다시 시도해 주세요.")],
            "skip_synthesis": True,
        }
```

### 3-7. 그래프에 노드·엣지 등록

`get_main_orchestrator()` 함수 안:

```python
workflow.add_node("livestock_agent", call_livestock_agent)

workflow.add_conditional_edges(START, router_node, {
    ...
    "livestock_agent": "livestock_agent",   # ← 추가
})

workflow.add_edge("livestock_agent", "synthesizer")   # ← 추가
```

## 4단계 — (선택) 키워드 fallback

LLM이 빈 응답을 내는 경우의 최종 안전망. Gemini를 LLM으로 쓸 때만 강력 권장.
shop의 `_shop_keyword_fallback` 패턴 그대로 복사.

```python
async def _livestock_keyword_fallback(user_message: str) -> tuple[str, list[dict]] | None:
    from app.agents.tools.livestock_tools import (
        get_my_livestock_status, register_livestock,
    )
    from app.agents.shared import extract_product_attrs

    lower = user_message.lower()

    if any(kw in lower for kw in ("내 가축", "가축 상태", "가축 얼마나")):
        result = await get_my_livestock_status.ainvoke({})
        return split_actions(result)

    if any(kw in lower for kw in ("가축 등록", "소 등록", "돼지 등록")):
        attrs = extract_product_attrs(user_message)  # name/price/stock 자동 추출
        if attrs.get("product_name"):
            result = await register_livestock.ainvoke({
                "animal_name": attrs["product_name"],
                "count": attrs.get("stock", 1),  # "100마리" → stock=100
            })
            return split_actions(result)

    return None
```

그리고 `call_livestock_agent`에서 호출 (shop과 동일):

```python
if not cleaned and not merged_actions:
    last_human = next(
        (m for m in reversed(all_msgs) if isinstance(m, HumanMessage)), None
    )
    if last_human and last_human.content:
        fallback = await _livestock_keyword_fallback(last_human.content)
        if fallback:
            cleaned, fb_actions = fallback
            merged_actions.extend(fb_actions)
```

## 5단계 — (선택) 새 액션 타입 추가

UI에 새 카드(예: 가축 카드 목록)를 띄우려면 액션 타입을 추가해야 합니다.

### 5-1. AI 서버 타입 정의

**`ai/app/models/chat.py`**

```python
ActionType = Literal[
    "NAVIGATE", "FILL_FORM", "TOAST", "REFRESH",
    "CLARIFY", "CONFIRM", "OPEN_MODAL", "PRODUCT_LIST",
    "LIVESTOCK_LIST",   # ← 추가
]

class ChatLivestockItem(BaseModel):
    id: int
    animalName: str
    count: int

class ChatAction(BaseModel):
    type: ActionType
    # ...
    livestocks: Optional[list[ChatLivestockItem]] = None   # ← 추가
```

### 5-2. 프론트 타입 미러링

**`frontend/lib/chat-types.ts`**

```typescript
export type ChatActionType =
  | 'NAVIGATE' | 'FILL_FORM' | 'TOAST' | 'REFRESH'
  | 'CLARIFY' | 'CONFIRM' | 'OPEN_MODAL' | 'PRODUCT_LIST'
  | 'LIVESTOCK_LIST';     // ← 추가

export interface ChatLivestockItem {
  id: number;
  animalName: string;
  count: number;
}

export interface ChatAction {
  type: ChatActionType;
  // ...
  livestocks?: ChatLivestockItem[];   // ← 추가
}
```

### 5-3. 액션 디스패처 — UI 렌더형은 dispatch 안 함

**`frontend/components/common/FarmBot/useChatActions.ts`**

```typescript
case 'CLARIFY':
case 'CONFIRM':
case 'PRODUCT_LIST':
case 'LIVESTOCK_LIST':       // ← 추가
  break;
```

### 5-4. UI 렌더링

**`frontend/components/common/FarmBot/FarmBot.tsx`**

채팅 메시지 액션 렌더링 블록 안 (PRODUCT_LIST 블록 옆에):

```tsx
if (action.type === 'LIVESTOCK_LIST' && action.livestocks) {
  return (
    <div key={ai} className={styles.productCardList}>
      {action.livestocks.map(l => (
        <div key={l.id} className={styles.productCard}>
          <span>{l.animalName} — {l.count}마리</span>
        </div>
      ))}
    </div>
  );
}
```

## 6단계 — 테스트 시나리오

1. **키워드 force routing**: `DOMAIN_FORCE_KEYWORDS["livestock_agent"]`에 등록한 단어로 메시지 → 로그에 `[Router] 키워드 매칭 → livestock_agent` 보임
2. **멀티턴 컨텍스트**: "내 가축 보여줘" → "1번 출하" 같은 후속 → 로그에 `[Router] 멀티턴 컨텍스트 → livestock_agent` 보임
3. **비로그인 가드**: 로그아웃 후 보호된 도구 호출 시 "로그인이 필요해요" 응답
4. **액션 디스패치**: NAVIGATE/TOAST/REFRESH 가 프론트에서 실제 실행되는지

---

# 부록 — 공통 레퍼런스

## 공통 인프라 (`app.agents.shared`) 함수 목록

새 도메인이 무조건 import해야 하는 공용 함수들:

| 함수 | 용도 |
|---|---|
| `action_token(payload)` | `[ACTION:{...}]` 토큰 문자열 생성 (도구에서 사용) |
| `split_actions(text)` | 텍스트에서 액션 토큰 추출 (중첩 JSON 지원) |
| `ensure_logged_in()` | JWT 가드 — 비로그인 시 안내 메시지 반환 |
| `login_required_message()` | 직접 호출용 로그인 안내 |
| `extract_price(text)` | "8800원" → 8800 |
| `extract_stock(text)` | "100개" → 100 |
| `extract_korean_noun(text)` | 문장에서 한글 명사 추출 |
| `extract_product_attrs(text)` | name/price/stock 일괄 추출 (fallback용) |
| `extract_agent_output(messages)` | ReAct 응답에서 본문·액션 안전 추출 (LLM 빈 응답 대응 포함) |

import 예시:
```python
from app.agents.shared import (
    action_token, split_actions,
    ensure_logged_in, login_required_message,
    extract_price, extract_stock, extract_korean_noun, extract_product_attrs,
    extract_agent_output,
)
```

## orchestrator.py 레지스트리 위치 (5초 안에 찾기)

| 무엇 | 키워드로 검색 |
|---|---|
| `DOMAIN_FORCE_KEYWORDS` | `grep -n "DOMAIN_FORCE_KEYWORDS" orchestrator.py` |
| `DOMAIN_CONTEXT_INDICATORS` | `grep -n "DOMAIN_CONTEXT_INDICATORS"` |
| `ROUTER_SYSTEM_PROMPT` | `grep -n "ROUTER_SYSTEM_PROMPT"` |
| `VALID_ROUTES` | `grep -n "VALID_ROUTES"` |
| `get_main_orchestrator()` | `grep -n "def get_main_orchestrator"` |

## 자주 묻는 질문

**Q. 시스템 프롬프트에 `[ACTION:{...}]` 토큰 예시를 넣어도 되나요?**
A. 권장하지 않습니다. LLM이 토큰을 직접 생성하려고 시도해 도구 호출을 안 하게 됩니다. `extract_agent_output()`이 ToolMessage에서 직접 토큰을 추출하므로 LLM은 도구 호출만 잘 하면 됩니다.

**Q. 응답이 자꾸 비어서 옵니다.**
A. ① Gemini 모델은 짧은 입력에 빈 응답을 종종 반환합니다 — 키워드 fallback(PART 2 §4)을 추가하거나 `groq`로 바꾸세요. ② 첫 메시지가 AIMessage이면 Gemini가 혼란스러워합니다 — `chat.py`가 이미 첫 user 메시지부터만 보내도록 처리되어 있습니다.

**Q. Synthesizer가 응답을 변형해서 숫자/이름이 바뀝니다.**
A. `skip_synthesis: True`를 반환하세요. 도구 응답을 정확히 보존해야 하는 도메인은 모두 이걸 쓰는 게 안전합니다.

**Q. 사용자 페이지 이동 액션의 URL이 화면에 그대로 보입니다.**
A. 텍스트에는 한국어 라벨만 쓰고, URL은 `action_token({"type":"NAVIGATE","url":"..."})` 안에만 넣으세요. 본문에 `/shop/cart` 같은 경로 노출 금지.

**Q. CLARIFY 옵션 클릭 시 사용자에게 id가 노출됩니다.**
A. `FarmBot.tsx`에서 `sendChatMessage(displayText, sendAs)` 시그니처를 사용. `displayText`는 화면에, `sendAs`(id 포함)는 AI에 별도 전송. `stripInternalIds()` 함수가 봇 응답에 남은 id 패턴도 화면에서 가립니다.

**Q. 도구 호출 시 백엔드가 401을 반환해도 작업이 진행됩니다.**
A. 백엔드가 게스트 요청을 허용하더라도 도구 자체에서 `ensure_logged_in()` 으로 사전 차단해야 합니다. 보호된 도구는 첫 줄에 무조건 가드.

---

## 변경 이력

- 2026-05-19: 초안 작성 (라우터 일반화 + shared 모듈 추출 완료 시점)
- 2026-05-19: 기존 에이전트 활용 챕터 추가 (모든 call_xxx 래퍼 통일)
- 2026-05-19: 구조 재배치 — PART 1(기존 확장)을 상단으로, PART 2(새 도메인)를 하단으로
