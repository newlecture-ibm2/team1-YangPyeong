# 🔍 AI 서버 환경 점검 결과

> 작성일: 2026-05-06  
> Phase 3 구현 전 AI 인프라 점검 결과 및 의사결정 기록

---

## 1. 전체 구조 요약

프로젝트에는 **2개의 Python 서버**가 존재합니다:

| 서버 | 경로 | 포트 | LLM Provider | 역할 |
|------|------|:---:|:---:|------|
| **AI Server** | `ai/` | 8000 | Gemini | 데이터 분석, 추천, 정책 매칭, 상품 AI 어시스트 |
| **Agent Server** | `agent/` | 8001 | Groq | 실시간 챗봇 (골격만 존재) |

---

## 2. 재사용 가능한 기존 인프라 ✅

| 항목 | 파일 | 상태 |
|------|------|:---:|
| LLM 추상화 (`BaseLLM`) | `ai/app/llm/base.py` | ✅ 완성 |
| Gemini Provider | `ai/app/llm/gemini.py` | ✅ 완성 |
| LLM 팩토리 (`get_llm()`) | `ai/app/llm/__init__.py` | ✅ 완성 |
| Config (`Settings`) | `ai/app/config.py` | ✅ 완성 |
| Pydantic 모델 패턴 | `ai/app/models/policy.py` | ✅ 참고용 |
| 라우터 패턴 | `ai/app/routers/policy.py` | ✅ 참고용 |
| 서비스 패턴 (LLM 호출) | `ai/app/services/policy_analyzer.py` | ✅ 참고용 |
| Docker 배포 | `docker-compose.yml` | ✅ ai-server 정의됨 |
| Frontend 상수 패턴 | `frontend/lib/constants.ts` | ✅ `BACKEND_URL` 정의됨 |

---

## 3. 발견된 문제점 ⚠️

### 3-1. `.env` 파일 미존재 (로컬)

```
ai/.env        → ❌ 없음 (docker-compose 환경변수로 주입됨)
agent/.env     → ❌ 없음
```

> `docker-compose.yml`에서 `GEMINI_API_KEY=${GEMINI_API_KEY}`로 주입하므로, 서버 환경의 `.env` 또는 시스템 환경변수에 키가 설정되어 있습니다.
> 로컬에서 단독 실행하려면 `ai/.env`를 별도로 만들어야 합니다.

### 3-2. `config.py`의 `get_settings()` 함수 미정의

`health.py`와 `db.py`에서 `from app.config import get_settings`를 호출하지만, 실제 `config.py`에는 `settings` 싱글톤만 있고 `get_settings()` 함수가 없습니다.

```diff
# config.py에 추가 필요
+def get_settings() -> Settings:
+    return settings
```

> Phase 3 구현에는 영향 없음. 추후 health 엔드포인트 사용 시 수정 필요.

### 3-3. `generate_json()` 메서드 미정의

`policy_analyzer.py`에서 `llm.generate_json()`을 호출하지만, `BaseLLM`과 `GeminiLLM`에는 이 메서드가 정의되어 있지 않습니다.

> Phase 3에서는 `llm.generate()` 메서드만 사용하므로 이 문제를 회피할 수 있습니다. 기존 정책 분석이 동작하는지는 별도 확인 필요.

### 3-4. Frontend → AI 서버 직접 연결 경로 (해결 완료 ✅)

Phase 3 구현 시 `docker-compose.yml`에 `AI_SERVER_URL=http://ai-server:8000` 환경변수를 프론트엔드에 추가하여 해결했습니다.

```yaml
# docker-compose.yml — frontend 서비스
environment:
  - AI_SERVER_URL=http://ai-server:8000  # ← 추가됨
```

BFF Route Handler(`app/api/ai/product-assist/route.ts`)에서 이 변수를 참조합니다.

---

## 4. Docker 배포 환경

```yaml
# docker-compose.yml 핵심 요약
ai-server:
  port: 8000
  env:
    - GEMINI_API_KEY=${GEMINI_API_KEY}      # ← 서버 .env에서 주입
    - LLM_PROVIDER=gemini
    - GEMINI_MODEL=gemini-2.5-flash         # ← 최신 모델
    - DATABASE_URL=postgresql+psycopg://...  # ← DB 접근 가능
```

> 모델이 `gemini-2.5-flash`로 설정되어 최신 버전을 사용 중입니다.

---

## 5. Phase 3 구현 결과 (완료 ✅)

### 새로 생성된 파일 (4개)

| # | 파일 | 설명 |
|:-:|------|------|
| 1 | `ai/app/models/product_assist.py` | 요청/응답 Pydantic 모델 |
| 2 | `ai/app/services/product_assist_service.py` | LLM 호출 + 프롬프트 로직 |
| 3 | `ai/app/routers/product_assist.py` | `POST /api/product-assist/description` |
| 4 | `frontend/app/api/ai/product-assist/route.ts` | BFF Route Handler |

### 수정된 파일 (5개)

| # | 파일 | 수정 내용 |
|:-:|------|-----------|
| 1 | `ai/app/main.py` | 새 라우터 등록 (v0.3.0) |
| 2 | `mypage/seller/register/page.tsx` | ✨ AI 설명 생성 버튼 추가 |
| 3 | `mypage/seller/register/page.module.css` | AI 버튼 + 스피너 스타일 |
| 4 | `mypage/seller/[productId]/edit/page.tsx` | 수정 페이지에도 동일 적용 |
| 5 | `mypage/seller/[productId]/edit/page.module.css` | 수정 페이지 AI 버튼 스타일 |
| 6 | `docker-compose.yml` | 프론트엔드에 `AI_SERVER_URL` 추가 |

### 재사용한 기존 인프라 (수정 없음)

- `ai/app/llm/*` — `get_llm()` 그대로 사용
- `ai/app/config.py` — `settings` 싱글톤 그대로 사용
- `ai/app/db.py` — Phase 3에서는 DB 불필요 (LLM만 호출)

---

## 6. 최종 상태 요약

| 항목 | 상태 |
|------|:---:|
| LLM 추상화 인프라 | ✅ 완벽 |
| Gemini Provider 코드 | ✅ 완성 |
| Docker 배포 구성 | ✅ 완성 |
| API 키 (서버 환경) | ✅ docker-compose로 주입 |
| API 키 (로컬 환경) | ⚠️ `.env` 파일 별도 생성 필요 |
| config.py 일부 불일치 | ⚠️ `get_settings()` 미정의 (Phase 3에 영향 없음) |
| Frontend → AI 직접 연결 | ✅ `AI_SERVER_URL` 환경변수 추가 완료 |
| Phase 3 상품 설명 생성 | ✅ 구현 완료 |
