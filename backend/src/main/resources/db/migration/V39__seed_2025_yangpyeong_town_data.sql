-- =========================================================================
-- FarmBalance 2025 Year Town-specific Seed Data for Yangpyeong (12 Towns)
-- =========================================================================
-- 이 SQL 스크립트는 2025년도를 기준으로 양평군의 12개 읍면동 전체에 대해
-- 실제 상용 서비스 운영 규모의 현실적이고 웅장한 빅데이터 환경을 시뮬레이션합니다.
--
-- [주요 특징]
-- 1. 각 읍면동(12개)에 테스트용 농가와 농장을 각각 50곳씩 대량 배치 (총 600개 농장 대량 구축)
-- 2. 12개 활성 작물 전체에 대해 대량 재배 데이터를 600개 농장에 고르게 분배
--    ➔ 옥수수, 메밀 등 양평군 대표 작물이 모두 포함되어 0% 없이 실감나는 수급 현황 표시
-- 3. 소수점 단위의 정밀한 합산 공급량을 제어하여 양평군 종합 수급 균형 비율 충족
-- =========================================================================

-- [Step 0] crops 마스터 테이블에 빠져있는 대표 작물 추가 (옥수수, 메밀)
-- 옥수수: 양평군 대표 밭작물 / 메밀: 양평군 특산물(양평메밀축제)
INSERT INTO crops (category_id, code, name, data_source)
VALUES (1, 'CORN', '옥수수', 'MANUAL')
ON CONFLICT (code) DO NOTHING;

INSERT INTO crops (category_id, code, name, data_source)
VALUES (1, 'BUCKWHEAT', '메밀', 'MANUAL')
ON CONFLICT (code) DO NOTHING;


-- [Step 1] 테스트 환경 클린업 & 기존 유령 데이터 초기화
-- 1) 2025년 테스트용 재배 등록(자식) 데이터 삭제
DELETE FROM cultivation_registrations
WHERE farm_id IN (
    SELECT id
    FROM farms
    WHERE name LIKE '2025 % 테스트 농장%'
);

-- 2) 2025년 테스트용 농장 데이터 삭제
DELETE FROM farms
WHERE name LIKE '2025 % 테스트 농장%';

-- 3) 2025년 테스트용 사용자 관련 알림 및 사용자 데이터 삭제
DELETE FROM notifications
WHERE user_id IN (
    SELECT id
    FROM users
    WHERE email LIKE 'town_farmer_%'
);

DELETE FROM users
WHERE email LIKE 'town_farmer_%';

-- 4) 2025년도 생산 통계 및 이전 테스트 잔여물 정리
DELETE FROM crop_production_stats
WHERE year = 2025 AND region_code = '4183';

DELETE FROM crop_production_stats
WHERE itm_nm = '벼' AND region_code = '4183';

-- 5) 기존에 꼬여있던 타 연도/타 테스트의 ACTIVE 재배 등록 데이터를 모두 완료(COMPLETED) 처리
-- (단, farmer%@test.com 계정은 아래에서 면적 정합성을 재조정한 뒤 ACTIVE로 복구할 것이므로 제외)
UPDATE cultivation_registrations
SET status = 'COMPLETED', deleted_at = NOW()
WHERE status = 'ACTIVE' AND deleted_at IS NULL
  AND farm_id NOT IN (
      SELECT id FROM farms WHERE user_id IN (
          SELECT id FROM users WHERE email LIKE 'farmer%@test.com'
      )
  );

-- 6) 기존 farmer% 계정들의 농장 재배 면적 정합성(농장 전체 면적을 넘지 않도록) 조정 및 ACTIVE 상태 복원
-- farmer1 (농장 전체 면적: 3100) -> 고구마: 2000.0, 방울토마토: 100.0 (합계: 2100)
UPDATE cultivation_registrations SET cultivation_area = 2000.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 66;
UPDATE cultivation_registrations SET cultivation_area = 100.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 28;

-- farmer2 (농장 전체 면적: 3200) -> 콩: 1500.0, 사과: 1500.0 (합계: 3000)
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 68;
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 2;

-- farmer3 (농장 전체 면적: 16000) -> 감자: 2000.0, 토마토: 1500.0, 토마토: 1500.0 (합계: 5000)
UPDATE cultivation_registrations SET cultivation_area = 2000.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 3;
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 88;
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 70;

-- farmer4 (농장 전체 면적: 3400) -> 사과: 1500.0, 인삼: 1500.0 (합계: 3000)
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 72;
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 4;

-- farmer5 (농장 전체 면적: 3500) -> 콩: 1500.0, 쌀: 1500.0 (합계: 3000)
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 75;
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 5;

-- farmer6 (농장 전체 면적: 3600) -> 고추: 1500.0, 쌀: 1500.0 (합계: 3000)
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 6;
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 76;

