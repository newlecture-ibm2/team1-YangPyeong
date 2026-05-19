-- V22__add_status_reason.sql
-- 관리자 제재/반려 사유 표출 시스템을 위한 컬럼 추가

-- 1. 상점 (Shop)
ALTER TABLE products ADD COLUMN IF NOT EXISTS status_reason VARCHAR(500);

-- 2. 유저 (User)
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_reason VARCHAR(500);

-- 3. 커뮤니티 (Community)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS status_reason VARCHAR(500);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

ALTER TABLE comments ADD COLUMN IF NOT EXISTS status_reason VARCHAR(500);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
