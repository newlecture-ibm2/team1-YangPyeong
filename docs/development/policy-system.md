# 정책 수집·분석 시스템 기술 문서

> FarmBalance 프로젝트의 AI 기반 정책 수집·분석·서빙 파이프라인 전체 문서

---

## 1. 시스템 개요

외부 API에서 농업 정책을 수집하고, Gemini AI로 정규화·분류·신뢰도 평가를 수행한 뒤, 지역코드 보정과 카테고리 검증을 거쳐 DB에 저장하는 End-to-End 파이프라인입니다.

```
[외부 API / Mock]
     │ fetch
     ▼
[PolicySyncService] ── orchestration ──
     │
     ├── STEP 1: Fetch  (PolicyExternalFetchPort)
     ├── STEP 2: Analyze (PolicyAiAnalyzePort → FastAPI AI 서버)
     │       └─ 실패 시 skip (analyzed < fetched)
     ├── STEP 3: Correct (RegionCodeNormalizer + CategoryValidator)
     └── STEP 4: Persist (PolicySavePort → JPA)
              └─ 개별 트랜잭션 (1건 실패 격리)
     │
     ▼
[API 제공]
     ├── GET  /api/policies          → 목록 (필터 + AI 상태)
     ├── GET  /api/policies/{id}     → 상세 (normalizedData 객체)
     └── POST /api/admin/policies/sync → 수동 동기화

[스케줄러]
     └── @Scheduled(cron="0 0 3 * * *") → 자동 동기화 (기본 OFF)
```

---

## 2. 헥사고날 아키텍처 — 파일 구조

```
com.farmbalance.policy/
├── adapter/
│   ├── in/
│   │   ├── web/
│   │   │   ├── PolicyController.java          ← REST API (목록/상세/동기화)
│   │   │   ├── PolicyAdminLocalController.java ← @Profile("local") 전용 관리 API
│   │   │   └── dto/
│   │   │       ├── PolicyListResponse.java     ← 목록 응답 DTO
│   │   │       └── PolicyDetailResponse.java   ← 상세 응답 DTO (@JsonRawValue)
│   │   └── scheduler/
│   │       └── PolicySyncScheduler.java        ← 매일 03:00 자동 동기화
│   └── out/
│       ├── external/
│       │   ├── PolicyAiAnalyzeClient.java      ← AI 서버 REST 호출
│       │   ├── MockPolicyFetcher.java          ← 테스트용 Mock (7건, 기본 OFF)
│       │   ├── Gov24PolicyClient.java          ← 정부24 API (운영 연동 완료)
│       │   └── MafraPolicyClient.java          ← 농림축산식품부 (TODO)
│       └── persistence/
│           ├── entity/PolicyDataJpaEntity.java ← JPA Entity
│           ├── repository/PolicyDataRepository.java ← JPQL 동적 쿼리
│           └── adapter/
│               ├── PolicyPersistenceAdapter.java    ← QueryPort + SavePort 구현
│               ├── RegionCodeResolveAdapter.java    ← 지역코드 DB 조회
│               └── RegionNameResolveAdapter.java    ← 지역명 조회
├── application/
│   ├── port/
│   │   ├── in/
│   │   │   ├── SearchPolicyUseCase.java        ← 조회 Input Port
│   │   │   └── SyncPolicyUseCase.java          ← 동기화 Input Port + SyncResult
│   │   └── out/
│   │       ├── PolicyAiAnalyzePort.java         ← AI 분석 Output Port
│   │       ├── PolicyExternalFetchPort.java     ← 수집 Output Port
│   │       ├── PolicyQueryPort.java             ← 조회 Output Port
│   │       ├── PolicySavePort.java              ← 저장 Output Port
│   │       ├── RegionCodeResolvePort.java       ← 지역코드 보정 Port
│   │       └── RegionNameResolvePort.java       ← 지역명 조회 Port
│   └── service/
│       ├── PolicyQueryService.java              ← 조회 서비스
│       └── PolicySyncService.java               ← 동기화 오케스트레이터
└── domain/model/
    ├── PolicyData.java                          ← 도메인 모델 (순수 POJO)
    ├── PolicySource.java                        ← 수집 소스 enum (10종)
    ├── PolicySearchCondition.java               ← 검색 조건 VO
    ├── RegionCodeNormalizer.java                ← 지역코드 순수 보정 로직
    └── SyncWarningType.java                     ← 경고 유형 enum (10종)
```

