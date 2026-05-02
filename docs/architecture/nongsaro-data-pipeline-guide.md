# 🌾 농사로 데이터 파이프라인 구현 가이드

> **목적**: 농사로 Open API → JSON 파싱 → PostgreSQL 저장 → RAG 인제스트 → 챗봇 활용
> **작성일**: 2026-04-30

---

## 담당자별 작업 범위

| Phase | 담당 | 작업 내용 | 상태 |
|:-----:|------|---------|:----:|
| **1** | **나은님** | API 호출 → XML→JSON 파싱 → DB 테이블 설계 → 데이터 저장 | 🔨 진행 예정 |
| **2** | **AI 담당** | DB 데이터 → ChromaDB 인제스트 (RAG 구축) | ⏳ 대기 |
| **3** | **AI 담당** | 챗봇 에이전트에서 RAG 검색 → 재배 기술 상담 | ⏳ 대기 |

---

## 전체 아키텍처

```
[Phase 1 - 나은님]                  [Phase 2 - AI 담당]           [Phase 3 - AI 담당]

┌─────────────────┐          ┌──────────────────┐         ┌──────────────────┐
│  농사로 API      │          │  DB → ChromaDB   │         │  Agent/Service   │
│                 │          │                  │         │                  │
│  XML 응답 수신   │──JSON──▶│  SELECT 조회      │──벡터──▶│  RAG 검색         │
│  JSON 파싱      │   ↓      │  텍스트 변환      │  DB     │  LLM 응답 생성    │
│  PostgreSQL 저장 │  DB     │  임베딩 + 적재    │         │  재배 기술 상담    │
└─────────────────┘          └──────────────────┘         └──────────────────┘
```

---

# Phase 1: API → DB 저장 (나은님 담당)

## 1. 인증키 관리

### 1.1 키 목록

| 키 | 소유자 | 매핑 서비스 |
|---|--------|-----------|
| `20260428GUY88H4AXA3DMMHFQP6DA` | 나은님 | 8개 서비스 + 공통코드 |
| `20260424FUQ4QUUDOL19ZNUIUEFYW` | 현석님 (서버) | `cropEbook`, `dbyhsCccrrncInfo` |
| `20260424ZSHPH8ZYG6VU6UNEL8O9LW` | 현석님 (로컬) | `cropEbook`, `dbyhsCccrrncInfo` |

### 1.2 환경변수 설정

**Step 1.** `.env` 파일에 실제 키 저장 (Git에 커밋하지 않음):

```env
# .env (Git 미추적 — .gitignore에 포함)
NONGSARO_API_KEY_DEFAULT=20260428GUY88H4AXA3DMMHFQP6DA
NONGSARO_API_KEY_CROP_EBOOK=20260424FUQ4QUUDOL19ZNUIUEFYW
```

**Step 2.** `application-dev.yml`에서 환경변수로 참조:

```yaml
# backend/src/main/resources/application-dev.yml
nongsaro:
  api:
    default-key: ${NONGSARO_API_KEY_DEFAULT}
    crop-ebook-key: ${NONGSARO_API_KEY_CROP_EBOOK}
```

> [!WARNING]
> YAML에 API 키를 직접 쓰면 Git에 커밋됩니다. 반드시 `.env` + `${환경변수}` 참조 방식을 사용하세요.

> [!IMPORTANT]
> `cropEbook` 서비스만 현석님 키 사용. 나머지는 전부 나은님 키.

---

## 2. DB 테이블 설계

> 기존 ERD에 `crop_guides`, `pest_occurrence_reports`는 이미 존재합니다.
> 아래는 **신규로 추가해야 할 테이블**입니다.

### 2.1 기존 테이블 (ERD에 이미 있음)

| 테이블 | 용도 | 데이터 소스 |
|--------|------|-----------|
| `crop_guides` | 작물별 재배 가이드 (PDF, 목차, 품종) | `cropEbook` |
| `pest_occurrence_reports` | 병해충 발생정보 보고서 | `dbyhsCccrrncInfo` |

### 2.2 신규 테이블

#### `nongsaro_varieties` — 품종 정보 (2,604건)

