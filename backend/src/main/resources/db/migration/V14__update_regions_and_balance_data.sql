-- V14__update_regions_and_balance_data.sql

-- 1. users 테이블의 region_code를 양평군(4183)으로 일괄 업데이트
UPDATE users 
SET region_code = '4183' 
WHERE region_code IS NULL 
  AND address LIKE '%양평%';

-- 2. users 테이블의 농부 주소 업데이트 (읍/면/리 상세화)
UPDATE users 
SET address = '경기도 양평군 ' || 
    CASE 
        WHEN id % 3 = 0 THEN '양평읍' 
        WHEN id % 3 = 1 THEN '강상면' 
        ELSE '강하면' 
    END || ' 어느마을 ' || id
WHERE role = 'FARMER' AND address LIKE '양평군 어느마을%';

-- 3. farms 테이블의 농장 주소 업데이트 (읍/면/리 상세화)
UPDATE farms 
SET address = '경기도 양평군 ' || 
    CASE 
        WHEN id % 3 = 0 THEN '양평읍' 
        WHEN id % 3 = 1 THEN '강상면' 
        ELSE '강하면' 
    END || ' 어느마을 ' || id
WHERE address LIKE '양평군 어느마을%';

-- 4. balance_data 더미 데이터 삽입
INSERT INTO balance_data (
    region_code,
    crop_id,
    year,
    season,
    supply_forecast,
    demand_forecast,
    supply_ratio,
    balance_status,
    calculated_at,
    created_at
)
SELECT
    '4183000000', -- 양평군 (수급 데이터 지역 코드)
    c.id,
    EXTRACT(YEAR FROM CURRENT_DATE)::int,
    'ALL',
    supply_forecast,
    demand_forecast,
    ROUND((supply_forecast::numeric / demand_forecast::numeric) * 100, 2),
    CASE
        WHEN (supply_forecast::numeric / demand_forecast::numeric) >= 1.2 THEN 'SURPLUS'
        WHEN (supply_forecast::numeric / demand_forecast::numeric) <= 0.8 THEN 'SHORTAGE'
        ELSE 'NORMAL'
    END,
    NOW(),
    NOW()
FROM (
    SELECT
        id,
        FLOOR(RANDOM() * 5000 + 1000)::int AS supply_forecast,
        FLOOR(RANDOM() * 5000 + 1000)::int AS demand_forecast
    FROM crops
) c
ON CONFLICT (region_code, crop_id, year, season) DO NOTHING;

-- 5. balance_data supply_ratio 보정 (정수 나눗셈 방지를 위해 numeric 캐스팅 추가)
UPDATE balance_data
SET supply_ratio = ROUND((supply_forecast::numeric / demand_forecast::numeric) * 100, 2)
WHERE region_code = '4183000000' AND year = EXTRACT(YEAR FROM CURRENT_DATE)::int;

-- 6. balance_data balance_status 보정
UPDATE balance_data
SET balance_status = CASE
    WHEN supply_ratio >= 130 THEN 'EXCESS_WARN'
    WHEN supply_ratio >= 115 THEN 'EXCESS_CAUTION'
    WHEN supply_ratio <= 70 THEN 'SHORT_WARN'
    WHEN supply_ratio <= 85 THEN 'SHORT_CAUTION'
    ELSE 'NORMAL'
END
WHERE region_code = '4183000000'
  AND year = EXTRACT(YEAR FROM CURRENT_DATE)::int;
