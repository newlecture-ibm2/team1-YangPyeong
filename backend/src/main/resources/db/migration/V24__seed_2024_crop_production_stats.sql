-- V24__seed_2024_crop_production_stats.sql
-- 경기도 양평군 친환경농업과(Eco-friendly Agriculture Division) 공식 2024년 기준 식량작물 생산 통계 적재

INSERT INTO crop_production_stats (itm_nm, region_code, region_name, year, cultivated_area, yield_per_10a, total_production, unit_nm)
VALUES 
('벼', '4183', '양평군', 2024, 2627.70, 460.30, 12094.00, '톤'),
('쌀', '4183', '양평군', 2024, 2627.70, 460.30, 12094.00, '톤'),
('콩', '4183', '양평군', 2024, 432.90, 139.60, 604.30, '톤'),
('보리', '4183', '양평군', 2024, 7.70, 229.90, 17.70, '톤'),
('옥수수', '4183', '양평군', 2024, 181.40, 544.50, 987.50, '톤'),
('메밀', '4183', '양평군', 2024, 13.80, 78.30, 10.80, '톤'),
('감자', '4183', '양평군', 2024, 158.90, 1451.20, 2306.00, '톤'),
('고구마', '4183', '양평군', 2024, 71.70, 977.00, 700.50, '톤')
ON CONFLICT (itm_nm, region_code, year) DO UPDATE SET
    cultivated_area = EXCLUDED.cultivated_area,
    yield_per_10a = EXCLUDED.yield_per_10a,
    total_production = EXCLUDED.total_production,
    unit_nm = EXCLUDED.unit_nm;
