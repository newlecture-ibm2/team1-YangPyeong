-- ═══════════════════════════════════════════════════════════════
-- V5: 인증 관련 누락 스키마 보정 + 기본 유저 시드 데이터
--   1) security_questions 테이블 (비밀번호 찾기용)
--   2) users 테이블 누락 컬럼 (provider, provider_id, profile_image_url)
--   3) user_social_accounts 테이블 (소셜 연동용)
--   4) 기본 유저 시드 (농업인, 일반, 관리자, 지자체)
-- ═══════════════════════════════════════════════════════════════

-- ===== 1. security_questions 테이블 =====
CREATE TABLE IF NOT EXISTS security_questions (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL UNIQUE REFERENCES users(id),
    question    VARCHAR(200) NOT NULL,
    answer      VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_security_questions_user_id ON security_questions(user_id);

-- ===== 2. users 테이블 누락 컬럼 추가 =====
-- 소셜 로그인 provider (LOCAL, KAKAO, GOOGLE, NAVER)
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL';
-- 소셜 로그인 provider별 사용자 ID
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(100);
-- 프로필 이미지 URL (로컬 업로드 경로 또는 외부 URL 저장용)
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(200);

-- ===== 3. user_social_accounts 테이블 =====
CREATE TABLE IF NOT EXISTS user_social_accounts (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    provider    VARCHAR(20)  NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    linked_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_id)
);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_user_id ON user_social_accounts(user_id);

-- ===== 4. 기본 유저 시드 데이터 =====
-- 비밀번호: test1234 (BCrypt 해시)

-- 4-1. 시퀀스 보정 (PK 충돌 방지)
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));

-- 4-2. 농업인 (2명)
INSERT INTO users (email, password, name, phone, role, region, region_code, status, created_at) VALUES
('farmer1@test.com', '$2a$10$xKTcWrqRNaGWTZ2aQS0AEOqiY0AIzLPh0jcvVxZ5lc5JYs9Xf3xOq', '양평농장 김씨',   '010-1111-1111', 'FARMER', '양평군', '4183', 'ACTIVE', NOW()),
('farmer2@test.com', '$2a$10$xKTcWrqRNaGWTZ2aQS0AEOqiY0AIzLPh0jcvVxZ5lc5JYs9Xf3xOq', '양평과수원 박씨', '010-2222-2222', 'FARMER', '양평군', '4183', 'ACTIVE', NOW())
ON CONFLICT (email) DO NOTHING;

-- 4-3. 일반 사용자 (2명)
INSERT INTO users (email, password, name, phone, role, region, status, created_at) VALUES
('user1@test.com', '$2a$10$xKTcWrqRNaGWTZ2aQS0AEOqiY0AIzLPh0jcvVxZ5lc5JYs9Xf3xOq', '일반사용자 이씨', '010-3333-3333', 'USER', '서울', 'ACTIVE', NOW()),
('user2@test.com', '$2a$10$xKTcWrqRNaGWTZ2aQS0AEOqiY0AIzLPh0jcvVxZ5lc5JYs9Xf3xOq', '일반사용자 최씨', '010-4444-4444', 'USER', '서울', 'ACTIVE', NOW())
ON CONFLICT (email) DO NOTHING;

-- 4-4. 관리자 (1명)
INSERT INTO users (email, password, name, phone, role, region, status, created_at) VALUES
('admin@farmbalance.kr', '$2a$10$xKTcWrqRNaGWTZ2aQS0AEOqiY0AIzLPh0jcvVxZ5lc5JYs9Xf3xOq', '시스템 관리자', '031-000-0001', 'ADMIN', '양평군', 'ACTIVE', NOW())
ON CONFLICT (email) DO NOTHING;

-- 4-5. 지자체 담당자 (2명 — 양평군, 가평군)
INSERT INTO users (email, password, name, phone, role, region, region_code, status, created_at) VALUES
('gov-yangpyeong@farmbalance.kr', '$2a$10$xKTcWrqRNaGWTZ2aQS0AEOqiY0AIzLPh0jcvVxZ5lc5JYs9Xf3xOq', '양평군 담당자', '031-770-2001', 'GOV', '양평군', '4183', 'ACTIVE', NOW()),
('gov-gapyeong@farmbalance.kr',  '$2a$10$xKTcWrqRNaGWTZ2aQS0AEOqiY0AIzLPh0jcvVxZ5lc5JYs9Xf3xOq', '가평군 담당자', '031-000-0002', 'GOV', '가평군', '4182', 'ACTIVE', NOW())
ON CONFLICT (email) DO NOTHING;