### AI 서버 (FastAPI)

```
ai/app/
├── routers/policy.py              ← POST /api/policy/analyze
├── services/policy_analyzer.py    ← Gemini LLM 프롬프트 + JSON 파싱 + 검증
├── models/policy.py               ← Pydantic 스키마 (Request/Response/Result)
└── llm/
    ├── base.py                    ← BaseLLM 추상 클래스
    ├── gemini.py                  ← Gemini 구현체 (기본)
    └── __init__.py                ← get_llm() 팩토리
```

---

## 3. DB 스키마 — policy_data 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGSERIAL PK | 자동 증가 |
| `external_id` | VARCHAR(200) NOT NULL | 외부 시스템 고유 ID |
| `source` | VARCHAR(30) | 수집 소스 (GOV24, SEED 등) |
| `title` | VARCHAR(500) | 정책명 |
| `organization` | VARCHAR(200) | 지원기관 |
| `region_code` | VARCHAR(10) | 지역코드 (41, 4183, 0000) |
| `category` | VARCHAR(50) | 카테고리 (7종) |
| `target` | VARCHAR(200) | 지원대상 |
| `content` | TEXT | AI 요약 내용 |
| `support_amount` | VARCHAR(100) | 지원금액/규모 |
| `apply_start` | DATE | 신청 시작일 |
| `apply_end` | DATE | 신청 마감일 |
| `source_url` | VARCHAR(1000) | 원문 링크 |
| `raw_data` | JSONB | 원본 API 응답 JSON |
| `normalized_data` | JSONB | AI 정규화 결과 전체 JSON |
| `confidence` | NUMERIC(5,2) | AI 신뢰도 (0.00~1.00) |
| `data` | TEXT NOT NULL | 구조화 JSON (`{"source":"...","type":"raw/text","content":...}`) |
| `fetched_at` | TIMESTAMP NOT NULL | 수집 시각 |
| `created_at` | TIMESTAMP | 생성 시각 |
| `updated_at` | TIMESTAMP | 수정 시각 |
| `deleted_at` | TIMESTAMP | 소프트 삭제 시각 |

**UNIQUE 제약**: `(external_id, source)`

---

## 4. API 명세

### 4.1 목록 조회 — `GET /api/policies`

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `keyword` | String | 제목/내용/기관 검색 |
| `regionCode` | String | 지역코드 필터 (41, 4183, 0000) |
| `category` | String | 카테고리 필터 (보조금, 교육, 임대, 검정, 세금, 융자, 기타) |
| `period` | String | `active` (진행중) / `closed` (마감) |
| `minConfidence` | BigDecimal | 최소 AI 신뢰도 (0.0~1.0) |
| `page` | int | 페이지 번호 (0부터, 기본 0) |
| `size` | int | 페이지 크기 (기본 10, 최대 100) |

