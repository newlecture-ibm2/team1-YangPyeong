# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FarmBalance** — 양평군 스마트 파밍 및 수급 균형 플랫폼 (Smart Farming & Supply Balance Platform)

Monorepo with three services:
- `frontend/` — Next.js 15 (BFF pattern)
- `backend/` — Spring Boot 3.3 (Hexagonal Architecture)
- `ai/` — FastAPI + LangGraph multi-LLM agent server

## Development Commands

### Full Stack (Docker)
```bash
bash setup.sh           # First-time setup
docker compose up --build1
```

### Frontend (Next.js 15)
```bash
cd frontend
npm install
npm run dev             # http://localhost:3000
npm run build
npm run lint
```

### Backend (Spring Boot)
```bash
cd backend
./gradlew bootRun       # http://localhost:8080
./gradlew build
./gradlew test
./gradlew test --tests "com.farmbalance.SomeTest"
```
Swagger UI: `http://localhost:8080/swagger-ui.html`

### AI Server (FastAPI)
```bash
cd ai
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # http://localhost:8000
```

### Environment Setup
Copy `.env.example` to `.env` and fill in keys. Key variables:
- `SKIP_AUTH=true` — skip login for local dev/demo
- `AI_SERVER_URL=http://localhost:8000` — override for local (Docker default: `http://ai-server:8000`)
- `SCHEDULER_ENABLED=false` — disable background schedulers locally

## Architecture

### Service Communication
```
Browser
  → Next.js /api/* (BFF routes — JWT from httpOnly cookie auto-attached)
    → Spring Boot :8080 (business logic)
      → PostgreSQL, Redis, Firebase Admin (FCM)
      → FastAPI :8000 (AI features)
        → Gemini / Groq LLM, Chroma RAG
```

The frontend **never calls the backend directly from the browser** for authenticated requests — all calls go through Next.js API routes (`/api/proxy/[...path]` catches general cases; domain-specific routes handle specific flows).

### Frontend — BFF Pattern
- `frontend/app/api/` — API route handlers (Node.js BFF layer)
- `frontend/lib/api-client.ts` — server-side fetch wrapper; reads JWT from cookies and adds `Authorization: Bearer`
- `frontend/lib/api-fetch.ts` — client-side fetch wrapper
- `frontend/middleware.ts` — auth guard + role-based routing (GOV users are isolated to `/gov/*`)
- Path alias `@/*` maps to `frontend/`

Route groups:
- `(auth)/` — login, signup
- `(main)/` — authenticated user pages
- `admin/` — admin dashboard
- `gov/` — local government dashboard

### Backend — Hexagonal Architecture
Strict layering enforced by convention (not by module boundaries):
```
domain/          ← Pure Java, zero Spring annotations
application/     ← Port interfaces (in/out) + UseCase implementations
adapter/
  in/web/        ← Controllers, request/response DTOs
  out/           ← JPA repositories, external API adapters
```

Domains: `user`, `farm`, `balance`, `shop`, `community`, `policy`, `store`, `admin`

DB migrations are managed by **Flyway** (`classpath:db/migration/`). JPA `ddl-auto` is set to `validate` — never let Hibernate auto-create/update schema.

### AI Server — Agent Architecture
```
ai/app/
├── routers/     ← FastAPI route handlers (9 routers registered in main.py)
├── agents/      ← LangGraph agent definitions and tool bindings
├── services/    ← Business logic
├── llm/         ← LLM abstraction (Gemini / Groq / Bedrock switchable via LLM_PROVIDER)
├── prompts/     ← LLM prompt templates
├── rag/         ← Chroma vector store retrieval
├── models/      ← Pydantic schemas + SQLAlchemy ORM
└── db.py        ← Async SQLAlchemy session (shared PostgreSQL with backend)
```

The AI server shares the **same PostgreSQL database** as the backend (direct read queries, no API hop).

## Key Infrastructure Details

- **Auth**: JWT — access token 12h, refresh token 7 days, stored as httpOnly cookies
- **DB**: PostgreSQL 16 exposed on port `5151:5432` locally
- **Cache**: Redis 7 (internal only, not exposed)
- **Push**: Firebase Admin SDK (backend) + Firebase JS SDK (frontend FCM)
- **Payments**: PortOne browser SDK
- **Maps**: Kakao Maps JS SDK
- **CI/CD**: GitHub Actions triggers on push to `dev` branch → self-hosted runner → `docker compose up --build -d`

## External APIs Used

| API | Purpose |
|-----|---------|
| KAMIS | Agricultural wholesale price data |
| 농사로 (Nongsaro) | Crop info, e-books |
| 기상청 (KMA) | Weather forecast |
| KOSIS | Statistical data |
| GOV24 | Government policy info |
| Kakao (REST + OAuth) | Maps, social login |
| Google OAuth | Social login |
| Gmail SMTP | Email notifications |
