# 🛒 챗봇 ↔ Shop 프론트엔드 연동 가이드 (Actionable Shop Agent)

> **목표**: 챗봇(양평이 할아버지) 대화를 통해 장터/마이페이지의 상품·장바구니·주문 기능을 직접 수행하거나 페이지로 이동시키는 **액션형 에이전트(Actionable Agent)** 를 완성한다.
>
> **전제**: 이미 구현되어 있는 LangGraph Orchestrator(`ai/app/agents/orchestrator.py`) 위에 `shop_agent`의 역할을 확장하고, 프론트엔드의 챗봇 응답 파이프라인에 **Action 디스패처**를 추가한다.

---

## 1. 현재 구조 진단 (As-Is)

### 1.1 챗봇 데이터 흐름

```
[사용자]
   │  메시지 입력
   ▼
[FarmBot 채팅창] ─ useFarmBot.ts:sendChatMessage()
   │  POST /api/ai/chat (history 포함)
   ▼
[Next.js BFF] ─ app/api/ai/chat/route.ts
   │  POST {AI_SERVER_URL}/api/chat
   ▼
[FastAPI] ─ ai/app/routers/chat.py
   │  orchestrator.ainvoke({messages, user_id, ...})
   ▼
[LangGraph Orchestrator] ─ ai/app/agents/orchestrator.py
   │  router_node → 1개 이상의 agent 선택
   ▼
[Sub-Agent] ─ shop_agent / farm_agent / policy_agent / ...
   │  tool 호출 → "[ACTION:{...}]" 문자열을 포함한 답변
   ▼
[Synthesizer] ─ 양평이 할아버지 톤으로 통합
   ▼
{ reply: string }    ← 단순 텍스트만 반환
```

### 1.2 이미 구현되어 있는 자산

| 영역 | 파일 | 역할 |
|------|------|------|
| Orchestrator | `ai/app/agents/orchestrator.py` | LLM 기반 의도 라우터 + 8개 에이전트 + Synthesizer |
| Shop Agent | `ai/app/agents/shop_agent.py` | ReAct 에이전트 (Gemini), 2개 도구 보유 |
| Shop Tools | `ai/app/agents/tools/shop_tools.py` | `navigate_to_register_page`, `autofill_product_info` |
| AI 자동채우기 | `ai/app/services/product_assist_service.py` + `routers/product_assist.py` | `/api/ai/product-assist/autofill` |
| Chat BFF | `frontend/app/api/ai/chat/route.ts` | AI 서버 프록시 |
| 챗봇 UI | `frontend/components/common/FarmBot/useFarmBot.ts:320~358` | 채팅 메시지 송수신 |
| Shop API | `backend .../shop/adapter/in/web/{Product,Cart,Order}Controller.java` | 상점 도메인 REST API |

### 1.3 ⚠️ 핵심 갭(Gap)

1. **프론트엔드에 Action 파서가 없다.** `shop_tools.py`가 `[ACTION:{...}]` 문자열을 만들어도, `useFarmBot.ts:343-348`은 그 문자열을 그대로 말풍선에 출력만 한다.
2. **Synthesizer가 ACTION을 잡아먹는다.** `synthesizer_node`(orchestrator.py:170)는 LLM이 다시 문장을 만들면서 `[ACTION:{...}]` 토큰을 누락/변형할 수 있다.
3. **shop_agent 도구가 2개뿐이다.** 장바구니 담기/주문 이동/내 상품 조회/주문 조회 등은 도구화되어 있지 않다.
4. **부족한 정보 보완 대화 흐름이 없다.** "사과 장바구니에 담아줘" 같이 어떤 사과인지 모호한 경우, 후속 질문으로 좁히는 멀티턴 시나리오가 없다.

---

## 2. 목표 아키텍처 (To-Be)

### 2.1 데이터 흐름

