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
-- crop_id는 DB마다 다르므로 code로 조회 (V26과 동일).
-- =============================================

-- 1. 쌀(RICE): 23,704,240㎡ → 300,000㎡ (30ha 대농 규모)
--    수확량: 460kg/10a × 300 = 138톤
UPDATE cultivation_registrations
SET cultivation_area = 300000,
    farmer_estimated_yield = 138.0
WHERE cultivation_area > 1000000
  AND crop_id = (SELECT id FROM crops WHERE code = 'RICE' LIMIT 1)
  AND deleted_at IS NULL;

-- 2. 콩(SOYBEAN): 5,064,690㎡ → 80,000㎡ (8ha)
--    수확량: 139.6kg/10a × 80 = 11.17톤
UPDATE cultivation_registrations
SET cultivation_area = 80000,
    farmer_estimated_yield = 11.17
WHERE cultivation_area > 500000
  AND crop_id = (SELECT id FROM crops WHERE code = 'SOYBEAN' LIMIT 1)
  AND deleted_at IS NULL;

-- 3. 감자(POTATO): 1,080,540㎡ → 50,000㎡ (5ha)
--    수확량: 1,451.2kg/10a × 50 = 72.56톤
UPDATE cultivation_registrations
SET cultivation_area = 50000,
    farmer_estimated_yield = 72.56
WHERE cultivation_area > 500000
  AND crop_id = (SELECT id FROM crops WHERE code = 'POTATO' LIMIT 1)
  AND deleted_at IS NULL;

-- 4. 고구마(SWEET_POTATO): 552,082㎡ → 30,000㎡ (3ha)
--    수확량: 977kg/10a × 30 = 29.31톤
UPDATE cultivation_registrations
SET cultivation_area = 30000,
    farmer_estimated_yield = 29.31
WHERE cultivation_area > 500000
  AND crop_id = (SELECT id FROM crops WHERE code = 'SWEET_POTATO' LIMIT 1)
  AND deleted_at IS NULL;

-- 5. V26 대규모 농장 farms.area 보정: 30,000,000㎡ → 500,000㎡
UPDATE farms
SET area = 500000
WHERE area > 1000000
  AND name LIKE '%양평친환경%'
  AND deleted_at IS NULL;
