# 🤖 FarmBalance AI 아키텍처 가이드

> AI 에이전트 서버의 폴더 구조, 설계 원칙, 각 모듈의 역할과 구현 가이드

---

## 1. 전체 아키텍처 개요

```
┌─── Frontend (Next.js) ─── Backend (Spring Boot) ───┐
│                                │                    │
│                          policy/adapter/             │
│                          out/external/               │
│                          AiApiAdapter.java           │
│                                │                    │
└────────────────────────────────┼────────────────────┘
                                 │ HTTP (REST)
                                 ▼
┌────────────── AI 에이전트 서버 (FastAPI) ──────────────┐
│                                                       │
│  routers/     →  services/     →  agents/             │
│  (API 진입)      (비즈니스)       (오케스트레이션)       │
│                      │               │                │
│                      │          tools/ (도구)          │
│                      │               │                │
│                      ▼               ▼                │
│                  llm/            rag/                  │
│              (LLM 호출)       (문서 검색)               │
│           ┌────┼────┐                                 │
│        Gemini  Groq  Bedrock                          │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

## 2. 폴더별 역할 상세

### 2.1 `app/routers/` — API 엔드포인트

FastAPI의 라우터. **요청을 받아서 Service로 전달**하는 역할만 합니다.

| 파일 | 엔드포인트 | 설명 |
|------|-----------|------|
| `recommend.py` | `POST /recommend` | 작물 추천 요청 |
| `policy.py` | `POST /policy` | 정책 매칭 + 공문 생성 |
| `analysis.py` | `POST /analysis` | 수확량/수익 예측 |
| `agent.py` | `POST /agent/chat` | 에이전트 대화 (SSE 스트리밍) |

```python
# 예시: app/routers/recommend.py
from fastapi import APIRouter
from app.models.recommend import RecommendRequest, RecommendResponse
from app.services.recommend_service import RecommendService

router = APIRouter(prefix="/recommend", tags=["추천"])

@router.post("/", response_model=RecommendResponse)
async def get_recommendation(request: RecommendRequest):
    service = RecommendService()
    return await service.recommend(request)
```

---

### 2.2 `app/models/` — Pydantic 스키마

요청(Request)과 응답(Response)의 데이터 구조를 정의합니다.

```python
# 예시: app/models/recommend.py
from pydantic import BaseModel

class RecommendRequest(BaseModel):
    farm_id: int
    region: str          # "양평군"
    area_m2: float       # 재배 가능 면적
    experience_years: int # 영농 경력

class CropScore(BaseModel):
    crop_name: str
    total_score: float
    supply_score: float  # 수급 적합도 (0.35)
    env_score: float     # 환경 적합도 (0.25)
    profit_score: float  # 수익성 (0.25)
    capacity_score: float # 농가 역량 (0.15)
    reasoning: str       # 추천 근거

class RecommendResponse(BaseModel):
    top_crops: list[CropScore]  # 상위 5개
    region: str
    generated_at: str
```

---

### 2.3 `app/services/` — 비즈니스 로직

핵심 계산 로직을 담당합니다. **LLM이나 RAG를 호출**하여 결과를 생성합니다.

```python
# 예시: app/services/recommend_service.py
from app.llm import get_llm
from app.rag.retriever import retrieve_crop_data

class RecommendService:
    def __init__(self):
        self.llm = get_llm()  # config에 따라 Gemini/Groq/Bedrock 자동 선택

    async def recommend(self, request):
        # 1. RAG로 지역 작물 데이터 검색
        crop_data = await retrieve_crop_data(request.region)
        
        # 2. LLM으로 점수 산정
        prompt = self._build_prompt(request, crop_data)
        result = await self.llm.generate(prompt)
        
        # 3. 파싱 후 반환
        return self._parse_response(result)
```

---

### 2.4 `app/llm/` — LLM Provider 추상화

**핵심 설계**: Gemini, Groq, Bedrock을 동일한 인터페이스로 사용할 수 있게 합니다.

#### 추상 베이스 클래스

```python
# app/llm/base.py
from abc import ABC, abstractmethod
from typing import AsyncGenerator

class BaseLLM(ABC):
    """모든 LLM Provider가 구현해야 하는 인터페이스"""
    
    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> str:
        """동기 응답 생성"""
        ...
    
    @abstractmethod
    async def generate_stream(self, prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """스트리밍 응답 생성"""
        ...
```

#### Provider 구현체

```python
# app/llm/gemini.py
from google import genai
from app.llm.base import BaseLLM
from app.config import GEMINI_API_KEY

class GeminiLLM(BaseLLM):
    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.model = "gemini-1.5-flash"
    
    async def generate(self, prompt: str, **kwargs) -> str:
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt
        )
        return response.text
    
    async def generate_stream(self, prompt: str, **kwargs):
        response = self.client.models.generate_content_stream(
            model=self.model,
            contents=prompt
        )
        for chunk in response:
            yield chunk.text
```

```python
# app/llm/groq.py
from groq import Groq
from app.llm.base import BaseLLM