```
[사용자] "사과 장바구니에 넣어줘"
   │
   ▼
[FarmBot UI] ─ sendChatMessage
   │
   ▼
[BFF: /api/ai/chat] ─ AI 서버 호출 (사용자 컨텍스트 헤더 첨부)
   │
   ▼
[FastAPI /api/chat] ─ orchestrator.ainvoke
   │
   ▼
[Router] → shop_agent
   │
   ▼
[Shop Agent (ReAct)]
   ├─ search_products(keyword="사과")  → 3개 결과
   └─ 후보가 여러 개 → CLARIFY 액션 반환
   │
   ▼
[Synthesizer] ─ ACTION 토큰 보존
   │
   ▼
응답: {
   reply: "사과 종류가 3가지 있구만. 어느 걸로 담을까?",
   actions: [
     { type: "CLARIFY", payload: { intent:"ADD_TO_CART",
       options:[{id:11, label:"부사 사과 1kg"}, ...] } }
   ]
}
   │
   ▼
[FarmBot UI Dispatcher]
   ├─ reply는 말풍선에 표시
   └─ CLARIFY 액션 → 옵션 버튼 렌더링
   │  사용자가 "부사 사과 1kg" 선택
   ▼
[자동으로 다음 턴 전송] "부사 사과 1kg(id=11) 장바구니에 1개"
   ▼
… shop_agent가 add_to_cart 도구 실행 → ACTION:TOAST + 카트 카운트 갱신
```

### 2.2 책임 분담

| Layer | 책임 |
|-------|------|
| **Shop Agent (Python)** | 자연어 → 의도 + 인자 추출, 부족하면 CLARIFY 액션 반환, 충분하면 실제 백엔드 API 호출 도구 사용 |
| **AI Server** | `chat.py` 응답 스키마를 `{ reply, actions: Action[] }`로 확장 |
| **BFF (Next)** | 응답을 그대로 통과시키고, 인증 토큰을 AI 서버에 헤더로 전달 |
| **Frontend Dispatcher** | `actions[]` 을 순차 처리 (NAVIGATE / FILL_FORM / TOAST / CLARIFY / CONFIRM / REFRESH) |
| **FarmBot UI** | CLARIFY는 칩 버튼, CONFIRM은 예/아니오 버튼으로 인라인 렌더 |

---

## 3. Action 프로토콜 정의

### 3.1 응답 스키마

```ts
// frontend/lib/types/chat.ts (신규)
export type ChatAction =
  | { type: 'NAVIGATE'; url: string; replace?: boolean }
  | { type: 'FILL_FORM'; target: string; payload: Record<string, unknown> } // target: form key
  | { type: 'TOAST'; level: 'success'|'info'|'error'; message: string }
  | { type: 'REFRESH'; scope: 'cart'|'orders'|'products' }
  | { type: 'CLARIFY'; intent: string; question: string;
      options: { id: string|number; label: string; meta?: Record<string, unknown> }[] }
  | { type: 'CONFIRM'; intent: string; question: string;
      payload: Record<string, unknown> }
  | { type: 'OPEN_MODAL'; modal: string; payload?: Record<string, unknown> };

export interface ChatReply {
  reply: string;
  actions?: ChatAction[];
}
```

### 3.2 Python 측 응답 모델

```python
# ai/app/models/chat.py (신규)
from pydantic import BaseModel
from typing import Any, Literal, Optional

class ChatAction(BaseModel):
    type: Literal['NAVIGATE','FILL_FORM','TOAST','REFRESH','CLARIFY','CONFIRM','OPEN_MODAL']
    # NAVIGATE
    url: Optional[str] = None
    replace: Optional[bool] = None
    # FILL_FORM
    target: Optional[str] = None
    payload: Optional[dict[str, Any]] = None
    # TOAST
    level: Optional[Literal['success','info','error']] = None
    message: Optional[str] = None
    # REFRESH
    scope: Optional[Literal['cart','orders','products']] = None
    # CLARIFY
    intent: Optional[str] = None
    question: Optional[str] = None
    options: Optional[list[dict[str, Any]]] = None
    # CONFIRM
    modal: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    actions: list[ChatAction] = []
```

### 3.3 도구 → 응답 변환 규칙

각 Tool은 기존처럼 `[ACTION:{...json...}]` 문자열을 답변에 끼워 반환한다. 변경 포인트는 **응답 직전 후처리**에서 모든 `[ACTION:...]` 토큰을 추출하여 `actions[]` 로 분리하고, `reply`에서는 제거한다.

