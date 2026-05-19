# FarmBot 도메인 라우팅·페이지 유도 구현 가이드

> **목적:** 사용자가 작물 추천, 재배, 로그인, 프로필, 주문, 커뮤니티 등 **FarmBalance 핵심 기능**을 챗봇에서 물어보면  
> ① 짧게 답하고 ② 필요 시 **페이지로 이동**하거나 ③ **로그인/등록을 유도**한다.  
> **구현 전 설계 문서** — 코드 변경은 이 문서의 Phase 순서를 따른다.

> **LLM 정책 (2026-05):** 챗봇 MAS(라우터·합성기·general)는 **Google Gemini 2.5 Flash** (`gemini-2.5-flash`)로 통일한다.  
> 수익 예측·작물 추천·정책 RAG 등 기존 Gemini 경로와 **동일 Provider**를 쓰며, Groq(`langchain-groq`)는 챗 경로에서 제거한다.

**관련 문서:** `chatbot-implementation-guide.md`, `chatbot-upgrade-guide.md`, `shop-agent-implementation.md`

---

## 0. LLM: Gemini 2.5 Flash (챗봇 전환)

### 0.1 목표 스택

| 구분 | 이전 (현재 코드 일부) | 이후 |
|------|----------------------|------|
| 라우터 | `get_llm("groq")` | `get_llm("gemini")` |
| 합성기 | `get_llm("groq")` | `get_llm("gemini")` |
| general_agent | `get_llm("groq")` | `get_llm("gemini")` |
| guidance / account (신규) | — | `get_llm("gemini")` |
| farm / shop / policy / balance | 이미 Gemini 또는 `LLM_PROVIDER` | **변경 없음** |
| 모델 ID | `GROQ_MODEL` | `GEMINI_MODEL=gemini-2.5-flash` |

프로젝트 기본값은 이미 `ai/app/config.py`에 맞춰져 있다.

```python
LLM_PROVIDER: str = "gemini"
GEMINI_MODEL: str = "gemini-2.5-flash"
```

### 0.2 환경 변수 (.env / Docker)

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-google-ai-studio-key
GEMINI_MODEL=gemini-2.5-flash

# (선택) 챗만 다른 Flash 변형을 쓸 때
CHAT_GEMINI_MODEL=gemini-2.5-flash
```

| 변수 | 필수 | 설명 |
|------|------|------|
| `GEMINI_API_KEY` | ✅ | Google AI Studio / Vertex API 키 |
| `GEMINI_MODEL` | ✅ | 기본 `gemini-2.5-flash` — 수익·추천·챗 공통 |
| `CHAT_GEMINI_MODEL` | 선택 | 구현 시 `config.py`에 추가; 미설정 시 `GEMINI_MODEL` 사용 |

**배포:** farm-ai 이미지 재빌드 후 `GEMINI_API_KEY` 주입. Groq 키는 챗 경로에서 더 이상 필요하지 않음(다른 용도 없으면 제거 가능).

### 0.3 코드 변경 (Phase 0보다 먼저 또는 병행)

**공통 팩토리:** `ai/app/llm/gemini.py` → `ChatGoogleGenerativeAI(model=gemini-2.5-flash)`

| 파일 | 변경 |
|------|------|
| `ai/app/agents/orchestrator.py` | `router_node`, `synthesizer_node`: `get_llm("groq")` → `get_llm("gemini")` |
| `ai/app/agents/general_agent.py` | 동일 |
| `ai/app/llm/__init__.py` | docstring: 챗봇도 gemini 기준으로 수정 |
| `ai/app/config.py` | (선택) `CHAT_GEMINI_MODEL` |
| `ai/requirements.txt` | `langchain-google-genai` 유지; `langchain-groq`는 챗 전용이면 제거 검토 |

**라우터 호출 예 (orchestrator.py):**

```python
llm = get_llm("gemini")
chat_model = llm.get_chat_model(temperature=0, max_output_tokens=256)
response = await chat_model.ainvoke([
    SystemMessage(content=ROUTER_SYSTEM_PROMPT),
    HumanMessage(content=last_message),
])
```

**합성기 호출 예:**

```python
llm = get_llm("gemini")
chat_model = llm.get_chat_model(temperature=0.5, max_output_tokens=1024)
# SYNTHESIZER_SYSTEM_PROMPT에 [ACTION:…] 보존 지침 필수 (§9)
```

### 0.4 노드별 temperature·토큰 권장

| 노드 | temperature | max_output_tokens | 이유 |
|------|-------------|-------------------|------|
| Router | `0` | 256 | 라우트 이름만, 변동 최소 |
| Synthesizer | `0.5` | 1024 | 할아버지 톤 + ACTION 보존 |
| general_agent | `0.4` | 1024 | RAG + 대화 |
| guidance_agent | `0.2` | 512 | URL·ACTION 위주, 환각 최소 |
| account_agent | `0` | 768 | Tool 결과 요약만 |

### 0.5 Gemini 특화 설계 (구멍 방지)

1. **`[ACTION:…]` 유실** — Flash는 합성 시 토큰을 줄이려 할 수 있음. 합성기 시스템 프롬프트에 「조사된 정보에 포함된 `[ACTION:{...}]` 줄은 **한 글자도 바꾸지 말고** 답변 맨 아래에 그대로 붙여라」 명시. 가능하면 **에이전트 단계에서만 ACTION 생성**, 합성기는 본문만 다듬고 ACTION은 후처리로 병합(§Phase 4).
2. **라우터 출력 형식** — 쉼표 구분 영문 라우트 유지. 분류율이 낮으면 `GeminiLLM.generate_json()` + `response_mime_type: application/json`으로 `{"routes":["farm_agent"]}` 강제(선택).
3. **한자·기호** — 기존 general/synthesizer 금지 규칙 유지(Gemini도 동일하게 지시).
4. **재시도** — 429/5xx 시 exponential backoff 2회; 실패 시 §Phase 3 규칙 프리라우터 + static fallback.
5. **비용·지연** — Flash 2.5는 Groq 대비 라우터+합성 2콜 구조에서도 허용 범위. 복수 에이전트 병렬 시 **합성 1콜**만 Gemini, 서브 에이전트는 Tool 위주면 토큰 절감.

### 0.6 의존성

```text
# requirements.txt (챗·분석 공통)
langchain-google-genai
google-generativeai
langchain-core>=0.3,<0.4

