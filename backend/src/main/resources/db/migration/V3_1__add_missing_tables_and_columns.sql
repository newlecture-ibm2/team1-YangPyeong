-- ═══════════════════════════════════════════════════════════════
-- V3.1: V1 DDL 누락 테이블/컬럼 보정
-- JPA 엔티티 및 V4 시드 데이터와의 불일치 해결
-- ═══════════════════════════════════════════════════════════════

-- ===== 1. users.region_code 컬럼 추가 (V4 시드에서 사용) =====
ALTER TABLE users ADD COLUMN IF NOT EXISTS region_code VARCHAR(10);

-- ===== 2. farm_crops 테이블 생성 (V4 시드에서 DELETE 참조) =====
CREATE TABLE IF NOT EXISTS farm_crops (
    id        BIGSERIAL PRIMARY KEY,
    farm_id   BIGINT    NOT NULL REFERENCES farms(id),
    crop_name VARCHAR(50) NOT NULL,
    UNIQUE (farm_id, crop_name)
);
CREATE INDEX IF NOT EXISTS idx_farm_crops_farm_id ON farm_crops(farm_id);

-- ===== 3. download_history 테이블 생성 (DownloadHistoryJpaEntity 매핑) =====
CREATE TABLE IF NOT EXISTS download_history (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    type        VARCHAR(20) NOT NULL,
    format      VARCHAR(10) NOT NULL,
    start_date  DATE,
    end_date    DATE,
    town        VARCHAR(50),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_download_history_user_id ON download_history(user_id);

-- ===== 4. products.sales_count 컬럼 추가 (ProductJpaEntity 매핑) =====
ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count INT NOT NULL DEFAULT 0;

-- ===== 5. uploads 테이블 생성 (UploadJpaEntity 매핑) =====
CREATE TABLE IF NOT EXISTS uploads (
    id             BIGSERIAL    PRIMARY KEY,
    entity_type    VARCHAR(30)  NOT NULL,
    entity_id      BIGINT       NOT NULL,
    file_type      VARCHAR(20)  NOT NULL DEFAULT 'IMAGE',
    file_url       VARCHAR(500) NOT NULL,
    original_name  VARCHAR(255),
    display_order  INT          DEFAULT 0,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_uploads_entity ON uploads(entity_type, entity_id);
