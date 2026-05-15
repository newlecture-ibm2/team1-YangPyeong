# 마이그레이션 통합 리팩토링 — 최종 감사 보고서

> **작성일**: 2026-05-14
> **대상 커밋**: `1893015` (refactor: 마이그레이션 통합 리팩토링 51개 → 17개)
> **검증 방법**: 통합 이전 Flyway 51개 vs 통합 이후 14개 vs JPA 엔티티 33개 3-way 비교 + 실 코드 사용 여부 교차 검증

> ⚠️ **이 문서는 기존의 두 자동 보고서(`migration-audit-report.md`, `migration-audit-detailed.md`)에서 발견된 false positive를 모두 제거하고 직접 검증한 결과만 담은 최종본입니다.**

---

## 0. 핵심 요약

| 등급 | 항목 | 개수 | 운영 영향 |
|---|---|---|---|
| 🔴 **CRITICAL** | 사용 중 테이블 누락 | **1개** | 런타임 에러 (정책 그래프 기능 전체 실패) |
| 🟠 **HIGH** | 성능 인덱스 누락 | **30+개** | 풀 테이블 스캔 → 응답 시간 수 배 증가 |
| 🟡 **MEDIUM** | FK 제약 누락 | **1개** | 데이터 무결성 위반 가능 |
| 🟢 **LOW (참고)** | DB에 있지만 JPA가 매핑 안 한 컬럼 | 7+개 | 운영 영향 없음 (정보성) |
| ✅ **FALSE POSITIVE** | farm_crops, ProductCategory 누락 등 | 5개 이상 | 영향 없음 |

**즉시 조치 필요**: V13 마이그레이션 작성 (테이블 1개 + FK 1개 + 인덱스 30개+)

---

## 1. 🔴 CRITICAL — 즉시 조치 필요

### 1.1 `graph.graph_relation` 테이블 누락

**상태**: 현재 마이그레이션에 **테이블 자체가 없음**

#### 코드 사용 증거 (실제로 운영 중인 코드)
```
backend/src/main/java/com/farmbalance/policy/adapter/out/persistence/adapter/PolicyGraphPersistenceAdapter.java:38
backend/src/main/java/com/farmbalance/policy/adapter/out/persistence/adapter/PolicyGraphPersistenceAdapter.java:53
backend/src/main/java/com/farmbalance/policy/adapter/out/persistence/adapter/PolicyGraphPersistenceAdapter.java:63
backend/src/main/java/com/farmbalance/policy/application/service/GraphRefreshService.java:31  (DELETE)
backend/src/main/java/com/farmbalance/policy/application/service/GraphRefreshService.java:158 (INSERT)
backend/src/main/java/com/farmbalance/policy/application/service/GraphRefreshService.java:171 (INSERT)
backend/src/main/java/com/farmbalance/policy/application/service/GraphRefreshService.java:184 (INSERT)
backend/src/main/java/com/farmbalance/policy/application/service/GraphRefreshService.java:197 (INSERT)
backend/src/main/java/com/farmbalance/policy/application/service/GraphRefreshService.java:210 (INSERT)
backend/src/main/java/com/farmbalance/policy/adapter/out/external/AiServerPolicyAdapter.java:29 (참조)
```
SELECT 3회 + DELETE 1회 + INSERT 5회 = **9곳 이상**에서 직접 SQL로 사용 중

#### 운영 영향
정책 그래프 기능 호출 시 `SQLException: relation "graph.graph_relation" does not exist` 발생 → 정책 관련 기능 전체 다운

#### 과거 정의 (V33__create_graph_tables.sql)
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

V38에서 `graph` 스키마로 이동됨 → 최종 위치는 `graph.graph_relation`

#### 권장 조치 SQL
```sql
-- V13 마이그레이션에 포함
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
```

---

## 2. 🟡 MEDIUM — Foreign Key 제약 누락

### 2.1 `rag_documents.user_id` FK 누락

**위치**: V8__create_rag_tables.sql

#### 과거 정의 (V1__init_schema.sql)
```sql
user_id BIGINT NOT NULL REFERENCES users(id),
```

