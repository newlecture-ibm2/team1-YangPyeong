-- ═══════════════════════════════════════════════════════════════
-- V3: 보조 스키마 추가 및 지역 시드 데이터
-- (기존 V3, V3_1, V3_2를 통합)
--   1) regions 테이블 + 시드 데이터
--   2) users.region_code 컬럼
--   3) farm_crops / download_history / uploads 테이블
--   4) products.sales_count 컬럼
--   5) cart_items FK cascade 수정
-- ═══════════════════════════════════════════════════════════════

-- ===== 1. regions 테이블 =====
CREATE TABLE IF NOT EXISTS regions (
    id         BIGSERIAL PRIMARY KEY,
    code       VARCHAR(10) NOT NULL UNIQUE,
    name       VARCHAR(30) NOT NULL,
    type       VARCHAR(10) NOT NULL CHECK (type IN ('PROVINCE','CITY','TOWN')),
    parent_id  BIGINT REFERENCES regions(id),
    is_active  BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regions_parent ON regions(parent_id);
CREATE INDEX IF NOT EXISTS idx_regions_type ON regions(type);

-- 기존 데이터 정리 (멱등)
DELETE FROM regions WHERE code LIKE '4183%' AND type = 'TOWN';
DELETE FROM regions WHERE code IN ('4183','4182');
DELETE FROM regions WHERE code = '41';

-- 시도
INSERT INTO regions (id, code, name, type, parent_id) VALUES
(1, '41', '경기도', 'PROVINCE', NULL)
ON CONFLICT (code) DO NOTHING;

-- 시군구
INSERT INTO regions (id, code, name, type, parent_id) VALUES
(2, '4183', '양평군', 'CITY', 1),
(3, '4182', '가평군', 'CITY', 1)
ON CONFLICT (code) DO NOTHING;

-- 양평군 읍면동 (12개)
INSERT INTO regions (id, code, name, type, parent_id) VALUES
(10, '4183010', '양평읍', 'TOWN', 2),
(11, '4183020', '강상면', 'TOWN', 2),
(12, '4183030', '강하면', 'TOWN', 2),
(13, '4183040', '양서면', 'TOWN', 2),
(14, '4183050', '옥천면', 'TOWN', 2),
(15, '4183060', '서종면', 'TOWN', 2),
(16, '4183070', '단월면', 'TOWN', 2),
(17, '4183080', '청운면', 'TOWN', 2),
(18, '4183090', '양동면', 'TOWN', 2),
(19, '4183100', '지평면', 'TOWN', 2),
(20, '4183110', '용문면', 'TOWN', 2),
(21, '4183120', '개군면', 'TOWN', 2),
(22, '4183130', '산북면', 'TOWN', 2)
ON CONFLICT (code) DO NOTHING;

-- 시퀀스 보정
SELECT setval('regions_id_seq', 100, true);

-- ===== 2. users.region_code 컬럼 추가 =====
ALTER TABLE users ADD COLUMN IF NOT EXISTS region_code VARCHAR(10);
UPDATE users SET region_code = '4183' WHERE region = '양평군' AND region_code IS NULL;
UPDATE users SET region_code = '4182' WHERE region = '가평군' AND region_code IS NULL;

-- ===== 3. farm_crops 테이블 =====
CREATE TABLE IF NOT EXISTS farm_crops (
    id        BIGSERIAL PRIMARY KEY,
    farm_id   BIGINT    NOT NULL REFERENCES farms(id),
    crop_name VARCHAR(50) NOT NULL,
    UNIQUE (farm_id, crop_name)
);
CREATE INDEX IF NOT EXISTS idx_farm_crops_farm_id ON farm_crops(farm_id);

-- ===== 4. download_history 테이블 =====
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

-- ===== 5. products.sales_count 컬럼 추가 =====
ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count INT NOT NULL DEFAULT 0;

-- ===== 6. uploads 테이블 =====
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

-- ===== 7. cart_items FK cascade 수정 =====
-- 상품 삭제 시 장바구니 항목도 자동 정리되도록
ALTER TABLE cart_items
    DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;

ALTER TABLE cart_items
    ADD CONSTRAINT cart_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