# 챗 전환 후 제거 검토
langchain-groq>=0.2.0
groq==0.25.0
```

임베딩·RAG는 기존과 같이 `langchain_google_genai` GoogleGenerativeAIEmbeddings 사용 (`ai/app/rag/embeddings.py`).

### 0.7 검증 체크리스트 (Gemini 전환)

| ID | 입력 | 기대 |
|----|------|------|
| Gm1 | 안녕 | general → 할아버지 톤, Groq 키 없이 응답 |
| Gm2 | 작물 추천해줘 | guidance(구현 후) 또는 farm, 5초 내 |
| Gm3 | 상품 등록 | shop + `[ACTION:NAVIGATE…]` 유지 |
| Gm4 | 로그 API | `GeminiLLM 초기화 완료 (모델: gemini-2.5-flash)` |
| Gm5 | GEMINI_API_KEY 미설정 | 503/명확한 에러 (farm-ai health) |

---

## 1. 현재 구조 요약

```
[FarmBot UI]  useFarmBot.ts
      │  POST { message, history }   ← userId/farmId 없음
      ▼
[BFF]         frontend/app/api/ai/chat/route.ts
      │  POST /api/chat
      ▼
[AI]          ai/app/routers/chat.py
      │  orchestrator.ainvoke({ user_id, farm_id: 0, messages })
      ▼
[LangGraph]   ai/app/agents/orchestrator.py
      Router (Gemini 2.5 Flash) → farm | shop | community | policy | balance | gov | general
      → Sub-agents (대부분 Gemini) → Tools
      → Synthesizer (Gemini 2.5 Flash) → reply: string + [ACTION:…]
```

**이미 있는 것**

| 항목 | 위치 |
|------|------|
| 멀티 에이전트 라우터 | `ai/app/agents/orchestrator.py` |
| `[ACTION:{"type":"NAVIGATE",...}]` | `ai/app/agents/tools/shop_tools.py` (shop만) |
| 농장 internal API | `GET /api/internal/farms/{id}/agent-summary` |
| 이메일 가입 조회 | `GET /api/users/check-email?email=` |
| 프로필 | `GET /api/users/me` |
| 내 커뮤니티 | `GET /api/community/me/posts|comments|reports` |
| 주문 | `GET /api/shop/order`, seller: `/api/shop/seller/order` |

**없는 것 (이번 작업으로 채움)**

| 항목 | 영향 |
|------|------|
| FarmBot이 `[ACTION:…]` 파싱 | shop 외 페이지 이동 불가 |
| BFF → AI에 `userId` / `farmId` | "내 농장/내 주문" 개인화 불가 |
| `account_agent` / `guidance_agent` | 로그인·추천 유도 전용 흐름 없음 |
| 로그인 후 `callbackUrl` / pending action | 이동 의도가 로그인 후 끊김 |

---

## 2. 목표 아키텍처 (구멍 최소화)

### 2.1 3층 모델

```
사용자 메시지
    │
    ├─ [선택] Phase 2: 규칙 프리라우터 (키워드·정규식, confidence 높을 때만)
    │
    ▼
① LLM Router (orchestrator.py)
    account_agent | guidance_agent | farm_agent | shop_agent | …
    │
    ▼
② Tools (백엔드/ BFF 호출 — 숫자·상태는 여기서만)
    check_auth_context, check_email, get_profile_summary,
    get_farm_guidance_state, get_my_orders_summary, …
    │
    ▼
③ Actions (프론트 실행용 토큰)
    NAVIGATE | OPEN_LOGIN | (기존 FILL_FORM)
    │
    ▼
Synthesizer → reply + [ACTION:…] 보존
    │
    ▼
