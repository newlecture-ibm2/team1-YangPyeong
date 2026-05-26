# 🌱 FarmBalance — 양평군 스마트 파밍 및 수급 균형 플랫폼

> 양평군 농업인을 위한 작물 수급 균형 관리 및 AI 기반 스마트 파밍 플랫폼

---

## 📋 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **팀** | Team 1 - YangPyeong |
| **기간** | 6주 (5주 MVP + 1주 고도화 및 안정화) |
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
- **외부 연동**: Firebase FCM · AWS S3 · KAMIS · KMA · gov24 · 농사로(비료/재배)

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
- **클라우드**: AWS EC2 · AWS RDS · AWS S3
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
├── scripts/          ← EC2 배포 스크립트
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

## 🖥️ EC2 서버 초기 구축 (배포 담당자용)

> ⚠️ **EC2 서버에 최초 배포할 때만** 실행합니다.

```bash
# EC2 인스턴스에 SSH 접속 후 실행
bash scripts/ec2-setup.sh
```

이 스크립트가 수행하는 작업:
- ✅ 시스템 업데이트 및 Docker / Docker Compose v2 설치
- ✅ `ubuntu` 유저 docker 그룹 추가
- ✅ git, curl, unzip 설치

> 실행 완료 후 docker 그룹 권한 적용을 위해 **재접속(exit → SSH)** 해야 합니다.

### 서버 접속

- **SSM**: AWS 콘솔 → EC2 → 인스턴스 → '연결' 버튼 (브라우저 터미널)
- **SSH**: `chmod 400 FB-Key.pem && ssh -i "FB-Key.pem" ubuntu@<EC2-IP>`

### 보안 준수

- `.env`, `.env.local`, `*.pem` 파일은 절대 커밋하지 마세요 (`.gitignore` 등록됨)
- 민감 정보는 환경 변수(`${DB_PASSWORD}` 등)로만 주입

---

## 👥 팀원

| 이름 | 역할 |
|------|------|
| 김지윤 | 인프라 및 기반 설계 |
| 채나은 | 장터(Shop) 풀스택 · FCM 푸시 알림 시스템 · STT 음성 입력 · FarmBot Shop 에이전트 · 반응형 UI · 프로젝트 초기 세팅 |
| - | - |
| - | - |
| - | - |
| - | - |