```sql
CREATE TABLE nongsaro_varieties (
    id              BIGSERIAL PRIMARY KEY,
    cntnts_no       VARCHAR(20) UNIQUE NOT NULL,  -- 농사로 콘텐츠 번호
    variety_name    VARCHAR(200),                  -- 품종명
    crop_name       VARCHAR(100),                  -- 작물명
    category_code   VARCHAR(20),                   -- 분류코드
    characteristics TEXT,                           -- 품종 특성
    breeding_inst   VARCHAR(200),                  -- 육성기관
    breeding_year   VARCHAR(10),                   -- 육성년도
    image_url       TEXT,                           -- 이미지 URL
    attachment_url  TEXT,                           -- 첨부파일 URL
    file_name       VARCHAR(200),                  -- 파일명
    raw_data        JSONB,                          -- 원본 전체 보관
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);
```

#### `nongsaro_farm_schedules` — 농작업일정 시기별 데이터

```sql
CREATE TABLE nongsaro_farm_schedules (
    id                  BIGSERIAL PRIMARY KEY,
    cntnts_no           VARCHAR(20) NOT NULL,       -- 콘텐츠 번호
    crop_code           VARCHAR(20),                 -- 품목코드 (210001 등)
    crop_name           VARCHAR(50),                 -- 품목명 (채소 등)
    farm_work_type      VARCHAR(100),                -- 농작업 구분 (벼 기계이앙재배 등)
    info_type_code      VARCHAR(20),                 -- 정보유형코드 (410001 등)
    info_type_name      VARCHAR(100),                -- 정보유형명 (생육과정 등)
    operation_name      VARCHAR(200),                -- 작업명 (모기르기 등)
    start_month         INT,                          -- 시작 월
    start_period        VARCHAR(10),                 -- 시작 시기 (상/중/하)
    end_month           INT,                          -- 종료 월
    end_period          VARCHAR(10),                 -- 종료 시기
    duration_months     INT,                          -- 소요 개월
    video_url           TEXT,                         -- 동영상 URL
    raw_data            JSONB,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP,
    deleted_at          TIMESTAMP,
    UNIQUE (cntnts_no, operation_name, start_month)   -- 중복 INSERT 방지
);

CREATE INDEX idx_farm_schedules_crop ON nongsaro_farm_schedules(crop_code);
CREATE INDEX idx_farm_schedules_month ON nongsaro_farm_schedules(start_month);
```

#### `nongsaro_disaster_prevention` — 재해예방정보 (320건)

```sql
CREATE TABLE nongsaro_disaster_prevention (
    id              BIGSERIAL PRIMARY KEY,
    cntnts_no       VARCHAR(20) UNIQUE NOT NULL,
    title           VARCHAR(300),
    crop_name       VARCHAR(100),
    disaster_type   VARCHAR(100),
    content         TEXT,
    image_url       TEXT,
    raw_data        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);
```

#### `nongsaro_eco_farming` — 친환경 우수사례 (66건)

```sql
CREATE TABLE nongsaro_eco_farming (
    id              BIGSERIAL PRIMARY KEY,
    cntnts_no       VARCHAR(20) UNIQUE NOT NULL,
    title           VARCHAR(300),
    region_name     VARCHAR(50),
    link_url        TEXT,
    file_name       VARCHAR(200),
    raw_data        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);
```

#### `nongsaro_advanced_tech` — 첨단농업기술 (171건)

```sql
CREATE TABLE nongsaro_advanced_tech (
    id              BIGSERIAL PRIMARY KEY,
    cntnts_no       VARCHAR(20) UNIQUE NOT NULL,
    title           VARCHAR(300),
    content         TEXT,
    image_url       TEXT,
    video_url       TEXT,
    raw_data        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP
);
```

> [!TIP]
> 모든 테이블에 `raw_data JSONB` 컬럼을 넣어서 **API 원본 응답을 그대로 보관**합니다.
> 나중에 추가 필드가 필요하면 raw_data에서 꺼내 쓸 수 있어 안전합니다.

---

## 3. 구현 방식: Python 수집 → Flyway SQL 생성 (확정 ✅)

> **방법 A (Python 스크립트)로 확정.**
> 정기 배치가 필요하지 않고 **1회성 수집**이므로 Python이 가장 효율적입니다.

### 3.1 전체 프로세스