**응답**:
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 2,
        "title": "청년농업인 영농정착 지원사업",
        "organization": "농림축산식품부",
        "regionCode": "0000",
        "regionName": "전국",
        "category": "보조금",
        "target": "만 18~40세 이하 청년농",
        "contentSummary": "만 18~40세 이하 청년농에게 월 최대 100만원...",
        "supportAmount": "월 최대 100만원",
        "applyEnd": "2025-04-30",
        "source": "SEED",
        "sourceUrl": "https://gov24.go.kr/policy/mock001",
        "aiConfidence": 0.95,
        "isLowConfidence": false,
        "isAnalyzed": true
      }
    ],
    "page": 0, "size": 10, "totalCount": 7, "totalPages": 1
  }
}
```

### 4.2 상세 조회 — `GET /api/policies/{id}`

목록 필드 + 아래 추가:

| 추가 필드 | 설명 |
|----------|------|
| `applyStart` | 신청 시작일 |
| `normalizedData` | AI 정규화 결과 **(JSON 객체)** — `@JsonRawValue` 적용 |

```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "청년농업인 영농정착 지원사업",
    "aiConfidence": 0.95,
    "isLowConfidence": false,
    "isAnalyzed": true,
    "normalizedData": {
      "title": "청년농업인 영농정착 지원사업",
      "category": "보조금",
      "confidence": 0.95,
      "region_code": "0000",
      "organization": "농림축산식품부",
      "warnings": []
    }
  }
}
```

### 4.3 동기화 — `POST /api/admin/policies/sync`

관리자 전용 (TODO: 인증/인가 적용).

**응답**:
```json
{
  "success": true,
  "data": {
    "fetched": 7,
    "created": 7,
    "updated": 0,
    "analyzed": 6,
    "skipped": 1,
    "failed": 0,
    "warnings": [
      "[MOCK_SKIP_007][AI_ANALYZE_SKIPPED] AI 서버 응답 없음 → skip",
      "[MOCK_006][AI_LOW_CONFIDENCE] 낮은 신뢰도: 0.05"
    ]
  }
}
```

### 4.4 AI 분석 — `POST /api/policy/analyze` (AI 서버)

**요청** (Backend → AI):
```json
{
  "source": "GOV24",
  "external_id": "MOCK_001",
  "raw": { "servNm": "청년농업인 영농정착 지원사업", "..." },
  "text": null,
  "source_url": "https://gov24.go.kr/policy/mock001"
}
```

**응답** (AI → Backend):
```json
{
  "status": "ok",
  "source": "GOV24",
  "external_id": "MOCK_001",
  "result": {
    "title": "청년농업인 영농정착 지원사업",
    "organization": "농림축산식품부",
    "region_code": "0000",
    "category": "보조금",
    "target": "만 18~40세 이하 청년농",
    "content_summary": "월 최대 100만원 영농정착금 지원",
    "support_amount": "월 최대 100만원",
    "apply_start": "2025-03-01",
    "apply_end": "2025-04-30",
    "confidence": 0.95,
    "warnings": []
  }
}
```

---

## 5. 동기화 파이프라인 상세

### STEP 1: Fetch (수집)

- `PolicyExternalFetchPort` 인터페이스를 구현한 Fetcher 목록을 순회
- 현재 활성: `MockPolicyFetcher` (7건 테스트 데이터)
- 각 Fetcher는 `List<PolicyData>`를 반환 (raw 또는 text만 채워진 상태)

### STEP 2: Analyze (AI 분석)

- `PolicyAiAnalyzePort` → `PolicyAiAnalyzeClient` → FastAPI AI 서버
- AI 서버는 Gemini LLM 프롬프트로 정규화 JSON 생성
- 결과: title, organization, category, region_code, confidence, warnings 등
- **실패 시** (`Optional.empty()`) → `skipped++`, 건은 DB에 raw만 저장
- **성공 시** → `analyzed++`, 결과를 PolicyData에 적용

### STEP 3: Correct (보정)

#### 지역코드 보정 (RegionCodeNormalizer + RegionCodeResolveAdapter)

| 입력 | 보정 결과 | 규칙 |
|------|----------|------|
| `"전국"`, `"공통"` | `"0000"` | 특수 키워드 매핑 |
| `"4100"` | `"41"` | 4자리 + 뒤 00 → 2자리(시/도) |
| `"41830"` | `"4183"` | 5자리 → 4자리 |
| `"양평군"` | `"4183"` | regions 테이블 name 매칭 |
| 매칭 실패 | `null` | warning 추가 |

#### 카테고리 보정

- 유효 카테고리: `보조금`, `교육`, `임대`, `검정`, `세금`, `융자`, `기타`
- 유효하지 않은 값 → `"기타"` + warning

### STEP 4: Persist (저장)

- `external_id + source` 기준 upsert (존재 시 update, 없으면 create)
- 개별 `@Transactional` → 1건 실패해도 나머지 계속 저장
- `data` 컬럼: `{"source":"SEED","type":"raw","content":{...}}` JSON 구조화

---

## 6. AI 상태 분류

```
┌──────────────────────────────────────────────────┐
│ AI 호출                                           │
├────────────────────┬─────────────────────────────┤
│ 실패 (empty)       │ 성공                         │
│                    ├──────────────┬──────────────┤
│                    │ conf ≥ 0.6   │ conf < 0.6   │
├────────────────────┼──────────────┼──────────────┤
│ SyncResult:        │ SyncResult:  │ SyncResult:  │
│  skipped++         │  analyzed++  │  analyzed++  │
│                    │              │              │
│ API 응답:          │ API 응답:    │ API 응답:    │
│  aiConfidence=null │  0.6~1.0     │  0.0~0.59    │
│  isLowConf=false   │  false       │  true        │
│  isAnalyzed=false  │  true        │  true        │
│  normalizedData    │  {객체}      │  {객체}      │
│   =null            │              │              │
│                    │              │              │
│ DB 저장: raw만     │ DB 저장 정상 │ DB 저장 정상 │
└────────────────────┴──────────────┴──────────────┘
```

---

## 7. SyncWarningType — 경고 유형

| 코드 | 의미 | 예시 |
|------|------|------|
| `REGION_CORRECTION` | 지역코드 보정됨 | `'4100' → '41'` |
| `REGION_MATCH_FAILED` | 지역코드 매칭 실패 → null | `'경상남도' → null` |
| `CATEGORY_CORRECTION` | 카테고리 보정 → '기타' | `'금융' → '기타'` |
| `DATE_PARSE_FAILED` | 날짜 파싱 실패 | `'상시' → null` |
| `DATE_ESTIMATED` | 날짜 연도 추정 | `'~4월 30일' → '2025-04-30'` |
| `AI_ANALYZE_SKIPPED` | AI 호출 skip | AI 서버 무응답 |
| `AI_ANALYZE_FAILED` | AI 예외 발생 | 네트워크 에러 |
| `AI_LOW_CONFIDENCE` | AI 경고 메시지 전달 | `'낮은 신뢰도: 0.40'` |
| `SYNC_SAVE_FAILED` | DB 저장 실패 | NOT NULL 제약 위반 |
| `SYNC_FETCH_FAILED` | 소스 전체 수집 실패 | API 인증 만료 |

포맷: `[externalId][WARNING_TYPE] message`

---

## 8. PolicySource — 수집 소스

| 소스 | 설명 | 상태 |
|------|------|------|
| `GOV24` | 보조금24 (정부24) API | TODO |
| `MAFRA` | 농림축산식품부 공고 | TODO |
| `FARM_MACHINE` | 농기계 임대 API | TODO |
| `NONGSARO` | 농사로 영농기술상담 | TODO |
| `SOIL` | 흙토람 토양검정 | TODO |
| `AGRIEDU` | 농업교육포털 | TODO |
| `GREENDAERO` | 그린대로 귀농귀촌 | TODO |
| `MANUAL` | 수동 업로드 (PDF/HWP) | TODO |
| `CRAWL` | 기타 웹 크롤링 | TODO |
| `SEED` | 개발용 테스트 데이터 | ✅ 활성 |

---

## 9. MockPolicyFetcher — 테스트 데이터

`app.policy.mock-fetcher-enabled=true` (기본 활성)

| # | externalId | 시나리오 | 검증 포인트 |
|---|-----------|---------|-----------|
| 1 | MOCK_001 | 정상 GOV24 JSON | 보조금 분류, 날짜 파싱 |
| 2 | MOCK_002 | 경기도 농기계 임대 | 4100 → 41 보정 |
| 3 | MOCK_003 | 양평군 토양 검정 | 이름 → 4183 매칭 |
| 4 | MOCK_004 | 파싱 어려운 날짜 | 연도 추정 + warning |
| 5 | MOCK_005 | 최소 데이터 | 낮은 confidence |
| 6 | MOCK_006 | 무의미한 텍스트 | 매우 낮은 confidence (0.05) |
| 7 | MOCK_SKIP_007 | AI 호출 강제 skip | analyzed < fetched 검증 |

---

## 10. 스케줄러

```java
@ConditionalOnProperty(name = "app.policy.scheduler-enabled",
                        havingValue = "true", matchIfMissing = false)
