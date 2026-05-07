-- V4__seed_gov.sql 및 이후 마이그레이션의 성공을 위해 
-- users 테이블에 누락된 인증 관련 컬럼 추가

ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL';
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(200);