#### 현재 정의 (V8__create_rag_tables.sql)
```sql
user_id BIGINT NOT NULL,    -- ❌ FK 없음
```

#### JPA 매핑
```java
// RagDocumentJpaEntity.java
@Column(nullable = false)
private Long userId;  // @ManyToOne 대신 단순 Long
```

→ JPA 레벨에서는 `@ManyToOne` 관계를 안 쓰므로 Hibernate validate 실패는 아님. 다만 **DB 레벨 무결성 제약이 없어 고아 데이터 발생 가능.**

#### 권장 조치
```sql
ALTER TABLE rag_documents
    ADD CONSTRAINT fk_rag_documents_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

---

## 3. 🟠 HIGH — 성능 인덱스 30개+ 누락

### 현재 마이그레이션에 정의된 인덱스 (8개만)
```
idx_download_history_user_created
idx_fcm_tokens_user_id
idx_policy_data_apply_dates
idx_policy_data_category
idx_policy_data_region
idx_rag_docs_category
idx_rag_docs_content_type
idx_rag_docs_status
```

### 과거 마이그레이션에 정의되었으나 통합 후 누락된 인덱스

**핵심 FK 인덱스 (가장 시급)** — 조회 빈도 높은 외래키

| # | 테이블 | 인덱스 | 컬럼 | 용도 |
|---|---|---|---|---|
| 1 | farms | idx_farms_user_id | user_id | 사용자별 농장 조회 |
| 2 | farms | idx_farms_bjd_code | bjd_code | 지역별 농장 조회 |
| 3 | cultivation_registrations | idx_cultivation_reg_farm_id | farm_id | 농장별 재배 |
| 4 | cultivation_registrations | idx_cultivation_reg_crop_id | crop_id | 작물별 재배 |
| 5 | cultivation_registrations | idx_cultivation_farm_status | (farm_id, status) | 상태 필터 |
| 6 | orders | idx_orders_buyer_id | buyer_id | 구매자별 주문 |
| 7 | order_items | idx_order_items_order_id | order_id | 주문 상세 |
| 8 | products | idx_products_seller_id | seller_id | 판매자 상품 |
| 9 | products | idx_products_category_id | category_id | 카테고리 |
| 10 | products | idx_products_harvest_id | harvest_record_id | 수확물 연결 |
| 11 | cart_items | idx_cart_items_user_id | user_id | 사용자 장바구니 |
| 12 | posts | idx_posts_author_id | author_id | 작성자 |
| 13 | posts | idx_posts_category_id | category_id | 카테고리 |
| 14 | comments | idx_comments_post_id | post_id | 게시물 댓글 |
| 15 | comments | idx_comments_parent_id | parent_id | 대댓글 |
| 16 | notifications | idx_notifications_user_id_read | (user_id, is_read) | 안읽음 필터 |
| 17 | uploads | idx_uploads_entity | (entity_type, entity_id) | 다형성 조회 |
| 18 | security_questions | idx_security_questions_user_id | user_id | - |
| 19 | user_social_accounts | idx_user_social_accounts_user_id | user_id | - |
| 20 | user_sanction_logs | idx_user_sanction_logs_target_user_id | target_user_id | - |
| 21 | harvest_records | idx_harvest_cult_reg | cultivation_registration_id | - |
| 22 | cultivation_history | idx_history_cult_reg | cultivation_registration_id | - |
| 23 | cultivation_history | idx_history_farm_id | farm_id | - |
| 24 | recommend_history | idx_recommend_history_farm_generated | (farm_id, generated_at) | - |
| 25 | reports | idx_reports_status | status | - |
| 26 | reports | idx_reports_target | (target_type, target_id) | - |
| 27 | balance_data | idx_balance_crop_id | crop_id | - |
| 28 | balance_data | idx_balance_region | region_code | - |

**기타 조회 빈도 높은 인덱스**

| # | 테이블 | 인덱스 | 컬럼 |
|---|---|---|---|
| 29 | crops | idx_crops_external_id | external_id |
| 30 | crop_categories | idx_crop_categories_external_id | external_id |
| 31 | api_sync_status | idx_api_sync_active | is_active |
| 32 | api_sync_status | idx_api_sync_status | sync_status |
| 33 | batch_logs | idx_batch_logs_created_at | created_at DESC |
| 34 | batch_logs | idx_batch_logs_job_name | job_name |
| 35 | crop_cultivation_env | idx_crop_cultivation_env_name | crop_name |
| 36 | crop_price_cache | idx_crop_price_cache_name_date | (crop_name, date) |
| 37 | pest_occurrence_reports | idx_pest_reports_year | report_year |
| 38 | soil_exam_data | idx_soil_pnu | pnu_code |
| 39 | regions | idx_regions_parent | parent_id |
| 40 | regions | idx_regions_type | type |
| 41 | nongsaro_farm_schedules | idx_farm_schedules_crop | crop_code |
| 42 | nongsaro_farm_schedules | idx_farm_schedules_month | start_month |
| 43 | graph_entity | idx_graph_entity_type | entity_type |
| 44 | graph_entity | idx_graph_entity_type_key | (entity_type, entity_key) |

총 **44개 인덱스 누락** (그래프 인덱스 3개는 위 1.1에 포함)

---

## 4. 🟢 LOW (정보성) — DB에는 있는데 JPA가 매핑 안 한 컬럼

**중요**: 이건 운영에 문제 없음. JPA는 명시하지 않은 컬럼은 무시. **Hibernate validate도 통과합니다.** 다만 일부 비즈니스 데이터가 엔티티에서 활용되지 않을 수 있음.

### 4.1 ProductCategoryJpaEntity ← `product_categories`
- 엔티티에 없는 DB 컬럼: `created_at`, `updated_at`, `deleted_at`
- 영향: 카테고리의 생성/수정/삭제 시각을 엔티티로 못 읽음. 다만 카테고리는 거의 정적 데이터라 문제 없음.

### 4.2 RecommendHistoryEntity ← `recommend_history`
- 엔티티에 없는 DB 컬럼: `w_soil`, `w_price`, `w_supply`, `w_difficulty`, `score_includes_climate`
- 영향: AI 추천 가중치(weights)를 JPA로는 못 읽음. JdbcTemplate 등으로 별도 처리하면 OK.

### 4.3 RecommendHistoryItemEntity ← `recommend_history_item`
- 엔티티에 없는 DB 컬럼: `kpi_sources_note`, `climate_fitness_percent`
- 영향: 동일 (JdbcTemplate으로 별도 접근 가능)

> 이 항목들은 **누락이 아니라 의도된 inactive mapping**일 수 있음. 코드 리뷰에서 의도 확인 필요. 즉시 조치 대상은 아님.

---

## 5. ✅ False Positive (조치 불필요)

### 5.1 ~~`farm_crops` 테이블 누락~~
**검증 결과**: 코드에서 이미 `cultivation_registrations`로 완전 전환됨.
```java
// FarmPersistenceAdapter.java:115
String sql = "SELECT c.name FROM cultivation_registrations cr JOIN crops c ON c.id = cr.crop_id 
              WHERE cr.farm_id = ? AND cr.status = 'ACTIVE' AND cr.deleted_at IS NULL ORDER BY c.name";