FarmBot → parseChatResponse → router.push / 로그인
```

### 2.2 왜 에이전트를 2개만 추가하는가

| 에이전트 | 담당 | 이유 |
|---------|------|------|
| **`guidance_agent`** | 농장·재배·추천·수익·병해충 **페이지 유도** + 재배 미등록 분기 | 요구 1번 — 상태 머신 + URL이 명확 |
| **`account_agent`** | 로그인, 이메일 조회, 프로필·커뮤니티·주문 **요약** | 요구 2~6번 — 모두 `userId` + 인증 |

기존 `farm_agent` / `shop_agent` / `community_agent`는 **데이터 질의·검색**에 두고,  
「페이지 가줘」「로그인하고 싶어」는 새 에이전트가 담당하면 **라우터 프롬프트가 덜 섞인다.**

### 2.3 구멍을 줄이는 핵심 원칙

1. **이동·가입 여부·건수는 LLM이 만들지 않는다** → Tool JSON만 인용.
2. **비로그인 시 개인 데이터 질문** → 무조건 `OPEN_LOGIN` (추측 답변 금지).
3. **한국어 동의어는 라우터 예시 + (Phase 2) 규칙 프리라우터**에 넣는다.
4. **응답 스키마**에 `actions[]`를 공식화하고, 본문 `[ACTION:…]`와 병행(하위 호환).

---

## 3. 공통 스펙

### 3.1 ChatAction 타입 (프론트)

**신규:** `frontend/components/common/FarmBot/chatActions.ts`

```typescript
export type ChatAction =
  | { type: 'NAVIGATE'; url: string; label?: string }
  | { type: 'OPEN_LOGIN'; returnTo?: string; label?: string }
  | { type: 'FILL_FORM'; payload: Record<string, unknown> }; // shop 기존

export type ChatResponsePayload = {
  reply: string;           // ACTION 토큰 제거된 표시용 텍스트
  actions?: ChatAction[];
};
```

### 3.2 ACTION 문자열 규칙 (AI → 프론트)

shop과 동일하게 **한 줄에 하나**, 합성기 프롬프트에 「반드시 보존」 명시:

```text
[ACTION:{"type":"NAVIGATE","url":"/farm/recommend","label":"AI 작물 추천 보기"}]
```

**파서:** `frontend/components/common/FarmBot/parseChatActions.ts`

- 정규식: `\[ACTION:(\{.*?\})\]` (non-greedy)
- 파싱 후 `reply`에서는 토큰 제거
- `executeChatActions(actions, router)` — `NAVIGATE` → `router.push`, `OPEN_LOGIN` → pending 저장 후 `/login?callbackUrl=`

### 3.3 sessionStorage 키

| 키 | 용도 |
|----|------|
| `fb-chat-pending-action` | 로그인 후 복귀할 `ChatAction` JSON |
| `fb-chat-return-message` | (선택) 복귀 후 봇이 할 말 |

### 3.4 BFF 요청/응답 확장

**`POST /api/ai/chat` 요청**

```typescript
{
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  userId?: number;      // fb-user 쿠키 또는 /api/users/me
  farmId?: number;      // 첫 번째 승인 농장 또는 선택 농장
  isAuthenticated: boolean;
  pathname?: string;    // 현재 페이지 — 맥락용
}
```

**응답**

```typescript
{
  success: true,
  data: {
    reply: string;
    actions?: ChatAction[];
  }
}
```

**수정 파일:** `frontend/app/api/ai/chat/route.ts` — 세션 쿠키에서 userId 파싱, farm 목록 1건 조회(선택).

### 3.5 AI ChatRequest 확장

**`ai/app/routers/chat.py`**

```python
class ChatRequest(BaseModel):
    userId: int = 0
    farmId: int = 0
    isAuthenticated: bool = False
    pathname: Optional[str] = None
    message: str
    history: Optional[list[HistoryItem]] = None
    # ...
```

**`AgentState` (`orchestrator.py`)**

```python
class AgentState(TypedDict):
    messages: ...
    user_id: int
    farm_id: int
    is_authenticated: bool
    pathname: str
    next_node: str
    current_focus: str