```python
# ai/app/routers/chat.py 내 헬퍼 (신규)
import re, json
ACTION_RE = re.compile(r"\[ACTION:(\{.*?\})\]", re.DOTALL)

def split_actions(text: str) -> tuple[str, list[dict]]:
    actions = [json.loads(m.group(1)) for m in ACTION_RE.finditer(text)]
    cleaned = ACTION_RE.sub("", text).strip()
    return cleaned, actions
```

> **Synthesizer 문제 해결**: Synthesizer에 들어가기 전, 각 agent의 메시지에서 ACTION 토큰을 미리 빼내어 state에 누적(`state["pending_actions"]`)하고, Synthesizer는 텍스트만 합성한다. 최종 응답에서 `pending_actions`를 그대로 actions로 내려보낸다.

---

## 4. Shop Agent 도구 명세 (신규/확장)

기존 `navigate_to_register_page`, `autofill_product_info` 외에 아래 도구들을 `ai/app/agents/tools/shop_tools.py`에 추가한다.

| Tool | 자연어 트리거 예 | 동작 |
|------|---------------|------|
| `navigate_to(target)` | "장터로 가줘", "장바구니 보여줘", "주문내역 보여줘" | NAVIGATE 액션 반환. target ∈ `shop_home`, `cart`, `my_orders`, `seller_register`, `seller_products`, `seller_orders` |
| `search_products(keyword, category?)` | "사과 보여줘" | 백엔드 `GET /api/shop/product?keyword=` 호출. 1건이면 자동 선택, 다건이면 CLARIFY 액션 |
| `add_to_cart(product_id, quantity=1)` | "사과 장바구니에 담아줘" | `POST /api/shop/cart`. 성공 시 TOAST + REFRESH(cart) |
| `buy_now(product_id, quantity)` | "사과 바로 주문해줘" | 체크아웃 페이지로 NAVIGATE + 쿼리로 productId,qty 전달 |
| `list_my_products()` | "내가 등록한 상품 뭐 있어?" | `GET /api/shop/seller`. 텍스트 요약 |
| `list_seller_orders(status?)` | "들어온 주문 보여줘" | `GET /api/shop/seller/order`. 텍스트 요약 |
| `autofill_product_info(name)` | "배추 정보 채워줘" | (기존) NAVIGATE → FILL_FORM 액션 2개 |
| `clarify(intent, question, options)` | 도구 내부에서 후보가 모호할 때 직접 호출 | CLARIFY 액션 반환 |

### 4.1 백엔드 호출 도구의 인증 처리

Shop Agent의 백엔드 호출 도구는 사용자 컨텍스트가 필요하다.

1. **BFF**: `/api/ai/chat`에서 쿠키 → JWT 추출 → `X-User-Token` 헤더로 AI 서버에 전달.
2. **AI 서버**: `chat.py`에서 헤더를 받아 `request.metadata["jwt"]`에 주입, orchestrator state에 `user_jwt` 키로 전파.
3. **Tool**: `from app.utils.backend_client import call_backend` 같은 헬퍼를 만들어 JWT를 자동으로 `Authorization: Bearer ...`로 붙여 호출.

```python
# ai/app/utils/backend_client.py (신규)
import os, httpx
from contextvars import ContextVar

BACKEND_BASE = os.getenv("BACKEND_BASE_URL", "http://farm-backend:8080")
user_jwt_ctx: ContextVar[str | None] = ContextVar("user_jwt", default=None)

async def call_backend(method: str, path: str, *, json_body=None, params=None) -> dict:
    headers = {"Content-Type": "application/json"}
    jwt = user_jwt_ctx.get()
    if jwt:
        headers["Authorization"] = f"Bearer {jwt}"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.request(method, f"{BACKEND_BASE}{path}",
                                 headers=headers, json=json_body, params=params)
        r.raise_for_status()
        return r.json()
```

`chat.py`에서 invoke 직전에 `user_jwt_ctx.set(request.metadata.get("jwt"))`.

### 4.2 도구 구현 예시 — `add_to_cart`

