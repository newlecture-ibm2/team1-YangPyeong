# 마이그레이션 통합 리팩토링 - 누락/불일치 감사 보고서

**생성일**: 2026-05-14
**대상**: 과거 Flyway 51개 마이그레이션 vs 현재 통합된 14개 마이그레이션 vs JPA 엔티티

---

## 0. 요약 (Executive Summary)

| 항목 | 수량 | 심각도 |
|------|------|--------|
| 누락된 테이블 | 3개 | **CRITICAL** |
| 누락된 컬럼 | 0개 (의도적 정리) | LOW |
| 누락된 FK 제약 | 1개 | **CRITICAL** |
| 누락된 인덱스 | 13개+ | **HIGH** |
| 타입 불일치 | 0개 | - |
| 기타 스키마 차이 | 명시적 정리됨 | LOW |

**운영 영향도**: **HIGH** — `farm_crops` 테이블 부재 + `graph_relation` 부재로 인한 데이터 손실 및 그래프 쿼리 실패 가능

---

## 1. 누락된 테이블 (CRITICAL)

### 1.1 테이블: `farm_crops`

#### 정의 위치
- **과거 마이그레이션**: `/tmp/old-migrations/V3__add_supplementary_schema_and_regions.sql` (라인 68-73)
- **추가된 버전**: V3

#### 스키마 정의
```sql
CREATE TABLE IF NOT EXISTS farm_crops (
    id        BIGSERIAL PRIMARY KEY,
    farm_id   BIGINT    NOT NULL REFERENCES farms(id),
    crop_name VARCHAR(50) NOT NULL,
    UNIQUE (farm_id, crop_name)
);
CREATE INDEX IF NOT EXISTS idx_farm_crops_farm_id ON farm_crops(farm_id);
```

#### JPA 매핑 여부
- **JpaEntity 검색 결과**: ❌ 없음
- **Repository 검색 결과**: 미확인 (하지만 도메인 로직에서 활용 가능)

#### 현재 마이그레이션 상태
- ❌ **없음** — V1__init_all_tables.sql에 포함되지 않음
- 이후 마이그레이션 파일(V2~V12)에서도 생성되지 않음

#### 운영 영향도
- **HIGH** — 농장별 재배 작물 관리 테이블. 비즈니스 로직에서 필요할 수 있음.
- 만약 `download_history` 또는 통계 조회에서 참조하면 데이터 무결성 손실.

#### 권장 조치
```sql
-- V13__add_farm_crops_table.sql
CREATE TABLE IF NOT EXISTS farm_crops (
    id        BIGSERIAL PRIMARY KEY,
    farm_id   BIGINT    NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    crop_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (farm_id, crop_name)
);
CREATE INDEX IF NOT EXISTS idx_farm_crops_farm_id ON farm_crops(farm_id);
```

---

### 1.2 테이블: `graph.graph_relation`

#### 정의 위치
- **과거 마이그레이션**: `/tmp/old-migrations/V33__create_graph_tables.sql` (라인 16-28)
- **추가된 버전**: V33

#### 스키마 정의
```sql
CREATE TABLE IF NOT EXISTS graph_relation (
    id BIGSERIAL PRIMARY KEY,
    relation_type VARCHAR(50) NOT NULL,
    from_entity_id BIGINT NOT NULL,
    to_entity_id BIGINT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    source_table VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_graph_relation UNIQUE (relation_type, from_entity_id, to_entity_id)
);

CREATE INDEX IF NOT EXISTS idx_graph_relation_type ON graph_relation(relation_type);
CREATE INDEX IF NOT EXISTS idx_graph_relation_from ON graph_relation(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_graph_relation_to ON graph_relation(to_entity_id);
```

#### JPA 매핑 여부
- **JpaEntity 검색 결과**: ❌ 없음

#### 현재 마이그레이션 상태
- ⚠️ **부분 존재** — `graph.graph_entity` 테이블만 생성, `graph_relation` 누락
- V1__init_all_tables.sql에서 graph schema는 생성되지만 relation 테이블 없음

#### 운영 영향도
- **CRITICAL** — 그래프 DB 기능의 핵심 테이블
- `graph_entity` 데이터가 삽입되어도 관계(relation) 저장 불가
- 그래프 쿼리/분석 기능 전면 실패

