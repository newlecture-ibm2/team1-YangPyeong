-- users 테이블에서 활동지역(region) 컬럼 삭제
ALTER TABLE users DROP COLUMN IF EXISTS region;
