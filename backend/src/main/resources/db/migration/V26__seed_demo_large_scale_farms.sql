-- =========================================================================
-- V26: 대규모 친환경 영농조합 법인 및 위탁단지 가상 데이터 시딩 (시연용)
-- =========================================================================

DO $$
DECLARE
    v_user_id BIGINT;
    v_farm_id BIGINT;
BEGIN
    -- 1. 대규모 친환경 영농조합 법인 유저 생성 (대표자)
    -- 비밀번호 해시는 기본 테스트 규격인 'password' 의 BCrypt 해시입니다.
    INSERT INTO users (email, password, name, role, status, address, region_code)
    VALUES ('yp_coop@test.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.7uSyLnS', 
            '양평친환경영농조합', 'FARMER', 'ACTIVE', '경기도 양평군 양평읍 중앙로 10', '4183')
    ON CONFLICT (email) DO UPDATE SET 
        name = EXCLUDED.name,
        region_code = EXCLUDED.region_code
    RETURNING id INTO v_user_id;

    -- 2. 30,000,000 ㎡ (약 900만 평, 3,000 헥타르) 규모의 대형 위탁 영농 단지 생성
    INSERT INTO farms (user_id, name, address, area, certification_status, status)
    VALUES (v_user_id, '양평친환경영농조합 대규모 위탁단지', '경기도 양평군 양평읍 덕평길 50', 
            30000000.0, 'APPROVED', 'OPERATING')
    ON CONFLICT DO NOTHING;

    -- 생성 혹은 기존 존재할 대규모 위탁단지의 farm_id 조회
    SELECT id INTO v_farm_id FROM farms WHERE user_id = v_user_id LIMIT 1;

    -- 3. 기존 시드 데이터 중 대규모 수량 연출을 혼란스럽게 만들 수 있는 간섭 데이터 정리
    -- 농부1(id=1) 및 조합(v_farm_id)의 감자, 고구마, 콩, 토마토 ACTIVE 재배 데이터를 삭제하여 신규 법인 데이터와 혼선이 생기지 않도록 정화합니다.
    DELETE FROM cultivation_registrations 
    WHERE farm_id IN (1, v_farm_id) 
      AND crop_id IN (SELECT id FROM crops WHERE name IN ('쌀', '감자', '고구마', '콩', '토마토'));

    -- 4. 2024년 기준 수요량(분모)에 정확히 대비되는 [활성 공급량(status = 'ACTIVE')] 적재
    -- 1㎡당 약 0.5kg 수준의 농업 생태학적 면적-수확량 고증 비율을 정교하게 반영합니다.

    -- [쌀 / 벼] 기준 수요량 12,094,000 kg 대비 98.0% 적정 (목표 공급량: 11,852.12 톤)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE name = '쌀' LIMIT 1), 23704240.0, 11852.12, '톤', 'ACTIVE');

    -- [고구마] 기준 수요량 700,500 kg 대비 77.0% 부족주의 (목표 공급량: 539.385 톤)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE name = '고구마' LIMIT 1), 552082.0, 539.385, '톤', 'ACTIVE');

    -- [감자] 기준 수요량 2,306,000 kg 대비 68.0% 부족경고 (목표 공급량: 1,568.08 톤)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE name = '감자' LIMIT 1), 1080540.0, 1568.08, '톤', 'ACTIVE');

    -- [콩] 기준 수요량 604,300 kg 대비 117.0% 과잉주의 (목표 공급량: 707.031 톤)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE name = '콩' LIMIT 1), 5064690.0, 707.031, '톤', 'ACTIVE');

    -- [토마토] 기준 수요량 72,000 kg 대비 135.0% 과잉경고 (목표 공급량: 97.2 톤)
    INSERT INTO cultivation_registrations (farm_id, crop_id, cultivation_area, farmer_estimated_yield, yield_unit, status)
    VALUES (v_farm_id, (SELECT id FROM crops WHERE name = '토마토' LIMIT 1), 24300.0, 97.2, '톤', 'ACTIVE');

    -- 5. 지자체 포탈 대시보드(/gov)의 balance_data 데이터 동기화 셋업 (2026년 기준)
    -- 농민 포탈과 소수점 한 자리까지 수치가 정확하게 동기화되어 극대화된 웹 정밀도를 연출합니다.
    INSERT INTO balance_data (region_code, crop_id, year, season, supply_forecast, demand_forecast, supply_ratio, balance_status, calculated_at, created_at)
    VALUES
    ('4183000000', (SELECT id FROM crops WHERE name = '쌀' LIMIT 1), 2026, 'ALL', 11852.12 * 1000, 12094 * 1000, 98.00, 'BALANCED', NOW(), NOW()),
    ('4183000000', (SELECT id FROM crops WHERE name = '고구마' LIMIT 1), 2026, 'ALL', 539.385 * 1000, 700.5 * 1000, 77.00, 'SHORT_CAUTION', NOW(), NOW()),
    ('4183000000', (SELECT id FROM crops WHERE name = '감자' LIMIT 1), 2026, 'ALL', 1568.08 * 1000, 2306 * 1000, 68.00, 'SHORT_WARN', NOW(), NOW()),
    ('4183000000', (SELECT id FROM crops WHERE name = '콩' LIMIT 1), 2026, 'ALL', 707.031 * 1000, 604.3 * 1000, 117.00, 'EXCESS_CAUTION', NOW(), NOW()),
    ('4183000000', (SELECT id FROM crops WHERE name = '토마토' LIMIT 1), 2026, 'ALL', 97.2 * 1000, 72 * 1000, 135.00, 'EXCESS_WARN', NOW(), NOW())
    ON CONFLICT (region_code, crop_id, year, season) DO UPDATE SET
        supply_forecast = EXCLUDED.supply_forecast,
        demand_forecast = EXCLUDED.demand_forecast,
        supply_ratio = EXCLUDED.supply_ratio,
        balance_status = EXCLUDED.balance_status,
        calculated_at = NOW();

END $$;
