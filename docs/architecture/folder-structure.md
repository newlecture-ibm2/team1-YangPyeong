# 📁 FarmBalance 폴더 구조 가이드 (v4)

> **최종 수정일**: 2026-04-23
> **구조 방식**: Backend(헥사고날) + Frontend(코로케이션) + AI(멀티 LLM)

---

## 1. 전체 모노레포 구조

```
team1-YangPyeong/
├── backend/          ← Spring Boot (헥사고날)
├── frontend/         ← Next.js 15 (BFF + 코로케이션)
├── ai/               ← FastAPI + 멀티 LLM + Agent + RAG
├── docs/             ← 기획문서, UI 목업, 아키텍처 가이드
├── docker-compose.yml
└── .gitignore
```

| 영역 | 기술 스택 | 설계 방식 |
|------|-----------|-----------|
| **Backend** | Java 21, Spring Boot 3.3.x, JPA, Gradle | 헥사고날 아키텍처 (Ports & Adapters) |
| **Frontend** | Next.js 15 (App Router), React 19, TS 5 | BFF 패턴 + 코로케이션 |
| **AI** | Python 3.12+, FastAPI, Gemini/Groq/Bedrock | app/ 패키지 + LLM 추상화 + Agent + RAG |

---

## 2. Backend — 헥사고날 아키텍처

### 2.1 폴더 구조

```
backend/
├── build.gradle
├── settings.gradle
├── Dockerfile
└── src/main/
    ├── java/com/farmbalance/
    │   │
    │   ├── FarmBalanceApplication.java
    │   │
    │   ├── global/                              ← 전역 공통
    │   │   ├── config/
    │   │   │   ├── SecurityConfig.java          ← Spring Security
    │   │   │   ├── CorsConfig.java              ← CORS 설정
    │   │   │   ├── JpaConfig.java               ← JPA Auditing
    │   │   │   └── RedisConfig.java             ← Redis 연결
    │   │   ├── error/
    │   │   │   ├── ErrorCode.java               ← E-[역할]-[기능]-[번호]
    │   │   │   ├── BusinessException.java       ← 비즈니스 예외
    │   │   │   └── GlobalExceptionHandler.java  ← @RestControllerAdvice
    │   │   ├── response/
    │   │   │   ├── ApiResponse.java             ← 공통 응답 래퍼
    │   │   │   └── PageResponse.java            ← 페이징 응답
    │   │   ├── security/
    │   │   │   ├── JwtTokenProvider.java
    │   │   │   └── JwtAuthenticationFilter.java
    │   │   └── util/
    │   │       └── CorrelationIdFilter.java     ← X-Correlation-Id
    │   │
    │   ├── user/                                ← ── 도메인 ──
    │   │   ├── adapter/
    │   │   │   ├── in/web/                      ← Driving Adapter
    │   │   │   │   ├── dto/
    │   │   │   │   │   ├── SignUpRequest.java
    │   │   │   │   │   └── SignUpResponse.java
    │   │   │   │   └── AuthController.java
    │   │   │   └── out/persistence/             ← Driven Adapter
    │   │   │       ├── entity/
    │   │   │       │   └── UserJpaEntity.java
    │   │   │       ├── repository/
    │   │   │       │   └── UserJpaRepository.java
    │   │   │       └── UserPersistenceAdapter.java
    │   │   ├── application/
    │   │   │   ├── port/
    │   │   │   │   ├── in/                      ← Input Port
    │   │   │   │   │   ├── SignUpUseCase.java
    │   │   │   │   │   └── LoginUseCase.java
    │   │   │   │   └── out/                     ← Output Port
    │   │   │   │       └── UserRepository.java
    │   │   │   └── service/
    │   │   │       └── AuthService.java
    │   │   └── domain/
    │   │       ├── User.java
    │   │       ├── Role.java
    │   │       └── UserStatus.java
    │   │
    │   ├── farm/        ← 동일 구조 (adapter / application / domain)
    │   ├── crop/
    │   ├── balance/
    │   ├── shop/
    │   ├── community/
    │   ├── policy/      ← adapter/out/external/ 추가 (FastAPI 호출)
    │   ├── store/
    │   └── admin/
    │
    └── resources/
        ├── application.yml
        ├── application-dev.yml
        └── application-prod.yml
```

### 2.2 도메인 목록