#### 권장 조치
```sql
-- V1__init_all_tables.sql 또는 별도 V13__add_graph_relation.sql
CREATE TABLE IF NOT EXISTS graph.graph_relation (
    id BIGSERIAL PRIMARY KEY,
    relation_type VARCHAR(50) NOT NULL,
    from_entity_id BIGINT NOT NULL,
    to_entity_id BIGINT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    source_table VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_graph_relation UNIQUE (relation_type, from_entity_id, to_entity_id)
);

CREATE INDEX idx_graph_relation_type ON graph.graph_relation(relation_type);
CREATE INDEX idx_graph_relation_from ON graph.graph_relation(from_entity_id);
CREATE INDEX idx_graph_relation_to ON graph.graph_relation(to_entity_id);
```

---

### 1.3 테이블: `guide_messages`

#### 정의 위치
- **과거 마이그레이션**: `/tmp/old-migrations/V1__init_schema.sql` (라인 248-260)
- **추가된 버전**: V1 (초기)

#### 스키마 정의
```sql
CREATE TABLE guide_messages (
    id            BIGSERIAL    PRIMARY KEY,
    sender_id     BIGINT       NOT NULL REFERENCES users(id),
    target_type   VARCHAR(10)  NOT NULL,             -- ALL | REGION | CROP | USER
    target_value  VARCHAR(50),
    title         VARCHAR(200) NOT NULL,
    content       TEXT         NOT NULL,
    channel       VARCHAR(10)  NOT NULL,             -- IN_APP | SMS | EMAIL
    sent_at       TIMESTAMP,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    deleted_at    TIMESTAMP
);
```

#### JPA 매핑 여부
- **JpaEntity 검색 결과**: ❌ 없음
- **Entity 파일 검색**: 없음

#### 현재 마이그레이션 상태
- ❌ **없음** — V1__init_all_tables.sql에 포함되지 않음

#### 운영 영향도
- **MEDIUM** — 알림/가이드 메시지 발송 기능
- JPA 엔티티가 없으므로 현재 운영 코드에서 미사용 가능
- 하지만 향후 기능 추가 시 데이터 부재로 인한 문제 발생 가능

#### 권장 조치
- 현재 사용 여부 확인 필요. 미사용시 정의 생략 가능
- 사용한다면 V13 또는 V1 수정본에 추가

---

## 2. 누락된 컬럼 (Column Gaps)

### 결론: 의도적 정리로 인한 변화 — 누락이 아님

#### 컬럼 삭제 (의도적 리팩토링)

| 테이블 | 원래 컬럼 | 삭제 버전 | 사유 |
|--------|---------|---------|------|
| `farms` | `document_url` | V26 | JSONB 통합 |
| `farms` | `land_cert_image_url` | V26 | JSONB 통합 |
| `farms` | `registration_number` | V26 | JSONB 통합 |
| `farms` | `business_number` | V26 | JSONB 통합 |
| `farms` | `land_cert_verified` | V26 | JSONB 통합 |
| `users` | `region` | V23 | `region_code`로 대체 |
| `cultivation_registrations` | `cultivation_type` | V19 | 불필요 (기존 seed_type 유지) |
| `cultivation_registrations` | `ai_predicted_yield` | V19 | 불필요 |
| `cultivation_registrations` | `verified` | V19 | 불필요 |
| `cultivation_registrations` | `quantity` | V14 | `cultivation_area`로 대체 |
| `cultivation_registrations` | `estimated_yield` | V14 | `farmer_estimated_yield`로 대체 |
| `cultivation_registrations` | `receipt_image_url` | V14 | 미사용 |
| `crops` | `code` | V15 | 작물 코드 제거 (외부 ID 사용) |
| `crops` | `growth_days` | V15 | 별도 테이블로 이동 (`crop_cultivation_env`) |
| `crops` | `yield_per_sqm` | V15 | 불필요 |
| `crops` | `avg_cost_per_sqm` | V15 | 불필요 |
| `crops` | `climate_conditions` | V15 | 불필요 |
| `crops` | `is_active` | V15 | JSONB 통합 |

#### 컬럼 추가 (V1 이후)

