-- ═══════════════════════════════════════════════════════════════
-- V6: crops 테이블 축소 + seed_registrations → farm_crops 통합
--
-- 1) 기존 farm_crops 테이블 rename (FarmJpaEntity용 보존)
-- 2) crops 6개 컬럼 삭제 (조회 전용 전환)
-- 3) seed_registrations → farm_crops rename
-- 4) farm_crops 4개 컬럼 삭제
-- 5) 인덱스 재생성
-- ═══════════════════════════════════════════════════════════════

-- ===== 1. 기존 farm_crops 테이블 삭제 (V3에서 생성, FarmJpaEntity @ElementCollection용 — 더 이상 사용하지 않음) =====
DROP INDEX IF EXISTS idx_farm_crops_farm_id;
DROP TABLE IF EXISTS farm_crops;

-- ===== 2. crops 테이블 — 6개 컬럼 삭제 (조회 전용 전환) =====
-- code: 더 이상 사용하지 않음 (시드 데이터로만 관리)
ALTER TABLE crops DROP CONSTRAINT IF EXISTS crops_code_key;
ALTER TABLE crops DROP COLUMN IF EXISTS code;
ALTER TABLE crops DROP COLUMN IF EXISTS growth_days;
ALTER TABLE crops DROP COLUMN IF EXISTS yield_per_sqm;
ALTER TABLE crops DROP COLUMN IF EXISTS avg_cost_per_sqm;
ALTER TABLE crops DROP COLUMN IF EXISTS climate_conditions;
ALTER TABLE crops DROP COLUMN IF EXISTS is_active;

-- ===== 3. seed_registrations → farm_crops rename =====
ALTER TABLE seed_registrations RENAME TO farm_crops;

-- ===== 4. farm_crops — 4개 컬럼 삭제 =====
ALTER TABLE farm_crops DROP COLUMN IF EXISTS seed_type;
ALTER TABLE farm_crops DROP COLUMN IF EXISTS quantity;
ALTER TABLE farm_crops DROP COLUMN IF EXISTS receipt_image_url;
ALTER TABLE farm_crops DROP COLUMN IF EXISTS verified;

-- ===== 5. 인덱스 재생성 =====
-- 기존 인덱스 삭제 (seed_registrations 기반)
DROP INDEX IF EXISTS idx_seed_reg_farm_id;
DROP INDEX IF EXISTS idx_seed_reg_crop_id;

-- 새 인덱스 생성 (farm_crops 기반)
CREATE INDEX IF NOT EXISTS idx_farm_crops_farm_id ON farm_crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_crops_crop_id ON farm_crops(crop_id);
