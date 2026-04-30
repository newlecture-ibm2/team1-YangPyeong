-- 농사로 테이블 컬럼 길이 수정
-- operation_name, farm_work_type 등에 HTML 포함 긴 텍스트가 들어올 수 있어 TEXT로 변경

ALTER TABLE nongsaro_farm_schedules ALTER COLUMN operation_name TYPE TEXT;
ALTER TABLE nongsaro_farm_schedules ALTER COLUMN farm_work_type TYPE TEXT;
ALTER TABLE nongsaro_farm_schedules ALTER COLUMN info_type_name TYPE TEXT;

-- 재해예방/친환경/첨단농업 테이블도 안전하게 TEXT로 변경
ALTER TABLE nongsaro_disaster_prevention ALTER COLUMN title TYPE TEXT;
ALTER TABLE nongsaro_eco_farming ALTER COLUMN title TYPE TEXT;
ALTER TABLE nongsaro_advanced_tech ALTER COLUMN title TYPE TEXT;
ALTER TABLE nongsaro_advanced_tech ALTER COLUMN content TYPE TEXT;
ALTER TABLE nongsaro_varieties ALTER COLUMN variety_name TYPE TEXT;
ALTER TABLE nongsaro_varieties ALTER COLUMN characteristics TYPE TEXT;
ALTER TABLE nongsaro_varieties ALTER COLUMN breeding_inst TYPE TEXT;