| 도메인 | 패키지 | 핵심 엔티티 | 특이사항 |
|--------|--------|-------------|----------|
| **user** | `com.farmbalance.user` | User, Role | 인증/인가 |
| **farm** | `com.farmbalance.farm` | Farm, SeedRegistration, CropPlan, Harvest | 농장 라이프사이클 전체 |
| **crop** | `com.farmbalance.crop` | Crop | 작물 마스터 데이터 |
| **balance** | `com.farmbalance.balance` | BalanceData, BalanceStatus | 수급 계산 엔진 |
| **shop** | `com.farmbalance.shop` | Product, Order | 상점 |
| **community** | `com.farmbalance.community` | Post, Comment | 게시판 |
| **policy** | `com.farmbalance.policy` | PolicyData, PolicyMatch | `out/external/` 포함 |
| **store** | `com.farmbalance.store` | Store | 가게 정보 (Kakao API 연동, DB 엔티티 없음) |
| **admin** | `com.farmbalance.admin` | — | 관리 기능 (서비스 조합) |

### 2.3 헥사고날 규칙

```
                ┌── adapter/in/web ──┐
                │   (Controller)     │
                │        │ 호출      │
                │        ▼           │
                │  port/in (UseCase) │
                │        │ 구현      │
  HTTP 요청 ───→│    service         │───→ DB / 외부 API
                │        │ 호출      │
                │        ▼           │
                │  port/out (Repo)   │
                │        │ 구현      │
                │        ▼           │
                └── adapter/out/     ┘
                   persistence
```

| 규칙 | 설명 |
|------|------|
| ✅ `domain/` → 어디에도 의존 X | 순수 Java, Spring 어노테이션 금지 |
| ✅ `application/` → `domain/`만 의존 | UseCase + Port 정의 |
| ✅ `adapter/` → `application/` + `domain/` 의존 | 프레임워크 의존 허용 |
| ❌ `domain/` → `application/` | **의존 금지** |
| ❌ `application/` → `adapter/` | **의존 금지** |

### 2.4 out Adapter 유형

| 경로 | 역할 | 사용 도메인 |
|------|------|-------------|
| `out/persistence/` | DB 접근 (JPA) | 모든 도메인 |
| `out/external/` | 외부 API 호출 | policy (FastAPI 호출) |
| `out/messaging/` | 메시지 큐 (필요 시) | 향후 확장 |

---

## 3. Frontend — 코로케이션(Co-location) 방식

### 3.1 코로케이션이란?

**한 기능에 필요한 모든 파일을 해당 라우트 폴더 안에 배치**하는 방식입니다.

| 비교 | 분리형 (`app/` + `domains/`) | 코로케이션 (`app/` 안에 모두) |
|------|:---:|:---:|
| 하나의 기능 수정 시 | 2곳 이동 | **1곳에서 끝** |
| 파일 찾기 | 헷갈림 | **바로 옆에 있음** |
| 6명 소규모 팀 | 과도한 복잡도 | **⭐ 빠른 개발에 유리** |

### 3.2 폴더 구조

