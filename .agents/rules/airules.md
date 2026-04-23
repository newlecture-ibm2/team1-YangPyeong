---
trigger: always_on
---

# 🤖 FarmBalance AI 개발 규칙 (AI_RULES)

이 문서는 FarmBalance 프로젝트의 AI 도메인 개발 지침입니다.
모든 AI 관련 코드 생성 시 반드시 이 규칙을 따릅니다.

---

## 1. AI 핵심 철학

- **목표**: 양평군의 작물 수급 균형을 맞추고 농가 소득 안정을 위해 AI를 활용합니다.
- **컨텍스트**: 항상 양평군 특화 데이터와 지역 상생(Win-Win)을 최우선으로 고려합니다.
- **문서 참조**: 기술적 결정 전 반드시 `docs/project-spec.md`를 확인합니다.

---

## 2. 기술 스택

| 항목 | 기술 |
|------|------|
| **런타임** | Python 3.12+ |
| **프레임워크** | FastAPI |
| **LLM** | Gemini 1.5 Flash, Groq, AWS Bedrock (멀티 프로바이더) |
| **RAG** | ChromaDB (벡터 DB) + LangChain |
| **데이터** | PostgreSQL 마스터 데이터, 정책/매뉴얼 문서 |

---

## 3. 필수 참조 문서 (MUST READ before coding)

| 작업 | 참조 문서 |
|------|-----------|
| 추천 점수 공식, 수급 알림 기준 등 비즈니스 로직 | `docs/project-spec.md` |
| AI 서버 전체 아키텍처, 데이터 흐름, 배포 구성 | `docs/architecture/ai-architecture.md` |
| 외부 API(KOSIS, 기상청, 흙토람 등) 연동 시 | `docs/architecture/external-api/` 폴더 내 해당 문서 |

> 비즈니스 로직 상세(추천 점수 가중치, 수급 알림 비율 등)는 이 규칙에 중복 기재하지 않습니다.
> 반드시 위 문서를 읽고 최신 스펙을 따릅니다.

---

## 4. 폴더 구조 (MUST FOLLOW)

```
ai/
├── app/                          ← Python 패키지
│   ├── __init__.py, main.py, config.py
│   ├── models/                   ← Pydantic 스키마 (요청/응답)
│   ├── routers/                  ← API 엔드포인트
│   ├── services/                 ← 비즈니스 로직
│   ├── agents/                   ← 에이전트 오케스트레이션
│   │   └── tools/                ← 에이전트 도구
│   ├── llm/                      ← LLM Provider 추상화
│   │   ├── base.py               ← BaseLLM 추상 클래스
│   │   ├── gemini.py, groq.py, bedrock.py
│   │   └── __init__.py           ← get_llm() 팩토리
│   └── rag/                      ← RAG 파이프라인
│       ├── vectorstore.py, embeddings.py
│       ├── retriever.py, ingestion.py
├── scripts/                      ← 유틸리티 스크립트
├── data/policies/                ← RAG 소스 문서
└── requirements.txt
```

### Python 패키지 규칙
- **모든 폴더에 `__init__.py` 필수** — 없으면 Python이 패키지로 인식하지 못합니다.
- 새 폴더를 만들 때 반드시 빈 `__init__.py`를 함께 생성합니다.

---

## 5. LLM 추상화 규칙 (MUST FOLLOW)

### 5.1 모든 LLM 호출은 `BaseLLM` 인터페이스를 통해야 합니다.

```python
# DO NOT — 특정 Provider를 직접 호출 금지
from google import genai
client = genai.Client(...)  # ❌

# DO — 추상화를 통한 호출
from app.llm import get_llm
llm = get_llm()  # config에 따라 자동 선택
result = await llm.generate(prompt)  # ✅
```

### 5.2 Provider 선택은 환경변수로 제어

```env
LLM_PROVIDER=gemini  # gemini | groq | bedrock
```

### 5.3 새 Provider 추가 시

1. `app/llm/` 하위에 새 파일 생성 (e.g., `openai.py`)
2. `BaseLLM`을 상속하여 `generate()`, `generate_stream()` 구현
3. `app/llm/__init__.py`의 `get_llm()` 팩토리에 등록

---

## 6. 코드 작성 패턴

### 6.1 Router → Service 분리 (MUST FOLLOW)