-- farmer7 (농장 전체 면적: 3700) -> 사과: 1500.0, 감자: 1500.0 (합계: 3000)
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 7;
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 78;

-- farmer8 (농장 전체 면적: 3800) -> 콩: 1500.0, 감자: 1500.0 (합계: 3000)
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 80;
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 8;

-- farmer9 (농장 전체 면적: 3900) -> 토마토: 800.0, 인삼: 1000.0, 쌀: 1500.0 (합계: 3300)
UPDATE cultivation_registrations SET cultivation_area = 800.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 83;
UPDATE cultivation_registrations SET cultivation_area = 1000.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 9;
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 82;

-- farmer10 (농장 전체 면적: 4000) -> 감자: 1500.0, 쌀: 1500.0, 사과: 800.0 (합계: 3800)
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 85;
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 10;
UPDATE cultivation_registrations SET cultivation_area = 800.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 84;

-- farmer11 (농장 전체 면적: 4100) -> 고구마: 1500.0, 고추: 1500.0, 콩: 1000.0 (합계: 4000)
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 86;
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 11;
UPDATE cultivation_registrations SET cultivation_area = 1000.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 87;

-- farmer12 (농장 전체 면적: 4200) -> 사과: 1000.0, 쌀: 2000.0, 고추: 1000.0 (합계: 4000)
UPDATE cultivation_registrations SET cultivation_area = 1000.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 12;
UPDATE cultivation_registrations SET cultivation_area = 2000.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 64;
UPDATE cultivation_registrations SET cultivation_area = 1000.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 65;

-- farmer13 (농장 전체 면적: 4300) -> 보리: 2000.0, 감자: 2000.0 (합계: 4000)
UPDATE cultivation_registrations SET cultivation_area = 2000.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 67;
UPDATE cultivation_registrations SET cultivation_area = 2000.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 13;

-- farmer14 (농장 전체 면적: 4400) -> 인삼: 1500.0, 감자: 2500.0 (합계: 4000)
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 14;
UPDATE cultivation_registrations SET cultivation_area = 2500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 69;

-- farmer15 (농장 전체 면적: 4500) -> 고추: 1500.0, 쌀: 2500.0 (합계: 4000)
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 71;
UPDATE cultivation_registrations SET cultivation_area = 2500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 15;

-- farmer16 (농장 전체 면적: 4600) -> 보리: 2500.0, 고추: 1500.0 (합계: 4000)
UPDATE cultivation_registrations SET cultivation_area = 2500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 73;
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 16;

-- farmer17 (농장 전체 면적: 4700) -> 고구마: 2500.0, 사과: 1500.0 (합계: 4000)
UPDATE cultivation_registrations SET cultivation_area = 2500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 74;
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 17;

-- farmer18 (농장 전체 면적: 4800) -> 방울토마토: 1500.0, 감자: 2500.0 (합계: 4000)
UPDATE cultivation_registrations SET cultivation_area = 1500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 77;
UPDATE cultivation_registrations SET cultivation_area = 2500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 18;

-- farmer19 (농장 전체 면적: 4900) -> 고추: 2000.0, 인삼: 2000.0 (합계: 4000)
UPDATE cultivation_registrations SET cultivation_area = 2000.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 79;
UPDATE cultivation_registrations SET cultivation_area = 2000.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 19;

-- farmer20 (농장 전체 면적: 5000) -> 고구마: 2500.0, 쌀: 2000.0 (합계: 4500)
UPDATE cultivation_registrations SET cultivation_area = 2500.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 81;
UPDATE cultivation_registrations SET cultivation_area = 2000.0, status = 'ACTIVE', deleted_at = NULL WHERE id = 20;