```
Step 1. Python 스크립트 실행
        ├── 농사로 API 호출 (XML 응답 수신)
        ├── xmltodict로 XML → JSON(dict) 파싱
        └── 파싱된 데이터로 INSERT SQL문 자동 생성
                ↓
Step 2. .sql 파일 저장
        └── backend/src/main/resources/db/migration/
            ├── V9__create_nongsaro_tables.sql        ← 테이블 생성 (직접 작성)
            ├── V10_0__fix_nongsaro_column_lengths.sql ← 컬럼 길이 수정
            └── V10_1~V10_7__seed_nongsaro_*.sql      ← 데이터 INSERT (Python이 자동 생성)
                ↓
Step 3. Spring Boot 실행 시 Flyway가 자동 적용
        └── 팀원은 git pull → 앱 실행만 하면 데이터 자동 반영
```

### 3.2 필수 패키지

```bash
pip install xmltodict httpx python-dotenv tqdm
```

| 패키지 | 역할 |
|--------|------|
| `xmltodict` | XML → JSON(dict) 변환 (CDATA 자동 처리) |
| `httpx` | 농사로 API HTTP 호출 |
| `python-dotenv` | .env 파일에서 API 키 읽기 |
| `tqdm` | 수집 진행률 표시 |

### 3.3 Python 스크립트 구조

```python
# ai/scripts/fetch_nongsaro.py
"""
농사로 API 데이터를 수집하여 Flyway SQL 파일을 자동 생성하는 스크립트

사용법:
    python ai/scripts/fetch_nongsaro.py
"""
import os, json, httpx, xmltodict
from pathlib import Path
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()

BASE_URL = "http://api.nongsaro.go.kr/service"

# Flyway SQL 파일 출력 경로
OUTPUT_DIR = Path(__file__).parent.parent.parent / "backend" / "src" / "main" / "resources" / "db" / "migration"


def get_api_key(service: str) -> str:
    """서비스별 API 키 반환"""
    if service == "cropEbook":
        return os.getenv("NONGSARO_API_KEY_CROP_EBOOK")
    return os.getenv("NONGSARO_API_KEY_DEFAULT")


def fetch_and_parse(service: str, operation: str, params: dict = None) -> list:
    """API 호출 → XML → JSON(dict) → items 추출"""
    url = f"{BASE_URL}/{service}/{operation}"
    query = {"apiKey": get_api_key(service), **(params or {})}
    resp = httpx.get(url, params=query, timeout=30)
    data = xmltodict.parse(resp.text)
    items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
    # 단건이면 리스트로 감싸기
    return [items] if isinstance(items, dict) else items


def escape_sql(value) -> str:
    """SQL 인젝션 방지 + 특수문자 이스케이프"""
    if value is None:
        return "NULL"
    s = str(value).replace("'", "''")  # 작은따옴표 이스케이프
    return f"'{s}'"
```

### 3.4 SQL 파일 자동 생성 예시

```python
def generate_variety_sql():
    """품종 정보 수집 → V7__seed_nongsaro_varieties.sql 생성"""
    print("📦 품종 정보 수집 중...")
    all_items = []
    page = 1
    
    while True:
        items = fetch_and_parse("varietyInfo", "varietyLst", {
            "pageNo": page, "numOfRows": 100
        })
        if not items:
            break
        all_items.extend(items)
        page += 1
    
    # SQL 파일 생성
    sql_path = OUTPUT_DIR / "V7__seed_nongsaro_varieties.sql"
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("-- 농사로 품종 정보 시드 데이터 (자동 생성)\n")
        f.write(f"-- 생성일: {__import__('datetime').datetime.now()}\n")
        f.write(f"-- 총 {len(all_items)}건\n\n")
        
        for item in tqdm(all_items, desc="SQL 생성"):
            cntnts_no = escape_sql(item.get("cntntsNo"))
            variety_name = escape_sql(item.get("varietyNm"))
            crop_name = escape_sql(item.get("cropNm"))
            characteristics = escape_sql(item.get("charInfo"))
            breeding_inst = escape_sql(item.get("bredInstNm"))
            breeding_year = escape_sql(item.get("bredYear"))
            image_url = escape_sql(item.get("imgUrl"))
            raw_data = escape_sql(json.dumps(item, ensure_ascii=False))
            
            f.write(f"""INSERT INTO nongsaro_varieties 
(cntnts_no, variety_name, crop_name, characteristics, breeding_inst, breeding_year, image_url, raw_data)
VALUES ({cntnts_no}, {variety_name}, {crop_name}, {characteristics}, {breeding_inst}, {breeding_year}, {image_url}, {raw_data}::jsonb)
ON CONFLICT (cntnts_no) DO NOTHING;\n\n""")
    
    print(f"✅ {sql_path} 생성 완료 ({len(all_items)}건)")
```