```
frontend/
├── package.json
├── next.config.ts
├── tsconfig.json
├── Dockerfile
│
├── public/
│   └── images/
│
├── app/
│   ├── layout.tsx                            ← 루트 레이아웃
│   ├── page.tsx                              ← 랜딩 (/)
│   │
│   ├── api/                                  ← 🔐 BFF 레이어
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── signup/route.ts
│   │   │   └── logout/route.ts
│   │   ├── farm/
│   │   │   ├── route.ts
│   │   │   └── seed/route.ts
│   │   ├── balance/route.ts
│   │   ├── recommend/route.ts
│   │   ├── community/route.ts
│   │   ├── shop/route.ts
│   │   ├── policy/route.ts
│   │   ├── gov/route.ts
│   │   └── admin/route.ts
│   │
│   ├── (auth)/                               ← 인증 라우트 그룹
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   │
│   ├── (main)/                               ← 일반유저/농부 라우트 그룹
│   │   ├── layout.tsx                        ← 공통 레이아웃 (Header, Sidebar)
│   │   │
│   │   ├── farm/                             ← 🌾 농장 도메인
│   │   │   ├── page.tsx                      ← /farm
│   │   │   ├── useFarm.ts                    ← 훅은 사용하는 파일과 같은 폴더
│   │   │   ├── _lib/
│   │   │   │   ├── farm.api.ts
│   │   │   │   └── farm.types.ts
│   │   │   ├── _components/
│   │   │   │   ├── FarmCard.tsx
│   │   │   │   ├── FarmCard.module.css
│   │   │   │   └── useFarmCard.ts              ← 컴포넌트 전용 훅도 같은 폴더
│   │   │   ├── register/page.tsx
│   │   │   ├── seed/
│   │   │   │   ├── page.tsx
│   │   │   │   └── useSeedForm.ts             ← seed 전용 훅도 같은 폴더
│   │   │   ├── plan/page.tsx
│   │   │   └── harvest/page.tsx
│   │   │
│   │   ├── balance/                          ← 📊 밸런스
│   │   │   ├── page.tsx
│   │   │   ├── useBalance.ts
│   │   │   ├── [cropCode]/page.tsx
│   │   │   ├── _lib/
│   │   │   └── _components/
│   │   │
│   │   ├── recommend/                        ← 🤖 AI 추천
│   │   │   ├── page.tsx
│   │   │   ├── useRecommend.ts
│   │   │   ├── [cropCode]/page.tsx
│   │   │   └── _lib/
│   │   │
│   │   ├── shop/                             ← 🛒 상점
│   │   │   ├── page.tsx
│   │   │   ├── useProducts.ts                ← 훅 = 사용하는 파일과 같은 폴더
│   │   │   ├── [productId]/
│   │   │   │   ├── page.tsx
│   │   │   │   └── useProductDetail.ts
│   │   │   ├── cart/
│   │   │   │   ├── page.tsx
│   │   │   │   └── useCart.ts
│   │   │   ├── checkout/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── seller/{page,orders/page}.tsx
│   │   │   └── _lib/
│   │   │
│   │   ├── community/                        ← 💬 커뮤니티
│   │   │   ├── page.tsx
│   │   │   ├── useCommunity.ts
│   │   │   ├── [postId]/page.tsx
│   │   │   ├── write/page.tsx
│   │   │   └── _lib/
│   │   │
│   │   ├── policy/                           ← 📜 정책 매칭
│   │   ├── stores/                           ← 📍 가게 정보
│   │   └── mypage/                           ← 👤 마이페이지
│   │       ├── page.tsx
│   │       ├── useProfile.ts                 ← 프로필 훅
│   │       ├── _lib/
│   │       ├── _components/
│   │       └── seller/
│   │           ├── page.tsx
│   │           └── useSellerProducts.ts
│   │
│   ├── admin/                                ← ⚙️ 관리자
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── useAdmin.ts
│   │   ├── users/page.tsx
│   │   ├── approvals/page.tsx
│   │   └── _lib/
│   │
│   └── gov/                                  ← 📈 지자체
│       ├── layout.tsx
│       ├── page.tsx
│       ├── useGovUser.ts
│       ├── compare/page.tsx
│       ├── cultivation/page.tsx
│       └── _lib/
│
├── components/                               ← 🧩 공유 UI (도메인 무관)
│   ├── common/                               ← Button, Input, Modal, Card 등
│   └── layout/                               ← Header, Sidebar, Footer
│
├── lib/                                      ← 🔧 전역 유틸
│   ├── api-client.ts                         ← fetch 래퍼
│   ├── cookie.ts                             ← httpOnly 쿠키
│   └── constants.ts
│
└── styles/
    ├── globals.css
    ├── variables.css
    └── reset.css
```

### 3.3 Next.js 15 App Router 공식 규칙

#### 라우팅 파일 (자동 인식)

| 파일명 | 역할 |
|--------|------|
| `page.tsx` | 페이지 컴포넌트 |
| `layout.tsx` | 공유 레이아웃 |
| `loading.tsx` | 로딩 UI |
| `error.tsx` | 에러 UI |
| `not-found.tsx` | 404 UI |
| `route.ts` | API Route Handler |

#### 특수 폴더 규칙

| 문법 | 역할 | 예시 |
|------|------|------|
| `_폴더명` | **비공개 폴더** (라우트 제외) | `_lib/`, `_components/` |
| `(그룹명)` | **라우트 그룹** (URL 미포함) | `(auth)/`, `(main)/` |
| `[param]` | **동적 라우트** | `[cropCode]/`, `[postId]/` |

#### `_` 접두사 = 라우트 제외 / Hook 파일은 사용처와 같은 폴더 배치

```
farm/
├── page.tsx           ← ✅ /farm 으로 접근 가능
├── useFarm.ts         ← page.tsx에서 사용하는 훅 → 같은 폴더
├── _lib/              ← ❌ 라우트 아님 (API, 타입 등)
├── _components/
│   ├── FarmCard.tsx   ← 도메인 전용 컴포넌트
│   └── useFarmCard.ts ← FarmCard에서 사용하는 훅 → 같은 폴더
└── register/
    └── page.tsx       ← ✅ /farm/register 로 접근 가능
```

| 파일 종류 | 위치 | 예시 |
|-----------|------|------|
| **Hook** | **사용하는 파일과 같은 폴더** | `farm/useFarm.ts`, `_components/useFarmCard.ts` |
| API 호출 함수 | `해당 도메인/_lib/` | `farm/_lib/farm.api.ts` |
| 타입 정의 | `해당 도메인/_lib/` | `farm/_lib/farm.types.ts` |
| 도메인 전용 UI | `해당 도메인/_components/` | `farm/_components/FarmCard.tsx` |
| 공유 UI 컴포넌트 | 루트 `components/common/` | `components/common/Button/` |
| 전역 유틸 | 루트 `lib/` | `lib/api-client.ts` |

