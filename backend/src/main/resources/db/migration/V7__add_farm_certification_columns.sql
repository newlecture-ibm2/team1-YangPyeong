-- ═══════════════════════════════════════════════════════════════
-- V7: 농장(farms) 테이블에 인증/문서 관련 컬럼 추가
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE farms ADD COLUMN IF NOT EXISTS land_cert_image_url VARCHAR(500);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS land_cert_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS certification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