class GroqLLM(BaseLLM):
    def __init__(self):
        self.client = Groq()
        self.model = "llama-3.3-70b-versatile"
    
    async def generate(self, prompt: str, **kwargs) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
```

```python
# app/llm/bedrock.py
import boto3
from app.llm.base import BaseLLM

class BedrockLLM(BaseLLM):
    def __init__(self):
        self.client = boto3.client("bedrock-runtime", region_name="us-east-1")
        self.model_id = "anthropic.claude-3-haiku-20240307-v1:0"
    
    async def generate(self, prompt: str, **kwargs) -> str:
        # Bedrock invoke_model 호출
        ...
```

#### 팩토리 함수

```python
# app/llm/__init__.py
from app.config import LLM_PROVIDER
from app.llm.gemini import GeminiLLM
from app.llm.groq import GroqLLM
from app.llm.bedrock import BedrockLLM

def get_llm():
    """config의 LLM_PROVIDER 값에 따라 적절한 LLM 인스턴스 반환"""
    providers = {
        "gemini": GeminiLLM,
        "groq": GroqLLM,
        "bedrock": BedrockLLM,
    }
    return providers[LLM_PROVIDER]()
```

```env
# .env
LLM_PROVIDER=gemini          # gemini | groq | bedrock
GEMINI_API_KEY=xxx
GROQ_API_KEY=xxx
AWS_ACCESS_KEY_ID=xxx        # Bedrock용
AWS_SECRET_ACCESS_KEY=xxx
```

> **Provider를 바꾸고 싶으면 `.env`의 `LLM_PROVIDER` 값만 변경하면 됩니다.**

---

### 2.5 `app/agents/` — 에이전트 오케스트레이션

단순 LLM 호출이 아닌, **도구(tool)를 사용하여 멀티스텝으로 추론**하는 에이전트입니다.

#### 에이전트 흐름

```
사용자: "고추 심으려는데 보조금 받을 수 있어?"
         │
         ▼
    [policy_agent.py]
         │
         ├── 1단계: crop_lookup.py → DB에서 고추 정보 조회
         ├── 2단계: policy_search.py → RAG로 관련 정책 검색
         ├── 3단계: balance_check.py → 현재 수급 현황 확인
         │
         ▼
    [LLM 최종 응답 생성]
         │
         ▼
    "고추의 경우 양평군 스마트팜 지원사업에 해당됩니다.
     지원 금액은 최대 300만원이며, 신청서 초안을 작성해드릴까요?"
```

#### 도구(Tool) 정의

```python
# app/agents/tools/crop_lookup.py
async def crop_lookup(crop_name: str) -> dict:
    """작물 마스터 DB에서 해당 작물 정보를 조회합니다."""
    # Spring Boot API 호출 또는 직접 DB 조회
    return {
        "crop_name": "고추",
        "avg_yield_per_m2": 3.2,
        "current_price": 4200,
        "balance_status": "적정"
    }
```

```python
# app/agents/tools/policy_search.py
from app.rag.retriever import retrieve_policies

async def policy_search(crop_name: str, region: str) -> list[dict]:
    """RAG를 통해 해당 작물에 적용 가능한 정책을 검색합니다."""
    return await retrieve_policies(
        query=f"{region} {crop_name} 지원 정책",
        top_k=5
    )
```

---

### 2.6 `app/rag/` — RAG 파이프라인

정책 문서, 농업 매뉴얼 등을 벡터화하고 검색하는 시스템입니다.

#### 파이프라인 흐름

```
[인제스처 (1회성)]
PDF/JSON 문서 → ingestion.py → embeddings.py → vectorstore에 저장

[검색 (매 요청)]
사용자 질문 → embeddings.py → vectorstore에서 유사 문서 검색 → retriever.py
```

#### 모듈 역할

| 파일 | 역할 |
|------|------|
| `vectorstore.py` | 벡터 DB 연결/관리 (ChromaDB, Pinecone 등) |
| `embeddings.py` | 텍스트 → 벡터 변환 (임베딩 모델) |
| `retriever.py` | 유사 문서 검색 + 결과 후처리 |
| `ingestion.py` | 문서 → 청크 분할 → 벡터화 → 저장 |

```python
# 예시: app/rag/retriever.py
from app.rag.vectorstore import get_vectorstore
from app.rag.embeddings import embed_query

async def retrieve_policies(query: str, top_k: int = 5) -> list[dict]:
    """질문과 유사한 정책 문서를 검색합니다."""
    query_vector = await embed_query(query)
    store = get_vectorstore()
    results = store.similarity_search(query_vector, k=top_k)
    return [
        {"content": doc.page_content, "metadata": doc.metadata, "score": doc.score}
        for doc in results
    ]
```

---

### 2.7 `scripts/` — 유틸리티 스크립트

앱 실행과 별개로 독립적으로 실행하는 스크립트들입니다.

| 파일 | 용도 | 실행 시점 |
|------|------|----------|
| `add_rag_data.py` | 새 정책 문서를 RAG에 추가 | 정책 데이터 갱신 시 |
| `restore_rag.py` | 벡터 DB 재구축 | 초기 셋업 또는 데이터 복원 시 |
| `test_models.py` | LLM 연결 테스트 | 개발/배포 전 검증 |

```bash
# 사용법
python -m scripts.add_rag_data --input data/policies/
python -m scripts.test_models --provider gemini
```

---

## 3. 데이터 흐름 요약

### 3.1 작물 추천 흐름 (FRM-006)

```
[Spring Boot] POST /recommend
      │ RecommendRequest (farm_id, region, area)
      ▼
