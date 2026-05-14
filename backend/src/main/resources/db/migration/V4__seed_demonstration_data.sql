-- =============================================
-- V4: 양평군 통계 및 수급 분석 시연 데이터 통합
-- farmer1@test.com 농장의 cultivation_registrations 는 V2 시드를 삭제한 뒤
-- 수급 대시보드 시연용 3건으로 교체됩니다.
-- =============================================

-- 1. 양평군 작물 생산 통계 (KOSIS 기반 실데이터)
INSERT INTO crop_production_stats (itm_nm, region_code, region_name, year, cultivated_area, yield_per_10a, total_production, unit_nm)
VALUES 
('벼', '41830', '양평군', 2023, 3120, 500, 15600, '톤'),
('감자', '41830', '양평군', 2023, 150, 2200, 3300, '톤'),
('고추', '41830', '양평군', 2023, 85, 180, 153, '톤'),
('사과', '41830', '양평군', 2023, 42, 1500, 630, '톤')
ON CONFLICT (itm_nm, region_code, year) DO NOTHING;

-- 2. 수급 분석 대시보드 시연용 가상 데이터
DO $$
DECLARE
    v_farm_id BIGINT;
    v_grain_id BIGINT;
    v_veg_id BIGINT;
BEGIN
    -- 카테고리
    SELECT id INTO v_grain_id FROM crop_categories WHERE name = '곡물' LIMIT 1;
    SELECT id INTO v_veg_id FROM crop_categories WHERE name = '채소' LIMIT 1;

    -- 시연용 작물 정보 보충 (벼, 콩, 토마토 등)
    INSERT INTO crops (category_id, code, name, growth_days)
    VALUES 
        (v_grain_id, 'RICE', '벼', 150),
        (v_grain_id, 'SOYBEAN', '콩', 130),
        (v_veg_id, 'TOMATO', '토마토', 120),
        (v_veg_id, 'CHERRY_TOMATO', '방울토마토', 120)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

    -- 테스트용 농장 (farmer1) — V2에서 생성된 농장이 없으면 재배 등록만 생략
    SELECT id INTO v_farm_id FROM farms WHERE user_id = (SELECT id FROM users WHERE email = 'farmer1@test.com') LIMIT 1;
    IF v_farm_id IS NULL THEN
        RETURN;
    END IF;

    -- 기존 시연 데이터 초기화
    DELETE FROM cultivation_registrations WHERE farm_id = v_farm_id;

    -- [벼] 수급 적정
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE code = 'RICE' LIMIT 1), 3000.0, 21000.0, '톤', 'ACTIVE');

    -- [토마토] 공급 과잉 경고
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE code = 'TOMATO' LIMIT 1), 500.0, 130.0, '톤', 'ACTIVE');

    -- [콩] 공급 부족 주의
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE code = 'SOYBEAN' LIMIT 1), 400.0, 400.0, '톤', 'ACTIVE');

END $$;
