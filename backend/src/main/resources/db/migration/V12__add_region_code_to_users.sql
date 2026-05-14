-- V12__add_region_code_to_users.sql

ALTER TABLE users ADD COLUMN region_code VARCHAR(20);

-- 임시로 GOV 계정(양평군청담당자)에게 양평군의 지역 코드(4183000000)를 부여합니다.
UPDATE users SET region_code = '4183000000' WHERE email = 'gov@test.com';
