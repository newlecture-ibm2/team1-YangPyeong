-- =============================================
-- V19: 수급 분석 시연용 가상 데이터 및 통계 실데이터 적재
-- =============================================

DO $$
DECLARE
    v_farm_id BIGINT;
    v_grain_id BIGINT;
    v_veg_id BIGINT;
    v_user_id BIGINT;
BEGIN
    -- 1. 사용자 및 농장 조회/생성
    SELECT id INTO v_user_id FROM users WHERE email = 'farmer1@test.com' LIMIT 1;
    
    IF v_user_id IS NULL THEN
        -- 유저가 없으면 생성 (시연용 기본 비밀번호: password)
        INSERT INTO users (email, password, name, role, status, address, region_code)
        VALUES ('farmer1@test.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.7uSyLnS', '시연농부', 'FARMER', 'ACTIVE', '경기도 양평군 양평읍', '4183')
        RETURNING id INTO v_user_id;
    END IF;

    SELECT id INTO v_farm_id FROM farms WHERE user_id = v_user_id LIMIT 1;
    
    IF v_farm_id IS NULL THEN
        INSERT INTO farms (user_id, name, address, area, certification_status, status)
        VALUES (v_user_id, '시연용 가상 농장', '경기도 양평군 양평읍 중앙로 1', 5000.0, 'APPROVED', 'OPERATING')
        RETURNING id INTO v_farm_id;
    END IF;

    -- 2. 카테고리 조회 및 보충
    SELECT id INTO v_grain_id FROM crop_categories WHERE name = '곡물' LIMIT 1;
    IF v_grain_id IS NULL THEN
        INSERT INTO crop_categories (name, display_order) VALUES ('곡물', 1) RETURNING id INTO v_grain_id;
    END IF;

    SELECT id INTO v_veg_id FROM crop_categories WHERE name = '채소' LIMIT 1;
    IF v_veg_id IS NULL THEN
        INSERT INTO crop_categories (name, display_order) VALUES ('채소', 2) RETURNING id INTO v_veg_id;
    END IF;

    -- 3. 작물 데이터 보충 (ON CONFLICT 사용하여 중복 해결)
    INSERT INTO crops (category_id, code, name) VALUES (v_grain_id, 'RICE', '쌀') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
    INSERT INTO crops (category_id, code, name) VALUES (v_grain_id, 'SOYBEAN', '콩') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
    INSERT INTO crops (category_id, code, name) VALUES (v_veg_id, 'TOMATO', '토마토') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
    INSERT INTO crops (category_id, code, name) VALUES (v_veg_id, 'CHERRY_TOMATO', '방울토마토') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
    INSERT INTO crops (category_id, code, name) VALUES (v_veg_id, 'POTATO', '감자') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
    INSERT INTO crops (category_id, code, name) VALUES (v_veg_id, 'SWEET_POTATO', '고구마') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
    INSERT INTO crops (category_id, code, name) VALUES (v_grain_id, 'BARLEY', '보리') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

    -- 4. 기존 재배 데이터 초기화 (해당 농장만)
    DELETE FROM cultivation_registrations WHERE farm_id = v_farm_id;

    -- 5. 가상 재배 데이터 적재 (상태값이 골고루 나오도록 구성)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE name = '쌀' LIMIT 1), 3000.0, 21000.0, '톤', 'ACTIVE');

    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE name = '토마토' LIMIT 1), 500.0, 130.0, '톤', 'ACTIVE');

    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE name = '감자' LIMIT 1), 800.0, 8500.0, '톤', 'ACTIVE');

    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE name = '콩' LIMIT 1), 400.0, 400.0, '톤', 'ACTIVE');

    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE name = '방울토마토' LIMIT 1), 100.0, 5.0, '톤', 'ACTIVE');

    -- 6. 양평군 작물 생산 통계 (KOSIS 실데이터 기반)
    INSERT INTO crop_production_stats (itm_nm, region_code, region_name, year, cultivated_area, yield_per_10a, total_production, unit_nm)
    VALUES 
    ('쌀', '4183', '양평군', 2023, 3120, 500, 22950, '톤'),
    ('콩', '4183', '양평군', 2023, 412, 183, 756, '톤'),
    ('토마토', '4183', '양평군', 2023, 12, 6000, 72, '톤'),
    ('방울토마토', '4183', '양평군', 2023, 8.5, 4500, 38.25, '톤'),
    ('감자', '4183', '양평군', 2023, 315, 2310, 7280, '톤'),
    ('고구마', '4183', '양평군', 2023, 142, 1560, 2215, '톤'),
    ('보리', '4183', '양평군', 2023, 45, 320, 144, '톤')
    ON CONFLICT (itm_nm, region_code, year) DO UPDATE SET
        cultivated_area = EXCLUDED.cultivated_area,
        yield_per_10a = EXCLUDED.yield_per_10a,
        total_production = EXCLUDED.total_production,
        unit_nm = EXCLUDED.unit_nm;

END $$;