```

---

## 4. 페이지 URL 맵 (단일 진실 공급원)

**신규:** `ai/app/agents/navigation_urls.py` (또는 `frontend/lib/chatNavigation.ts` — AI·FE 중 한곳만)

| intent | URL | 비고 |
|--------|-----|------|
| 로그인 | `/login` | `callbackUrl` 쿼리 |
| 회원가입 | `/signup` | |
| 비밀번호 찾기 | `/password-reset` | 경로 확인 후 반영 |
| 농장 등록 | `/farm/register` | |
| 내 농장 대시보드 | `/farm` | |
| AI 작물 추천 | `/farm/recommend` | |
| 수급 분석 | `/balance` | |
| 정책/보조금 | `/policy` 또는 정책 목록 경로 | |
| 커뮤니티 | `/community` | |
| 마이페이지 프로필 | `/mypage` | |
| 내 게시글 | `/mypage/posts` | |
| 내 댓글 | `/mypage/comments` | |
| 신고 내역 | `/mypage/reports` | |
| 구매 주문 | `/mypage/history` | |
| 판매자 센터 | `/mypage/seller` | |
| 판매 주문 | `/mypage/seller/orders` | |
| 상품 등록 | `/mypage/seller/register` | |

---

## 5. Phase별 구현 (권장 순서)

### Phase 0 — 인프라 (모든 기능의 전제)

| # | 작업 | 파일 |
|---|------|------|
| 0-1 | `chatActions.ts`, `parseChatActions.ts` 생성 | `frontend/components/common/FarmBot/` |
| 0-2 | `useFarmBot.sendChatMessage` — userId, isAuthenticated 전송 | `useFarmBot.ts` |
| 0-3 | BFF에서 쿠키·`/api/users/me`로 userId 채우기 | `app/api/ai/chat/route.ts` |
| 0-4 | (선택) BFF에서 `GET /api/farms/my` → farmId | 새 proxy 또는 기존 farm API |
| 0-5 | 응답 `actions` 파싱 + 버튼 UI | `FarmBot.tsx`, `FarmBot.module.css` |
| 0-6 | `OPEN_LOGIN` + `sessionStorage` + `useLogin` callbackUrl | `useLogin.ts`, `middleware.ts` |
| 0-7 | `chat.py` / `AgentState`에 auth·farm·pathname | `ai/app/routers/chat.py`, `orchestrator.py` |
| 0-8 | Synthesizer: `[ACTION:…]` 절대 삭제하지 말 것 | `orchestrator.py` `SYNTHESIZER_SYSTEM_PROMPT` |

**로그인 복귀 (`useLogin.ts` 수정 예시)**

```typescript
const searchParams = useSearchParams();
const callbackUrl = searchParams.get('callbackUrl') || '/';
// 로그인 성공 시
const pending = sessionStorage.getItem('fb-chat-pending-action');
if (pending) {
  sessionStorage.removeItem('fb-chat-pending-action');
  const action = JSON.parse(pending) as ChatAction;
  if (action.type === 'NAVIGATE') router.push(action.url);
  else router.push(callbackUrl);
} else {
  router.push(callbackUrl);
}
```

---

### Phase 1 — `guidance_agent` (작물·재배·추천·수익 유도)

#### 5.1.1 신규 파일

| 파일 | 역할 |
|------|------|
| `ai/app/agents/guidance_agent.py` | ReAct 또는 **규칙 우선** 그래프 |
| `ai/app/agents/tools/guidance_tools.py` | `get_farm_guidance_state`, `build_navigate_action` |
| `ai/app/prompts/guidance_prompt.py` | 시스템 프롬프트 |

#### 5.1.2 Tool: `get_farm_guidance_state(user_id, farm_id)`

**호출:** BFF 경유(권장) 또는 backend internal API.

**반환 예시**

```json
{
  "is_authenticated": true,
  "has_farm": true,
  "farm_id": 12,
  "has_cultivation": false,
  "crop_count": 0,
  "primary_crop_name": null,
  "recommended_url": "/farm/register",
  "message_key": "NO_CULTIVATION"
}
```

**분기 로직 (코드로 고정)**

```
if not is_authenticated → OPEN_LOGIN, returnTo=/farm/recommend
elif not has_farm → NAVIGATE /farm/register
elif not has_cultivation → NAVIGATE /farm/register (재배 작물 등록 유도)
else → intent별 URL (아래 표)
```

| message_key | NAVIGATE URL |
|-------------|--------------|
| `CROP_RECOMMEND` | `/farm/recommend` |
| `FARM_DASHBOARD` | `/farm` |
| `REVENUE` | `/farm` (수익 패널은 대시보드 탭) |
| `BALANCE_PRICE` | `/balance` |
| `POLICY` | 정책 목록 경로 |
| `PEST_GENERAL` | `/farm/recommend` 또는 RAG 요약만 |

**병해충:** 짧은 일반 답은 `farm_agent` RAG + `guidance_agent`가 「자세한 건 AI 추천」 링크.

#### 5.1.3 수정 파일

| 파일 | 변경 |
|------|------|
| `ai/app/agents/orchestrator.py` | `VALID_ROUTES`에 `guidance_agent` 추가, conditional edge, `call_guidance_agent` |
| `ai/app/agents/__init__.py` | export |

#### 5.1.4 라우터 프롬프트 추가 (orchestrator `ROUTER_SYSTEM_PROMPT`)

```text
- guidance_agent: 작물 추천, 뭐 키울까, 재배 등록, 내 농장, 예상 수익, 수확량,
  재배 계획, 병해충, 페이지로 이동, AI 추천 받고 싶다
