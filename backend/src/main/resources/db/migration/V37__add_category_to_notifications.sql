-- V37: notifications 테이블에 category 컬럼 추가
-- 알림 목록 조회 시 사용자 수신 설정(notification_preferences)에 따라
-- 비활성화된 카테고리를 필터링하기 위해 필요

ALTER TABLE notifications
    ADD COLUMN category VARCHAR(30);

-- 기존 데이터 backfill: type → category 1:1 매핑
-- GUIDE 타입은 세부 카테고리 구분 불가하여 'GUIDE_SCHEDULE'로 일괄 매핑
UPDATE notifications SET category = type WHERE type IN ('BALANCE_WARN', 'ORDER', 'POLICY', 'SYSTEM');
UPDATE notifications SET category = 'GUIDE_SCHEDULE' WHERE type = 'GUIDE' AND category IS NULL;

COMMENT ON COLUMN notifications.category IS '알림 카테고리 (NotificationCategory enum값). 수신 설정 필터링에 사용';

CREATE INDEX idx_notifications_category ON notifications(category);
