# 🧭 FarmBot 도메인 라우팅·페이지 유도 구현 가이드

> **이 문서의 범위:** `guidance_agent`(농장·추천·재배·수익 **페이지 유도**)와 `account_agent`(로그인·이메일·프로필·내 활동·주문 **요약**)를  
> **기존 Actionable MAS** 위에 추가하는 작업입니다.  
> 챗봇 기본 연동·Shop 액션·도메인 추가 절차는 아래 문서를 따릅니다.

| 문서 | 역할 |
|------|------|
| [`chatbot-implementation-guide.md`](./chatbot-implementation-guide.md) | FarmBot UI + BFF `/api/ai/chat` 최초 연동 |
| [`chatbot-shop-integration-guide.md`](./chatbot-shop-integration-guide.md) | Action 프로토콜·Shop ReAct·디스패처 |
| [`chatbot-add-domain-agent.md`](./chatbot-add-domain-agent.md) | **도메인 에이전트 추가 표준 절차 (PART 2)** · 충돌 방지 |
| [`chatbot-upgrade-guide.md`](./chatbot-upgrade-guide.md) | FarmBot UI/UX 개선 |
| [`chatbot-full-guide.md`](./chatbot-full-guide.md) | 원스톱 복구용 (레거시 참고) |
| **본 문서** | guidance/account 도메인 설계 · QA 카탈로그 |

| 항목 | 내용 |
|------|------|
| **LLM** | `get_llm()` → `gemini-2.5-flash` (`ai/app/config.py`) |
| **액션 프로토콜** | `ai/app/models/chat.py` ↔ `frontend/lib/chat-types.ts` |
| **공통 유틸** | `ai/app/agents/shared/` (`action_token`, `split_actions`, `extract_agent_output`, `ensure_logged_in`) |

---

## 목차

