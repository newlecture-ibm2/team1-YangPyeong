-- MVP 기준 (양평군) farms.bjd_code NULL 데이터 보정
-- 기존에 농장 등록 시 법정동 코드가 누락된 데이터를 시군구 코드 '4183'으로 일괄 보정합니다.
UPDATE farms 
SET bjd_code = '4183000000' 
WHERE bjd_code IS NULL OR bjd_code = '';