> ⚠️ **`_hooks/` 폴더는 사용하지 않습니다.** 훅 파일(`useXxx.ts`)은 그것을 **사용하는 파일**(page, component 등)과 동일한 디렉터리에 배치합니다.
>
> 예: `FarmCard.tsx`가 `useFarmCard.ts`를 사용한다면, 둘 다 `_components/` 안에 나란히 배치합니다.

> 다른 도메인의 데이터가 필요하면 **API를 통해 조회**하거나, **공유 `lib/`로 올린다.**

### 3.5 BFF 데이터 흐름

```
[브라우저 Page]
    │  farm/useFarm.ts
    │  → farm/_lib/farm.api.ts
    │  → fetch('/api/farm')
    ▼
[app/api/farm/route.ts]          ← httpOnly 쿠키에서 JWT 추출
    │  Authorization: Bearer {jwt}
    ▼
[Spring Boot API Server]         ← 실제 비즈니스 처리
    │  ApiResponse<T> 반환
    ▼
[app/api/farm/route.ts]          ← 응답 가공
    ▼
[브라우저 Page]                   ← 렌더링
```

---

## 4. AI — FastAPI + 멀티 LLM + Agent + RAG

> 상세 가이드: [docs/ai-architecture.md](./ai-architecture.md)

### 4.1 폴더 구조

```
ai/
├── app/                              ← Python 패키지
│   ├── __init__.py
│   ├── main.py                       ← FastAPI 엔트리
│   ├── config.py                     ← 환경변수
│   │
│   ├── models/                       ← Pydantic 요청/응답
│   ├── routers/                      ← API 엔드포인트
│   ├── services/                     ← 비즈니스 로직
│   │
│   ├── agents/                       ← 🤖 에이전트 오케스트레이션
│   │   ├── farm_agent.py
│   │   ├── policy_agent.py
│   │   └── tools/                    ← 에이전트 도구
│   │
│   ├── llm/                          ← 🔌 LLM Provider 추상화
│   │   ├── base.py                   ← 추상 베이스
│   │   ├── gemini.py                 ← Gemini 1.5 Flash
│   │   ├── groq.py                   ← Groq
│   │   └── bedrock.py                ← AWS Bedrock
│   │
│   └── rag/                          ← 📚 RAG 파이프라인
│       ├── vectorstore.py
│       ├── embeddings.py
│       ├── retriever.py
│       └── ingestion.py
│
├── scripts/                          ← 유틸리티 스크립트
├── data/policies/                    ← RAG 소스 데이터
├── .env
├── Dockerfile
└── requirements.txt
```

### 4.2 모듈 역할 요약

| 모듈 | 역할 |
|------|------|
| `routers/` | API 진입점. 요청을 받아 서비스로 전달 |
| `models/` | Pydantic으로 요청/응답 구조 정의 |
| `services/` | 핵심 비즈니스 로직 (추천, 정책, 분석) |
| `agents/` | 도구(tool)를 사용한 멀티스텝 추론 에이전트 |
| `llm/` | Gemini/Groq/Bedrock 교체 가능한 추상화 |
| `rag/` | 정책 문서 벡터화 및 유사 검색 |
| `scripts/` | RAG 데이터 추가, 모델 테스트 등 |

---

## 5. 배포 구성

```
┌───────── 강사님 서버 ──────────┐
│                                │
│  ai/ (에이전트 서버)            │
│  ├── FastAPI (uvicorn)         │
│  ├── Gemini 1.5 Flash + Groq   │
│  ├── RAG (ChromaDB)            │
│  └── Port: 8000                │
│                                │
└────────────┬───────────────────┘
             │ HTTP
             ▼
┌───────── AWS ──────────────────┐
│                                │
│  frontend/ → Vercel / EC2      │
│  backend/  → EC2 / ECS        │
│  PostgreSQL → RDS              │
│  Redis     → ElastiCache       │
│                                │
└────────────────────────────────┘

┌───── AWS Bedrock (별도) ───────┐
│  실험적 에이전트 사용            │
│  ai/llm/bedrock.py 연동        │
└────────────────────────────────┘
```

---

## 6. 문서 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v1 | 2026-04-23 | 초안 — Backend 헥사고날, Frontend 분리형, AI 기본 |
| v2 | 2026-04-23 | Backend `infrastructure/` → `adapter/in`, `adapter/out` 수정 |
| v3 | 2026-04-23 | Frontend `domains/` 제거 → 코로케이션 방식 적용 |
| v4 | 2026-04-23 | AI `app/` 패키지 기반 + `llm/`, `agents/`, `rag/` 추가 |
| v5 | 2026-04-30 | **`_hooks/` 폴더 제거** — Hook 파일을 사용처(Page/Component)와 같은 폴더에 배치하는 colocation 방식 적용 |