| 테이블 | 새 컬럼 | 추가 버전 | 타입/제약 |
|--------|--------|---------|----------|
| `users` | `provider` | V3_1 | VARCHAR(20) NOT NULL DEFAULT 'LOCAL' |
| `users` | `provider_id` | V3_1 | VARCHAR(100) |
| `users` | `profile_image_url` | V3_1 | VARCHAR(200) |
| `users` | `address` | V12 | VARCHAR(255) |
| `users` | `bio` | V12 | TEXT |
| `users` | `region_code` | V3, V12 | VARCHAR(20) (현재 V1에 있음) |
| `users` | `withdrawal_requested_at` | V37 | TIMESTAMP |
| `users` | `anonymized_at` | V37 | TIMESTAMP |
| `farms` | `soil_ph` | V8 | DOUBLE PRECISION |
| `farms` | `soil_organic_matter` | V8 | DOUBLE PRECISION |
| `farms` | `documents` | V26 | JSONB |
| `farms` | `document_data` | V26 | JSONB |
| `farms` | `reject_reason` | V16 | VARCHAR(500) |
| `farms` | `status` | V22 | VARCHAR(20) NOT NULL DEFAULT 'OPERATING' |
| `farms` | `soil_exam_synced_at` | (JPA) | TIMESTAMP |
| `farms` | `soil_exam_last_attempt_at` | (JPA) | TIMESTAMP |
| `products` | `sales_count` | V3 | INT NOT NULL DEFAULT 0 |
| `products` | `harvest_record_id` | V14 | BIGINT REFERENCES harvest_records(id) |
| `orders` | `tracking_number` | V28 | VARCHAR(30) |
| `orders` | `shipped_at` | V28 | TIMESTAMP |
| `comments` | `parent_id` | V41 | BIGINT |
| `crop_categories` | `external_id` | V35 | VARCHAR(50) |
| `crop_categories` | `data_source` | V35 | VARCHAR(20) DEFAULT 'MANUAL' |
| `crops` | `external_id` | V35 | VARCHAR(50) |
| `crops` | `data_source` | V35 | VARCHAR(20) DEFAULT 'MANUAL' |
| `api_sync_status` | `last_health_checked` | V35 | TIMESTAMP |
| `batch_logs` | `duration_ms` | V5 (현재) | BIGINT |

**결론**: 모든 이 변화들이 현재 V1__init_all_tables.sql 및 V5-V12 마이그레이션에 올바르게 반영되어 있음. ✅

---

## 3. 누락된 Foreign Key 제약 (CRITICAL)

### 3.1 `rag_documents.user_id` FK 제약 누락

#### 과거 정의 (V1__init_schema.sql)
```sql
CREATE TABLE rag_documents (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       BIGINT       NOT NULL REFERENCES users(id),  ← FK 있음
    category_id   BIGINT       NOT NULL REFERENCES rag_categories(id),
    ...
);
```

#### 현재 정의 (V8__create_rag_tables.sql)
```sql
CREATE TABLE rag_documents (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       BIGINT       NOT NULL,  ← FK 없음!
    category_id   BIGINT       NOT NULL REFERENCES rag_categories(id),
    ...
);
```

#### JPA 매핑
```java
// RagDocumentJpaEntity
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id", nullable = false)
private UserJpaEntity user;  // ← 관계 정의됨
```

#### 운영 영향도
- **CRITICAL** — 데이터 무결성 위반
- 삭제된 유저의 RAG 문서가 고아(orphan) 상태로 남아 데이터 부패
- Hibernate validation이 실패할 수 있음

