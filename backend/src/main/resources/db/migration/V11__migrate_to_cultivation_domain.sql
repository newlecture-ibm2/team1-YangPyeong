-- ===================================================================
-- V11: 재배(Cultivation) 도메인 고도화 및 테이블 리팩토링
-- 1. seed_registrations -> cultivation_registrations 명칭 및 구조 변경
-- 2. cultivation_history 구조 고도화 (기상 데이터 연동)
-- 3. harvest_records(수확 이력) 테이블 신규 추가
-- 4. products 테이블과 수확 이력 연결
-- ===================================================================

-- 1. seed_registrations -> cultivation_registrations
ALTER TABLE seed_registrations RENAME TO cultivation_registrations;
ALTER TABLE cultivation_registrations RENAME COLUMN seed_type TO cultivation_type;

-- 1.1 cultivation_registrations 컬럼 수정
ALTER TABLE cultivation_registrations 
    ADD COLUMN cultivation_area DECIMAL(10,2),
    ADD COLUMN farmer_estimated_yield DECIMAL(12,2),
    ADD COLUMN ai_predicted_yield DECIMAL(12,2),
    DROP COLUMN IF EXISTS quantity,
    DROP COLUMN IF EXISTS estimated_yield,
    DROP COLUMN IF EXISTS receipt_image_url;

-- 2. cultivation_history (기존 테이블 삭제 후 재생성 또는 구조 변경)
-- 기존 데이터가 중요하지 않은 초기 단계이므로 DROP 후 재생성하여 ERD와 맞춤
DROP TABLE IF EXISTS cultivation_history;

CREATE TABLE cultivation_history (
    id                          BIGSERIAL    PRIMARY KEY,
    farm_id                     BIGINT       NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    cultivation_registration_id BIGINT       REFERENCES cultivation_registrations(id) ON DELETE CASCADE,
    record_date                 DATE         NOT NULL,
    activity_type               VARCHAR(20),  -- WATER | FERTILIZER | PESTICIDE | ETC
    activity_content            TEXT,
    avg_temp                    DECIMAL(5,1), -- 해당일 평균 기온 (API)
    total_rain                  DECIMAL(7,1), -- 해당일 강수량 (API)
    created_at                  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 3. harvest_records (수확 이력) 신규 생성
CREATE TABLE harvest_records (
    id                          BIGSERIAL    PRIMARY KEY,
    cultivation_registration_id BIGINT       NOT NULL REFERENCES cultivation_registrations(id) ON DELETE CASCADE,
    harvest_date                DATE         NOT NULL,
    yield_amount                DECIMAL(12,2) NOT NULL,
    yield_unit                  VARCHAR(10)  NOT NULL,
    grade                       VARCHAR(10),  -- A | B | C
    to_shop                     BOOLEAN      DEFAULT false,
    created_at                  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 4. products 테이블에 수확 이력 연결
ALTER TABLE products 
    ADD COLUMN harvest_record_id BIGINT REFERENCES harvest_records(id);

-- 5. 인덱스 정리
CREATE INDEX idx_cultivation_reg_farm_id ON cultivation_registrations(farm_id);
CREATE INDEX idx_cultivation_reg_crop_id ON cultivation_registrations(crop_id);
CREATE INDEX idx_history_cult_reg ON cultivation_history(cultivation_registration_id);
CREATE INDEX idx_harvest_cult_reg ON harvest_records(cultivation_registration_id);
CREATE INDEX idx_products_harvest_id ON products(harvest_record_id);

-- 기존 인덱스 삭제 (필요시)
DROP INDEX IF EXISTS idx_seed_reg_farm_id;
DROP INDEX IF EXISTS idx_seed_reg_crop_id;
DROP INDEX IF EXISTS idx_history_farm_id;

-- 6. 공통 업로드 entity_type 값 변경 (기존 데이터 마이그레이션)
UPDATE uploads SET entity_type = 'CULTIVATION_RECEIPT' WHERE entity_type = 'SEED_RECEIPT';
