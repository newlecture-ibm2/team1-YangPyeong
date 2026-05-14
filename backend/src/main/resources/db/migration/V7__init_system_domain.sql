-- =============================================
-- V7: 시스템 공통 도메인 (최종 통합 스키마)
-- guide_messages, notifications, fcm_tokens,
-- reports, batch_logs
-- =============================================

-- 1. guide_messages
CREATE TABLE guide_messages (
    id            BIGSERIAL    PRIMARY KEY,
    sender_id     BIGINT       NOT NULL REFERENCES users(id),
    target_type   VARCHAR(10)  NOT NULL,
    target_value  VARCHAR(50),
    title         VARCHAR(200) NOT NULL,
    content       TEXT         NOT NULL,
    channel       VARCHAR(10)  NOT NULL,
    sent_at       TIMESTAMP,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    deleted_at    TIMESTAMP
);

-- 2. notifications
CREATE TABLE notifications (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id),
    type       VARCHAR(20)  NOT NULL,
    title      VARCHAR(200) NOT NULL,
    message    TEXT,
    link       VARCHAR(500),
    is_read    BOOLEAN      DEFAULT false,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, is_read);

-- 3. fcm_tokens
CREATE TABLE fcm_tokens (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    token       VARCHAR(500) NOT NULL,
    device_type VARCHAR(20)  DEFAULT 'WEB',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    UNIQUE (user_id, token)
);
CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);

-- 4. reports (범용 신고)
CREATE TABLE reports (
    id          BIGSERIAL    PRIMARY KEY,
    target_type VARCHAR(20)  NOT NULL,
    target_id   BIGINT       NOT NULL,
    reporter_id BIGINT       NOT NULL REFERENCES users(id),
    reason      VARCHAR(500) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (target_type, target_id, reporter_id)
);
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_status ON reports(status);

-- 5. batch_logs
CREATE TABLE batch_logs (
    id BIGSERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_processed INT DEFAULT 0,
    total_failed INT DEFAULT 0,
    messages TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_batch_logs_job_name ON batch_logs(job_name);
CREATE INDEX idx_batch_logs_created_at ON batch_logs(created_at DESC);