```

---

### Phase 2 — `account_agent` (로그인·이메일·프로필·커뮤니티·주문)

#### 5.2.1 신규 파일

| 파일 | 역할 |
|------|------|
| `ai/app/agents/account_agent.py` | |
| `ai/app/agents/tools/account_tools.py` | 아래 tools |
| `ai/app/prompts/account_prompt.py` | |

#### 5.2.2 Tools

| Tool | API | 비로그인 |
|------|-----|----------|
| `check_email_membership(email)` | `GET /api/users/check-email?email=` | ✅ 허용 |
| `prompt_login(return_to?)` | — | `OPEN_LOGIN` 액션 반환 |
| `get_profile_summary(user_id)` | internal `GET /api/internal/users/{id}/summary` **신규** | ❌ |
| `get_my_community_summary(user_id)` | internal proxy to `community/me/*` | ❌ |
| `get_my_orders_summary(user_id, role=buyer\|seller)` | internal proxy to shop order APIs | ❌ |

**Backend 신규 (권장):** `InternalUserController`, `InternalAccountController`

- `GET /api/internal/users/{userId}/chat-summary`  
  → name, email, phone 유무, profileImage 유무, role, farmCount  
- `GET /api/internal/users/{userId}/orders-summary?limit=3`  
- `GET /api/internal/users/{userId}/community-summary?limit=3`  

헤더: `X-AI-Internal-Key` (farm internal과 동일 패턴).

**BFF 대안:** `POST /api/ai/chat/tools/*` — AI가 BFF만 호출 (키 노출 최소화).

#### 5.2.3 수정 파일

| 파일 | 변경 |
|------|------|
| `orchestrator.py` | `account_agent` 라우트·노드 |
| `UserController` 또는 internal | chat-summary API |

---

### Phase 3 — 규칙 프리라우터 (선택, 구멍 메우기)

**신규:** `ai/app/agents/intent_rules.py`

- 로그인/회원가입/주문/추천 등 **고빈도 패턴**을 정규식으로 먼저 매칭
- confidence ≥ 0.9 일 때만 LLM 라우터 스킵
- 애매하면 Gemini 라우터 (`get_llm("gemini")`, temperature=0)

```python
RULES = [
    (r"로그인|sign\s*in|로그인하고", "account_agent", "LOGIN"),
    (r"작물\s*추천|뭐\s*키울|키울\s*만한", "guidance_agent", "CROP_RECOMMEND"),
    (r"주문\s*내역|구매\s*내역", "account_agent", "ORDERS_BUYER"),
    # ...
]
```

---

### Phase 4 — Gemini 합성기·품질

| 작업 | 파일 |
|------|------|
| `orchestrator` / `general_agent` Groq → **Gemini 2.5 Flash** | `orchestrator.py`, `general_agent.py` |
| synthesizer에 `messages[-1]`이 아닌 **마지막 HumanMessage** 사용 | `orchestrator.py` |
| 다중 에이전트 시 ACTION 중복 제거 | synthesizer 후처리 |
| ACTION은 합성 **전** state에서 추출·합성 **후** 재부착 (Flash가 토큰 삭제 방지) | `orchestrator.py` |
| (선택) 라우터 JSON 모드 | `gemini.py` `generate_json` + orchestrator |
| `GEMINI_API_KEY`·`gemini-2.5-flash`·farm-ai **Docker 재빌드** | `.env`, `Dockerfile`, `config.py` |

---

## 6. 수정·신규 파일 체크리스트 (전체)

### Frontend

| 경로 | 신규/수정 | 내용 |
|------|-----------|------|
| `components/common/FarmBot/chatActions.ts` | 신규 | 타입 |
| `components/common/FarmBot/parseChatActions.ts` | 신규 | 파서·실행 |
| `components/common/FarmBot/useFarmBot.ts` | 수정 | context 전송, actions 처리 |
| `components/common/FarmBot/FarmBot.tsx` | 수정 | 액션 버튼 UI |
| `components/common/FarmBot/FarmBot.module.css` | 수정 | 버튼 스타일 |
| `app/api/ai/chat/route.ts` | 수정 | userId, farmId, actions |
| `app/(auth)/login/useLogin.ts` | 수정 | callbackUrl, pending action |
| `lib/chatAuth.ts` (선택) | 신규 | 쿠키에서 user 파싱 |

### AI (farm-ai)

| 경로 | 신규/수정 | 내용 |
|------|-----------|------|
| `app/agents/orchestrator.py` | 수정 | 라우트·state·synthesizer·**Gemini 전환** |
| `app/agents/general_agent.py` | 수정 | **get_llm("gemini")** |
| `app/config.py` | 수정 | (선택) `CHAT_GEMINI_MODEL` |
| `app/llm/gemini.py` | 참고 | `ChatGoogleGenerativeAI`, `generate_json` |
| `app/agents/guidance_agent.py` | 신규 | |
| `app/agents/account_agent.py` | 신규 | |
| `app/agents/tools/guidance_tools.py` | 신규 | |
| `app/agents/tools/account_tools.py` | 신규 | |
| `app/agents/navigation_urls.py` | 신규 | URL 상수 |
| `app/agents/intent_rules.py` | 신규 | (선택) |
| `app/prompts/guidance_prompt.py` | 신규 | |
| `app/prompts/account_prompt.py` | 신규 | |
| `app/routers/chat.py` | 수정 | request fields |

### Backend

| 경로 | 신규/수정 | 내용 |
|------|-----------|------|
| `farm/.../InternalFarmController.java` | 수정 | chat용 요약 필드 추가 가능 |
| `user/.../InternalUserChatController.java` | 신규 | profile/order/community summary |
| `SecurityConfig` | 수정 | internal 경로 AI 키 |

---

## 7. 사용자 프롬프트 카탈로그 (최대한 많은 요청)

> 라우터 few-shot 예시·규칙 프리라우터·QA 테스트에 그대로 사용.  
> **R:** 라우트, **G:** guidance, **A:** account, **F:** farm, **S:** shop, **C:** community, **P:** policy, **B:** balance, **X:** blocked

### 7.1 인증·계정 (A)

| # | 사용자 프롬프트 예시 | R | 기대 동작 |
|---|---------------------|---|-----------|
| A1 | 로그인하고 싶어 | A | OPEN_LOGIN |
| A2 | 로그인 페이지로 가줘 | A | NAVIGATE `/login` |
| A3 | 회원가입하려면? | A | NAVIGATE `/signup` |
| A4 | 비밀번호 찾기 / 비밀번호 재설정 | A | NAVIGATE password-reset |
| A5 | 로그아웃은 어떻게 해? | general | 헤더 안내 (챗에서 로그아웃 X) |
| A6 | `user@mail.com` 가입되어 있어? | A | check_email tool |
| A7 | 이 이메일 쓸 수 있어? `test@test.com` | A | available / exists / withdrawn |
| A8 | 예전에 탈퇴했는데 같은 이메일로 가입 | A | withdrawn → reactivate 안내 + signup/login |
| A9 | 내 계정 복구해줘 | A | reactivate 플로우 안내 |

### 7.2 프로필 (A)

| # | 사용자 프롬프트 예시 | R | 기대 동작 |
|---|---------------------|---|-----------|
| P1 | 내 프로필 보여줘 | A | get_profile_summary |
| P2 | 프로필 수정하고 싶어 | A | 요약 + NAVIGATE `/mypage` |
| P3 | 전화번호 안 넣었어? | A | summary 필드 누락 표시 |
| P4 | 프로필 사진 바꾸기 | A | NAVIGATE mypage |
| P5 | 비밀번호 변경 | A | NAVIGATE mypage (비밀번호 섹션) |

### 7.3 농장·재배 등록 (G)

| # | 사용자 프롬프트 예시 | R | 기대 동작 |
|---|---------------------|---|-----------|
| G1 | 작물 추천해줘 | G | 상태 확인 → `/farm/recommend` |
| G2 | 뭐 키우면 좋을까 | G | 동일 |
| G3 | 우리 농장에 맞는 작물 | G | farmId 필요, 없으면 등록 유도 |
| G4 | AI 추천 받고 싶어 | G | NAVIGATE recommend |
| G5 | 재배 작물 등록 | G | NO_CULTIVATION → `/farm/register` |
| G6 | 작물 등록 안 했어 | G | 등록 유도 |
| G7 | 농장 등록 방법 | G | `/farm/register` |
| G8 | 내 농장 면적 알려줘 | F | farm_agent (데이터) |
| G9 | 재배 중인 작물 뭐 있어 | F / G | farm summary |
| G10 | 파종일 언제가 좋아 (작물명) | F | farm + recommend 링크 |

### 7.4 수익·수확·시세 (G / F / B)

| # | 사용자 프롬프트 예시 | R | 기대 동작 |
|---|---------------------|---|-----------|
| R1 | 예상 수익 알려줘 | G | `/farm` 대시보드 |
| R2 | 수확량 얼마나 나올까 | G | 동일 |
| R3 | 고추 수익 예측 | G | 작물 있으면 farm 패널 |
| R4 | 사과 시세 어때 | B | balance_agent + `/balance` |
| R5 | 감자 가격 | B | balance |
| R6 | KAMIS 시세 | B | balance |

### 7.5 병해충·재배 방법 (F / G / C)

| # | 사용자 프롬프트 예시 | R | 기대 동작 |
|---|---------------------|---|-----------|
| D1 | 고추 탄저병 | F/C | 2~3문장 + recommend/farm |
| D2 | 배추 김씨병 방제 | C | community 검색 + 링크 |
| D3 | 토마토 재배 방법 | C / F | 노하우 검색 |
| D4 | 병충해 예방 | C | community |
| D5 | 약 뿌리는 시기 | F/C | 짧은 답 + 전문 페이지 |

### 7.6 정책·보조금 (P)

| # | 사용자 프롬프트 예시 | R | 기대 동작 |
|---|---------------------|---|-----------|
| PO1 | 보조금 뭐 있어 | P | policy_agent |
| PO2 | 지원금 신청 | P | policy + NAVIGATE |
| PO3 | 청년 농업인 지원 | P | policy |

### 7.7 커뮤니티 — 검색 vs 내 활동 (C / A)

| # | 사용자 프롬프트 예시 | R | 기대 동작 |
|---|---------------------|---|-----------|
| C1 | 배추 재배 팁 있어? | C | community 검색 |
| C2 | 다른 농가 의견 | C | 검색 |
| M1 | 내가 쓴 글 | A | community-summary + `/mypage/posts` |
| M2 | 내 댓글 목록 | A | `/mypage/comments` |
| M3 | 신고한 내역 | A | `/mypage/reports` |
| M4 | 내 게시글 몇 개야 | A | count만 채팅 |

### 7.8 쇼핑·주문 (S / A)

| # | 사용자 프롬프트 예시 | R | 기대 동작 |
|---|---------------------|---|-----------|
| S1 | 상품 등록하고 싶어 | S | NAVIGATE seller/register |
| S2 | 옥수수 팔고 싶어 | S | shop autofill |
| S3 | 내 주문 내역 | A | orders-summary + `/mypage/history` |
| S4 | 배송 어디까지 왔어 | A | 최근 1건 요약 |
| S5 | 판매 주문 확인 | A | seller orders + `/mypage/seller/orders` |

### 7.9 일반·인사 (general)

| # | 사용자 프롬프트 예시 | R | 기대 동작 |
|---|---------------------|---|-----------|
| Z1 | 안녕 할아버지 | general | 인사 |
| Z2 | 뭐 할 수 있어? | general | 기능 목록 + 예시 질문 |
| Z3 | 도움말 | general | 카테고리 안내 |

### 7.10 차단 (blocked_guard)

| # | 사용자 프롬프트 예시 | R |
|---|---------------------|---|
| X1 | ○○농장 주인 전화번호 | blocked |
| X2 | 다른 농가 개인정보 | blocked |

### 7.11 구어·오타·짧은 말 (라우터 견고성)

| # | 사용자 프롬프트 예시 | R |
|---|---------------------|---|
| V1 | 추천 | G |
| V2 | 등록 | G (맥락: 재배/농장) |
| V3 | 수익 | G |
| V4 | 로그인 | A |
| V5 | 주문 | A |
| V6 | 프로필 | A |
| V7 | 시세 | B |
| V8 | 보조금 | P |
| V9 | 팔래요 / 팔고싶어 | S |
| V10 | 글 | A (내 글) 또는 C (검색) — 이전 턴 맥락 |

### 7.12 농장 등록·인증 (G / general)

| # | 사용자 프롬프트 예시 | R | 기대 동작 |
|---|---------------------|---|-----------|
| F1 | 농업인 인증 어떻게 해 | general | 인증 안내 + `/mypage/farm-applications` |
| F2 | 농장 승인 됐는지 | A / general | farm-applications |
| F3 | 농장 여러 개 등록 | G | register 안내 |
| F4 | 면적 입력 | G | `/farm/register` |
| F5 | 작물 추가 | G | register |
| F6 | 내 농장 대시보드 | G | `/farm` |
| F7 | 날씨 보여줘 | F | farm_agent (데이터) |
| F8 | AI 분석 리포트 | G | `/farm` |
| F9 | 대표 작물 바꾸기 | F | (향후 primary crop 설정) |
| F10 | 수익 분석받기 | G | `/farm` + 분석받기 안내 |

### 7.13 쇼핑·장바구니 (S)

| # | 사용자 프롬프트 예시 | R |
|---|---------------------|---|
| SH1 | 장바구니 | S → `/shop/cart` (경로 확인) |
| SH2 | 양평 고구마 사고 싶어 | S (검색 유도) |
| SH3 | 직거래 | S |
| SH4 | 판매자 등록 | S |
| SH5 | 내 상품 목록 | A + `/mypage/seller` |
| SH6 | 배송비 | S / general |
| SH7 | 환불 | A (주문) + 정책 안내 |

### 7.14 커뮤니티 검색 확장 (C)

| # | 사용자 프롬프트 예시 | R |
|---|---------------------|---|
| CS1 | 비료 추천 글 있어? | C |
| CS2 | 온실 재배 후기 | C |
| CS3 | 농약 사용법 | C |
| CS4 | 양평 농가 수다 | C |
| CS5 | 질문 올리고 싶어 | C → `/community` 작성 유도 |

### 7.15 정책·행정 (P)

| # | 사용자 프롬프트 예시 | R |
|---|---------------------|---|
| PL1 | 농업 지원금 | P |
| PL2 | 교육 프로그램 | P |
| PL3 | 양평군 정책 | P |
| PL4 | 맞춤 정책 추천 | P → `/policy/recommend` |
| PL5 | 신청 기한 | P |

### 7.16 복합·연속 의도 (합성기 QA)

| # | 사용자 프롬프트 예시 | 처리 순서 |
|---|---------------------|-----------|
| Mx1 | 로그인하고 내 주문 보여줘 | account → OPEN_LOGIN → (복귀) orders |
| Mx2 | 농장 등록하고 작물 추천 | guidance: register → recommend |
| Mx3 | 고추 키우는데 수익이랑 시세 | farm + balance 링크 |
| Mx4 | 이메일 확인하고 가입 | check_email → signup |
| Mx5 | 프로필 고치고 상품 올릴게 | mypage → seller/register |

### 7.17 기존 FarmBot 시나리오와의 관계

페이지 가이드(툴팁)는 **`frontend/components/common/FarmBot/farmBotScenarios.ts`** 에 정의되어 있다.  
챗봇 `NAVIGATE` URL은 §4 표와 **동일 경로**를 쓰면 사용자가 가이드 모드와 챗 모드에서 같은 화면으로 도착한다.

---

## 8. 라우터 Few-shot 블록 (orchestrator에 붙여넣기)

```text
"로그인해줘" → account_agent
"test@a.com 가입됐어?" → account_agent
"내 프로필" → account_agent
"내 주문" → account_agent
"내가 쓴 글" → account_agent
"작물 추천" → guidance_agent
"뭐 키울까" → guidance_agent
"재배 작물 등록" → guidance_agent
"예상 수익" → guidance_agent
"탄저병" → farm_agent, guidance_agent
"보조금" → policy_agent
"감자 시세" → balance_agent
"상품 등록" → shop_agent
"배추 재배 팁" → community_agent
"안녕" → general_chat
```

**복합 질문**

```text
"로그인해서 작물 추천받고 싶어" → account_agent, guidance_agent
(합성기: 로그인 먼저 안내 → 로그인 후 추천 페이지)
```

---

## 9. 에이전트별 시스템 프롬프트 요지

### guidance_agent (Gemini 2.5 Flash)

- `get_llm("gemini")`, `temperature=0.2` — Tool·URL 위주, 환각 최소.
- Tool 결과의 `message_key`, `recommended_url`을 반드시 따른다.
- 재배 미등록 시 추천 실행 금지, 등록 페이지만 안내.
- 본문 2~4문장 + `[ACTION:…]` 1개.
- URL은 `navigation_urls.py`만 사용.

### account_agent (Gemini 2.5 Flash)

- `get_llm("gemini")`, `temperature=0` — 이메일·건수는 Tool JSON만 인용.
- 이메일은 반드시 `check_email_membership` 결과만 말한다.
- 프로필/주문/커뮤니티는 로그인 필수.
- summary: ✅/⚠️ 리스트 형식.
- 「자세히 보기」→ NAVIGATE.

### synthesizer (Gemini 2.5 Flash)

- 모든 `[ACTION:…]` 토큰을 **원문 그대로** 포함 (Flash가 요약할 때 잘릴 수 있어 §0.5 후처리 병합 권장).
- 여러 에이전트 답을 할아버지 말투로 1개로 합침.
- 로그인이 필요하면 먼저 로그인 유도.
- `temperature=0.5`, `max_output_tokens=1024` — 톤과 ACTION 길이 균형.

---

## 10. FarmBot UI 동작

1. 봇 메시지 아래 **액션 버튼** (최대 2개): `label` 표시  
2. `NAVIGATE` → `router.push(url)`  
3. `OPEN_LOGIN` → pending 저장 → `/login?callbackUrl=현재경로`  
4. (선택) 자동 이동은 하지 않음 — 사용자 클릭 권장  

**비로그인 시 개인 질문 예시 문구**

```text
로그인하시면 우리 농장 기준으로 추천·주문 내역을 볼 수 있어요.
[로그인하기]
```

---

## 11. 테스트 시나리오

| ID | 조건 | 입력 | 기대 |
|----|------|------|------|
| T1 | 비로그인 | 작물 추천해줘 | OPEN_LOGIN 또는 로그인 후 recommend |
| T2 | 로그인, 재배 0 | AI 추천 | `/farm/register` 유도 |
| T3 | 로그인, 재배 있음 | 작물 추천 | `/farm/recommend` 버튼 |
| T4 | 비로그인 | 내 주문 | 로그인 유도, 주문 숫자 X |
| T5 | 로그인 | 내 주문 | 3건 요약 + history 링크 |
| T6 | any | test@x.com 가입? | check-email 결과 |
| T7 | 로그인 | 프로필 | 필드 summary + mypage |
| T8 | shop | 상품 등록 | seller/register ACTION |
| T9 | 로그인 후 | pending action | recommend 등 복귀 |

---

## 12. 보안·운영

- **비밀번호 저장/자동입력:** 챗에서 구현하지 않음. 로그인 폼 `autocomplete` + 브라우저 비밀번호 관리자.
- **check-email:** rate limit (IP/분당 N회).
- **internal API:** `X-AI-Internal-Key` + 네트워크 격리.
- **PII 로그:** 이메일·주문 ID 마스킹.
- **Gemini 실패 (429/5xx/키 오류):** 2회 재시도 후 규칙 프리라우터 + static fallback; API 키는 서버 env만, 클라이언트 노출 금지.
- **할당량:** Google AI Studio RPM/RPD 모니터링; 피크 시 라우터만 규칙 프리라우터로 단축 가능.

---

## 13. 구현하지 않을 것 (1차 범위 밖)

- 챗에서 프로필/주문 **직접 수정**
- 챗에서 **작물 추천 API 실행** (페이지로만 유도)
- **비밀번호·이메일을 챗에 저장**
- Gov 전용 챗(`GovAiPanel`)과 오케스트레이터 통합 (별 스택 유지)

---

## 14. 예상 공수 (참고)

| Phase | 내용 | 규모 |
|-------|------|------|
| **0-G** | Groq → **Gemini 2.5 Flash** (orchestrator, general) | 0.5~1일 |
| 0 | 인프라·ACTION·로그인 복귀 | 2~3일 |
| 1 | guidance_agent + farm state API | 2~3일 |
| 2 | account_agent + internal APIs | 3~4일 |
| 3 | 규칙 프리라우터 + QA | 1~2일 |
| 4 | ACTION 후처리·라우터 JSON (선택) | 1일 |

---

## 15. 다음 단계

1. **Phase 0-G** — `orchestrator.py` / `general_agent.py`를 `get_llm("gemini")` + `gemini-2.5-flash`로 전환, farm-ai 재배포, §0.7 Gm1~Gm5 확인  
2. Phase 0 PR — ACTION 파싱만으로도 shop NAVIGATE 동작 확인  
3. `InternalUserChatController` API 스펙 팀 합의  
4. §7 프롬프트 표로 QA 시트 작성 (엑셀/노션)  
5. 라우터 few-shot(§8) 반영 후 **Gemini 라우터 분류율** 측정 (목표: 단일 의도 ≥90%)  

---

*문서 버전: 2026-05-19 · LLM: **Gemini 2.5 Flash** (`gemini-2.5-flash`) · 챗 Groq 제거 예정*
