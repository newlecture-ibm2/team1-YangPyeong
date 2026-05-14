-- =============================================
-- V7: FCM 푸시 알림 토큰 테이블 추가
-- FcmTokenJpaEntity와 매핑
-- =============================================

CREATE TABLE fcm_tokens (
    id           BIGSERIAL    PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token        VARCHAR(500) NOT NULL,
    device_type  VARCHAR(20),                                 -- WEB | ANDROID | IOS
    created_at   TIMESTAMP    NOT NULL,
    updated_at   TIMESTAMP
);

CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens (user_id);
