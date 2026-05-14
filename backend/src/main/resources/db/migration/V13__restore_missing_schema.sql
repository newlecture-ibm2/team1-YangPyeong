-- =============================================
-- V13: 마이그레이션 통합 리팩토링 중 누락된 스키마 복구
--
-- 통합 커밋 1893015 (51개 → 17개) 이후 빠진 항목 보강:
--   1) graph.graph_relation 테이블 + UNIQUE + 3개 인덱스
--   2) rag_documents.user_id FK 제약 추가
--   3) 누락된 성능 인덱스 38개+ 일괄 생성
--
-- 모든 statement는 IF NOT EXISTS / DO 블록을 사용하여 idempotent하게 작성.
-- =============================================

-- ─────────────────────────────────────────────
-- 1. graph.graph_relation 테이블
--   - 정책 그래프 코드 (PolicyGraphPersistenceAdapter, GraphRefreshService 등)에서 SELECT/INSERT/DELETE 9곳 이상 사용 중
-- ─────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS graph;

CREATE TABLE IF NOT EXISTS graph.graph_relation (
    id              BIGSERIAL PRIMARY KEY,
    relation_type   VARCHAR(50) NOT NULL,
    from_entity_id  BIGINT      NOT NULL,
    to_entity_id    BIGINT      NOT NULL,
    properties      JSONB       DEFAULT '{}'::jsonb,
    source_table    VARCHAR(50) NOT NULL,
    created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_graph_relation UNIQUE (relation_type, from_entity_id, to_entity_id)
);

CREATE INDEX IF NOT EXISTS idx_graph_relation_type ON graph.graph_relation(relation_type);
CREATE INDEX IF NOT EXISTS idx_graph_relation_from ON graph.graph_relation(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_graph_relation_to   ON graph.graph_relation(to_entity_id);

-- ─────────────────────────────────────────────
-- 2. rag_documents.user_id FK 제약 추가
--   - 사전 검증: SELECT COUNT(*) FROM rag_documents r LEFT JOIN users u ON u.id=r.user_id WHERE u.id IS NULL = 0 (확인됨)
--   - DO 블록으로 중복 추가 방지
-- ─────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'rag_documents'
          AND constraint_name = 'fk_rag_documents_user_id'
          AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE rag_documents
            ADD CONSTRAINT fk_rag_documents_user_id
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ─────────────────────────────────────────────
-- 3. 성능 인덱스 복구 (38개)
--   - 과거 V1~V42 마이그레이션에 정의되어 있던 인덱스 중 통합본에 누락된 것
--   - UNIQUE 제약으로 자동 인덱스 생성되는 컬럼(예: crop_cultivation_env.crop_name)은 제외
--   - 운영 DB 적용 시 큰 테이블에서 짧은 락 발생 가능 → 새벽 배포 권장
-- ─────────────────────────────────────────────

-- farm domain
CREATE INDEX IF NOT EXISTS idx_farms_user_id  ON farms(user_id);
CREATE INDEX IF NOT EXISTS idx_farms_bjd_code ON farms(bjd_code);

-- cultivation
CREATE INDEX IF NOT EXISTS idx_cultivation_reg_farm_id  ON cultivation_registrations(farm_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_reg_crop_id  ON cultivation_registrations(crop_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_farm_status  ON cultivation_registrations(farm_id, status);

-- shop
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id       ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id  ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_id    ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_harvest_id   ON products(harvest_record_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id    ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_entity        ON uploads(entity_type, entity_id);

-- community
CREATE INDEX IF NOT EXISTS idx_posts_author_id     ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id   ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id    ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id  ON comments(parent_id);

-- notification
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, is_read);

-- user / auth
CREATE INDEX IF NOT EXISTS idx_security_questions_user_id     ON security_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_user_id   ON user_social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sanction_logs_target_user ON user_sanction_logs(target_user_id);

-- harvest / history / recommend
CREATE INDEX IF NOT EXISTS idx_harvest_cult_reg ON harvest_records(cultivation_registration_id);
CREATE INDEX IF NOT EXISTS idx_history_cult_reg ON cultivation_history(cultivation_registration_id);
CREATE INDEX IF NOT EXISTS idx_history_farm_id  ON cultivation_history(farm_id);
CREATE INDEX IF NOT EXISTS idx_recommend_history_farm_generated ON recommend_history(farm_id, generated_at DESC);

-- reports
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);

-- balance / crops external
CREATE INDEX IF NOT EXISTS idx_balance_crop_id              ON balance_data(crop_id);
CREATE INDEX IF NOT EXISTS idx_balance_region               ON balance_data(region_code);
CREATE INDEX IF NOT EXISTS idx_crops_external_id            ON crops(external_id);
CREATE INDEX IF NOT EXISTS idx_crop_categories_external_id  ON crop_categories(external_id);

-- system / sync / batch
CREATE INDEX IF NOT EXISTS idx_api_sync_active       ON api_sync_status(is_active);
CREATE INDEX IF NOT EXISTS idx_api_sync_status       ON api_sync_status(sync_status);
CREATE INDEX IF NOT EXISTS idx_batch_logs_created_at ON batch_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_logs_job_name   ON batch_logs(job_name);

-- crop env / price cache (실제 컬럼명에 맞게 price_date 사용)
CREATE INDEX IF NOT EXISTS idx_crop_price_cache_name_date ON crop_price_cache(crop_name, price_date);

-- external data
CREATE INDEX IF NOT EXISTS idx_pest_reports_year ON pest_occurrence_reports(report_year);
CREATE INDEX IF NOT EXISTS idx_soil_pnu          ON soil_exam_data(pnu_code);

-- regions
CREATE INDEX IF NOT EXISTS idx_regions_parent ON regions(parent_id);
CREATE INDEX IF NOT EXISTS idx_regions_type   ON regions(type);

-- nongsaro
CREATE INDEX IF NOT EXISTS idx_farm_schedules_crop  ON nongsaro_farm_schedules(crop_code);
CREATE INDEX IF NOT EXISTS idx_farm_schedules_month ON nongsaro_farm_schedules(start_month);

-- graph entity (단일 컬럼 조회용 — 복합 UNIQUE 인덱스와 별개)
CREATE INDEX IF NOT EXISTS idx_graph_entity_type ON graph.graph_entity(entity_type);