### 3.5 생성되는 SQL 파일 예시

```sql
-- V7__seed_nongsaro_varieties.sql (Python이 자동 생성)
-- 생성일: 2026-04-30
-- 총 2604건

INSERT INTO nongsaro_varieties 
(cntnts_no, variety_name, crop_name, characteristics, breeding_inst, breeding_year, image_url, raw_data)
VALUES ('265051', '청춘채', '상추', '진한 자색의 치마 상추', '국립원예특작과학원', '2025', 'https://...', '{"cntntsNo":"265051",...}'::jsonb)
ON CONFLICT (cntnts_no) DO NOTHING;

INSERT INTO nongsaro_varieties 
(cntnts_no, variety_name, crop_name, characteristics, breeding_inst, breeding_year, image_url, raw_data)
VALUES ('265052', '꼬마배추', '배추', '소형 배추', '국립원예특작과학원', '2024', 'https://...', '{"cntntsNo":"265052",...}'::jsonb)
ON CONFLICT (cntnts_no) DO NOTHING;

-- ... 2,604건 반복
```

### 3.6 실행 후 적용 흐름

```
1. Python 실행:  python ai/scripts/fetch_nongsaro.py
                   ↓
2. SQL 파일 생성:  backend/.../migration/V7__seed_nongsaro_varieties.sql
                   ↓
3. Git 커밋:      git add . && git commit -m "feat: 농사로 시드 데이터 추가"
                   ↓
4. 팀원이 pull:   git pull
                   ↓
5. 앱 실행:       Flyway가 V7 감지 → 자동으로 2,604건 INSERT
```

> [!IMPORTANT]
> **팀원은 Python 스크립트를 실행할 필요 없이**, `git pull` 후 Spring Boot를 실행하면 Flyway가 자동으로 데이터를 넣어줍니다.

---

## 4. 서비스별 수집 순서

### 4.1 수집 대상 (7개)

| 순서 | 서비스 | 테이블 | 건수 | 비고 |
|:---:|--------|--------|:----:|------|
| 1 | `varietyInfo` | `nongsaro_varieties` | 2,604 | 페이징 필요 |
| 2 | `farmWorkingPlanNew` | `nongsaro_farm_schedules` | 다수 | 품목→일정→시기 3단계 |
| 3 | `dbyhsCccrrncInfo` | `pest_occurrence_reports` | 249 | 기존 테이블 |
| 4 | `frcDsstrPrevnt` | `nongsaro_disaster_prevention` | 320 | 페이징 필요 |
| 5 | `evrfrndFarmng` | `nongsaro_eco_farming` | 66 | 단순 목록 |
| 6 | `uptodeFarmngTchnlgyInfo` | `nongsaro_advanced_tech` | 171 | 페이징 필요 |
| 7 | `cropEbook` | `crop_guides` | 다수 | 기존 테이블, 현석님 키 |

### 4.2 수집 제외 (2개)

| 서비스 | 제외 사유 |
|--------|----------|
| `oneClickFarmngTchnlgy` (원클릭 농업기술) | 외부 링크(농사로 웹 페이지) 중심으로, DB에 구조화 저장할 데이터 없음. 챗봇에서 필요 시 URL 링크만 제공 |
| `farmWorkingPlan` (품목별 관리매뉴얼) | HWP/PDF 파일 다운로드 방식. DB 테이블이 아닌 **파일 다운로드 → RAG 인제스트** 방식으로 Phase 2에서 처리 |

---

## 5. Flyway 마이그레이션

> 현재 마이그레이션 최신 버전: `V8__add_farm_soil_columns.sql` (팀원 추가분 포함)
> 따라서 농사로 테이블은 **V9**부터 사용합니다.