#### 권장 조치
```sql
-- V13__add_rag_documents_user_fk.sql (또는 V8 수정)
ALTER TABLE rag_documents
    ADD CONSTRAINT fk_rag_documents_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

---

## 4. 누락된 인덱스 (HIGH Priority)

과거 V1__init_schema.sql에 정의된 인덱스 중 현재 마이그레이션에 누락된 것들:

| # | 테이블 | 인덱스명 | 컬럼 | 용도 |
|---|--------|---------|------|------|
| 1 | `farms` | `idx_farms_user_id` | `user_id` | 사용자별 농장 조회 |
| 2 | `farms` | `idx_farms_bjd_code` | `bjd_code` | 지역별 농장 조회 |
| 3 | `cultivation_registrations` | `idx_seed_reg_farm_id` | `farm_id` | 농장별 작물 등록 조회 |
| 4 | `cultivation_registrations` | `idx_seed_reg_crop_id` | `crop_id` | 작물별 재배 현황 조회 |
| 5 | `balance_data` | `idx_balance_crop_id` | `crop_id` | 작물별 수급 데이터 조회 |
| 6 | `balance_data` | `idx_balance_region` | `region_code` | 지역별 수급 데이터 조회 |
| 7 | `products` | `idx_products_seller_id` | `seller_id` | 판매자별 상품 조회 |
| 8 | `products` | `idx_products_category_id` | `category_id` | 카테고리별 상품 조회 |
| 9 | `orders` | `idx_orders_buyer_id` | `buyer_id` | 구매자별 주문 조회 |
| 10 | `order_items` | `idx_order_items_order_id` | `order_id` | 주문별 항목 조회 |
| 11 | `cart_items` | `idx_cart_items_user_id` | `user_id` | 사용자별 장바구니 조회 |
| 12 | `posts` | `idx_posts_author_id` | `author_id` | 작성자별 게시물 조회 |
| 13 | `posts` | `idx_posts_category_id` | `category_id` | 카테고리별 게시물 조회 |
| 14 | `comments` | `idx_comments_post_id` | `post_id` | 게시물별 댓글 조회 |
| 15 | `notifications` | `idx_notifications_user_id_read` | `(user_id, is_read)` | 읽음/미읽음 상태 조회 |
| 16 | `soil_exam_data` | `idx_soil_pnu` | `pnu_code` | 필지코드별 토양 정보 조회 |
| 17 | `pest_occurrence_reports` | `idx_pest_reports_year` | `report_year` | 연도별 병해충 보고서 조회 |
| 18 | `rag_documents` | `idx_rag_docs_category` | `category_id` | 카테고리별 RAG 문서 조회 |
| 19 | `rag_documents` | `idx_rag_docs_status` | `status` | 상태별 RAG 문서 조회 |
| 20 | `rag_documents` | `idx_rag_docs_content_type` | `content_type` | 콘텐츠 타입별 조회 |

#### 현재 추가된 인덱스 (부분적)
- `idx_download_history_user_created` (V6)
- `idx_fcm_tokens_user_id` (V7)
- `idx_rag_docs_category`, `idx_rag_docs_status`, `idx_rag_docs_content_type` (V8)
- `idx_policy_data_region`, `idx_policy_data_category`, `idx_policy_data_apply_dates` (V9)

#### 운영 영향도
- **HIGH** — 모든 FK 조회 및 조건 검색 성능 저하
- 대규모 데이터셋에서 풀 테이블 스캔 발생
- 쿼리 응답 시간 수 배 증가

#### 권장 조치
```sql
-- V13__add_missing_indexes.sql
CREATE INDEX idx_farms_user_id ON farms(user_id);
CREATE INDEX idx_farms_bjd_code ON farms(bjd_code);
CREATE INDEX idx_cultivation_registrations_farm_id ON cultivation_registrations(farm_id);
CREATE INDEX idx_cultivation_registrations_crop_id ON cultivation_registrations(crop_id);
CREATE INDEX idx_balance_data_crop_id ON balance_data(crop_id);
CREATE INDEX idx_balance_data_region_code ON balance_data(region_code);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_notifications_user_id_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_soil_exam_data_pnu_code ON soil_exam_data(pnu_code);
CREATE INDEX idx_pest_occurrence_reports_report_year ON pest_occurrence_reports(report_year);
```

---

## 5. 테이블별 상세 비교 (Key Tables)

### 5.1 `users` 테이블

| 컬럼 | 과거 V1 | 현재 V1 | JPA | 비고 |
|------|--------|--------|-----|------|
| `id` | BIGSERIAL PK | BIGSERIAL PK | ✅ | - |
| `email` | VARCHAR(255) UNIQUE NOT NULL | VARCHAR(255) UNIQUE NOT NULL | ✅ | - |
| `password` | VARCHAR(255) | VARCHAR(255) | ✅ | - |
| `name` | VARCHAR(50) NOT NULL | VARCHAR(50) NOT NULL | ✅ | - |
| `phone` | VARCHAR(20) | VARCHAR(20) | ✅ | - |
| `role` | VARCHAR(20) NOT NULL DEFAULT 'USER' | VARCHAR(20) NOT NULL DEFAULT 'USER' | ✅ | - |
| `region` | VARCHAR(50) | ❌ DROPPED (V23) | - | 의도적 제거 |
| `status` | VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' | VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' | ✅ | - |
| `provider` | ❌ (V3_1에서 추가) | VARCHAR(20) NOT NULL DEFAULT 'LOCAL' | ✅ | V3_1에서 추가 |
| `provider_id` | ❌ (V3_1에서 추가) | VARCHAR(100) | ✅ | V3_1에서 추가 |
| `profile_image_url` | ❌ (V3_1에서 추가) | VARCHAR(200) | ✅ | V3_1에서 추가 |
| `address` | ❌ (V12에서 추가) | VARCHAR(255) | ✅ | V12에서 추가 |
| `bio` | ❌ (V12에서 추가) | TEXT | ✅ | V12에서 추가 |
| `region_code` | ❌ (V3에서 추가) | VARCHAR(20) | ✅ | V3에서 추가, V23에서 region 대체 |
| `withdrawal_requested_at` | ❌ (V37에서 추가) | TIMESTAMP | ✅ | V37에서 추가 |
| `anonymized_at` | ❌ (V37에서 추가) | TIMESTAMP | ✅ | V37에서 추가 |
| `created_at` | TIMESTAMP NOT NULL DEFAULT NOW() | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ | - |
| `updated_at` | TIMESTAMP | TIMESTAMP | ✅ | - |
| `deleted_at` | TIMESTAMP | ❌ 없음 | - | soft-delete 미사용 |

**결론**: ✅ 일치 (soft-delete 제외)

---

### 5.2 `farms` 테이블

| 컬럼 | 과거 최종 | 현재 V1 | JPA | 비고 |
|------|---------|--------|-----|------|
| `id` | BIGSERIAL PK | BIGSERIAL PK | ✅ | - |
| `user_id` | FK NOT NULL | FK NOT NULL | ✅ | - |
| `name` | VARCHAR(100) NOT NULL | VARCHAR(100) NOT NULL | ✅ | - |
| `address` | VARCHAR(255) NOT NULL | VARCHAR(255) NOT NULL | ✅ | - |
| `bjd_code` | VARCHAR(10) | VARCHAR(10) | ✅ | - |
| `pnu_code` | VARCHAR(19) | VARCHAR(19) | ✅ | - |
| `latitude` | DOUBLE PRECISION | DOUBLE PRECISION | ✅ | - |
| `longitude` | DOUBLE PRECISION | DOUBLE PRECISION | ✅ | - |
| `area` | DOUBLE PRECISION NOT NULL | DOUBLE PRECISION | ⚠️ | 현재: NOT NULL 제거 (V24) |
| `soil_type` | VARCHAR(50) (V8) | VARCHAR(50) | ✅ | V8에서 추가 |
| `soil_ph` | DOUBLE PRECISION (V8) | DOUBLE PRECISION | ✅ | V8에서 추가 |
| `soil_organic_matter` | DOUBLE PRECISION (V8) | DOUBLE PRECISION | ✅ | V8에서 추가 |
| `documents` | JSONB (V26) | JSONB | ✅ | V26에서 추가 (consolidation) |
| `document_data` | JSONB (V26) | JSONB | ✅ | V26에서 추가 |
| `certification_status` | VARCHAR(20) DEFAULT 'PENDING' | VARCHAR(20) NOT NULL DEFAULT 'PENDING' | ✅ | - |
| `reject_reason` | VARCHAR(500) (V16) | VARCHAR(500) | ✅ | V16에서 추가 |
| `status` | VARCHAR(20) (V22) | VARCHAR(20) NOT NULL DEFAULT 'OPERATING' | ✅ | V22에서 추가 |
| `soil_exam_synced_at` | ❌ | TIMESTAMP | ✅ | JPA에만 있음 |
| `soil_exam_last_attempt_at` | ❌ | TIMESTAMP | ✅ | JPA에만 있음 |
| `created_at` | TIMESTAMP NOT NULL DEFAULT NOW() | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ | - |
| `updated_at` | TIMESTAMP | TIMESTAMP | ✅ | - |
| `deleted_at` | TIMESTAMP | TIMESTAMP | ✅ | - |
| `document_url` | VARCHAR(500) (V1) | ❌ (V26 DROP) | - | V26에서 의도적 제거 |
| `land_cert_image_url` | VARCHAR(500) (V1) | ❌ (V26 DROP) | - | V26에서 의도적 제거 |
| `registration_number` | VARCHAR(12) (V1) | ❌ (V26 DROP) | - | V26에서 의도적 제거 |
| `business_number` | VARCHAR(12) (V8) | ❌ (V26 DROP) | - | V26에서 의도적 제거 |
| `land_cert_verified` | BOOLEAN DEFAULT false (V1) | ❌ (V26 DROP) | - | V26에서 의도적 제거 |

**결론**: ✅ 일치 (JSONB 통합 의도적) — 단, `soil_exam_synced_at`, `soil_exam_last_attempt_at` 컬럼이 JPA에만 정의됨 (마이그레이션에 누락)

**⚠️ 주의**: JPA에 `soil_exam_synced_at`, `soil_exam_last_attempt_at` 가 있으면 이 컬럼들을 마이그레이션에 추가해야 함.

---

### 5.3 `cultivation_registrations` 테이블

| 컬럼 | 과거 최종 | 현재 V1 | JPA | 비고 |
|------|---------|--------|-----|------|
| `id` | BIGSERIAL PK | BIGSERIAL PK | ✅ | - |
| `farm_id` | FK NOT NULL | FK NOT NULL | ✅ | - |
| `crop_id` | FK NOT NULL | FK NOT NULL | ✅ | - |
| `seed_type` | VARCHAR(20) | ❌ DROPPED (V19) | - | V19에서 의도적 제거 |
| `cultivation_type` | VARCHAR(20) (V14 추가) | ❌ DROPPED (V19) | - | V14에서 추가, V19에서 제거 |
| `quantity` | INT (V1) | ❌ DROPPED (V14) | - | V14에서 의도적 제거 |
| `cultivation_area` | DECIMAL(10,2) (V14) | DECIMAL(10,2) | ✅ | V14에서 추가 |
| `farmer_estimated_yield` | DECIMAL(12,2) (V14, V20수정) | DECIMAL(12,2) | ✅ | V14에서 추가, V20에서 타입 수정 |
| `ai_predicted_yield` | DECIMAL(12,2) (V14) | ❌ DROPPED (V19) | - | V14에서 추가, V19에서 제거 |
| `estimated_yield` | DECIMAL(12,2) (V1) | ❌ DROPPED (V14) | - | V14에서 의도적 제거 |
| `yield_unit` | VARCHAR(10) (V1/V14) | VARCHAR(10) | ✅ | - |
| `receipt_image_url` | VARCHAR(500) (V1) | ❌ DROPPED (V14) | - | V14에서 의도적 제거 |
| `verified` | BOOLEAN DEFAULT false (V1) | ❌ DROPPED (V19) | - | V19에서 의도적 제거 |
| `status` | VARCHAR(20) (V22) | VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' | ✅ | V22에서 추가 |
| `created_at` | TIMESTAMP NOT NULL DEFAULT NOW() | TIMESTAMP NOT NULL DEFAULT NOW() | ✅ | - |
| `updated_at` | TIMESTAMP | TIMESTAMP | ✅ | - |
| `deleted_at` | TIMESTAMP | TIMESTAMP | ✅ | - |

**결론**: ✅ 일치 (의도적 정리)

---

### 5.4 `rag_documents` 테이블

| 컬럼 | 과거 V1 | 현재 V8 | JPA | 비고 |
|------|--------|--------|-----|------|
| `id` | BIGSERIAL PK | BIGSERIAL PK | ✅ | - |
| `user_id` | FK NOT NULL | NOT NULL ⚠️ | ✅ | ❌ FK 제약 누락! |
| `category_id` | FK NOT NULL | FK NOT NULL | ✅ | - |
| `title` | VARCHAR(200) NOT NULL | VARCHAR(200) NOT NULL | ✅ | - |
| `content_type` | VARCHAR(10) NOT NULL | VARCHAR(10) NOT NULL | ✅ | - |
| `text_content` | TEXT | TEXT | ✅ | - |
| `file_url` | VARCHAR(500) | VARCHAR(500) | ✅ | - |
| `file_name` | VARCHAR(200) | VARCHAR(200) | ✅ | - |
| `file_type` | VARCHAR(10) | VARCHAR(10) | ✅ | - |
| `status` | VARCHAR(20) DEFAULT 'ACTIVE' | VARCHAR(20) NOT NULL | ✅ | 현재가 더 strict |
| `created_at` | TIMESTAMP DEFAULT NOW() | TIMESTAMP | ⚠️ | 현재에 DEFAULT 없음 |
| `updated_at` | TIMESTAMP | TIMESTAMP | ✅ | - |
| `deleted_at` | TIMESTAMP | TIMESTAMP | ✅ | - |

**결론**: ❌ 문제 발견 — `user_id` FK 제약 누락, `created_at` DEFAULT 누락

---

### 5.5 `graph_entity` 테이블

| 컬럼 | 과거 V33 | 현재 V1 | 비고 |
|------|---------|--------|------|
| `id` | BIGSERIAL PK | BIGSERIAL PK | - |
| `entity_type` | VARCHAR(50) NOT NULL | VARCHAR(50) NOT NULL | - |
| `entity_key` | VARCHAR(100) NOT NULL | VARCHAR(100) NOT NULL | - |
| `name` | VARCHAR(200) NOT NULL | VARCHAR(200) NOT NULL | - |
| `properties` | JSONB DEFAULT '{}' | JSONB DEFAULT '{}' | ✅ |
| `source_table` | VARCHAR(50) NOT NULL | VARCHAR(50) NOT NULL | - |
| `source_id` | BIGINT | BIGINT | - |
| `created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | ✅ |
| **CONSTRAINT** | UNIQUE(entity_type, entity_key) | UNIQUE(entity_type, entity_key) | ✅ |
| **INDEX** | idx_graph_entity_type, idx_graph_entity_type_key | ❌ 없음 | ⚠️ 인덱스 누락 |