```python
@tool
async def add_to_cart(product_id: int, quantity: int = 1) -> str:
    """사용자가 특정 상품을 장바구니에 담길 원할 때 호출.
    product_id가 모호하면 먼저 search_products를 호출해 후보를 좁혀라."""
    try:
        await call_backend("POST", "/api/shop/cart",
                           json_body={"productId": product_id, "quantity": quantity})
        actions = [
            {"type": "TOAST", "level": "success", "message": f"장바구니에 담았습니다."},
            {"type": "REFRESH", "scope": "cart"},
        ]
        return "장바구니에 담아두었어. " + " ".join(f"[ACTION:{json.dumps(a, ensure_ascii=False)}]" for a in actions)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            return "장바구니에 담으려면 먼저 로그인이 필요하구만. [ACTION:" + json.dumps({"type":"NAVIGATE","url":"/login"}, ensure_ascii=False) + "]"
        return f"장바구니 담기에 실패했어. ({e.response.status_code})"
```

### 4.3 시나리오 — "사과 장바구니에 넣어줘"

| 턴 | 사용자 | Shop Agent 내부 동작 | 반환 액션 |
|----|------|--------------------|----------|
| 1 | "사과 장바구니에 넣어줘" | `search_products("사과")` → 3건 | `CLARIFY(intent="ADD_TO_CART", options=[{id:11,label:"부사 사과 1kg"}, ...])` |
| 2 | "부사 사과 1kg" (또는 옵션 클릭 → id=11 메타로 자동 전송) | `add_to_cart(product_id=11, quantity=1)` 성공 | `TOAST`, `REFRESH(cart)` |

### 4.4 시나리오 — "사과 바로 주문해줘"

| 턴 | 사용자 | 동작 | 액션 |
|----|------|------|------|
| 1 | "사과 바로 주문해줘" | search → 1건이면 즉시, 다건이면 CLARIFY | CLARIFY 또는 다음 단계 |
| 2 | "부사 사과 1kg" | "몇 개 주문할까?" | CLARIFY(options=[1,2,3,5,10]) 또는 자유 입력 |
| 3 | "3개" | `buy_now(11, 3)` | `NAVIGATE(/shop/checkout?productId=11&qty=3)` |

> **체크아웃 페이지 수정 필요**: 현재 `useCheckout.ts`는 `?items=...` 형식의 장바구니 기반이다. `productId/qty` 쿼리도 받을 수 있도록 초기화 로직을 확장한다.

### 4.5 시나리오 — "배추 등록할래"

| 턴 | 사용자 | 동작 | 액션 |
|----|------|------|------|
| 1 | "배추 등록할래" | navigate + autofill 결합 | `NAVIGATE(/mypage/seller/register)`, `FILL_FORM(target="seller_register", payload={...})` |

프론트엔드는 페이지 이동 후 sessionStorage에 payload를 보관해두고, register 페이지가 마운트 시 sessionStorage를 읽어 폼을 자동 채운다. 기존 `/api/ai/product-assist/autofill` 호출 흐름을 재사용한다.

---

## 5. 프론트엔드 변경 가이드

### 5.1 BFF — `frontend/app/api/ai/chat/route.ts`

```ts
// 1) 쿠키에서 JWT 꺼내 헤더로 전달
import { cookies } from 'next/headers';
const jwt = (await cookies()).get('accessToken')?.value;

// 2) AI 서버 호출 시 metadata.jwt에 포함
body: JSON.stringify({
  userId: body.userId || 0,
  roomId: body.roomId || 0,
  category: 'general',
  message,
  history: body.history || [],
  metadata: { jwt, currentPath: body.currentPath },  // ← 추가
}),

// 3) 응답 스키마 확장
return NextResponse.json({
  success: true,
  data: { reply: data.reply, actions: data.actions ?? [] },
  error: null,
});
```

### 5.2 Action Dispatcher — 신규 `components/common/FarmBot/useChatActions.ts`

