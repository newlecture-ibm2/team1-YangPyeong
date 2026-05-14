-- =============================================
-- V1: 유저 도메인 (최종 통합 스키마)
-- users, user_social_accounts, security_questions, user_sanction_logs
-- =============================================

-- 1. users
CREATE TABLE users (
    id                      BIGSERIAL    PRIMARY KEY,
    email                   VARCHAR(255) NOT NULL UNIQUE,
    password                VARCHAR(255),
    name                    VARCHAR(50)  NOT NULL,
    phone                   VARCHAR(20),
    role                    VARCHAR(20)  NOT NULL DEFAULT 'USER',
    status                  VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    provider                VARCHAR(20)  NOT NULL DEFAULT 'LOCAL',
    provider_id             VARCHAR(100),
    profile_image_url       VARCHAR(200),
    address                 VARCHAR(255),
    bio                     TEXT,
    withdrawal_requested_at TIMESTAMP,
    anonymized_at           TIMESTAMP,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP
);

-- 2. user_social_accounts
CREATE TABLE user_social_accounts (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    provider    VARCHAR(20)  NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    linked_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_id)
);
CREATE INDEX idx_user_social_accounts_user_id ON user_social_accounts(user_id);

-- 3. security_questions
CREATE TABLE security_questions (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL UNIQUE REFERENCES users(id),
    question    VARCHAR(200) NOT NULL,
    answer      VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP
);
CREATE INDEX idx_security_questions_user_id ON security_questions(user_id);

-- 4. user_sanction_logs
CREATE TABLE user_sanction_logs (
    id              BIGSERIAL PRIMARY KEY,
    target_user_id  BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type     VARCHAR(50) NOT NULL,
    reason_type     VARCHAR(50) NOT NULL,
    reason_detail   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_sanction_logs_target_user_id ON user_sanction_logs(target_user_id);