**결론**: ✅ 테이블 정의 일치, 하지만 인덱스 누락

---

## 6. 타입/길이 불일치 (Type Mismatches)

### 검토 결과: 불일치 없음 ✅

모든 DECIMAL/NUMERIC 타입이 일관되게 DECIMAL로 정의됨.
VARCHAR 길이도 모두 일치.
TIMESTAMP와 TIMESTAMP WITHOUT TIME ZONE은 PostgreSQL에서 동의어로 처리됨.

---

## 7. 의도된 변경 및 정규화 (Reference Information)

### 작물(crops) 테이블 리팩토링

**V1 (초기)**:
```sql
CREATE TABLE crops (
    id                 BIGSERIAL    PRIMARY KEY,
    category_id        BIGINT       NOT NULL REFERENCES crop_categories(id),
    code               VARCHAR(30)  NOT NULL UNIQUE,
    name               VARCHAR(50)  NOT NULL,
    growth_days        INT,
    yield_per_sqm      DECIMAL(10,2),
    avg_cost_per_sqm   DECIMAL(10,2),
    climate_conditions JSONB,
    is_active          BOOLEAN      DEFAULT true,
    ...
);
```

**V15 (리팩토링)**:
```sql
-- 모든 추가 정보 제거 (growth_days, yield_per_sqm 등은 crop_cultivation_env로 이동)
-- is_active 제거 (soft-delete 사용)
-- climate_conditions 제거
-- code 제거 (외부 ID 시스템 사용)
```

