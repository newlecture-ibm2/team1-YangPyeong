-- ═══════════════════════════════════════════════════════════════
-- V8: 농장(farms) 테이블에 토양 정보 및 사업자 번호 관련 컬럼 추가
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE farms ADD COLUMN IF NOT EXISTS soil_type VARCHAR(50);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS soil_ph DOUBLE PRECISION;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS soil_organic_matter DOUBLE PRECISION;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS business_number VARCHAR(12);
