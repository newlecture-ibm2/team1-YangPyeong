-- =============================================
-- V32: cultivation 데이터 증설 + sowing_date/yield_unit 보정
--
-- 목적:
--   1) 기존 sowing_date NULL 전수 보정
--   2) yield_unit 혼재(NULL/톤) → kg 통일
--   3) V31 보정 후 '톤' 단위 잔존 → unit만 kg로 변경 (값은 V31에서 이미 kg 기준 재계산됨)
--   4) 신규 24건 INSERT (12개 읍면 × 2건, 2025/2026 혼합)
--
-- 전제: V28~V31 적용 후
-- 영향: cultivation_registrations
-- 위험도: 낮음
-- =============================================

-- 고구마·보리 crop_id는 DB마다 다름(V19 시드 기준 9~10, 구 환경 19~20).
-- 하드코딩 id 대신 code 조회 + 미존재 시 보충.
INSERT INTO crops (category_id, code, name)
SELECT (SELECT id FROM crop_categories WHERE name = '채소' LIMIT 1), 'SWEET_POTATO', '고구마'
WHERE NOT EXISTS (SELECT 1 FROM crops WHERE code = 'SWEET_POTATO');

INSERT INTO crops (category_id, code, name)
SELECT (SELECT id FROM crop_categories WHERE name = '곡물' LIMIT 1), 'BARLEY', '보리'
WHERE NOT EXISTS (SELECT 1 FROM crops WHERE code = 'BARLEY');

-- ========================================
-- Part A: sowing_date NULL 보정
-- ========================================

UPDATE cultivation_registrations SET sowing_date = '2026-04-15'
WHERE crop_id = 1 AND sowing_date IS NULL AND deleted_at IS NULL;

UPDATE cultivation_registrations SET sowing_date = '2026-04-01'
WHERE crop_id = 2 AND sowing_date IS NULL AND deleted_at IS NULL;

UPDATE cultivation_registrations SET sowing_date = '2026-03-15'
WHERE crop_id = 3 AND sowing_date IS NULL AND deleted_at IS NULL;

UPDATE cultivation_registrations SET sowing_date = '2026-03-20'
WHERE crop_id = 4 AND sowing_date IS NULL AND deleted_at IS NULL;

UPDATE cultivation_registrations SET sowing_date = '2026-03-01'
WHERE crop_id = 5 AND sowing_date IS NULL AND deleted_at IS NULL;

UPDATE cultivation_registrations SET sowing_date = '2026-06-15'
WHERE crop_id = 7 AND sowing_date IS NULL AND deleted_at IS NULL AND status = 'ACTIVE';

UPDATE cultivation_registrations SET sowing_date = '2025-06-15'
WHERE crop_id = 7 AND sowing_date IS NULL AND deleted_at IS NULL AND status = 'COMPLETED';

UPDATE cultivation_registrations SET sowing_date = '2026-03-10'
WHERE crop_id = 8 AND sowing_date IS NULL AND deleted_at IS NULL;

UPDATE cultivation_registrations SET sowing_date = '2026-03-10'
WHERE crop_id = 9 AND sowing_date IS NULL AND deleted_at IS NULL;

UPDATE cultivation_registrations SET sowing_date = '2026-04-25'
WHERE crop_id = (SELECT id FROM crops WHERE code = 'SWEET_POTATO' LIMIT 1)
  AND sowing_date IS NULL AND deleted_at IS NULL;

UPDATE cultivation_registrations SET sowing_date = '2025-10-15'
WHERE crop_id = (SELECT id FROM crops WHERE code = 'BARLEY' LIMIT 1)
  AND sowing_date IS NULL AND deleted_at IS NULL;

-- ========================================
-- Part B: yield_unit 통일
-- ========================================

-- B-1: NULL → kg
UPDATE cultivation_registrations
SET yield_unit = 'kg'
WHERE yield_unit IS NULL AND deleted_at IS NULL;

-- B-2: '톤' → kg (V31 적용 후 값은 이미 kg 기준으로 재계산됨)
-- V31 보정 대상 (id 51~54): yield 값이 138.0, 29.31, 72.56, 11.17 → 실제로 '톤' 단위
-- 이 경우 값 × 1000 + unit='kg' 변환 필요
-- V31 미보정 (id 55 토마토): yield=97.20톤 → 97200kg
-- cr.id=47: yield=5.00톤 → 5000kg
UPDATE cultivation_registrations
SET farmer_estimated_yield = farmer_estimated_yield * 1000,
    yield_unit = 'kg'