@Scheduled(cron = "0 0 3 * * *")
public void syncDaily() { ... }
```

- **기본 비활성** — `app.policy.scheduler-enabled=true` 설정 시 활성화
- 매일 새벽 3시 자동 동기화
- 실패 시 로그만 남기고 전체 앱에 영향 없음

---

## 11. 환경변수

### Backend (Spring Boot)

| 환경변수 | 기본값 | 설명 |
|---------|--------|------|
| `AI_SERVER_URL` 또는 `ai.server-url` | `http://localhost:8000` | AI 서버 URL |
| `app.policy.mock-fetcher-enabled` | `true` | Mock Fetcher 활성화 |
| `app.policy.scheduler-enabled` | `false` | 스케줄러 활성화 |

### AI Server (FastAPI)

| 환경변수 | 기본값 | 설명 |
|---------|--------|------|
| `GEMINI_API_KEY` | (필수) | Google Gemini API Key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | 사용할 Gemini 모델명 |
| `LLM_PROVIDER` | `gemini` | LLM 제공자 (gemini/groq/bedrock) |
| `DATABASE_URL` | (선택) | PostgreSQL 연결 문자열 |

### Docker Compose

```yaml
ai-server:
  environment:
    - GEMINI_API_KEY=${GEMINI_API_KEY}
    - LLM_PROVIDER=gemini
    - GEMINI_MODEL=gemini-2.5-flash
    - DATABASE_URL=postgresql+psycopg://farm:xxx@db:5432/farm_db

backend:
  environment:
    - AI_SERVER_URL=http://ai-server:8000
```