```ts
'use client';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { ChatAction } from '@/lib/types/chat';
import { showToast } from '@/lib/toast';

export function useChatActions() {
  const router = useRouter();

  return useCallback((actions: ChatAction[]) => {
    for (const a of actions) {
      switch (a.type) {
        case 'NAVIGATE':
          a.replace ? router.replace(a.url) : router.push(a.url);
          break;
        case 'FILL_FORM':
          sessionStorage.setItem(`chat-fill:${a.target}`, JSON.stringify(a.payload));
          window.dispatchEvent(new CustomEvent('chat:fill-form', { detail: { target: a.target } }));
          break;
        case 'TOAST':
          showToast(a.message, a.level);
          break;
        case 'REFRESH':
          window.dispatchEvent(new CustomEvent('chat:refresh', { detail: { scope: a.scope } }));
          break;
        case 'CLARIFY':
        case 'CONFIRM':
          // 인라인 옵션 칩은 ChatMessage에 그대로 보관, UI에서 렌더
          break;
        case 'OPEN_MODAL':
          window.dispatchEvent(new CustomEvent('chat:open-modal', { detail: a }));
          break;
      }
    }
  }, [router]);
}
```

### 5.3 `useFarmBot.ts` 응답 처리 확장

```ts
// 320~358 라인 sendChatMessage 내부
const data = await res.json();
const reply = data?.data?.reply ?? FARM_BOT_CONSTANTS.ERROR_MESSAGE;
const actions: ChatAction[] = data?.data?.actions ?? [];

setChatMessages(prev => [...prev, {
  role: 'bot',
  content: reply,
  actions,  // ← 추가: CLARIFY/CONFIRM 옵션을 렌더링용으로 보관
}]);

// 즉시 실행 액션(NAVIGATE/FILL_FORM/TOAST/REFRESH)은 dispatcher로
dispatchActions(actions.filter(a =>
  ['NAVIGATE','FILL_FORM','TOAST','REFRESH','OPEN_MODAL'].includes(a.type)
));
```

### 5.4 CLARIFY/CONFIRM UI

`FarmBot.tsx`의 채팅 메시지 렌더링에서, `message.actions`에 `CLARIFY` 또는 `CONFIRM`이 있으면 메시지 하단에 옵션 칩/버튼을 그린다.

```tsx
{msg.role === 'bot' && msg.actions?.map((a, i) => {
  if (a.type === 'CLARIFY') {
    return (
      <div key={i} className={styles.optionChips}>
        {a.options.map(opt => (
          <button key={opt.id} onClick={() => sendChatMessage(
            `${opt.label} (id=${opt.id})`  // 다음 턴에 id를 전달
          )}>{opt.label}</button>
        ))}
      </div>
    );
  }
  if (a.type === 'CONFIRM') {
    return (
      <div key={i} className={styles.confirmBtns}>
        <button onClick={() => sendChatMessage(`예, 진행해줘 (intent=${a.intent})`)}>예</button>
        <button onClick={() => sendChatMessage('아니, 취소할게')}>아니오</button>
      </div>
    );
  }
  return null;
})}
```

### 5.5 페이지 측 수신 — 예) 상품 등록

`app/(main)/mypage/seller/register/page.tsx`:

```ts
useEffect(() => {
  const raw = sessionStorage.getItem('chat-fill:seller_register');
  if (!raw) return;
  const payload = JSON.parse(raw);
  sessionStorage.removeItem('chat-fill:seller_register');
  // 폼 setState로 일괄 주입
  applyAutofill(payload);
}, []);

useEffect(() => {
  const handler = () => { /* chat:refresh scope=products → mutate */ };
  window.addEventListener('chat:refresh', handler);
  return () => window.removeEventListener('chat:refresh', handler);
}, []);
```

장바구니 / 주문 페이지도 `chat:refresh` 이벤트를 받아 SWR `mutate()` 또는 데이터 재조회를 트리거한다.

---

## 6. Orchestrator/Synthesizer 변경

### 6.1 Router 프롬프트 보강

`orchestrator.py`의 `ROUTER_SYSTEM_PROMPT`에 shop 라우팅 예시 추가:

```
- shop_agent: 상품 검색/등록/관리, 장바구니/주문/판매 관련 모든 질문
  예: "사과 장바구니에 넣어줘", "장터로 이동해줘", "내 주문 보여줘"
```

### 6.2 ACTION 토큰 분리 (1순위)

`call_shop_agent`에서 응답을 받은 직후, **에이전트 답변 메시지의 ACTION을 추출**해 state에 누적한다.

