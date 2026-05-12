-- ==============================================
-- FCM 토큰 테이블 생성
-- 사용자별 디바이스 FCM 토큰을 관리합니다.
-- 1명의 유저가 여러 디바이스에서 로그인할 수 있으므로 1:N 관계입니다.
-- ==============================================

CREATE TABLE fcm_tokens (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    token       VARCHAR(500) NOT NULL,
    device_type VARCHAR(20)  DEFAULT 'WEB',   -- WEB | ANDROID | IOS
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    UNIQUE (user_id, token)
);

CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);