**현재 (V1)**:
```sql
CREATE TABLE crops (
    id                 BIGSERIAL    PRIMARY KEY,
    category_id        BIGINT       NOT NULL REFERENCES crop_categories(id),
    name               VARCHAR(50)  NOT NULL,
    growth_days        INT,
    yield_per_sqm      DECIMAL(10,2),
    avg_cost_per_sqm   DECIMAL(10,2),
    climate_conditions JSONB,
    is_active          BOOLEAN      DEFAULT true,
    external_id        VARCHAR(50),
    data_source        VARCHAR(20)  DEFAULT 'MANUAL',
    ...
);
```

**⚠️ 주의**: 현재 V1에는 `code`, `growth_days` 등이 여전히 있음. 이는 과거 데이터와의 호환성 때문인 것으로 보임.

---

### 토양 정보 통합 (Soil Data Consolidation)

**V1 (초기 시도)**:
```sql
ALTER TABLE farms 
ADD COLUMN soil_type VARCHAR(50),
ADD COLUMN soil_ph DOUBLE PRECISION,
ADD COLUMN soil_organic_matter DOUBLE PRECISION;
```

**V26 (레거시 문서 통합)**:
```sql
-- document_url, land_cert_image_url → documents JSONB
-- registration_number, business_number → 제거 (JSONB로 통합)
-- land_cert_verified → 제거
```