1. [문서 성격 · 부록 A 안내](#1-문서-성격--부록-a-안내)
2. [현재 인프라 (풀 반영 후)](#2-현재-인프라-풀-반영-후)
3. [목표: guidance · account](#3-목표-guidance--account)
4. [설계 원칙 · 뉘앙스 대응](#4-설계-원칙--뉘앙스-대응)
5. [처리 흐름 (팀 표준)](#5-처리-흐름-팀-표준)
6. [구현 절차 (PART 2 준수)](#6-구현-절차-part-2-준수)
7. [기술 스펙](#7-기술-스펙)
8. [팀 협업 · 충돌 방지](#8-팀-협업--충돌-방지)
9. [테스트 · 로드맵](#9-테스트--로드맵)
- [부록 A. 사용자 프롬프트 카탈로그 (QA)](#부록-a-사용자-프롬프트-카탈로그-qa)
- [부록 B. orchestrator 등록 스니펫](#부록-b-orchestrator-등록-스니펫)

---

## 1. 문서 성격 · 부록 A 안내

### 1.1 이 문서에서 구현하는 것

| 구분 | 내용 |
|------|------|
| **신규 도메인** | `guidance_agent`, `account_agent` (+ 각 `tools/*.py`) |
| **오케스트레이터** | `DOMAIN_FORCE_KEYWORDS`, `DOMAIN_CONTEXT_INDICATORS`, `VALID_ROUTES`, `call_*` 래퍼, 그래프 노드 |
| **백엔드 (선택)** | account용 internal chat-summary API |
| **보강** | `farm_id` 전달, `navigation_urls` 상수, 로그인 URL에 `callbackUrl` |

### 1.2 이 문서에서 다시 만들지 않는 것

아래는 **이미 구현됨** — [`chatbot-shop-integration-guide.md`](./chatbot-shop-integration-guide.md) · [`chatbot-add-domain-agent.md`](./chatbot-add-domain-agent.md) 참고.

| 항목 | 위치 |
|------|------|
| `{ reply, actions }` 응답 | `ai/app/routers/chat.py`, BFF `app/api/ai/chat/route.ts` |
| `[ACTION:{...}]` 직렬화·파싱 | `ai/app/agents/shared/action_token.py` |
| 에이전트 출력 → 액션 추출 | `extract_agent_output()` → `pending_actions` |
| 프론트 디스패처 | `useChatActions.ts`, `useFarmBot.ts` |
| JWT 전파 | BFF `metadata.jwt` → `user_jwt_ctx` → `call_backend()` |
| Shop force routing | `orchestrator.DOMAIN_FORCE_KEYWORDS["shop_agent"]` |

### 1.3 부록 A는 “전부 구현 목록”이 아님

[부록 A](#부록-a-사용자-프롬프트-카탈로그-qa)는 **라우터 few-shot · `DOMAIN_FORCE_KEYWORDS` · QA 시트**용 예시 문장입니다.  
문장마다 `if` 분기를 두지 않고, **intent 단위로 에이전트·Tool 한 세트**가 여러 표현을 처리합니다.

| 부록 A 유형 | 비중 | 동작 |
|-------------|------|------|
| 페이지 이동·로그인 유도 | 많음 | `NAVIGATE` (`/farm/recommend`, `/login?callbackUrl=…`) |
| 챗 안 요약만 | 있음 | Tool JSON (프로필, 주문 건수, check-email) |
| 기존 도메인 답변 | 있음 | farm / balance / community / policy (이동은 보조) |

---

## 2. 현재 인프라 (풀 반영 후)

### 2.1 데이터 흐름

```
[FarmBot] useFarmBot.sendChatMessage
   │  POST /api/ai/chat { message, history, currentPath }
   ▼
[BFF] metadata.jwt (쿠키), metadata.currentPath
   ▼
[chat.py] orchestrator.ainvoke → ChatResponse(reply, actions)
   ▼
[useChatActions] NAVIGATE | FILL_FORM | TOAST | REFRESH | …
   (CLARIFY/CONFIRM/PRODUCT_LIST → FarmBot.tsx 인라인 UI)
```

### 2.2 구현 상태

| 구분 | 상태 | 비고 |
|------|:----:|------|
| Gemini 라우터·합성기 | ✅ | `get_llm()` |
| Action 프로토콜·`split_actions` | ✅ | `shared/`, `chat.py` |
| JWT · `ensure_logged_in()` | ✅ | 로그인 유도 = `NAVIGATE` `/login` |
| Shop actionable | ✅ | `shop_tools.py`, `skip_synthesis` 패턴 |
| `guidance_agent` | ✅ | `guidance_agent.py`, `tools/guidance_tools.py` |
| `account_agent` | ✅ | `account_agent.py`, `tools/account_tools.py` |
| `DOMAIN_FORCE_KEYWORDS` (guidance/account) | ✅ | `orchestrator.py` (account·guidance → shop 순) |
| `farm_id` / BFF `userId` | ⚠️ | `chat.py` metadata.farmId; BFF userId는 선택 |
| 로그인 후 `callbackUrl` 복귀 | ⚠️ | NAVIGATE만으로는 pending intent 미보존 시 끊길 수 있음 |

---

## 3. 목표: guidance · account

### 3.1 에이전트 역할 (기존 도메인과 분리)

| 에이전트 | 담당 | 기존 에이전트와 경계 |
|---------|------|---------------------|
| **`guidance_agent`** | 추천·재배 등록·수익 화면 **유도**, 재배/농장 **상태 분기** | 데이터 조회는 `farm_agent`, 시세는 `balance_agent` |
| **`account_agent`** | 로그인·이메일 조회, 프로필/주문/내 커뮤니티 **요약** | 타인 글 검색은 `community_agent`, 장터는 `shop_agent` |

### 3.2 로그인 유도 방식 (팀 컨벤션)

별도 `OPEN_LOGIN` 타입을 쓰지 않고, **공통 `auth_guard` 패턴**을 따릅니다.

```python
from app.agents.shared import ensure_logged_in, action_token

if (msg := ensure_logged_in(login_url="/login?callbackUrl=/farm/recommend")):
    return msg  # 본문 + [ACTION:NAVIGATE ...] 포함
```

프론트는 기존 `NAVIGATE` 디스패처로 처리 (`useChatActions.ts`).

---

## 4. 설계 원칙 · 뉘앙스 대응

**한 줄:** 라우팅은 넓게, 사실·URL·건수는 **Tool·코드**만.

### 4.1 라우터 우선순위 (`orchestrator.router_node`)

팀 표준 순서 — guidance/account 추가 시 **②번 dict만 보강**하면 됩니다.

```
① 멀티턴 (is_short_followup + DOMAIN_CONTEXT_INDICATORS)
② DOMAIN_FORCE_KEYWORDS (force_route)
③ LLM 라우터 (ROUTER_SYSTEM_PROMPT + few-shot)
④ general_chat
```

### 4.2 뉘앙스 4층 (부록 A와 연동)

| 층 | 구현 |
|----|------|
| ② 키워드 | `DOMAIN_FORCE_KEYWORDS["guidance_agent"]`, `["account_agent"]` |
| ③ LLM | 부록 B few-shot |
| ③ Tool | `get_farm_guidance_state`, `check_email_membership`, … |
| ④ 액션 | `action_token({"type":"NAVIGATE",...})` — 본문에 URL 노출 금지 ([add-domain-agent §2 체크리스트](./chatbot-add-domain-agent.md)) |

### 4.3 Synthesizer · 액션

- **액션형 도메인:** `call_guidance_agent` / `call_account_agent` 에서 `_agent_node_response(..., skip_synthesis=True)` 권장 ([shop 가이드 §3.3](./chatbot-shop-integration-guide.md), balance 예시 [add-domain-agent §3](./chatbot-add-domain-agent.md)).
- `pending_actions` + `chat.py`의 `split_actions`가 최종 `actions[]`를 만듦 — **합성기가 ACTION을 삭제하지 않도록** skip 우선.

### 4.4 의도 경계 (QA 시 확인)

| 사용자 말 | 라우트 |
|-----------|--------|
| 작물 추천 / 뭐 키울까 | `guidance_agent` |
| 내 농장 면적 / 재배 이력 | `farm_agent` |
| 내가 쓴 글 / 내 주문 | `account_agent` |
| 배추 재배 팁 (타인) | `community_agent` |
| 사과 시세 | `balance_agent` |

---

## 5. 처리 흐름 (팀 표준)

[`chatbot-add-domain-agent.md`](./chatbot-add-domain-agent.md) 상단 다이어그램과 동일합니다.

```
사용자 메시지
  → chat.py
  → router_node (멀티턴 → force → LLM)
  → guidance_agent | account_agent | …
  → @tool → 한글 본문 + action_token(...)
  → extract_agent_output → pending_actions
  → (skip_synthesis 시 Synthesizer 생략)
  → ChatResponse { reply, actions }
  → FarmBot 디스패처
```

---

## 6. 구현 절차 (PART 2 준수)

> 상세 코드 템플릿: [`chatbot-add-domain-agent.md` PART 2](./chatbot-add-domain-agent.md)  
> Shop 도구 패턴: [`chatbot-shop-integration-guide.md`](./chatbot-shop-integration-guide.md)

### Phase 1 — `guidance_agent`

| # | 파일 | 작업 |
|---|------|------|
| 1 | `ai/app/agents/tools/guidance_tools.py` | `@tool` — `get_farm_guidance_state`, `navigate_crop_recommend` 등 |
| 2 | `ai/app/agents/guidance_agent.py` | `create_react_agent` + 시스템 프롬프트 |
| 3 | `ai/app/agents/navigation_urls.py` | URL 상수 (단일 진실 공급원) |
| 4 | `orchestrator.py` | import, `VALID_ROUTES`, `ROUTER_SYSTEM_PROMPT`, `DOMAIN_FORCE_*`, `call_guidance_agent`, 그래프 |

**`get_farm_guidance_state` 분기 (코드 고정):**

```text
JWT 없음        → ensure_logged_in("/login?callbackUrl=/farm/recommend")
농장 없음       → NAVIGATE /farm/register
재배 없음       → NAVIGATE /farm/register
그 외           → message_key → /farm/recommend | /farm | /balance | …
```

**LLM:** `get_llm("gemini")`, `temperature=0.1~0.2` (ReAct·한국어).  
**래퍼:** `skip_synthesis=True`.

**`DOMAIN_FORCE_KEYWORDS` 예:**

```python
"guidance_agent": {
    "작물 추천", "뭐 키울", "키울 만한", "ai 추천", "추천받",
    "재배 등록", "작물 등록", "농장 등록",
    "예상 수익", "수확량", "수익 분석",
},
```

> ⚠️ shop의 「작물 등록」과 겹칠 수 있음 — 문맥상 **농장 재배**면 guidance, **장터 상품**이면 shop. 키워드는 [부록 A](#부록-a-사용자-프롬프트-카탈로그-qa)로 QA 후 조정.

### Phase 2 — `account_agent`

| # | 파일 | 작업 |
|---|------|------|
| 1 | `ai/app/agents/tools/account_tools.py` | `check_email_membership`, `get_profile_summary`, … |
| 2 | `ai/app/agents/account_agent.py` | ReAct |
| 3 | Backend (권장) | `GET /api/internal/users/{id}/chat-summary` 등 |
| 4 | `orchestrator.py` | account 등록 |

| Tool | API | 비로그인 |
|------|-----|:--------:|
| `check_email_membership` | `GET /api/users/check-email?email=` | ✅ (`call_backend` 불필요 시 직접) |
| `get_profile_summary` | internal chat-summary | ❌ `ensure_logged_in` |
| `get_my_orders_summary` | shop order internal | ❌ |
| `get_my_community_summary` | `community/me/*` | ❌ |

**LLM:** `temperature=0`, `skip_synthesis=True`.

**`DOMAIN_FORCE_KEYWORDS` 예:**

```python
"account_agent": {
    "로그인", "회원가입", "비밀번호",
    "내 프로필", "프로필 수정",
    "내 주문", "구매 내역", "배송",
    "내가 쓴 글", "내 댓글", "신고 내역",
    "가입되어", "이메일", "탈퇴",
},
```

### Phase 3 — 보강 (선택)

| 작업 | 파일 |
|------|------|
| BFF `userId` / 농장 `farmId` → orchestrator state | `chat/route.ts`, `chat.py`, `useFarmBot.ts` |
| `metadata.currentPath` → guidance 분기 | 이미 BFF 전달 중 → Tool에서 활용 |
| 로그인 후 의도 URL 복귀 | `NAVIGATE`에 `callbackUrl` 쿼리 + (선택) sessionStorage |
| 부록 A 회귀 QA | 분류율 목표 **≥90%** (단일 intent) |

---

## 7. 기술 스펙

### 7.1 Action 타입 (신규 추가 시)

기본은 [`chatbot-shop-integration-guide.md` §3](./chatbot-shop-integration-guide.md) 와 동일합니다.  
guidance/account는 대부분 **`NAVIGATE`만** 사용합니다. 카드 UI가 필요하면 `ChatAction` + `FarmBot.tsx` 분기 추가 ([add-domain-agent PART 1 §3](./chatbot-add-domain-agent.md)).

### 7.2 도구 작성 체크리스트 (팀 공통)

- [ ] `@tool` + **async**
- [ ] docstring 첫 줄 = **언제 호출하는지**
- [ ] 개인 데이터 → `ensure_logged_in()`
- [ ] 백엔드 → `call_backend()` (JWT 자동)
- [ ] URL은 `action_token` 안에만 — 본문에는 「작물 추천 페이지」 등 한글 라벨
- [ ] `[XX 성공]` 태그로 성공/실패 구분
- [ ] 한자 금지

### 7.3 URL 맵 (`navigation_urls.py`)

| intent | URL |
|--------|-----|
| 로그인 | `/login?callbackUrl={encoded}` |
| 회원가입 | `/signup` |
| 비밀번호 찾기 | `/password-reset` |
| 농장·재배 등록 | `/farm/register` |
| 내 농장 | `/farm` |
| AI 작물 추천 | `/farm/recommend` |
| 수급·시세 | `/balance` |
| 맞춤 정책 | `/policy/recommend` |
| 커뮤니티 | `/community` |
| 프로필 | `/mypage` |
| 내 게시글 / 댓글 / 신고 | `/mypage/posts`, `comments`, `reports` |
| 구매 주문 | `/mypage/history` |
| 판매 | `/mypage/seller`, `seller/orders`, `seller/register` |
| 농장 승인 | `/mypage/farm-applications` |

`farmBotScenarios.ts` 경로와 **동일**하게 유지.

### 7.4 BFF · state (보강 시)

```typescript
// useFarmBot → BFF (이미: message, history, currentPath)
// 보강 예: userId, farmId
```

```python
# chat.py orchestrator invoke
"user_id": request.userId,
"farm_id": request.metadata.get("farmId", 0) if request.metadata else 0,
```

---

## 8. 팀 협업 · 충돌 방지

[`chatbot-add-domain-agent.md` §6](./chatbot-add-domain-agent.md) 와 동일.

| 위치 | 충돌 | 권장 |
|------|------|------|
| `DOMAIN_FORCE_KEYWORDS` | 낮음 | key별로 다른 팀원이 다른 dict 항목 추가 |
| `DOMAIN_CONTEXT_INDICATORS` | 낮음 | 동일 |
| `ROUTER_SYSTEM_PROMPT` | 중간 | 카테고리 **한 줄씩** 추가, 부록 B 합의 |
| `call_*_agent` 신규 함수 | 없음 | 파일 하단 추가 |
| `get_main_orchestrator()` 엣지 | 낮음 | 노드명만 다르면 양쪽 유지 |

**워크플로:** `git pull` → `feature/guidance-account-agent` → rebase → PR 전 부록 A 스모크 QA.

**역할 분담 제안**

| 담당 | 수정 범위 |
|------|-----------|
| 도메인 팀원 | `*_agent.py`, `tools/*_tools.py` |
| 본 작업 (guidance/account) | 위 + `navigation_urls.py`, orchestrator **등록 블록** |
| orchestrator **머지 오너** | PR마다 `VALID_ROUTES`·그래프 최종 정합 |

---

## 9. 테스트 · 로드맵

### 9.1 스모크 시나리오

| ID | 입력 | 기대 |
|----|------|------|
| T1 | 비로그인 · 작물 추천 | `NAVIGATE` `/login?...` |
| T2 | 로그인 · 재배 0 · AI 추천 | `/farm/register` |
| T3 | 로그인 · 재배 있음 · 뭐 키울까 | `/farm/recommend` |
| T4 | test@x.com 가입? | check-email 텍스트 (로그인 불필요) |
| T5 | 내 주문 | 요약 + `/mypage/history` |
| T6 | 상품 등록 | `shop_agent` (guidance와 미스라우팅 없음) |

### 9.2 로드맵

| 순서 | 작업 | 규모 |
|------|------|------|
| 1 | Phase 1 `guidance_agent` | 2~3일 |
| 2 | Phase 2 `account_agent` + internal API | 3~4일 |
| 3 | Phase 3 보강 + 부록 A QA | 1~2일 |

### 9.3 1차 범위外

- 챗에서 프로필/주문 **직접 수정**
- 챗에서 **작물 추천 API 실행** (페이지 유도만)
- Gov 전용 챗과 오케스트레이터 통합

---

## 부록 A. 사용자 프롬프트 카탈로그 (QA)

> **용도:** few-shot · `DOMAIN_FORCE_KEYWORDS` 보강 · 수동 QA.  
> **R:** account **A** · guidance **G** · farm **F** · shop **S** · community **C** · policy **P** · balance **B** · general · blocked **X**

### A.1 인증·계정 (A)

| # | 프롬프트 | R | 기대 |
|---|----------|---|------|
| A1 | 로그인하고 싶어 | A | `NAVIGATE` `/login` |
| A2 | 로그인 페이지로 가줘 | A | 동일 |
| A3 | 회원가입하려면? | A | `/signup` |
| A4 | 비밀번호 찾기 | A | `/password-reset` |
| A5 | 로그아웃은? | general | 헤더 안내 |
| A6~A9 | 이메일 가입/탈퇴/복구 | A | `check_email` Tool |

### A.2 프로필 (A)

| # | 프롬프트 | R | 기대 |
|---|----------|---|------|
| P1~P5 | 내 프로필, 수정, 전화번호, 사진, 비밀번호 | A | summary + `/mypage` |

### A.3 농장·재배 (G / F)

| # | 프롬프트 | R | 기대 |
|---|----------|---|------|
| G1~G7 | 추천, 뭐 키울까, 재배/농장 등록 | G | 상태별 NAVIGATE |
| G8~G10 | 면적, 재배 작물, 파종일 | F/G | farm 데이터 + 링크 |

### A.4 수익·시세 (G / F / B)

| # | 프롬프트 | R | 기대 |
|---|----------|---|------|
| R1~R3 | 예상 수익, 수확량, 작물별 수익 | G | `/farm` |
| R4~R6 | 시세, 가격, KAMIS | B | balance |

### A.5 병해충·재배 (F / C)

| # | 프롬프트 | R | 기대 |
|---|----------|---|------|
| D1~D5 | 탄저병, 방제, 재배법, 예방 | F/C | 답변 + (선택) 링크 |

### A.6 정책 (P) · A.7 커뮤니티 (C/A) · A.8 쇼핑 (S/A)

- PO1~PL5 → `policy_agent`
- C1~CS5 → `community_agent` / M1~M4 → `account_agent`
- S1~S5, SH1~7 → `shop_agent` / `account_agent`

### A.9 구어 · A.10 복합

| # | 예 | R |
|---|-----|---|
| V1~10 | 추천, 등록, 수익, 로그인, 주문, … | 맥락별 G/A/B/P/S |
| Mx1~5 | 로그인+주문, 등록+추천, … | 우선순위: 로그인 → 데이터 → NAVIGATE |

---

## 부록 B. orchestrator 등록 스니펫

[`chatbot-add-domain-agent.md` 3단계](./chatbot-add-domain-agent.md) 와 동일 패턴.

```text
# ROUTER_SYSTEM_PROMPT 카테고리 추가
- guidance_agent: 작물 추천, 재배 등록, 내 농장·수익 화면 안내, AI 추천 페이지 유도
- account_agent: 로그인·회원가입, 이메일 가입 확인, 내 프로필·주문·게시글/댓글/신고

# VALID_ROUTES += guidance_agent, account_agent

# DOMAIN_FORCE_KEYWORDS — §6 Phase 1·2 예시 참고

# DOMAIN_CONTEXT_INDICATORS (선택)
"guidance_agent": ("추천", "재배 등록", "농장 등록", "/farm/recommend", "[ACTION:"),
"account_agent": ("프로필", "주문 내역", "내가 쓴", "/mypage"),

# few-shot
"작물 추천" / "뭐 키울까" → guidance_agent
"내 주문" / "내가 쓴 글" → account_agent
"로그인해줘" → account_agent
"내 농장 면적" → farm_agent
"감자 시세" → balance_agent
"상품 등록" → shop_agent
```

---

*문서 버전: 2026-05-19 · 팀 가이드(chatbot-add-domain-agent, shop-integration) 정합 · 풀 반영 후 인프라 기준*