```python
# AgentState 확장
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    next_node: str
    farm_id: int
    user_id: int
    current_focus: str
    pending_actions: list[dict]   # ← 추가

async def call_shop_agent(state):
    agent = get_shop_agent()
    response = await agent.ainvoke({"messages": state["messages"]})
    raw = response["messages"][-1].content
    cleaned, actions = split_actions(raw)   # 4.3에서 정의
    return {
        "messages": [AIMessage(content=cleaned or " ")],
        "pending_actions": [*(state.get("pending_actions") or []), *actions],
    }
```

### 6.3 Synthesizer 우회 옵션

shop_agent가 **유일하게** 라우팅됐고 actions가 있으면 Synthesizer를 건너뛰는 short-circuit edge를 두는 것이 응답 속도/액션 보존에 유리하다. 일단은 Synthesizer를 거치되, 입력 프롬프트에 "원본의 핵심 메시지를 변형하지 말고 한 줄로 다듬으라"는 제약을 추가한다.

### 6.4 chat.py 응답 변환

```python
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    user_jwt_ctx.set((request.metadata or {}).get("jwt"))
    ...
    result = await orchestrator.ainvoke({..., "pending_actions": []})
    reply_text = result["messages"][-1].content
    cleaned, inline_actions = split_actions(reply_text)
    actions = [*(result.get("pending_actions") or []), *inline_actions]
    return ChatResponse(reply=cleaned, actions=actions)
```

---

## 7. 부족한 정보 보완 가이드 (Clarification Policy)

Shop Agent의 System Prompt에 다음 정책을 추가한다.

```
[정보 보완 정책]
- 사용자가 상품을 특정하지 않으면 먼저 search_products로 후보를 조회하고,
  결과가 2건 이상이면 clarify를 호출해 선택지를 제시하라.
- 수량이 명시되지 않은 주문/장바구니 요청은 기본 1로 가정하되,
  주문(buy_now)에서는 반드시 CONFIRM 액션으로 사용자 동의를 받아라.
- 가격/배송지 변경 같은 민감한 작업은 항상 CONFIRM을 거쳐라.
- 비로그인 사용자에게 401이 나면 로그인 페이지로 NAVIGATE하라.
```

LLM이 직접 자연어로 되묻는 대신 `CLARIFY` 액션을 사용하면 프론트엔드가 **클릭 가능한 옵션 칩**을 그릴 수 있어 다음 턴이 정확해진다.

---

## 8. 인텐트 → 도구 매핑표 (요청 예시 모음)

| 사용자 발화 예 | 호출 도구 | 결과 액션 |
|--------------|---------|----------|
| "장터로 이동해줘" / "상점 보여줘" | `navigate_to("shop_home")` | NAVIGATE `/shop` |
| "장바구니 보여줘" | `navigate_to("cart")` | NAVIGATE `/shop/cart` |
| "내 주문내역 알려줘" | `navigate_to("my_orders")` + `list_my_orders()` (요약) | NAVIGATE `/shop/orders` + 텍스트 요약 |
| "사과 장바구니에 넣어줘" | `search_products` → `add_to_cart` | (CLARIFY) → TOAST + REFRESH |
| "사과 바로 주문해줘" | `search_products` → `buy_now` | (CLARIFY 수량) → NAVIGATE `/shop/checkout?...` |
| "상품 등록할래" | `navigate_to("seller_register")` | NAVIGATE `/mypage/seller/register` |
| "배추 등록할래 내용 채워줘" | `navigate_to("seller_register")` + `autofill_product_info("배추")` | NAVIGATE + FILL_FORM |
| "내가 등록한 상품 뭐 있어?" | `list_my_products()` | 텍스트 요약 (+선택적 NAVIGATE `/mypage/seller`) |
| "주문 들어온 거 뭐 있어?" | `list_seller_orders()` | 텍스트 요약 (+선택적 NAVIGATE `/mypage/seller/orders`) |
| "배추 주문 거절해줘" | (확장) `update_order_status(orderId, REJECTED)` | CONFIRM → PATCH `/api/shop/seller/order/{id}` |

---

## 9. 단계별 작업 체크리스트