-- [Step 2] 12개 활성 작물에 대한 2025년 기준 생산 통계(수요 데이터) 삽입
-- 양평군 전체(region_code='4183') 기준이며, 단위는 '톤'
-- 이 수요량이 수급률 계산의 분모(기준치)가 됩니다.
INSERT INTO crop_production_stats (
    itm_nm,
    region_code,
    region_name,
    year,
    cultivated_area,
    yield_per_10a,
    total_production,
    unit_nm
) VALUES 
-- ★ 양평군 핵심 대표 작물: 쌀, 옥수수, 고추, 콩, 감자, 고구마, 사과
('쌀',        '4183', '양평군', 2025, 2000.0, 500.0, 10000.0, '톤'),   -- 기준 수요: 10,000톤
('옥수수',    '4183', '양평군', 2025, 300.0,  400.0,  1200.0, '톤'),   -- 기준 수요: 1,200톤
('고추',      '4183', '양평군', 2025, 150.0,  200.0,   300.0, '톤'),   -- 기준 수요: 300톤
('콩',        '4183', '양평군', 2025, 350.0,  180.0,   630.0, '톤'),   -- 기준 수요: 630톤
('감자',      '4183', '양평군', 2025, 800.0,  250.0,  2000.0, '톤'),   -- 기준 수요: 2,000톤
('고구마',    '4183', '양평군', 2025, 500.0,  200.0,  1000.0, '톤'),   -- 기준 수요: 1,000톤
('사과',      '4183', '양평군', 2025, 200.0,  250.0,   500.0, '톤'),   -- 기준 수요: 500톤
-- ★ 양평군 특산물
('메밀',      '4183', '양평군', 2025, 100.0,  150.0,   150.0, '톤'),   -- 기준 수요: 150톤
('인삼',      '4183', '양평군', 2025,  60.0,  100.0,    60.0, '톤'),   -- 기준 수요: 60톤
-- ★ 시설원예/채소
('토마토',    '4183', '양평군', 2025,  80.0,  300.0,   240.0, '톤'),   -- 기준 수요: 240톤
('방울토마토','4183', '양평군', 2025,  50.0,  350.0,   175.0, '톤'),   -- 기준 수요: 175톤
-- ★ 기타 곡물
('보리',      '4183', '양평군', 2025,  30.0,  200.0,    60.0, '톤');   -- 기준 수요: 60톤


-- [Step 3] PL/pgSQL 루프를 이용한 대규모 농가(600개) 및 분산 재배 데이터 자동 생성
-- 12개 읍면동 × 50개 농장 = 총 600개 농장
-- 12개 작물 × 각 120개 농장씩 분배 = 총 1,440개 재배 등록 데이터
DO $$
DECLARE
    v_user_id BIGINT;
    v_farm_id BIGINT;
    v_crop_id BIGINT;
    v_town_code VARCHAR;
    v_town_name VARCHAR;
    v_crop_name VARCHAR;
    
    -- 12개 읍면동 정보 매핑 배열
    t_town_codes VARCHAR[] := ARRAY['4183010', '4183020', '4183030', '4183040', '4183050', '4183060', '4183070', '4183080', '4183090', '4183100', '4183110', '4183120'];
    t_town_names VARCHAR[] := ARRAY['양평읍', '강상면', '강하면', '양서면', '옥천면', '서종면', '단월면', '청운면', '양동면', '지평면', '용문면', '개군면'];
    
    -- 12개 활성 작물 배열 (양평군 대표작물 → 특산물 → 시설원예 → 기타)
    t_crops VARCHAR[] := ARRAY['쌀', '옥수수', '고추', '콩', '감자', '고구마', '사과', '메밀', '인삼', '토마토', '방울토마토', '보리'];
    
    -- 양평군 전체의 현실적 수급 비율을 충족시키는 작물별 전체 목표 총 공급량 (톤 단위)
    -- 수급률 = (공급량 / 수요량) × 100
    t_target_yields DOUBLE PRECISION[] := ARRAY[
        10000.0,  -- 쌀:        수요 10,000톤 → 공급 10,000톤 → 수급률 100% (적정)
         1080.0,  -- 옥수수:     수요  1,200톤 → 공급  1,080톤 → 수급률  90% (적정)
          210.0,  -- 고추:       수요    300톤 → 공급    210톤 → 수급률  70% (부족주의)
          600.0,  -- 콩:         수요    630톤 → 공급    600톤 → 수급률  95% (적정)
        3000.0,   -- 감자:       수요  2,000톤 → 공급  3,000톤 → 수급률 150% (초과주의)
         850.0,   -- 고구마:     수요  1,000톤 → 공급    850톤 → 수급률  85% (적정)
         350.0,   -- 사과:       수요    500톤 → 공급    350톤 → 수급률  70% (부족주의)
         180.0,   -- 메밀:       수요    150톤 → 공급    180톤 → 수급률 120% (초과주의)
          78.0,   -- 인삼:       수요     60톤 → 공급     78톤 → 수급률 130% (초과주의)
          72.0,   -- 토마토:     수요    240톤 → 공급     72톤 → 수급률  30% (부족경고)
          52.5,   -- 방울토마토: 수요    175톤 → 공급   52.5톤 → 수급률  30% (부족경고)
         102.0    -- 보리:       수요     60톤 → 공급    102톤 → 수급률 170% (초과경고)
    ];
    
    i INT;
    j INT;
    v_idx INT;
    v_farm_name VARCHAR;
    v_email VARCHAR;
    
    v_yield DOUBLE PRECISION;
    v_area DOUBLE PRECISION;
    
    -- 면적 정합성 검사용 변수
    v_farm_total_area DOUBLE PRECISION;
    v_already_used_area DOUBLE PRECISION;
    v_remaining_area DOUBLE PRECISION;
    v_final_area DOUBLE PRECISION;