---

## 12. 실행 방법

### 로컬 개발

```bash
# 1. AI 서버 실행
cd ai && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

# 2. Backend 실행
cd backend && AI_SERVER_URL=http://localhost:8000 ./gradlew bootRun --args='--server.port=8081'

# 3. Sync 호출
curl -s -X POST http://localhost:8081/api/admin/policies/sync | python3 -m json.tool

# 4. 목록 확인
curl -s 'http://localhost:8081/api/policies?page=0&size=10' | python3 -m json.tool

# 5. 상세 확인
curl -s 'http://localhost:8081/api/policies/2' | python3 -m json.tool

# 6. 필터 테스트
curl -s 'http://localhost:8081/api/policies?minConfidence=0.8'
curl -s --get 'http://localhost:8081/api/policies' --data-urlencode 'category=보조금'
curl -s 'http://localhost:8081/api/policies?regionCode=4183'
```

### Docker Compose 배포

```bash
docker compose up -d --build
# backend → http://ai-server:8000 으로 AI 서버 호출 (자동)
```

---

## 13. 의존성 흐름 (헥사고날 규칙)

```
domain/ ──→ 어디에도 의존하지 않음 (순수 POJO)
  PolicyData, PolicySource, PolicySearchCondition,
  RegionCodeNormalizer, SyncWarningType

application/ ──→ domain/만 의존
  port/in:  SearchPolicyUseCase, SyncPolicyUseCase
  port/out: PolicyAiAnalyzePort, PolicyExternalFetchPort,
            PolicyQueryPort, PolicySavePort, RegionCodeResolvePort
  service:  PolicyQueryService, PolicySyncService

adapter/ ──→ application/ + domain/ 의존 (프레임워크 허용)
  in/web:   PolicyController, DTO
  in/sched: PolicySyncScheduler
  out/ext:  PolicyAiAnalyzeClient, MockPolicyFetcher
  out/pers: PolicyDataJpaEntity, PolicyDataRepository,
            PolicyPersistenceAdapter, RegionCodeResolveAdapter
```

---

## 14. 검증 완료된 테스트 결과

### Gov24 실제 데이터 SyncResult

```
fetched=28, analyzed=28, skipped=0, created=26, updated=0, failed=2
```