```python
# DO — Router는 요청/응답 처리만, 로직은 Service로
@router.post("/")
async def get_recommendation(request: RecommendRequest):
    service = RecommendService()
    return await service.recommend(request)  # ✅

# DO NOT — Router에 비즈니스 로직 직접 작성 금지
@router.post("/")
async def get_recommendation(request: RecommendRequest):
    llm = get_llm()
    result = await llm.generate(...)  # ❌ Router에서 직접 LLM 호출
```

### 6.2 Service 규칙

- `services/`는 FastAPI에 의존하지 않습니다 (Request, Response 등 import 금지).
- Service는 `llm/`과 `rag/`를 조합하여 비즈니스 로직을 수행합니다.
- 타입 힌트를 반드시 사용합니다.

```python
# DO — 타입 힌트 필수
async def recommend(self, request: RecommendRequest) -> RecommendResponse:  # ✅

# DO NOT — 타입 힌트 없는 함수 금지
async def recommend(self, request):  # ❌
```

### 6.3 에러 핸들링

```python
# DO — 구조화된 에러 응답
from fastapi import HTTPException

raise HTTPException(
    status_code=400,
    detail={"code": "E-AI-REC-001", "message": "추천할 수 있는 작물이 없습니다."}
)

# 에러 코드 형식: E-AI-[기능]-[번호]
# E-AI-REC-001: 추천 관련
# E-AI-POL-001: 정책 관련
# E-AI-RAG-001: RAG 관련
```

---

## 7. 에이전트 도구(Tool) 규칙

### 에이전트 흐름

```
사용자 질문 → Agent → [도구 선택] → 결과 수집 → LLM 최종 응답 생성
```

### 도구 작성 규칙

| 규칙 | 설명 |
|------|------|
| 도구 함수는 `async def` | 비동기 기본 |
| 반환 타입은 `dict` | 구조화된 데이터 반환 |
| 타입 힌트 필수 | 매개변수, 반환값 모두 |
| 실패 시 빈 dict + 에러 메시지 | 예외를 삼키지 않고 로깅 |
| 도구끼리 직접 호출 금지 | Agent가 도구 조합을 결정 |

```python
# DO — 도구 함수 템플릿
async def crop_lookup(crop_name: str) -> dict:
    """작물 마스터 DB에서 해당 작물 정보를 조회합니다."""
    try:
        # 조회 로직
        return {"crop_name": crop_name, "data": result}
    except Exception as e:
        logger.error(f"crop_lookup 실패: {e}")
        return {"error": str(e)}
```

---

## 8. RAG 파이프라인 규칙

### 인제스처 (데이터 추가)
```
[문서 PDF/JSON] → scripts/add_rag_data.py → 청크 분할 → 임베딩 → vectorstore 저장
```

### 검색 (매 요청)
```
[사용자 질문] → embeddings.py → vectorstore 유사검색 → retriever.py → 결과 반환
```

### 주의사항
- 인제스처 스크립트는 `scripts/` 폴더에 배치 (앱 코드와 분리).
- 벡터 DB 데이터(`data/chroma/`)는 `.gitignore`에 추가하여 Git 미추적.
- 정책 원본 문서(`data/policies/`)만 Git으로 관리.

---

## 9. 테스트 규칙

| 대상 | 테스트 방법 | 위치 |
|------|-----------|------|
| `services/` | pytest + AsyncMock | `tests/test_services/` |
| `routers/` | httpx.AsyncClient + TestClient | `tests/test_routers/` |
| `llm/` | Mock LLM (BaseLLM 상속 테스트용) | `tests/test_llm/` |
| `agents/tools/` | 개별 도구 단위 테스트 | `tests/test_tools/` |

```python
# 테스트 파일 네이밍: test_{원본파일명}.py
# 예: recommend_service.py → test_recommend_service.py
```

---

## 10. 금지 사항 (DO NOT)

| # | 금지 사항 |
|:-:|-----------|
| 1 | `llm/` 외부에서 LLM Provider SDK를 직접 import 금지 |
| 2 | `BaseLLM`을 거치지 않는 LLM 호출 금지 |
| 3 | `services/`에서 HTTP 프레임워크 의존 금지 (FastAPI Request 등) |
| 4 | 에이전트 도구(tool) 간 직접 호출 금지 |
| 5 | 벡터 DB 데이터를 Git에 커밋 금지 |
| 6 | `.env` 파일에 실제 API 키 커밋 금지 (`.env.example`만 커밋) |
| 7 | 타입 힌트 없는 함수 정의 금지 |
| 8 | 새 폴더 생성 시 `__init__.py` 누락 금지 |
