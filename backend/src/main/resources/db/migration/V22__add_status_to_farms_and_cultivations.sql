-- V21: 농장 운영 상태 및 재배 등록 상태 컬럼 추가
-- farms: OPERATING(운영중), FALLOW(휴경), CLOSED(폐업)
-- cultivation_registrations: ACTIVE(재배중), COMPLETED(수확완료)

-- 1. farms 테이블에 운영 상태 컬럼 추가
ALTER TABLE farms
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'OPERATING';

COMMENT ON COLUMN farms.status IS '농장 운영 상태 (OPERATING: 운영중, FALLOW: 휴경, CLOSED: 폐업)';

-- 2. cultivation_registrations 테이블에 재배 상태 컬럼 추가
ALTER TABLE cultivation_registrations
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

COMMENT ON COLUMN cultivation_registrations.status IS '재배 상태 (ACTIVE: 재배중, COMPLETED: 수확완료)';

-- 3. 인덱스 추가 (면적 합산 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_cultivation_farm_status
    ON cultivation_registrations (farm_id, status)
    WHERE deleted_at IS NULL;
