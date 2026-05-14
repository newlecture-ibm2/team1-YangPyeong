-- =============================================
-- V11: 수급 분석 대시보드 시연용 가상 재배 데이터 적재
-- 각 상태값(과잉, 적정, 부족)이 골고루 나오도록 구성
-- =============================================

DO $$
DECLARE
    v_farm_id BIGINT;
    v_category_grain_id BIGINT;
    v_category_veg_id BIGINT;
BEGIN
    -- 1. 테스트용 농장 조회 (V8_1에서 생성된 farmer1@test.com 유저의 농장 활용)
    SELECT id INTO v_farm_id FROM farms WHERE user_id = (SELECT id FROM users WHERE email = 'farmer1@test.com') LIMIT 1;
    
    -- 만약 농장이 없다면 시연용으로 하나 생성
    IF v_farm_id IS NULL THEN
        INSERT INTO farms (user_id, name, address, area, certification_status)
        VALUES ((SELECT id FROM users WHERE email = 'farmer1@test.com'), '시연용 가상 농장', '경기도 양평군 양평읍 중앙로 1', 5000.0, 'APPROVED')
        RETURNING id INTO v_farm_id;
    END IF;

    -- 2. 필수 작물 데이터 확인 및 보충
    SELECT id INTO v_category_grain_id FROM crop_categories WHERE name = '곡물' LIMIT 1;
    SELECT id INTO v_category_veg_id FROM crop_categories WHERE name = '채소' LIMIT 1;
    
    -- 시연에 필요한 추가 작물 등록 (기존 V8 데이터와 겹치면 업데이트)
    INSERT INTO crops (category_id, code, name, growth_days)
    VALUES 
        (v_category_grain_id, 'RICE', '벼', 150),
        (v_category_grain_id, 'SOYBEAN', '콩', 130),
        (v_category_veg_id, 'CHERRY_TOMATO', '방울토마토', 120),
        (v_category_veg_id, 'TOMATO', '토마토', 120)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

    -- 3. 기존 시연 데이터 삭제 (해당 농장의 데이터만 초기화)
    DELETE FROM cultivation_registrations WHERE farm_id = v_farm_id;

    -- 4. 작물별 가상 재배 등록 (farmer_estimated_yield 값을 통해 비율 조절)
    
    -- [벼] 수급 적정 (목표 대비 약 91%)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE code = 'RICE' LIMIT 1), 3000.0, 21000.0, '톤', 'ACTIVE');

    -- [토마토] 공급 과잉 경고 (목표 대비 약 180%)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE code = 'TOMATO' LIMIT 1), 500.0, 130.0, '톤', 'ACTIVE');

    -- [감자] 공급 과잉 주의 (목표 대비 약 116%)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE code = 'POTATO' LIMIT 1), 800.0, 8500.0, '톤', 'ACTIVE');

    -- [콩] 공급 부족 주의 (목표 대비 약 52%)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE code = 'SOYBEAN' LIMIT 1), 400.0, 400.0, '톤', 'ACTIVE');

    -- [방울토마토] 공급 부족 경고 (목표 대비 약 13%)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE code = 'CHERRY_TOMATO' LIMIT 1), 100.0, 5.0, '톤', 'ACTIVE');

END $$;
