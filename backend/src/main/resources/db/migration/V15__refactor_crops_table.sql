-- ═══════════════════════════════════════════════════════════════
-- V15: crops 테이블 축소
--
-- V14에서 seed_registrations -> cultivation_registrations 리팩터링이 완료되었으므로,
-- 여기서는 crops 테이블의 6개 컬럼 삭제(조회 전용 전환)만 수행합니다.
-- ═══════════════════════════════════════════════════════════════

-- ===== crops 테이블 — 6개 컬럼 삭제 (조회 전용 전환) =====
-- code: 더 이상 사용하지 않음 (시드 데이터로만 관리)
ALTER TABLE crops DROP CONSTRAINT IF EXISTS crops_code_key;
ALTER TABLE crops DROP COLUMN IF EXISTS code;
ALTER TABLE crops DROP COLUMN IF EXISTS growth_days;
ALTER TABLE crops DROP COLUMN IF EXISTS yield_per_sqm;
ALTER TABLE crops DROP COLUMN IF EXISTS avg_cost_per_sqm;
ALTER TABLE crops DROP COLUMN IF EXISTS climate_conditions;
ALTER TABLE crops DROP COLUMN IF EXISTS is_active;
