-- 기존 V14 마이그레이션에서 10자리(4183000000)로 잘못 들어간 balance_data의 region_code를
-- regions 테이블의 표준 4자리 코드(4183)로 보정합니다.

UPDATE balance_data 
SET region_code = '4183' 
WHERE region_code = '4183000000';