```
farm_crops는 더 이상 사용 안 함. **조치 불필요.**

### 5.2 ~~`guide_messages` 테이블 누락~~
**검증 결과**: 코드 전체에서 `guide_messages` / `GuideMessage` 참조 0건. 사용 안 함.
**조치 불필요** (단, 향후 가이드 메시지 기능 개발 예정이면 추가 필요)

### 5.3 ~~ProductCategoryJpaEntity INSERT 실패~~
**검증 결과**: created_at은 `DEFAULT NOW()`로 자동 채워지고, updated_at/deleted_at은 nullable. **INSERT 실패하지 않음.**

### 5.4 ~~RecommendHistory 컬럼 누락으로 데이터 손실~~
**검증 결과**: 엔티티가 못 읽을 뿐 DB 컬럼은 존재. JdbcTemplate 등으로 접근 시 데이터 정상.

---

## 6. ✅ 정상 확인된 항목 (참고)

### 6.1 모든 JPA 엔티티 테이블이 마이그레이션에 존재
| 검증 | 결과 |
|---|---|
| JPA `@Table` 매핑 32개 | 모두 마이그레이션에 CREATE TABLE 존재 ✅ |

### 6.2 cultivation_registrations 컬럼 타입
- `cultivation_area DECIMAL(10,2)` ↔ `Double + columnDefinition="NUMERIC"` ✅
- `farmer_estimated_yield DECIMAL(12,2)` ↔ `Double + columnDefinition="NUMERIC"` ✅

### 6.3 users 테이블 추가 컬럼들
- `provider`, `provider_id`, `profile_image_url` (V3_1 출신) ✅
- `address`, `bio` (V12 출신) ✅
- `region_code` (V3 출신) ✅
- `withdrawal_requested_at`, `anonymized_at` (V37 출신) ✅
모두 통합된 V1에 포함됨.

### 6.4 farms 테이블 추가 컬럼들
- `soil_type`, `soil_ph`, `soil_organic_matter` (V8) ✅
- `documents`, `document_data` JSONB (V26 통합) ✅
- `reject_reason` (V16) ✅
- `status` (V22) ✅
- `soil_exam_synced_at`, `soil_exam_last_attempt_at` (JPA 추가) ✅

---

## 7. 권장 복구 마이그레이션 — `V13__restore_missing_schema.sql`

```sql
-- =====================================================
-- V13: 마이그레이션 통합 중 누락된 항목 복구
--
-- 1) graph.graph_relation 테이블 + 인덱스 + UNIQUE
-- 2) rag_documents.user_id FK 제약
-- 3) 핵심 FK 인덱스 30+ 개
-- =====================================================