WHERE yield_unit = '톤' AND deleted_at IS NULL;

-- ========================================
-- Part C: 신규 cultivation INSERT (24건)
-- 12개 읍면 × 2건, 2025/2026 혼합
-- 면적: 1,000~15,000㎡ / yield: 면적 기반 현실 계산 / unit: kg
-- ========================================

-- 양평읍 (farm 12): 쌀 2026 + 고추 2025
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (12, 1, 8000, 3680, 'kg', 'ACTIVE', '2026-04-15');
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (12, 2, 2000, 360, 'kg', 'ACTIVE', '2025-04-01');

-- 강상면 (farm 1, 13): 고구마 2025 + 보리 2026
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (1, (SELECT id FROM crops WHERE code = 'SWEET_POTATO' LIMIT 1), 4000, 3920, 'kg', 'ACTIVE', '2025-04-25');
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (13, (SELECT id FROM crops WHERE code = 'BARLEY' LIMIT 1), 5000, 1150, 'kg', 'ACTIVE', '2025-10-15');

-- 강하면 (farm 2, 14): 콩 2025 + 감자 2026
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (2, 7, 3000, 420, 'kg', 'ACTIVE', '2025-06-15');
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (14, 4, 4000, 5800, 'kg', 'ACTIVE', '2026-03-20');

-- 양서면 (farm 3, 15): 토마토 2026 + 고추 2025
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (3, 8, 1500, 9000, 'kg', 'ACTIVE', '2026-03-10');
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (15, 2, 3000, 540, 'kg', 'ACTIVE', '2025-04-01');

-- 옥천면 (farm 4, 16): 사과 2025 + 보리 2026
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (4, 3, 5000, 7500, 'kg', 'ACTIVE', '2025-03-15');
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (16, (SELECT id FROM crops WHERE code = 'BARLEY' LIMIT 1), 6000, 1380, 'kg', 'ACTIVE', '2025-10-15');

-- 서종면 (farm 17, 5): 고구마 2025 + 콩 2026
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (17, (SELECT id FROM crops WHERE code = 'SWEET_POTATO' LIMIT 1), 5000, 4900, 'kg', 'ACTIVE', '2025-04-25');
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (5, 7, 2000, 280, 'kg', 'ACTIVE', '2026-06-15');

-- 단월면 (farm 6, 18): 쌀 2026 + 방울토마토 2025
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (6, 1, 10000, 4600, 'kg', 'ACTIVE', '2026-04-15');
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (18, 9, 1000, 4500, 'kg', 'ACTIVE', '2025-03-10');

-- 청운면 (farm 7, 19): 감자 2026 + 고추 2025
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (7, 4, 3000, 4350, 'kg', 'ACTIVE', '2026-03-20');
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (19, 2, 2500, 450, 'kg', 'ACTIVE', '2025-04-01');

-- 양동면 (farm 8, 20): 콩 2025 + 고구마 2026
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (8, 7, 4000, 560, 'kg', 'ACTIVE', '2025-06-15');
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (20, (SELECT id FROM crops WHERE code = 'SWEET_POTATO' LIMIT 1), 3000, 2940, 'kg', 'ACTIVE', '2026-04-25');

-- 지평면 (farm 9): 쌀 2026 + 토마토 2025
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (9, 1, 12000, 5520, 'kg', 'ACTIVE', '2026-04-15');
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (9, 8, 800, 4800, 'kg', 'ACTIVE', '2025-03-10');

-- 용문면 (farm 10): 사과 2025 + 감자 2026
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (10, 3, 7000, 10500, 'kg', 'ACTIVE', '2025-03-15');
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (10, 4, 2500, 3625, 'kg', 'ACTIVE', '2026-03-20');

-- 개군면 (farm 11): 고구마 2026 + 콩 2025
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (11, (SELECT id FROM crops WHERE code = 'SWEET_POTATO' LIMIT 1), 6000, 5880, 'kg', 'ACTIVE', '2026-04-25');
INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status, sowing_date)
VALUES (11, 7, 3000, 420, 'kg', 'ACTIVE', '2025-06-15');
