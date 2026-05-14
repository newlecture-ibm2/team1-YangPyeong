-- V42: 수급 분석 대시보드 시연용 가상 재배 데이터 적재
-- 각 상태값(과잉, 적정, 부족)이 골고루 나오도록 구성

DO $$
DECLARE
    v_farm_id BIGINT;
    v_category_id BIGINT;
BEGIN
    -- 1. 테스트용 농장 조회 (기존 farmer1@test.com 유저의 농장 활용)
    SELECT id INTO v_farm_id FROM farms WHERE user_id = (SELECT id FROM users WHERE email = 'farmer1@test.com') LIMIT 1;
    
    -- 만약 농장이 없다면 시연용으로 하나 생성
    IF v_farm_id IS NULL THEN
        INSERT INTO farms (user_id, name, address, area, certification_status)
        VALUES ((SELECT id FROM users WHERE email = 'farmer1@test.com'), '시연용 가상 농장', '경기도 양평군 양평읍 중앙로 1', 5000.0, 'APPROVED')
        RETURNING id INTO v_farm_id;
    END IF;

    -- 2. 필수 작물 데이터 확인 및 보충 (crops 테이블에 없는 경우)
    -- 참고: V15 마이그레이션에서 crops 테이블의 code, growth_days, yield_per_sqm 등의 컬럼이 삭제되었습니다.
    -- 현재 crops 테이블은 id, category_id, name 컬럼 위주로 관리됩니다.
    
    -- 카테고리 조회 (기존 카테고리 하나를 임의로 할당)
    SELECT id INTO v_category_id FROM crop_categories ORDER BY id ASC LIMIT 1;
    
    -- 작물 보충 (쌀, 콩, 방울토마토가 crops 테이블에 없는 경우를 대비)
    INSERT INTO crops (category_id, code, name)
    SELECT v_category_id, 'RICE', '쌀'
    WHERE NOT EXISTS (SELECT 1 FROM crops WHERE name = '쌀');

    INSERT INTO crops (category_id, code, name)
    SELECT v_category_id, 'SOYBEAN', '콩'
    WHERE NOT EXISTS (SELECT 1 FROM crops WHERE name = '콩');

    INSERT INTO crops (category_id, code, name)
    SELECT v_category_id, 'CHERRY_TOMATO', '방울토마토'
    WHERE NOT EXISTS (SELECT 1 FROM crops WHERE name = '방울토마토');

    -- 3. 기존 시연 데이터 삭제 (해당 농장의 데이터만 초기화)
    DELETE FROM cultivation_registrations WHERE farm_id = v_farm_id;

    -- 4. 작물별 가상 재배 등록 (farmer_estimated_yield 값을 통해 비율 조절)
    -- 참고: status는 Enum 규격에 맞춰 'ACTIVE'로 설정합니다.
    
    -- [쌀] 수급 적정 (목표 22,950톤 대비 약 91%)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE name = '쌀' LIMIT 1), 3000.0, 21000.0, '톤', 'ACTIVE');

    -- [토마토] 공급 과잉 경고 (목표 72톤 대비 약 180%)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE name = '토마토' LIMIT 1), 500.0, 130.0, '톤', 'ACTIVE');

    -- [감자] 공급 과잉 주의 (목표 7,280톤 대비 약 116%)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE name = '감자' LIMIT 1), 800.0, 8500.0, '톤', 'ACTIVE');

    -- [콩] 공급 부족 주의 (목표 756톤 대비 약 52%)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE name = '콩' LIMIT 1), 400.0, 400.0, '톤', 'ACTIVE');

    -- [방울토마토] 공급 부족 경고 (목표 38.25톤 대비 약 13%)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE name = '방울토마토' LIMIT 1), 100.0, 5.0, '톤', 'ACTIVE');

END $$;
