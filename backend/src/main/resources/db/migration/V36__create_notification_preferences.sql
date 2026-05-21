-- V36: 사용자별 알림 수신 설정 테이블
-- 푸시(FCM) 차단 정책: 카테고리별 disabled 시 DB 이력은 저장하되 FCM 푸시는 스킵
-- 8개 카테고리 = 4개 일반 타입 + 영농 가이드 4개 세부

CREATE TABLE notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- 일반 알림 타입 (4개)
    balance_warn_enabled BOOLEAN NOT NULL DEFAULT true,
    policy_enabled       BOOLEAN NOT NULL DEFAULT true,
    order_enabled        BOOLEAN NOT NULL DEFAULT true,
    system_enabled       BOOLEAN NOT NULL DEFAULT true,

    -- 영농 가이드 세부 카테고리 (4개)
    guide_weather_enabled  BOOLEAN NOT NULL DEFAULT true,
    guide_schedule_enabled BOOLEAN NOT NULL DEFAULT true,
    guide_pest_enabled     BOOLEAN NOT NULL DEFAULT true,
    guide_soil_enabled     BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

COMMENT ON TABLE notification_preferences IS '사용자별 알림 수신 설정 (카테고리별 on/off)';
COMMENT ON COLUMN notification_preferences.balance_warn_enabled IS '수급 임계값 경고 알림 수신 여부';
COMMENT ON COLUMN notification_preferences.policy_enabled IS '정책 매칭 알림 수신 여부';
COMMENT ON COLUMN notification_preferences.order_enabled IS '주문 상태 알림 수신 여부';
COMMENT ON COLUMN notification_preferences.system_enabled IS '시스템 알림(농장 승인/댓글 등) 수신 여부';
COMMENT ON COLUMN notification_preferences.guide_weather_enabled IS '영농 가이드 - 기상 알림 수신 여부';
COMMENT ON COLUMN notification_preferences.guide_schedule_enabled IS '영농 가이드 - 재배 일정 알림 수신 여부';
COMMENT ON COLUMN notification_preferences.guide_pest_enabled IS '영농 가이드 - 병해충 알림 수신 여부';
COMMENT ON COLUMN notification_preferences.guide_soil_enabled IS '영농 가이드 - 토양 알림 수신 여부';
