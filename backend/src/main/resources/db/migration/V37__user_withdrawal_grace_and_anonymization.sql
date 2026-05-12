-- 탈퇴 유예(PENDING_WITHDRAWAL) 시작 시각, 비식별화 완료 시각
ALTER TABLE users ADD COLUMN IF NOT EXISTS withdrawal_requested_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMP NULL;

COMMENT ON COLUMN users.withdrawal_requested_at IS '자진 탈퇴 요청 시각(유예 중일 때만)';
COMMENT ON COLUMN users.anonymized_at IS '개인정보 비식별화(anonymize) 처리 완료 시각';