```sql
-- V9__create_nongsaro_tables.sql

-- 품종 정보
CREATE TABLE IF NOT EXISTS nongsaro_varieties (
    id BIGSERIAL PRIMARY KEY,
    cntnts_no VARCHAR(20) UNIQUE NOT NULL,
    variety_name VARCHAR(200),
    crop_name VARCHAR(100),
    category_code VARCHAR(20),
    characteristics TEXT,
    breeding_inst VARCHAR(200),
    breeding_year VARCHAR(10),
    image_url TEXT,
    attachment_url TEXT,
    file_name VARCHAR(200),
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 농작업일정
CREATE TABLE IF NOT EXISTS nongsaro_farm_schedules (
    id BIGSERIAL PRIMARY KEY,
    cntnts_no VARCHAR(20) NOT NULL,
    crop_code VARCHAR(20),
    crop_name VARCHAR(50),
    farm_work_type VARCHAR(100),
    info_type_code VARCHAR(20),
    info_type_name VARCHAR(100),
    operation_name VARCHAR(200),
    start_month INT,
    start_period VARCHAR(10),
    end_month INT,
    end_period VARCHAR(10),
    duration_months INT,
    video_url TEXT,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_farm_schedules_crop ON nongsaro_farm_schedules(crop_code);
CREATE INDEX IF NOT EXISTS idx_farm_schedules_month ON nongsaro_farm_schedules(start_month);

-- 재해예방정보
CREATE TABLE IF NOT EXISTS nongsaro_disaster_prevention (
    id BIGSERIAL PRIMARY KEY,
    cntnts_no VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(300),
    crop_name VARCHAR(100),
    disaster_type VARCHAR(100),
    content TEXT,
    image_url TEXT,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 친환경 우수사례
CREATE TABLE IF NOT EXISTS nongsaro_eco_farming (
    id BIGSERIAL PRIMARY KEY,
    cntnts_no VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(300),
    region_name VARCHAR(50),
    link_url TEXT,
    file_name VARCHAR(200),
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 첨단농업기술
CREATE TABLE IF NOT EXISTS nongsaro_advanced_tech (
    id BIGSERIAL PRIMARY KEY,
    cntnts_no VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(300),
    content TEXT,
    image_url TEXT,
    video_url TEXT,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

---

## 6. Phase 1 체크리스트 (나은님)

- [x] `.env`에 API 키 2개 설정 (`NONGSARO_API_KEY_DEFAULT`, `NONGSARO_API_KEY_CROP_EBOOK`)
- [x] `V9__create_nongsaro_tables.sql` 작성 (테이블 CREATE)
- [x] `V10_0__fix_nongsaro_column_lengths.sql` 작성 (TEXT 타입 확장)
- [x] Python 수집 스크립트 작성 (`ai/scripts/fetch_nongsaro.py`)
- [x] 서비스별 수집 + DB INSERT
  - [x] `nongsaro_varieties` (2,604건) — V10_1
  - [x] `nongsaro_farm_schedules` (품목별 시기 데이터) — V10_2
  - [x] `pest_occurrence_reports` (249건, 기존 테이블) — V10_3
  - [x] `nongsaro_disaster_prevention` (320건) — V10_4
  - [x] `nongsaro_eco_farming` (66건) — V10_5
  - [x] `nongsaro_advanced_tech` (171건) — V10_6
  - [x] `crop_guides` (cropEbook, 기존 테이블) — V10_7
- [ ] 데이터 정합성 확인 (`SELECT COUNT(*) FROM ...`)
- [x] `.gitignore` 확인 (`.env` 미커밋)

---

# Phase 2: RAG 인제스트 (AI 담당)

> [!IMPORTANT]
> 이 섹션은 Phase 1 완료 후 AI 담당 팀원이 진행합니다.

## 7. RAG 인제스트 개요

**RAG(Retrieval-Augmented Generation)** = "검색으로 보강된 생성"

```
PostgreSQL 데이터 → 텍스트 변환 → 임베딩(벡터화) → ChromaDB 저장
                                                      ↓
                                            챗봇이 여기서 검색
