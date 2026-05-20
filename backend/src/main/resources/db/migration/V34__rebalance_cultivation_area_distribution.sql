-- V34__rebalance_cultivation_area_distribution.sql
-- 옥천면에 과도하게 집중된 재배면적 차트 분포를 자연스럽게 조정하기 위해
-- 타 읍면의 대규모/중규모 농장 면적을 상향 조정합니다.

-- 1. 단월면 (쌀) -> 75,000㎡
UPDATE cultivation_registrations
SET cultivation_area = 75000,
    farmer_estimated_yield = 75000 * 0.46,
    yield_unit = 'kg'
WHERE id = 11;

-- 2. 지평면 (쌀) -> 65,000㎡
UPDATE cultivation_registrations
SET cultivation_area = 65000,
    farmer_estimated_yield = 65000 * 0.46,
    yield_unit = 'kg'
WHERE id = 74;

-- 3. 양동면 (고구마) -> 45,000㎡
UPDATE cultivation_registrations
SET cultivation_area = 45000,
    farmer_estimated_yield = 45000 * 0.98,
    yield_unit = 'kg'
WHERE id = 73;

-- 4. 양평읍 (쌀) -> 19,000㎡
UPDATE cultivation_registrations
SET cultivation_area = 19000,
    farmer_estimated_yield = 19000 * 0.46,
    yield_unit = 'kg'
WHERE id = 56;

-- 5. 양서면 (쌀) -> 18,000㎡
UPDATE cultivation_registrations
SET cultivation_area = 18000,
    farmer_estimated_yield = 18000 * 0.46,
    yield_unit = 'kg'
WHERE id = 15;

-- 6. 개군면 (감자) -> 16,000㎡
UPDATE cultivation_registrations
SET cultivation_area = 16000,
    farmer_estimated_yield = 16000 * 1.45,
    yield_unit = 'kg'
WHERE id = 61;

-- 7. 강하면 (콩) -> 15,000㎡
UPDATE cultivation_registrations
SET cultivation_area = 15000,
    farmer_estimated_yield = 15000 * 0.14,
    yield_unit = 'kg'
WHERE id = 59;

-- 8. 강상면 (고구마) -> 14,000㎡
UPDATE cultivation_registrations
SET cultivation_area = 14000,
    farmer_estimated_yield = 14000 * 0.98,
    yield_unit = 'kg'
WHERE id = 58;