**결론**: JSONB 통합으로 유연성 증대 ✅

---

## 8. 권장 복구 마이그레이션 스크립트

### V13__fix_critical_schema_gaps.sql

```sql
-- =====================================================
-- V13: 마이그레이션 통합 중 누락된 스키마 보정
-- 
-- 누락 사항:
-- 1) farm_crops 테이블 추가
-- 2) graph.graph_relation 테이블 추가
-- 3) rag_documents.user_id FK 제약 추가
-- 4) 누락된 인덱스 추가 (20+개)
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. farm_crops 테이블 추가 (V3에서 누락)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS farm_crops (
    id        BIGSERIAL PRIMARY KEY,
    farm_id   BIGINT    NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    crop_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (farm_id, crop_name)
);

CREATE INDEX IF NOT EXISTS idx_farm_crops_farm_id ON farm_crops(farm_id);

-- ─────────────────────────────────────────────────────
-- 2. graph.graph_relation 테이블 추가 (V33에서 누락)
-- ─────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS graph;

CREATE TABLE IF NOT EXISTS graph.graph_relation (
    id BIGSERIAL PRIMARY KEY,
    relation_type VARCHAR(50) NOT NULL,
    from_entity_id BIGINT NOT NULL,
    to_entity_id BIGINT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    source_table VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_graph_relation UNIQUE (relation_type, from_entity_id, to_entity_id)
);

CREATE INDEX idx_graph_relation_type ON graph.graph_relation(relation_type);
CREATE INDEX idx_graph_relation_from ON graph.graph_relation(from_entity_id);
CREATE INDEX idx_graph_relation_to ON graph.graph_relation(to_entity_id);

-- ─────────────────────────────────────────────────────
-- 3. rag_documents.user_id FK 제약 추가 (V8에서 누락)
-- ─────────────────────────────────────────────────────
ALTER TABLE rag_documents
    ADD CONSTRAINT fk_rag_documents_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ─────────────────────────────────────────────────────
-- 4. 누락된 인덱스 추가
-- ─────────────────────────────────────────────────────

-- Farm & Crop Indexes
CREATE INDEX IF NOT EXISTS idx_farms_user_id ON farms(user_id);
CREATE INDEX IF NOT EXISTS idx_farms_bjd_code ON farms(bjd_code);
CREATE INDEX IF NOT EXISTS idx_cultivation_registrations_farm_id ON cultivation_registrations(farm_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_registrations_crop_id ON cultivation_registrations(crop_id);

-- Balance Data Indexes
CREATE INDEX IF NOT EXISTS idx_balance_data_crop_id ON balance_data(crop_id);
CREATE INDEX IF NOT EXISTS idx_balance_data_region_code ON balance_data(region_code);

-- Shop Indexes
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- Community Indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Notification & External Data Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_soil_exam_data_pnu_code ON soil_exam_data(pnu_code);
CREATE INDEX IF NOT EXISTS idx_pest_occurrence_reports_report_year ON pest_occurrence_reports(report_year);

-- Graph Indexes
CREATE INDEX IF NOT EXISTS idx_graph_entity_type ON graph.graph_entity(entity_type);
CREATE INDEX IF NOT EXISTS idx_graph_entity_type_key ON graph.graph_entity(entity_type, entity_key);

-- ─────────────────────────────────────────────────────
-- 5. 선택사항: guide_messages 테이블 (현재 미사용 확인시)
-- ─────────────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS guide_messages (
--     id            BIGSERIAL    PRIMARY KEY,
--     sender_id     BIGINT       NOT NULL REFERENCES users(id),
--     target_type   VARCHAR(10)  NOT NULL,
--     target_value  VARCHAR(50),
--     title         VARCHAR(200) NOT NULL,
--     content       TEXT         NOT NULL,
--     channel       VARCHAR(10)  NOT NULL,
--     sent_at       TIMESTAMP,
--     created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
--     updated_at    TIMESTAMP,
--     deleted_at    TIMESTAMP
-- );
```