```

### 왜 DB만으로는 부족한가?

| | SQL 검색 | RAG (벡터 검색) |
|--|:---:|:---:|
| `고추` 검색 | ✅ 정확히 일치하는 것만 | ✅ |
| `매운 채소 키우는 법` 검색 | ❌ 불가능 | ✅ 의미로 검색 |
| `5월에 뭐 심어야 해?` | ❌ 자연어 불가 | ✅ 관련 일정 반환 |

## 8. 인제스트 대상 테이블

| DB 테이블 | ChromaDB Collection | 청크 전략 |
|----------|---------------------|---------|
| `nongsaro_varieties` | `nongsaro_variety` | 품종 1건 = 1 청크 |
| `nongsaro_farm_schedules` | `nongsaro_schedule` | 작물×시기 = 1 청크 |
| `crop_guides` | `nongsaro_crop_guide` | PDF 다운로드 → 페이지별 분할 |
| `pest_occurrence_reports` | `nongsaro_pest` | 보고서 1건 = 1 청크 |
| `nongsaro_disaster_prevention` | `nongsaro_disaster` | 항목 1건 = 1 청크 |
| `nongsaro_eco_farming` | `nongsaro_eco` | 사례 1건 = 1 청크 |

## 9. 인제스트 스크립트 구조

```python
# ai/scripts/ingest_nongsaro.py

"""
DB에 저장된 농사로 데이터를 ChromaDB에 인제스트하는 스크립트

사용법:
    python -m scripts.ingest_nongsaro              # 전체
    python -m scripts.ingest_nongsaro --source variety
"""

import psycopg2
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.rag.vectorstore import get_vectorstore


def load_varieties_from_db() -> list[Document]:
    """DB에서 품종 정보를 읽어 Document로 변환"""
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT variety_name, crop_name, characteristics, breeding_inst, breeding_year FROM nongsaro_varieties")
    
    documents = []
    for row in cur.fetchall():
        text = f"작물: {row[1]}\n품종: {row[0]}\n특성: {row[2]}\n육성기관: {row[3]}\n육성년도: {row[4]}"
        documents.append(Document(
            page_content=text,
            metadata={"source": "nongsaro_variety", "crop_name": row[1]}
        ))
    
    conn.close()
    return documents


