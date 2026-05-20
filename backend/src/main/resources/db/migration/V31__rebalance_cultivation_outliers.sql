-- =============================================
-- V31: cultivation_area 이상치 보정 + 대규모 농장 면적 축소
-- 
-- 목적: V26에서 생성된 초거대 재배면적(최대 23,704,240㎡)을
--        현실적 대규모 농가 수준(≤300,000㎡)으로 축소합니다.
--        farms.area도 동시 보정하여 차트 Y축 붕괴를 방지합니다.
-- 영향: cultivation_registrations (cultivation_area, farmer_estimated_yield)
--        farms (area)
-- 위험도: 낮음 (WHERE 조건으로 대상 특정, 데모 데이터 전용)
-- 비고: balance_data.supply_forecast는 시군구 단위 집계 데이터이므로 미조정.
--        (개별 농가 재배면적 ≠ 시군구 총 공급 예측)
--
-- 실제 데이터 분석 결과 (2026-05-19):
--   crops.name 확인: '쌀'(id=1), '감자'(id=4), '콩'(id=7), '토마토'(id=8), '고구마'(id=19)
--   V26 이상치:
--     쌀: 23,704,240㎡ (cr.id=51)
--     콩: 5,064,690㎡ (cr.id=54)
--     감자: 1,080,540㎡ (cr.id=53)
--     고구마: 552,082㎡ (cr.id=52)
--     토마토: 24,300㎡ (cr.id=55) — 정상 범위
-- =============================================

-- 1. 쌀(crop_id=1): 23,704,240㎡ → 300,000㎡ (30ha 대농 규모)
--    수확량: 460kg/10a × 300 = 138톤
UPDATE cultivation_registrations
SET cultivation_area = 300000,
    farmer_estimated_yield = 138.0
WHERE cultivation_area > 1000000
  AND crop_id = 1
  AND deleted_at IS NULL;

-- 2. 콩(crop_id=7): 5,064,690㎡ → 80,000㎡ (8ha)
--    수확량: 139.6kg/10a × 80 = 11.17톤
UPDATE cultivation_registrations
SET cultivation_area = 80000,
    farmer_estimated_yield = 11.17
WHERE cultivation_area > 500000
  AND crop_id = 7
  AND deleted_at IS NULL;

-- 3. 감자(crop_id=4): 1,080,540㎡ → 50,000㎡ (5ha)
--    수확량: 1,451.2kg/10a × 50 = 72.56톤
UPDATE cultivation_registrations
SET cultivation_area = 50000,
    farmer_estimated_yield = 72.56
WHERE cultivation_area > 500000
  AND crop_id = 4
  AND deleted_at IS NULL;

-- 4. 고구마(crop_id=19): 552,082㎡ → 30,000㎡ (3ha)
--    수확량: 977kg/10a × 30 = 29.31톤
UPDATE cultivation_registrations
SET cultivation_area = 30000,
    farmer_estimated_yield = 29.31
WHERE cultivation_area > 500000
  AND crop_id = 19
  AND deleted_at IS NULL;

-- 5. V26 대규모 농장 farms.area 보정: 30,000,000㎡ → 500,000㎡
UPDATE farms
SET area = 500000
WHERE area > 1000000
  AND name LIKE '%양평친환경%'
  AND deleted_at IS NULL;