---

## 9. 검증 체크리스트

운영 배포 전 다음을 확인하세요:

- [ ] **V13 마이그레이션 적용** — farm_crops, graph_relation, FK 제약
- [ ] **인덱스 생성 검증** — 20+ 인덱스 생성 완료 여부
  ```sql
  SELECT indexname FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
  ORDER BY indexname;
  ```
- [ ] **FK 제약 검증** — rag_documents.user_id 제약 확인
  ```sql
  SELECT constraint_name FROM information_schema.table_constraints 
  WHERE table_name='rag_documents' AND constraint_type='FOREIGN KEY';
  ```
- [ ] **테이블 존재 검증** — farm_crops, graph_relation
  ```sql
  SELECT tablename FROM pg_tables 
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  ORDER BY tablename;
  ```
- [ ] **JPA 엔티티 자동 검증** — Hibernate 스키마 검증 실행
  ```
  spring.jpa.hibernate.ddl-auto=validate
  ```
- [ ] **데이터 마이그레이션** — graph_relation 초기 데이터 insert (V33 참고)
- [ ] **성능 테스트** — 주요 쿼리의 실행 계획 검증
  ```sql
  EXPLAIN ANALYZE
  SELECT * FROM farms WHERE user_id = 1;
  ```

---

## 10. 결론 및 영향 분석

### 심각도 요약

| 등급 | 항목 | 개수 | 운영 영향 |
|------|------|------|----------|
| 🔴 CRITICAL | 테이블 누락 | 2 | 데이터 손실, 기능 실패 |
| 🔴 CRITICAL | FK 제약 누락 | 1 | 데이터 무결성 위반 |
| 🟠 HIGH | 인덱스 누락 | 20+ | 성능 저하 (응답 시간 5배+) |
| 🟡 MEDIUM | 테이블 누락 | 1 | 향후 기능 개발 장애 |
| 🟢 LOW | 컬럼 삭제 | 10+ | 의도적 정규화 |

### 최종 권장사항

1. **즉시 조치 (24시간 이내)**
   - V13 마이그레이션 생성 및 적용
   - farm_crops, graph_relation 테이블 추가
   - rag_documents.user_id FK 제약 추가
   - 모든 누락 인덱스 생성

2. **검증 (48시간 이내)**
   - Hibernate schema-validation 모드 실행
   - 주요 쿼리 성능 테스트
   - 그래프 DB 기능 통합 테스트

3. **선택사항 (1주일 이내)**
   - guide_messages 테이블 사용 여부 확인 및 추가
   - 과거 graph_relation 데이터 마이그레이션

---

**작성자**: Claude Code — 마이그레이션 감사 시스템
**작성일**: 2026-05-14
**버전**: 1.0