### Phase 1 — 인프라 ✅ 완료
- [x] `ai/app/models/chat.py` 신규: ChatResponse + ChatAction (7개 액션 타입)
- [x] `ai/app/utils/backend_client.py` 신규: `user_jwt_ctx` ContextVar + `call_backend()` + `BackendError`
- [x] `ai/app/utils/__init__.py` 신규 (패키지 마커 누락 보완)
- [x] `ai/app/routers/chat.py`: 응답 스키마 확장, JWT를 ContextVar에 주입, ACTION 토큰 split 후처리
- [x] `ai/app/agents/orchestrator.py`: `AgentState`에 `pending_actions` 추가, `split_actions()` 헬퍼, `call_shop_agent`가 ACTION 추출 후 state에 누적 (Synthesizer 변형 방지)
- [x] `frontend/app/api/ai/chat/route.ts`: 쿠키에서 JWT 추출 → `metadata.jwt`로 AI 서버 전달, actions passthrough
- [x] `frontend/lib/chat-types.ts` 신규: `ChatAction` / `ChatReply` 타입 (경로는 `lib/types/chat.ts`가 아닌 `lib/chat-types.ts`로 둠 — 기존 lib 평탄 구조에 맞춤)
- [x] `useFarmBot.ts`: `ChatMessage.actions` 필드 추가, `sendChatMessage`에 `currentPath` 포함, 응답의 즉시 실행 액션을 dispatcher로 위임
- [x] `useChatActions.ts` 신규: dispatcher 훅 + `consumeChatFillPayload()` + `CHAT_EVENTS` 상수
- [x] Smoke 검증: Python ast 파싱, TypeScript `tsc --noEmit` 통과

### Phase 2 — Shop Agent 확장 ✅ 완료
- [x] `shop_tools.py`에 신규 도구 9종 추가:
  - `navigate_to(target)` — 6개 페이지 매핑 (shop_home, cart, my_orders, seller_register, seller_products, seller_orders)
  - `search_products(keyword, category?, limit)` — 1건이면 자동 선택, 다건이면 CLARIFY 액션 자동 반환
  - `add_to_cart(product_id, quantity=1)` — TOAST + REFRESH(cart) 액션, 401 시 로그인 NAVIGATE
  - `buy_now(product_id, quantity=1)` — `/shop/checkout?productId=&qty=` NAVIGATE
  - `list_my_products()` — 판매자 등록 상품 텍스트 요약 + NAVIGATE
  - `list_seller_orders()` — 들어온 주문 요약 + NAVIGATE
  - `list_my_orders()` — 구매자 주문 내역 요약 + NAVIGATE
  - `clarify(intent, question, options_json)` — LLM이 직접 호출하는 선택지 도구
  - `autofill_product_info(product_name)` — NAVIGATE + FILL_FORM 결합 (기존 도구 보강)
  - `navigate_to_register_page()` — 하위 호환 유지
- [x] `shop_agent.py` 프롬프트 전면 갱신:
  - 필수 출력 규칙(ACTION 토큰 변형 금지, 한자 사용 금지)
  - 도구 선택 가이드 (모호한 상품 → search_products 우선)
  - 정보 보완 정책 (수량 미지정 시 기본 1, 임의 product_id 금지)
  - 좋은 답변 예시 3종
- [x] `orchestrator.py`: `pending_actions` state, `call_shop_agent` 후처리 (Phase 1에서 선행)
- [x] Router 프롬프트 보강 — 8개 shop 발화 예시 추가, shop_agent 카테고리 설명 확장
- [x] Smoke 검증: Python ast 파싱, `split_actions` 단위 테스트 4종 통과 (multi/none/broken-json/unicode)

### Phase 3 — Frontend Action UX ✅ 완료
- [x] FarmBot CLARIFY/CONFIRM 옵션 UI 추가 (`FarmBot.tsx` 메시지 렌더링 확장)
  - CLARIFY → 라벨 칩 버튼들, 마지막 봇 메시지일 때만 활성화 (이전 옵션 비활성화)
  - CONFIRM → "예, 진행" / "아니오" 2개 버튼
  - 클릭 시 `sendChatMessage("라벨 (id=...)")` 또는 `sendChatMessage("네, 진행해주세요 (intent=...)")`로 다음 턴 자동 전송
  - 스타일은 `FarmBot.module.css`에 `.chatOptionChips/.chatOptionChip/.chatConfirmRow/.chatConfirmYes/.chatConfirmNo` 추가
