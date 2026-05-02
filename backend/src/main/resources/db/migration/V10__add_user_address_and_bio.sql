-- ═══════════════════════════════════════════════════════════════
-- V10: 사용자 상세 주소 및 자기소개 컬럼 추가
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