- 수집 대상: 정부24 보조금24 API v3 (`api.odcloud.kr`)
- 키워드 필터: 농업, 농촌, 영농, 귀농, 축산, 농기계, 스마트팜 등 19종
- 5페이지(500건) 탐색 → 농업 관련 28건 추출
- 모든 정책에 `sourceUrl`(실제 gov.kr URL) 포함

### Mock 테스트 SyncResult (과거 검증)

```
fetched=7, analyzed=6, skipped=1, created=7, failed=0
```

### 핵심 검증 통과

- ✅ Gov24 실제 API 연동 (26건 저장 확인)
- ✅ 상세보기 → `https://www.gov.kr/...` 실제 정부 페이지 이동
- ✅ `4100` → `41` 보정
- ✅ `양평군` → `4183` 이름 매칭
- ✅ `전국` → `0000` 매핑
- ✅ AI 실패 → skip (MOCK_SKIP_ prefix)
- ✅ LOW CONFIDENCE → 저장 + flag
- ✅ normalizedData → JSON 객체 반환
- ✅ 개별 트랜잭션 (1건 실패 격리)
- ✅ 카테고리 7종 기준 보정

---

## 15. Gov24 API 연동 상세

### API 정보

| 항목 | 값 |
|------|----|
| API | 정부24 보조금24 서비스 목록 v3 |
| URL | `https://api.odcloud.kr/api/gov24/v3/serviceList` |
| 인증 | `Authorization: Infuser {GOV24_API_KEY}` |
| 환경변수 | `gov24.api-key` (Spring) / `GOV24_API_KEY` (.env.local) |
| 필터 방식 | 클라이언트 키워드 필터링 (서버 cond 미지원) |

### 키워드 필터 (19종)

```
농업, 농촌, 영농, 귀농, 귀촌, 농가, 농기계,
축산, 임업, 농산물, 양잠, 양봉, 스마트팜,
농림, 원예, 농지, 토양, 비료, 종자
```

### 수집 흐름

```
Gov24 API 5페이지(500건) 전체 조회
    ↓
서비스명/목적요약/소관기관/지원내용에 키워드 포함 여부 필터
    ↓
중복 제거 (서비스ID 기준)
    ↓
PolicyData 변환 (externalId=GOV24_{서비스ID}, sourceUrl=상세조회URL)
    ↓
AI 분석 → DB 저장
```

---

## 16. MockPolicyFetcher 관리

### 활성화 조건

```yaml
# application.yml 또는 bootRun args
app.policy.mock-fetcher-enabled: false   # 기본값 = 비활성화
```

| 설정값 | 결과 |
|--------|------|
| 미설정 (기본) | **MockFetcher 비활성화** — Gov24만 수집 |
| `false` | MockFetcher 비활성화 |
| `true` | MockFetcher 활성화 — SEED 데이터 7건 추가 생성 |

### 로컬 테스트 시 Mock 활성화

```bash
./gradlew bootRun --args='--app.policy.mock-fetcher-enabled=true'
```

### 삭제용 관리 API (@Profile("local") 전용)

```
DELETE /api/admin/policies?source=SEED
```

- `PolicyAdminLocalController.java`에 정의
- `@Profile("local")` 적용 → **운영 환경에서 로드되지 않음**
- 로컬 실행 시: `--spring.profiles.active=local` 추가 필요

---

## 17. 알려진 이슈 / TODO

| 항목 | 상태 | 비고 |
|------|------|------|
| Gov24 API 연동 | ✅ 완료 | 농업 키워드 필터 26건 수집 |
| MAFRA (농림축산식품부) 연동 | TODO | API 스펙 확인 후 구현 |
| `/api/admin/**` 인증/인가 | TODO | SecurityConfig 제한 |
| farms.status DDL 에러 | 기존 | 정책 모듈 무관 |
| 비동기 파이프라인 전환 | TODO | Kafka/이벤트 큐 |
| AI 분석 캐싱 | TODO | 동일 external_id 재분석 방지 |
| 프론트 정책 상세 페이지 | TODO | normalizedData 표시 |
