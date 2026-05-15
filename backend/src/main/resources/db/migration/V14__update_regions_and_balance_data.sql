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

-- 4. balance_data 더미 데이터 삽입 (NOT EXISTS 활용, 계산 로직 병합)
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
    '4183000000', -- 양평군
    src.id,
    EXTRACT(YEAR FROM CURRENT_DATE)::int,
    'ALL',
    src.supply_forecast,
    src.demand_forecast,
    ROUND((src.supply_forecast::numeric / src.demand_forecast::numeric) * 100, 2),
    CASE
        WHEN (src.supply_forecast::numeric / src.demand_forecast::numeric) >= 1.3 THEN 'EXCESS_WARN'
        WHEN (src.supply_forecast::numeric / src.demand_forecast::numeric) >= 1.15 THEN 'EXCESS_CAUTION'
        WHEN (src.supply_forecast::numeric / src.demand_forecast::numeric) <= 0.7 THEN 'SHORT_WARN'
        WHEN (src.supply_forecast::numeric / src.demand_forecast::numeric) <= 0.85 THEN 'SHORT_CAUTION'
        ELSE 'BALANCED'
    END,
    NOW(),
    NOW()
FROM (
    SELECT
        id,
        FLOOR(RANDOM() * 5000 + 1000)::int AS supply_forecast,
        FLOOR(RANDOM() * 5000 + 1000)::int AS demand_forecast
    FROM crops
) src
WHERE NOT EXISTS (
    SELECT 1 
    FROM balance_data bd 
    WHERE bd.region_code = '4183000000'
      AND bd.crop_id = src.id
      AND bd.year = EXTRACT(YEAR FROM CURRENT_DATE)::int
      AND bd.season = 'ALL'
);