- [x] 장바구니 페이지 (`shop/cart/useCart.ts`): `chat:refresh` 리스너 + 재조회 헬퍼 `fetchCart`
  - `add_to_cart` 도구가 보낸 REFRESH(scope='cart') 이벤트로 자동 재조회
  - 첫 로드 시에만 전체 선택, 재조회 때는 사용자의 선택 상태 유지
- [x] 체크아웃 페이지: 이미 `?productId=&quantity=` 쿼리를 지원함을 확인 (useCheckout.ts:176~192).
  - `buy_now` 도구의 URL을 `qty` → `quantity`로 정정하여 기존 코드와 일치시킴
- [x] 상품등록 페이지 (`mypage/seller/register/page.tsx`): `chat-fill:seller_register` 자동 적용
  - 카테고리 로드 완료 직후 `consumeChatFillPayload`로 sessionStorage 페이로드 1회 소비
  - 카테고리 매칭: 정확 → 부분 → '기타' → 첫 옵션 순으로 fallback (기존 AI 자동채우기 로직과 일관성)
  - `isKamisApplied/kamisUnit`도 함께 적용 (가격 추천 타입 동기화)
  - 페이지 머무는 동안 `chat:fill-form` 이벤트 추가 처리 (사용자가 챗봇 창에서 추가 요청한 경우)
- [x] 검증: TypeScript `tsc --noEmit` 통과 (1차 narrowing 오류 1건 수정)

### Phase 4 — 추가 시나리오 (선택, 2일)
- [ ] 주문 상태 변경(수락/거절) 도구
- [ ] 판매자 상품 비활성화/삭제 도구 (CONFIRM 필수)
- [ ] 다중 상품 장바구니("사과랑 배 한 개씩 담아줘")

---

## 10. 주의사항 & 테스트 포인트

1. **인증**: 비로그인 상태에서 카트/주문 도구가 호출되면 백엔드가 401을 던진다. Tool에서 401을 잡아 NAVIGATE(`/login`) 액션으로 우아하게 처리.
2. **권한**: `list_my_products`, `list_seller_orders`는 판매자 권한이 필요하다. 403일 때는 "판매자 인증이 필요해요" 메시지 + 적절한 페이지로 안내.
3. **체크아웃 액션의 부수효과**: NAVIGATE 직후 페이지가 바뀌면 챗봇이 닫힐 수 있다. FarmBot의 모드를 `chatting` → `minimized`로 전환하지 않고 유지하도록 처리.
4. **CLARIFY 옵션 ID 전달**: 옵션 클릭 시 사용자가 보기엔 라벨이 전송되지만 백엔드 ID를 함께 보내야 한다. `sendChatMessage('부사 사과 1kg (id=11)')` 처럼 의도/ID를 텍스트에 포함시키거나, `chatMessages`에 별도 메타로 보관하고 다음 턴 metadata로 전달.
5. **테스트 케이스**: `docs/development` 산하의 e2e 시나리오 문서에 위 8장 표 기준으로 케이스를 추가하고, AI 서버는 pytest로 router/도구 단위 테스트를 둔다.
6. **Synthesizer 변형 위험**: 단일 shop_agent 라우팅에서 액션이 충분히 보존되는지, ACTION을 미리 분리하는 로직(6.2)이 모든 경로에서 동작하는지 확인.

---

## 11. 관련 문서

- `docs/architecture/shop-ai-automation.md` — 상점 도메인 AI 적용 마스터 플랜
- `docs/architecture/ai-multi-agent-plan.md` — 멀티 에이전트 전략
- `docs/development/shop-agent-implementation.md` — Shop Agent v1 구현 계획 (본 문서의 전신)
- `docs/development/chatbot-full-guide.md` — FarmBot 채팅 모드 구현 히스토리
- `docs/architecture/api-spec.md` — Shop REST API 명세