BEGIN
    -- 1. 각 읍면동별 50개의 농부 & 농장 일괄 생성 (12 * 50 = 총 600개 농부/농장)
    FOR i IN 1..12 LOOP
        v_town_code := t_town_codes[i];
        v_town_name := t_town_names[i];
        
        FOR j IN 1..50 LOOP
            v_email := 'town_farmer_' || lower(substring(v_town_code, 6, 2)) || '_' || j || '@farmbalance.com';
            v_farm_name := '2025 ' || v_town_name || ' 테스트 농장 ' || j;
            
            -- 1) 사용자(농부) 등록
            INSERT INTO users (email, password, name, phone, role, status, provider, address)
            VALUES (
                v_email, 
                '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu', 
                v_town_name || ' 농가 ' || j, 
                '010-2025-' || lpad(cast((i*50 + j) as varchar), 4, '0'), 
                'FARMER', 
                'ACTIVE', 
                'LOCAL', 
                '경기도 양평군 ' || v_town_name
            )
            ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
            RETURNING id INTO v_user_id;
            
            -- 2) 농장 등록
            INSERT INTO farms (user_id, name, address, area, certification_status, bjd_code, status)
            VALUES (
                v_user_id, 
                v_farm_name, 
                '경기도 양평군 ' || v_town_name || ' 중앙길 ' || j, 
                1500.0 + (j * 50), 
                'APPROVED', 
                v_town_code, 
                'OPERATING'
            )
            RETURNING id INTO v_farm_id;
        END LOOP;
    END LOOP;
    
    -- 2. 12개 작물의 재배 데이터를 600개 농장에 고르게 쪼개어 자동 분산 주입
    --    (재배 데이터 작물당 120개씩 총 1,440개 생성)
    FOR i IN 1..12 LOOP
        v_crop_name := t_crops[i];
        
        -- 마스터 crops 테이블에서 정확한 작물 ID 조회
        SELECT id INTO v_crop_id FROM crops WHERE name = v_crop_name;
        
        IF v_crop_id IS NULL THEN
            RAISE NOTICE '경고: crops 테이블에서 "%"를 찾을 수 없습니다. 건너뜁니다.', v_crop_name;
            CONTINUE;
        END IF;
        
        -- 작물별 목표 전체 공급량을 120개 농가에 잘게 쪼개서 분배
        v_yield := t_target_yields[i] / 120.0; 
        v_area := (t_target_yields[i] * 10.0) / 120.0;
        
        FOR j IN 1..120 LOOP
            -- 600개 농장 중 무작위성 있게 고르게 흩어지도록 모듈러 연산 사용
            v_idx := ((i * 17 + j * 31) % 600) + 1;
            
            -- 해당 순번의 2025년 신규 농장 ID 조회
            SELECT id INTO v_farm_id 
            FROM farms 
            WHERE name LIKE '2025 % 테스트 농장 %'
            ORDER BY id
            LIMIT 1 OFFSET (v_idx - 1);
            
            IF v_farm_id IS NULL THEN
                CONTINUE;
            END IF;
            
            -- 면적 정합성 방어벽 (농장 전체 면적을 초과하지 않도록 제한)
            SELECT area INTO v_farm_total_area FROM farms WHERE id = v_farm_id;
            SELECT COALESCE(SUM(cultivation_area), 0) INTO v_already_used_area 
            FROM cultivation_registrations 
            WHERE farm_id = v_farm_id AND status = 'ACTIVE' AND deleted_at IS NULL;
            
            v_remaining_area := v_farm_total_area - v_already_used_area;
            
            -- 미세 변동성을 고려한 1차 계산 면적
            v_final_area := round(cast(v_area * (0.8 + (j % 5) * 0.1) as numeric), 1);
            
            -- 만약 잔여 면적보다 크다면 잔여 면적의 80%만 할당
            IF v_final_area > v_remaining_area THEN
                IF v_remaining_area <= 0 THEN
                    CONTINUE; -- 잔여 면적이 없으면 스킵
                END IF;
                v_final_area := round(cast(v_remaining_area * 0.8 as numeric), 1);
            END IF;
            
            -- 재배 데이터 주입 (yield_unit: 톤)
            INSERT INTO cultivation_registrations (
                farm_id,
                crop_id,
                cultivation_area,
                farmer_estimated_yield,
                yield_unit,
                status,
                sowing_date,
                in_season
            ) VALUES (
                v_farm_id,
                v_crop_id,
                v_final_area,
                round(cast(v_yield * (0.8 + (j % 5) * 0.1) as numeric), 3), -- 소수점 3째 자리까지 정밀 분배
                '톤',
                'ACTIVE',
                '2025-05-01',
                true
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ 완료: 12개 읍면동 × 50개 농장 = 600개 농장, 12개 작물 × 120개씩 = 1,440개 재배 데이터 생성!';
END $$;