# 🌱 FarmBalance — 양평군 스마트 파밍 및 수급 균형 플랫폼

> 양평군 농업인을 위한 작물 수급 균형 관리 및 AI 기반 스마트 파밍 플랫폼

---

## 📋 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **팀** | Team 1 - YangPyeong |
| **기간** | 6주 (5주 MVP + 1주 안정화) |
| **기술 스택** | Spring Boot 3.3 · Next.js 15 · FastAPI · PostgreSQL |

---

## 🚀 시작하기

### 1. 클론

```bash
git clone https://github.com/newlecture-ibm2/team1-YangPyeong.git
cd team1-YangPyeong
```

### 2. 초기 환경 설정 (최초 1회)

> ⚠️ **반드시 실행해주세요!** AI 에이전트 규칙 연동 등 공통 환경이 설정됩니다.

```bash
bash setup.sh
```

이 스크립트가 수행하는 작업:
- ✅ AI 에이전트 규칙(`.agents/rules/`)을 워크스페이스에 심링크로 연결
- ✅ 이후 팀원 모두 동일한 AI 코딩 가이드라인(헥사고날 아키텍처, BFF 등)이 적용됨

### 3. 서비스별 실행

```bash
# Backend (Spring Boot)
cd backend && ./gradlew bootRun

# Frontend (Next.js)
cd frontend && npm install && npm run dev

# AI (FastAPI)
cd ai && pip install -r requirements.txt && uvicorn app.main:app --reload
```

---

## 📁 프로젝트 구조

```
team1-YangPyeong/
├── backend/      ← Spring Boot (헥사고날 아키텍처)
├── frontend/     ← Next.js 15 (BFF + 코로케이션)
├── ai/           ← FastAPI + 멀티 LLM + Agent + RAG
├── docs/         ← 기획/설계 문서
├── .agents/      ← AI 에이전트 개발 규칙
├── setup.sh      ← 초기 환경 설정 스크립트
└── docker-compose.yml
```

> 상세 구조는 [docs/architecture/folder-structure.md](docs/architecture/folder-structure.md) 참조

---

## 📖 주요 문서

| 문서 | 설명 |
|------|------|
| [project-spec.md](docs/project-spec.md) | 통합 기획서 (Single Source of Truth) |
| [folder-structure.md](docs/architecture/folder-structure.md) | 폴더 구조 가이드 v4 |
| [ai-architecture.md](docs/architecture/ai-architecture.md) | AI 서버 아키텍처 상세 |
| [ERD.md](docs/architecture/ERD.md) | 데이터베이스 설계 |
| [api-spec.md](docs/architecture/api-spec.md) | 내부 API 명세서 |

---

## 🔧 개발 규칙

- **커밋**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **브랜치**: `main` (배포) / `dev` (개발)
- **Backend**: 헥사고날 아키텍처 (adapter/in, adapter/out)
- **Frontend**: Next.js 코로케이션 (`_hooks/`, `_lib/`, `_components/`)
- **AI 에이전트 규칙**: `.agents/rules/` 참조

---

## 👥 팀원

| 이름 | 역할 |
|------|------|
| 채나은 | - |
| - | - |
| - | - |
| - | - |
| - | - |
| - | - |