[FastAPI] routers/recommend.py
      │
      ▼
[services/recommend_service.py]
      │
      ├── rag/retriever.py → 지역 작물 데이터 검색
      ├── llm/gemini.py → 점수 산정 + 근거 생성
      │
      ▼
[RecommendResponse] → Top 5 작물 + 점수 + 근거
```

### 3.2 정책 매칭 + 공문 생성 흐름 (FRM-012)

```
[Spring Boot] POST /policy
      │ PolicyRequest (crop, region, area, experience)
      ▼
[FastAPI] routers/policy.py
      │
      ▼
[services/policy_service.py]
      │
      ├── rag/retriever.py → 관련 정책 문서 검색
      ├── llm/ → 정책 적합도 분석
      ├── llm/ → 공문 초안 생성 (PDF 템플릿 채우기)
      │
      ▼
[PolicyResponse] → 매칭 정책 목록 + 공문 초안 JSON
```

### 3.3 에이전트 대화 흐름

```
[Frontend] POST /agent/chat (SSE 스트리밍)
      │ { messages: [...], stream: true }
      ▼
[FastAPI] routers/agent.py
      │
      ▼
[agents/farm_agent.py 또는 policy_agent.py]
      │
      ├── tools/crop_lookup.py → DB 조회
      ├── tools/policy_search.py → RAG 검색
      ├── tools/balance_check.py → 수급 확인
      │
      ├── llm/ → 도구 결과를 종합하여 응답 생성
      │
      ▼
[SSE Stream] → 토큰 단위 스트리밍 응답
```

---

## 4. 배포 구성

### 4.1 Docker 컨테이너 구성

> 챗봇(Agent)과 AI 분석 기능은 **단일 ai-server 컨테이너**에 통합되어 있습니다.
> LLM Provider는 `get_llm("gemini")`, `get_llm("groq")` 팩토리를 통해 용도별로 선택합니다.

| 컨테이너 | 이미지 | 역할 | 포트 |
|----------|--------|------|:---:|
| `farm-ai` | farm-ai:latest | 데이터 분석, 추천, 정책 매칭, RAG, **챗봇** | 8000 |

```
┌───────────────── Docker Compose ─────────────────┐
│                                                   │
│  ┌─── ai-server (farm-ai) :8000 ───────────────┐ │
│  │  FastAPI (uvicorn)                           │ │
│  │  ├── Gemini API (데이터 분석·추천·정책)       │ │
│  │  ├── Groq API (실시간 챗봇 응답)              │ │
│  │  ├── RAG (ChromaDB) ← chroma-data 볼륨      │ │
│  │  └── PostgreSQL 직접 조회                     │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─── backend (farm-backend) :8080 ────────────┐ │
│  │  Spring Boot → ai-server 호출               │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─── frontend (farm-frontend) :3000 → 3131 ───┐ │
│  │  Next.js (BFF) → backend 프록시              │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─── db (farm-db) ──┐  ┌─── redis (farm-redis)┐ │
│  │  PostgreSQL :5432  │  │  Redis :6379         │ │
│  └────────────────────┘  └─────────────────────┘ │
└───────────────────────────────────────────────────┘
```

### 4.2 LLM Provider 용도별 사용

| 기준 | Gemini | Groq |
|------|:---:|:---:|
| **응답 속도** | 보통 | ⚡ 매우 빠름 (LPU) |
| **분석 능력** | ✅ 대용량 컨텍스트 | 보통 |
| **주 용도** | 데이터 분석·점수 산정 | 실시간 챗봇 대화 |
| **선택 방법** | `get_llm("gemini")` | `get_llm("groq")` |

---

## 5. 환경변수 설정

```env
# .env
# === 서버 설정 ===
PORT=8000
ENV=development

# === LLM Provider 선택 ===
LLM_PROVIDER=gemini        # gemini | groq | bedrock

# === Gemini ===
GEMINI_API_KEY=your-key

# === Groq ===
GROQ_API_KEY=your-key

# === AWS Bedrock ===
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1

# === RAG ===
CHROMA_PERSIST_DIR=./data/chroma
EMBEDDING_MODEL=text-embedding-004

# === Backend 연동 ===
BACKEND_API_URL=http://localhost:8080/api
```

---

## 6. 필수 패키지 (requirements.txt)

```
# === 프레임워크 ===
fastapi
uvicorn
sse-starlette
python-dotenv

# === LLM Providers ===
google-genai              # Gemini
groq                      # Groq
boto3                     # AWS Bedrock

# === RAG ===
chromadb                  # 벡터 DB
langchain                 # 문서 처리 + 체이닝
langchain-google-genai    # Gemini 임베딩

# === 유틸 ===
httpx                     # Backend API 호출
pydantic                  # 데이터 검증
```