def load_schedules_from_db() -> list[Document]:
    """DB에서 농작업일정을 읽어 Document로 변환"""
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT crop_name, farm_work_type, operation_name, 
               start_month, start_period, end_month, end_period, info_type_name
        FROM nongsaro_farm_schedules
    """)
    
    documents = []
    for row in cur.fetchall():
        text = (f"작물: {row[0]} - {row[1]}\n"
                f"작업: {row[2]}\n"
                f"시기: {row[3]}월 {row[4]} ~ {row[5]}월 {row[6]}\n"
                f"유형: {row[7]}")
        documents.append(Document(
            page_content=text,
            metadata={"source": "nongsaro_schedule", "crop_name": row[0], "month": row[3]}
        ))
    
    conn.close()
    return documents


def ingest(source: str = None):
    """ChromaDB에 인제스트"""
    vectorstore = get_vectorstore()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    
    loaders = {
        "variety": load_varieties_from_db,
        "schedule": load_schedules_from_db,
    }
    
    targets = {source: loaders[source]} if source else loaders
    
    for name, loader in targets.items():
        print(f"📥 {name} 인제스트 중...")
        docs = loader()
        chunks = splitter.split_documents(docs)
        vectorstore.add_documents(chunks)
        print(f"  ✅ {len(chunks)}개 청크 적재 완료")
```

## 10. Phase 2 체크리스트 (AI 담당)

- [ ] Phase 1 완료 확인 (DB 데이터 존재 여부)
- [ ] `ai/scripts/ingest_nongsaro.py` 작성
- [ ] 테이블별 Document 변환 함수 구현
- [ ] ChromaDB 인제스트 실행
- [ ] 검색 품질 테스트 (자연어 쿼리로 관련 데이터 반환 확인)
- [ ] 제외 서비스 2개 파일 기반 인제스트 (아래 §10.1, §10.2 참조)

---

### 10.1 품목별 관리매뉴얼 (`farmWorkingPlan`) — 파일 다운로드 후 RAG 인제스트

> [!IMPORTANT]
> 이 서비스는 Phase 1 DB 저장 대상에서 **제외**되었습니다.
> API 응답에 텍스트 내용이 없고 **HWP/PDF 파일 다운로드 URL만 제공**하기 때문입니다.
> AI 담당자가 직접 파일을 다운로드하여 텍스트를 추출한 뒤 RAG에 인제스트해야 합니다.

#### 서비스 정보

| 항목 | 내용 |
|------|------|
| **서비스 코드** | `farmWorkingPlan` |
| **Base URL** | `http://api.nongsaro.go.kr/service/farmWorkingPlan/` |
| **API 키** | `NONGSARO_API_KEY_DEFAULT` (나은님 키) |
| **데이터 형태** | 품목별 HWP/PDF 파일 (재배 매뉴얼) |

#### 오퍼레이션

| 오퍼레이션 | 설명 | 비고 |
|---------|------|------|
| `workScheduleGrpList` | 품목 리스트 조회 | 파라미터: `apiKey` |
| `workScheduleLst` | 품목별 파일 목록 조회 | 파라미터: `apiKey`, `kidofcomdtySeCode` |

#### 응답 필드 (`workScheduleLst`)

| 필드 | 설명 |
|------|------|
| `cntntsNo` | 품목 코드 |
| `sj` | 제목 |
| `fileDownUrlInfo` | **파일 다운로드 URL** (핵심) |
| `fileName` | 파일 이름 |
| `orginlFileNm` | 파일 원본 이름 |
| `fileSeCode` | 파일 일련 번호 |

#### 처리 흐름

```
Step 1. API 호출
        ├── workScheduleGrpList → 품목코드 목록 조회 (벼, 밭농사, 버섯, 약초, 채소 등)
        └── workScheduleLst(품목코드) → 파일 목록 + 다운로드 URL 조회
                ↓
Step 2. 파일 다운로드
        └── fileDownUrlInfo URL로 HWP/PDF 파일 다운로드
            → ai/data/manuals/ 폴더에 저장
                ↓
Step 3. 텍스트 추출
        ├── PDF → PyPDF2, pdfplumber 등으로 텍스트 추출
        └── HWP → hwp5txt, olefile 등으로 텍스트 추출
                ↓
Step 4. RAG 인제스트
        └── 추출된 텍스트 → 청크 분할 → 임베딩 → ChromaDB 저장
            Collection: nongsaro_manual
```

#### 예시 코드

```python
# ai/scripts/download_manuals.py

import httpx
import xmltodict
import os

API_KEY = os.getenv("NONGSARO_API_KEY_DEFAULT")
BASE_URL = "http://api.nongsaro.go.kr/service/farmWorkingPlan"
SAVE_DIR = "ai/data/manuals/"

def download_manuals():
    """품목별 관리매뉴얼 파일 다운로드"""
    # 1. 품목 목록 조회
    resp = httpx.get(f"{BASE_URL}/workScheduleGrpList", params={"apiKey": API_KEY})
    data = xmltodict.parse(resp.text)
    groups = data["response"]["body"]["items"]["item"]

    for group in groups:
        code = group["kidofcomdtySeCode"]
        name = group["codeNm"]

        # 2. 품목별 파일 목록
        resp2 = httpx.get(f"{BASE_URL}/workScheduleLst", params={
            "apiKey": API_KEY,
            "kidofcomdtySeCode": code
        })
        data2 = xmltodict.parse(resp2.text)
        files = data2["response"]["body"]["items"]["item"]
        if isinstance(files, dict):
            files = [files]

        for f in files:
            url = f.get("fileDownUrlInfo")
            filename = f.get("orginlFileNm", f.get("fileName", "unknown"))
            if url:
                # 3. 파일 다운로드
                file_resp = httpx.get(url, follow_redirects=True, timeout=60)
                save_path = os.path.join(SAVE_DIR, f"{name}_{filename}")
                with open(save_path, "wb") as fp:
                    fp.write(file_resp.content)
                print(f"  ✅ 다운로드: {save_path}")
```

---

### 10.2 원클릭 농업기술 (`oneClickFarmngTchnlgy`) — URL 메타데이터 활용

> [!IMPORTANT]
> 이 서비스는 Phase 1 DB 저장 대상에서 **제외**되었습니다.
> API 응답이 **외부 URL 링크 모음**이며, 실제 재배 기술 텍스트가 포함되어 있지 않습니다.
> 필요 시 URL을 크롤링하여 텍스트를 추출한 뒤 RAG에 인제스트할 수 있습니다.

#### 서비스 정보

| 항목 | 내용 |
|------|------|
| **서비스 코드** | `oneClickFarmngTchnlgy` |
| **Base URL** | `http://api.nongsaro.go.kr/service/oneClickFarmngTchnlgy/` |
| **API 키** | `NONGSARO_API_KEY_DEFAULT` (나은님 키) |
| **데이터 형태** | 작목별 기술정보 URL 모음 (가격, 일정, 소득, 영상 등) |

#### 오퍼레이션

| 오퍼레이션 | 설명 |
|---------|------|
| `oneClickFarmngTchnlgyClassSubCodeLst` | 서브 분류 코드 목록 |
| `oneClickFarmngTchnlgyClassSubMenuLst` | 서브 메뉴 목록 (URL 포함) |

#### 응답 필드 (`ClassSubMenuLst`)

| 필드 | 설명 |
|------|------|
| `classMenuCode` | 메뉴 코드 |
| `classMenuName` | 메뉴명 |
| `className` | 메인 분류명 |
| `classSubName` | 서브 분류명 |
| `classMenuDetail` | **작목기술정보 URL** |
| `classSubPriceUrl` | 가격정보 URL |
| `classSubDayworkUrl` | 작업일정 URL |
| `classSubPayUrl` | 소득정보 URL |
| `classSubMovieUrl` | 영상 URL |

#### 활용 방법 (선택사항)

- **방법 A (간단)**: URL을 챗봇 응답에 "참고 링크"로 첨부만 함
- **방법 B (심화)**: `classMenuDetail` URL을 크롤링하여 웹 페이지 텍스트 추출 → RAG 인제스트

```python
# 방법 B 예시: URL 크롤링 → 텍스트 추출
import httpx
from bs4 import BeautifulSoup

async def crawl_oneclick_page(url: str) -> str:
    """원클릭 농업기술 페이지에서 본문 텍스트 추출"""
    resp = httpx.get(url, follow_redirects=True, timeout=30)
    soup = BeautifulSoup(resp.text, "html.parser")
    # 본문 영역 추출 (농사로 페이지 구조에 맞게 selector 조정 필요)
    content = soup.select_one(".cont_area, .view_cont, article")
    return content.get_text(strip=True) if content else ""
```

> [!TIP]
> 원클릭 농업기술은 **우선순위가 낮습니다.** 다른 서비스(품종, 일정, 재해예방 등)의 RAG 구축이 끝난 후 필요하면 추가하세요.


# Phase 3: 챗봇 연동 (AI 담당)

## 11. 에이전트 도구 추가

```python
# ai/app/agents/tools/nongsaro_search.py

from app.rag.retriever import retrieve_documents

async def nongsaro_search(query: str, source: str = None) -> list[dict]:
    """농사로 데이터에서 관련 정보를 검색합니다."""
    filter_dict = {"source": f"nongsaro_{source}"} if source else {}
    results = await retrieve_documents(query=query, top_k=5, filter=filter_dict)
    return [{"content": doc.page_content, "metadata": doc.metadata} for doc in results]
```

## 12. 챗봇 대화 예시

```
사용자: "고추 재배 시 5월에 해야 할 작업이 뭐야?"
    ↓
Agent → nongsaro_search("고추 5월 작업", source="schedule")
    ↓
ChromaDB → 관련 청크 5개 반환
    ↓
LLM → "5월에는 고추 모종 정식 시기입니다. 밑거름 시비, 
       멀칭, 지주대 설치가 필요합니다..."
```

## 13. Phase 3 체크리스트 (AI 담당)

- [ ] `nongsaro_search` 도구 구현
- [ ] 에이전트에 도구 등록
- [ ] 엔드투엔드 테스트 (자연어 질문 → 정확한 답변)

---

## 참고: API 명세서

- [농사로 전체서비스 명세서](./API_농사로_전체서비스_명세서.md) — 9개 서비스 + 공통코드 상세 스펙
- [농사로 재배기술 명세서](./API_농사로_재배기술_명세서.md) — cropEbook + 병해충 상세 스펙
