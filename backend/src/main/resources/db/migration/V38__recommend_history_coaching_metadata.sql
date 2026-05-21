-- AI 코칭 상태·힌트 및 재배 등록 ID를 추천 이력 item에 저장
ALTER TABLE recommend_history_item
    ADD COLUMN IF NOT EXISTS registration_id BIGINT,
    ADD COLUMN IF NOT EXISTS ai_coaching_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS ai_coaching_hint VARCHAR(500);

COMMENT ON COLUMN recommend_history_item.registration_id IS '재배 등록 ID (코칭 작물 식별)';
COMMENT ON COLUMN recommend_history_item.ai_coaching_status IS 'ELIGIBLE | NEEDS_DATA | HAS_AI | OPTIONAL | NOT_APPLICABLE | COMPLETED_IDLE';
COMMENT ON COLUMN recommend_history_item.ai_coaching_hint IS '코칭 요청 불가 시 안내 문구';