-- ============= 1. graph.graph_relation 테이블 =============
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

CREATE INDEX IF NOT EXISTS idx_graph_relation_type ON graph.graph_relation(relation_type);
CREATE INDEX IF NOT EXISTS idx_graph_relation_from ON graph.graph_relation(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_graph_relation_to   ON graph.graph_relation(to_entity_id);

-- ============= 2. rag_documents FK 추가 =============
ALTER TABLE rag_documents
    ADD CONSTRAINT fk_rag_documents_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ============= 3. 핵심 FK / 조회 인덱스 (44개) =============

-- farm
CREATE INDEX IF NOT EXISTS idx_farms_user_id  ON farms(user_id);
CREATE INDEX IF NOT EXISTS idx_farms_bjd_code ON farms(bjd_code);

-- cultivation
CREATE INDEX IF NOT EXISTS idx_cultivation_reg_farm_id ON cultivation_registrations(farm_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_reg_crop_id ON cultivation_registrations(crop_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_farm_status ON cultivation_registrations(farm_id, status);

-- shop
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id        ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_id     ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_harvest_id    ON products(harvest_record_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id     ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_entity         ON uploads(entity_type, entity_id);

-- community
CREATE INDEX IF NOT EXISTS idx_posts_author_id    ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id  ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id   ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, is_read);

-- user
CREATE INDEX IF NOT EXISTS idx_security_questions_user_id      ON security_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_user_id    ON user_social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sanction_logs_target_user  ON user_sanction_logs(target_user_id);

-- harvest / history / recommend
CREATE INDEX IF NOT EXISTS idx_harvest_cult_reg ON harvest_records(cultivation_registration_id);
CREATE INDEX IF NOT EXISTS idx_history_cult_reg ON cultivation_history(cultivation_registration_id);
CREATE INDEX IF NOT EXISTS idx_history_farm_id  ON cultivation_history(farm_id);
CREATE INDEX IF NOT EXISTS idx_recommend_history_farm_generated ON recommend_history(farm_id, generated_at DESC);

-- reports
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);

-- balance / crops
CREATE INDEX IF NOT EXISTS idx_balance_crop_id        ON balance_data(crop_id);
CREATE INDEX IF NOT EXISTS idx_balance_region         ON balance_data(region_code);
CREATE INDEX IF NOT EXISTS idx_crops_external_id      ON crops(external_id);
CREATE INDEX IF NOT EXISTS idx_crop_categories_external_id ON crop_categories(external_id);

-- system / sync
CREATE INDEX IF NOT EXISTS idx_api_sync_active        ON api_sync_status(is_active);
CREATE INDEX IF NOT EXISTS idx_api_sync_status        ON api_sync_status(sync_status);
CREATE INDEX IF NOT EXISTS idx_batch_logs_created_at  ON batch_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_logs_job_name    ON batch_logs(job_name);

-- crop env / cache
CREATE INDEX IF NOT EXISTS idx_crop_cultivation_env_name ON crop_cultivation_env(crop_name);
CREATE INDEX IF NOT EXISTS idx_crop_price_cache_name_date ON crop_price_cache(crop_name, date);

-- regions / nongsaro
CREATE INDEX IF NOT EXISTS idx_pest_reports_year   ON pest_occurrence_reports(report_year);
CREATE INDEX IF NOT EXISTS idx_soil_pnu            ON soil_exam_data(pnu_code);
CREATE INDEX IF NOT EXISTS idx_regions_parent      ON regions(parent_id);
CREATE INDEX IF NOT EXISTS idx_regions_type        ON regions(type);
CREATE INDEX IF NOT EXISTS idx_farm_schedules_crop  ON nongsaro_farm_schedules(crop_code);
CREATE INDEX IF NOT EXISTS idx_farm_schedules_month ON nongsaro_farm_schedules(start_month);

-- graph
CREATE INDEX IF NOT EXISTS idx_graph_entity_type     ON graph.graph_entity(entity_type);
CREATE INDEX IF NOT EXISTS idx_graph_entity_type_key ON graph.graph_entity(entity_type, entity_key);
```

---

## 8. 배포 후 검증 체크리스트

```bash
# 1. 컨테이너 재기동 후 Flyway 적용 로그 확인
docker logs farm-backend 2>&1 | grep -i "flyway\|V13"

# 2. JPA validate 통과 확인
docker logs farm-backend 2>&1 | grep -i "started\|schema-validation"
```

```sql
-- 3. graph_relation 테이블 존재 확인
SELECT to_regclass('graph.graph_relation');
-- 결과: graph.graph_relation (NULL 아니면 OK)

-- 4. rag_documents FK 확인
SELECT constraint_name
  FROM information_schema.table_constraints
 WHERE table_name = 'rag_documents'
   AND constraint_type = 'FOREIGN KEY';

-- 5. 인덱스 갯수 확인 (44개 + 기존 8개 = 52개 이상)
SELECT COUNT(*) FROM pg_indexes
WHERE schemaname IN ('public', 'graph')
  AND indexname LIKE 'idx_%';

-- 6. 정책 그래프 기능 smoke test (Java 콘솔에서)
-- → /api/policy/recommend 호출해서 graph_relation 사용 정상인지 확인
```

---

## 9. 향후 재발 방지 권장

### 9.1 CI에 마이그레이션 검증 단계 추가
```yaml
# .github/workflows/ci.yml 예시
- name: Verify schema vs JPA
  run: |
    ./gradlew bootRun &  # ddl-auto=validate
    sleep 30
    grep -q "Started" backend/logs/app.log
```

### 9.2 마이그레이션 통합 시 체크리스트
- [ ] 통합 전/후 `CREATE TABLE` 카운트 일치 확인
- [ ] 통합 전/후 `CREATE INDEX` 카운트 일치 확인  
- [ ] 통합 전/후 FK/UNIQUE 제약 카운트 일치 확인
- [ ] JPA `@Entity` 매핑 테이블 모두 존재 확인
- [ ] 코드에서 직접 SQL로 참조하는 테이블 별도 확인 (grep 필요)

### 9.3 코드 컨벤션
- 가능하면 모든 테이블에 JPA 엔티티 매핑 권장 (Hibernate validate가 자동 검증)
- JDBC native 쿼리만 쓰는 테이블은 별도 문서 관리

---

**보고서 끝**
