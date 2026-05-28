# 🌱 FarmBalance — 양평군 스마트 파밍 및 수급 균형 플랫폼

> 양평군 농업인을 위한 작물 수급 균형 관리 및 AI 기반 스마트 파밍 플랫폼

---

## 📋 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **팀** | Team 1 - YangPyeong |
| **주소** | [farm.newlecture.com](https://farm.newlecture.com) |
| **기간** | 6주 (5주 MVP + 1주 안정화) |
| **기술 스택** | Spring Boot 3.4 · Next.js 15 · FastAPI · PostgreSQL 16 · Redis 7 |

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🌾 **내 농장** | 농장 등록, 작물 재배 관리, 수확 기록, AI 재배 가이드, 수익 예측 |
| 🎙️ **STT 음성 입력** | 농장 활동 기록 음성 입력 (Web Speech API + AI 파싱, 사투리 지원) |
| 📊 **수급 균형 대시보드** | 양평군 작물 수급 분석, KAMIS 시세 연동, 지자체 통계 시각화 |
| 🛒 **장터** | 농산물 직거래 상품 등록·구매, AI 자동완성, PortOne 결제 |
| 💬 **커뮤니티** | 게시글/댓글, AI 모더레이션, 신고·제재 시스템 |
| 📜 **정책 추천** | gov24 공공서비스 연동, AI 맞춤 정책 추천 및 2단계 코칭 |
| 🤖 **FarmBot 챗봇** | 멀티 에이전트 오케스트레이터 기반 스트리밍 챗봇 |
| 🔔 **알림** | Firebase FCM 푸시 알림 (날씨·병해충·재배일정·거래 알림) |
| 🛡️ **관리자** | 회원/커뮤니티/상점/농장/RAG 데이터 통합 관리 |

---

## 🏗️ 기술 스택

### Backend (Spring Boot 3.4)
- **언어/프레임워크**: Java 17 · Spring Boot 3.4 · Spring Security · Spring WebSocket
- **아키텍처**: 헥사고날 아키텍처 (adapter/in, adapter/out)
- **DB**: PostgreSQL 16 · Redis 7 · Flyway (마이그레이션)
- **인증**: JWT · OAuth2 (카카오, 구글)
- **외부 연동**: Firebase FCM · KAMIS · KMA · gov24 · 농사로(비료/재배)

### Frontend (Next.js 15)
- **언어/프레임워크**: TypeScript 5 · React 19 · Next.js 15 (App Router)
- **패턴**: BFF (Backend For Frontend) Route Handler · 코로케이션(`_components/`, `_hooks/`, `_lib/`)
- **결제**: PortOne
- **지도**: 카카오 지도 JS SDK

### AI Server (FastAPI)
- **프레임워크**: Python 3.12 · FastAPI 0.115 · Uvicorn
- **LLM**: Gemini 2.5 Flash (기본) · Groq (fallback)
- **에이전트**: LangGraph · LangChain (멀티 에이전트 오케스트레이터)
- **RAG**: ChromaDB · LangChain Chroma
- **주요 에이전트**: farm / gov / balance / policy / recommend / shop / community / guidance / account / general

### 인프라
- **컨테이너**: Docker · Docker Compose
- **CI/CD**: GitHub Actions

---

## 🚀 시작하기

### 1. 클론

```bash
git clone https://github.com/newlecture-ibm2/team1-YangPyeong.git
cd team1-YangPyeong
```

### 2. 초기 환경 설정 (최초 1회)

> ⚠️ **반드시 실행해주세요!** 패키지 설치, 환경변수 생성이 자동 진행됩니다.

```bash
bash setup.sh
```

이 스크립트가 수행하는 작업:
- ✅ **환경 변수 템플릿 복사**: `.env.example` → `.env` 자동 복사
- ✅ **권한 설정**: `backend/gradlew` 실행 권한 부여
- ✅ **패키지 자동 설치**: Frontend(`npm install`) 및 AI(`.venv` 생성 + `pip install`)

### 3. 환경 변수 설정

루트 `.env` 파일에 아래 값을 채워주세요. (민감 정보는 슬랙 `m 양평` 채널 공지 참고)

```env
# DB
DB_USERNAME=farm
DB_PASSWORD=...
DB_URL=jdbc:postgresql://localhost:5151/farm_db

# JWT
JWT_SECRET=...

# LLM (AI 서버)
LLM_PROVIDER=gemini
GEMINI_API_KEY=...

# 외부 API
KAKAO_REST_API_KEY=...
KMA_API_KEY=...
SOIL_API_KEY=...
NONGSARO_API_KEY=...
KOSIS_API_KEY=...
GOV24_API_KEY=...
KAMIS_CERT_KEY=...
KAMIS_CERT_ID=...

# BFF → AI 서버 내부 인증
AI_INTERNAL_SECRET_KEY=...

# 소셜 로그인 (OAuth2)
KAKAO_CLIENT_ID=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# 결제 (PortOne)
NEXT_PUBLIC_PORTONE_STORE_ID=...
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=...

# 지도
NEXT_PUBLIC_KAKAO_MAP_JS_KEY=...

# Firebase FCM
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_CREDENTIALS_BASE64=...
```

> AI 서버 전용 환경 변수는 `ai/.env.example` 참고.

### 4. 서비스별 실행

```bash
# Backend (Spring Boot)
cd backend && ./gradlew bootRun

# Frontend (Next.js)
cd frontend && npm run dev

# AI (FastAPI)
cd ai && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> `.venv`가 없다면 먼저 `setup.sh`를 실행하거나 아래 명령어로 수동 생성하세요.
> ```bash
> cd ai && python3 -m venv .venv --without-pip
> curl -sS https://bootstrap.pypa.io/get-pip.py | .venv/bin/python
> source .venv/bin/activate && pip install -r requirements.txt
> ```

### 5. Docker Compose (전체 통합 실행)

```bash
docker compose up --build
```

---

## 📁 프로젝트 구조

```
team1-YangPyeong/
├── backend/          ← Spring Boot 3.4 (헥사고날 아키텍처)
├── frontend/         ← Next.js 15 (BFF + App Router)
│   ├── app/
│   │   ├── (main)/  ← 사용자 페이지 (farm, shop, community, balance, policy …)
│   │   ├── admin/   ← 관리자 페이지
│   │   └── api/     ← BFF Route Handler (프록시 · 인증 · rate-limit)
│   ├── components/common/  ← 공용 UI 컴포넌트
│   └── lib/          ← 훅, 유틸, voice 관련
├── ai/               ← FastAPI + LangGraph + Gemini 2.5 Flash
│   └── app/
│       ├── agents/   ← 멀티 에이전트 (orchestrator + 도메인별 agent)
│       ├── routers/  ← REST 엔드포인트
│       ├── services/ ← 비즈니스 로직 (RAG, STT, parse, …)
│       ├── prompts/  ← LLM 프롬프트
│       └── models/   ← Pydantic 스키마
├── docs/             ← 기획/설계 문서
├── scripts/          ← 배포 스크립트
├── setup.sh          ← 로컬 초기 환경 설정
└── docker-compose.yml
```

> 상세 구조는 [docs/architecture/folder-structure.md](docs/architecture/folder-structure.md) 참조

---

## 📖 주요 문서

| 문서 | 설명 |
|------|------|
| [project-spec.md](docs/project-spec.md) | 통합 기획서 (Single Source of Truth) |
| [folder-structure.md](docs/architecture/folder-structure.md) | 폴더 구조 가이드 |
| [ai-architecture.md](docs/architecture/ai-architecture.md) | AI 서버 아키텍처 상세 |
| [ERD.md](docs/architecture/ERD.md) | 데이터베이스 설계 |
| [api-spec.md](docs/architecture/api-spec.md) | 내부 API 명세서 |
| [farm-history-stt-guide.md](docs/development/farm-history-stt-guide.md) | STT 음성 입력 개발 가이드 |

---

## 🔧 개발 규칙

- **커밋**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **브랜치**: `main` (배포) / `stage` (통합) / `dev-{이름}` (개인 개발)
- **Backend**: 헥사고날 아키텍처 (adapter/in, adapter/out)
- **Frontend**: Next.js 코로케이션 (`_hooks/`, `_lib/`, `_components/`)

---

## 👥 팀원

| 이름 | 역할 | 주요 담당 |
|------|------|--------|
| 정지은 | 농장주 | Farm 도메인 풀스택 · 재배 관리 & 수확 플로우 · 수급 밸런스 엔진 · 대시보드 시각화 · 영농 일지(History) 전체 · 외부 API 5종 연동 (기상청 · 흙토람 · 농사로 · KOSIS) · 비회원 미리보기 UX 전략 · DB 마이그레이션 · 데이터 시딩 · 초기 셋업 |
| 박수경 | 군수 | 지자체 GraphRAG AI 분석 · 대시보드 & 챗봇 · 정책 수집 · AI 맞춤 추천 · 에이전트 RAG · 동네 가게 지도 검색 · 비회원 챗봇 게스트 정책 · 인증 · BFF · 외부 API 연동 · 배포 환경 · 정책 고도화 |
| 김지윤 | 수문장 | AI 추천 페이지 · 수익 예측 & 인사이트 · 인증 시스템 · 계정 보안 · 마이페이지 통합 뷰 · 랜딩 페이지 UI · 공통 에러 페이지 · AI 초기 인프라 셋업 · 배포 서버 환경 · 마이그레이션 |
| 채나은 | 장터지기 | 장터(Shop) 전체 · 알림 시스템 · 이메일 발송 · Shop 에이전트 · FarmBot 가이드 · AI 상품 자동완성 · 판매자 인사이트 · STT 영농일지 · 농사로 API 연동 · 모바일 반응형 · 공통 컴포넌트 · 초기 셋업 |
| 정우혁 | 이장 | 커뮤니티(게시판) 전체 · 특화 기능 · 챗봇(FarmBot) 프론트엔드 · UX 제어 · 사용자 인증(Auth) · 권한 처리 · 게시판 검색 · 필터링 · 게시글 에디터 · 이미지 업로드 |
| 방현석 | 촌장 | 관리자 도메인 설계 · 풀스택 · 농장 및 작물 · RAG 관리 페이지 · ChromaDB RAG 전체 연동 · 고도화 · AI 상품 심사 · JSON 파싱 안정화 · AI 커뮤니티 게시글 · 댓글 검수 · 제재 시스템 · 관리자 UI 개선 |
